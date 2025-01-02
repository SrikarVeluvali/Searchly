import json
from flask import Flask, request, jsonify
from datetime import datetime
from uuid import uuid4
from pymongo import MongoClient
import time
import pandas as pd
from pinecone import Pinecone
from langchain.embeddings import HuggingFaceEmbeddings
import random
import asyncio
from scrape_web import scrape

SIMILARITY_THRESHOLD =0.2

def save_conversation(email, query, bot_response, tags, search_results, history_collection):
    history_entry = {
        "timestamp": datetime.utcnow(),
        "query": query,
        "bot_response": bot_response,
        "product_tags": tags,
        "search_results": search_results
    }
    if history_collection.find_one({"email": email}):
        history_collection.update_one(
            {"email": email},
            {"$push": {"history": history_entry}}
        )
    else:
        history_document = {
            "email": email,
            "history": [history_entry]
        }
        history_collection.insert_one(history_document)

def remove_conversation(history_collection):
    email = request.json.get('email','')
    history_collection.delete_one({"email": email})
    return jsonify({"message": "Conversation history deleted successfully"}), 200


def addDocument(content, link, image, rating, review_count, price, availability, embeddings, vector_store):
    embedding = embeddings.embed_query(content)
    
    # Convert NaNs and missing values to safe, descriptive defaults
    rating = str(rating) if pd.notnull(rating) else "No rating available"
    review_count = str(review_count) if pd.notnull(review_count) else "No reviews"
    price = str(price) if pd.notnull(price) else "Price not available"
    availability = availability if availability else "Unknown"

    # Ensure all values are strings to avoid Pinecone errors
    vector_store.upsert(vectors=[{
        "id": str(uuid4()),  # Unique ID for each document
        "values": embedding,
        "metadata": {
            "content": content,
            "link": link,
            "image": image,
            "rating": rating,
            "review_count": review_count,
            "price": price,
            "availability": availability
        }
    }])
    # print(f"Document added: {content}, {link}, {rating}")


def findItems(query: str, numItems: int, embeddings, vector_store):
    try:
        query_embedding = embeddings.embed_query(query)
        results_with_scores = vector_store.query(
            vector=query_embedding,
            top_k=numItems,
            include_metadata=True
        )

        # If no matches are found, return an empty list
        if not results_with_scores["matches"]:
            return []

        # Filter results based on similarity threshold
        relevant_results = [
            result for result in results_with_scores["matches"] if result["score"] >= SIMILARITY_THRESHOLD
        ]

        # If no relevant results, return an empty list
        if not relevant_results:
            return []

        # Format the results to match the required structure
        formatted_results = [
            {
                "name": result['metadata'].get('content', 'N/A'),
                "price": result['metadata'].get('price', 'N/A'),
                "url": result['metadata'].get('link', 'N/A'),
                "image": result['metadata'].get('image', 'N/A'),
                "rating": result['metadata'].get('rating', 'N/A'),
                "reviews": result['metadata'].get('review_count', 'N/A')
            } for result in relevant_results
        ]

        return formatted_results

    except Exception as e:
        print(f"Error retrieving items: {str(e)}")
        return []
    

def add_tags(email, tags, tags_collection):
    # Add tags to the user's document
    tags_collection.update_one(
        {"email": email},
        {"$addToSet": {"tags": {"$each": tags}}}  # Add unique tags only
    )

    # Retrieve the updated document to check the total number of tags
    user = tags_collection.find_one({"email": email}, {"tags": 1})
    if user and "tags" in user:
        total_tags = len(user["tags"])

        # If the total number of tags exceeds 20, keep only the latest 20
        if total_tags > 20:
            trimmed_tags = user["tags"][-20:]  # Keep only the last 20 tags
            tags_collection.update_one(
                {"email": email},
                {"$set": {"tags": trimmed_tags}}  # Update the tags array
            )

    print("Tags updated successfully")


def search_product(query, embeddings, vector_store):
    """
    Searches for a product on Amazon and Flipkart and adds results to Pinecone.

    Args:
        query (str): The search query.

    Returns:
        dict: The top product details or an error message.
    """
    print(query)
    try:
        # Perform the scrape
        top_results = asyncio.run(scrape(query))
        print(f"{len(top_results)} Results found")
        print("hi1")
        
        if top_results:
            print("hi2")
            # Loop through the results and add each one to Pinecone
            for result in top_results:
                addDocument(
                    content=result.get('title', 'N/A'),
                    link=result.get('link', 'N/A'),
                    image=result.get('image', 'N/A'),
                    rating=result.get('rating', None),
                    review_count=result.get('review_count', None),
                    price=result.get('price', None),
                    availability="In Stock", # Set default availability
                    embeddings=embeddings,
                    vector_store=vector_store
                )
            print("Added new products to the database successfully!")
            # Return the first result as the top result for immediate use
            return {
                "name": top_results[0].get('title', 'N/A'),
                "price": top_results[0].get('price', 'N/A'),
                "url": top_results[0].get('link', 'N/A'),
                "image": top_results[0].get('image', 'N/A'),
                "rating": top_results[0].get('rating', 'N/A'),
                "reviews": top_results[0].get('review_count', 'N/A')
            }
        else:
            print("hi3")
            return {"error": "No results found"}
    except Exception as e:
        print(f"Error fetching the products!: {e}")
        return {"error": str(e)}


def recommend_from_db(tags_collection, history_collection, embeddings, vector_store, client):
    # Get the user query from the request
    user_query = request.json.get('query', '')
    email = request.json.get('email','')
    if not (user_query and email):
        return jsonify({"error": "No query/email provided"}), 400
    user_history = history_collection.find_one({"email": email})
    history_messages = []
    if user_history and "history" in user_history:
        for entry in user_history["history"]:
            history_messages.append({
                "role": "user",
                "content": entry["query"]
            })
            history_messages.append({
                "role": "assistant",
                "content": entry["bot_response"]
            })
    current_messages = [
                {
                    "role": "user",
                    "content": (
                        "You are a professional product recommendation specialist dedicated to deeply understanding the user's needs and preferences based on their inquiry and their history. "
                        f"Here is the history of the user: {history_messages}"
                        "Listen attentively to their requirements, empathize with their situation, and craft a personalized response. "
                        "Provide your reply in JSON format with two fields: "
                        "1. 'message' - A personalized and empathetic message addressing the user's request. "
                        "2. 'product_tags' - A list of 3 to 5 as strings that excatly align with the user's needs. These tags should be formulated so that when searched on Amazon, the exact product the user is looking for appears first."
                        """Example for a json is: {
                        "message": "Aww, that's so exciting! I'm happy to help you find the paw-fect gift for your furry friend. Can you tell me a bit more about your dog? What's their breed, size, and personality like? That way, I can give you super tailored recommendations. In the meantime, here are some fun ideas to get you started:",
                        "product_tags": [
                            "Indestructible Chew Toys for Aggressive Chewers",
                            "Orthopedic Dog Beds for Large Dogs",
                            "Grain-Free Natural Dog Food",
                            "Interactive Puzzle Toys for Dogs",
                            "Waterproof Dog Coats for Winter",
                            "Portable Dog Water Bottles for Travel"
                        ]
                        }"""
                        f"The user asked: '{user_query}'."
                    )
                },
                {
                    "role": "assistant",
                    "content": "```json"
                }
            ]
    try:
        
        completion = client.chat.completions.create(
            model="llama3-70b-8192",
            messages=current_messages,
            stop="```",
        )
        # Extract and parse the JSON response
        response_json = completion.choices[0].message.content.strip()
        print(response_json)
        response_data = json.loads(response_json.replace("null", "None"))  # Replace `null` with Python's `None`

        # Populate 'search_results' with data for each product tag
        product_tags = response_data.get('product_tags', [])
        bot_response = response_data.get('message', '')
        add_tags(email, product_tags, tags_collection)
        search_results = {}
        url_set = set()

        for tag in product_tags:
            results = findItems(tag, 3, embeddings, vector_store)  # Fetch up to 3 results for the current tag
            if not results:
                continue  # Skip if no results are found

            for result in results:
                if result['url'] not in url_set:  # Ensure the URL is unique
                    search_results[tag] = result
                    url_set.add(result['url'])
                    break  # Break to only add one unique product per tag

        # Add search results to the response data
        response_data['search_results'] = search_results
        save_conversation(email, user_query, bot_response, product_tags, search_results, history_collection)
        return jsonify(response_data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


def getrecommendations(users_collection, tags_collection ,embeddings, vector_store):
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({"message": "Email is required"}), 400

    user_check = users_collection.find_one({"email": email})
    if not user_check:
        return jsonify({"message": "Oops something went wrong!"}), 400

    # Find the user's tags or initialize them if not present
    existing_user = tags_collection.find_one({"email": email})
    if not existing_user:
        # Initialize the tags field for the user as an empty list
        tags_collection.insert_one({"email": email, "tags": []})
        return jsonify({"result": []}), 200

    # If tags field is empty, return an empty result
    user_tags = existing_user.get('tags', [])
    if not user_tags:
        return jsonify({"result": []}), 200

    results = []
    seen = set()

    for tag in user_tags[:21]:
        items = findItems(tag, 3, embeddings, vector_store)
        for item in items:
            # Use 'url' as the unique identifier for each product
            if item['url'] not in seen:
                results.append(item)
                seen.add(item['url'])

    # Shuffle the results
    random.shuffle(results)

    return jsonify({"result": results}), 200



def recommend_from_web(tags_collection, history_collection, embeddings, vector_store, client):
    """
    Handles the /recommend route. Accepts a query from the user,
    generates product recommendations using Groq, and fetches
    details for each product tag.
    """
    # Get the user query from the request
    user_query = request.json.get('query', '')
    email = request.json.get('email','')
    if not (user_query and email):
        return jsonify({"error": "No query/email provided"}), 400

    # Generate the response using Groq
    try:
        
        completion = client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[
                {
                    "role": "user",
                    "content": (
                        "You are a professional product recommendation specialist dedicated to deeply understanding the user's needs and preferences based on their inquiry. "
                        "Listen attentively to their requirements, empathize with their situation, and craft a personalized response. "
                        "Provide your reply in JSON format with two fields: "
                        "1. 'message' - A personalized and empathetic message addressing the user's request. "
                        "2. 'product_tags' - A list of 3 to 5 products as strings that excatly align with the user's needs. These tags should be formulated so that when searched on Amazon, the exact product the user is looking for appears first."
                        """Example for a json is: {
                        "message": "Aww, that's so exciting! I'm happy to help you find the paw-fect gift for your furry friend. Can you tell me a bit more about your dog? What's their breed, size, and personality like? That way, I can give you super tailored recommendations. In the meantime, here are some fun ideas to get you started:",
                        "product_tags": [
                            "Indestructible Chew Toys for Aggressive Chewers",
                            "Orthopedic Dog Beds for Large Dogs",
                            "Grain-Free Natural Dog Food",
                            "Interactive Puzzle Toys for Dogs",
                            "Waterproof Dog Coats for Winter",
                            "Portable Dog Water Bottles for Travel"
                        ]
                        }"""
                        f"The user asked: '{user_query}'."
                    )
                },
                {
                    "role": "assistant",
                    "content": "```json"
                }
            ],
            stop="```",
        )
        # Extract and parse the JSON response
        response_json = completion.choices[0].message.content.strip()
        print(response_json)
        response_data = json.loads(response_json.replace("null", "None"))  # Replace `null` with Python's `None`

        # Populate 'search_results' with data for each product tag
        product_tags = response_data.get('product_tags', [])
        bot_response = response_data.get('message', '')
        add_tags(email, product_tags, tags_collection)
        search_results = {}
        url_set = set()
        for tag in product_tags:
            result = search_product(tag, embeddings, vector_store)
            if(not url_set.__contains__(result['url'])):
                print("hi4")
                search_results[tag] = result
                print("hi5")
        # Add search results to the response data
        response_data['search_results'] = search_results
        save_conversation(email, user_query, bot_response, product_tags, search_results, history_collection)
        return jsonify(response_data)

    except Exception as e:
        print("hi6")
        return jsonify({"error": str(e)}), 500
    
def gethistory(history_collection):
    """
    Retrieves the conversation history for a user.
    """
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({"message": "Email is required"}), 400

    history_entries = list(history_collection.find({"email": email}, {"_id": 0}))

    return jsonify({"history": history_entries}), 200