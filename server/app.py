from flask import Flask, request, jsonify
from groq import Groq
import requests
import json
import time
from flask_cors import CORS
from scrape_web import scrape
import asyncio
from dotenv import load_dotenv
import os
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from pymongo import MongoClient
from bson import ObjectId
from datetime import timedelta, datetime
import warnings
import jwt as pyjwt
import logging
from flask_mail import Mail, Message
import time
import pandas as pd
from uuid import uuid4
from langchain_huggingface import HuggingFaceEmbeddings
from pinecone import Pinecone, ServerlessSpec

load_dotenv()


# Initialize the Groq client
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
PINECONE_API_KEY=os.getenv("PINECONE_API_KEY")
client = Groq(api_key=GROQ_API_KEY)

# Initialize the Flask app
app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)
mail = Mail(app)

# Configure the JWT
app.config['JWT_SECRET_KEY'] = 'ProductRecommendationSystemProjectKMIT'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
jwt = JWTManager(app)


app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 465
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = True

mongo_client = MongoClient('mongodb://localhost:27017/')
db = mongo_client['product-recommendation-system']
users_collection = db['users']
tags_collection = db['tags']
pc = Pinecone(api_key=PINECONE_API_KEY)
# Define and initialize the Pinecone index
index_name = "products"
if not pc.has_index(index_name):
    pc.create_index(
        name=index_name,
        dimension=768,
        metric="cosine",
        spec=ServerlessSpec(
            cloud='aws', 
            region='us-east-1'
        ) 
    )
while not pc.describe_index(index_name).status['ready']:
    time.sleep(1)

vector_store = pc.Index(index_name)
embeddings = HuggingFaceEmbeddings()
SIMILARITY_THRESHOLD = 0.2

# Function to add a document to Pinecone
def addDocument(content, link, image, rating, review_count, price, availability):
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

# Function to search for similar items
def findItems(query: str, numItems: int):
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
    
@app.route('/recommend_from_db', methods=['POST'])
def recommendfromdb():
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
                        "2. 'product_tags' - A list of four products as strings that excatly align with the user's needs. These tags should be formulated so that when searched on Amazon, the exact product the user is looking for appears first."
                        """Example for a json is: {
                        "message": "Aww, that's so exciting! I'm happy to help you find the paw-fect gift for your furry friend. Can you tell me a bit more about your dog? What's their breed, size, and personality like? That way, I can give you super tailored recommendations. In the meantime, here are some fun ideas to get you started:",
                        "product_tags": [
                            "Dog Toys",
                            "Dog Beds",
                            "Dog Food"
                        ]
                        }"""
                        f"The user asked: {user_query}"
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
        add_tags(email, product_tags)
        search_results = {}
        for tag in product_tags:
            search_results[tag] = findItems(tag,3)[0]

        # Add search results to the response data
        response_data['search_results'] = search_results

        return jsonify(response_data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

def add_tags(email, tags):
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


@app.route('/userregister', methods=['POST'])
def user_register():
    data = request.get_json()
    user = data.get('user')

    if not user:
        return jsonify({"message": "No user data provided"}), 400

    name = user.get('name')
    email = user.get('email')
    password = user.get('password')

    if not (name and email and password):
        return jsonify({"message": "All fields are required"}), 400

    existing_user = users_collection.find_one({"email": email})
    
    if existing_user:
        return jsonify({"message": "User Already Exists"}), 400

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    
    new_user = {
        "name": name,
        "email": email,
        "password": hashed_password
    }

    users_collection.insert_one(new_user)
    
    access_token = create_access_token(identity={"email": email})
    new_user["_id"] = str(new_user["_id"]) 

    return jsonify({"message": "Registered Successfully", "user": new_user, "access_token": access_token}), 201

@app.route('/get_recommendations', methods=['POST'])
def get_recommendations():
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({"message": "Email is required"}), 400
    
    existing_user = tags_collection.find_one({"email": email})

    if not existing_user:
        return jsonify({"message": "User Not Registered"}), 400

    results = []
    result = {}
    seen = set()

    for i in existing_user['tags'][:21]:
        items = findItems(i, 3)
        for item in items:
            # Use 'url' as the unique identifier for each product
            if item['url'] not in seen:
                results.append(item)
                seen.add(item['url'])

    result['result'] = results

    return jsonify(result), 200

@app.route('/userlogin', methods=['POST'])
def user_login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not (email and password):
        return jsonify({"message": "Email and password are required"}), 400

    user = users_collection.find_one({"email": email})
    if not user:
        return jsonify({"message": "User Not Registered"}), 400

   
    if not bcrypt.check_password_hash(user['password'], password):
        return jsonify({"message": "Invalid Credentials"}), 400

    access_token = create_access_token(identity={"email": email})

    return jsonify({
        "message": "Login Successful",
        "access_token": access_token,
        "name": user['name'],
        "email": user['email']
    }), 200


def search_product(query):
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
        
        if top_results:
            # Loop through the results and add each one to Pinecone
            for result in top_results:
                addDocument(
                    content=result.get('title', 'N/A'),
                    link=result.get('link', 'N/A'),
                    image=result.get('image', 'N/A'),
                    rating=result.get('rating', None),
                    review_count=result.get('review_count', None),
                    price=result.get('price', None),
                    availability="In Stock"  # Set default availability
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
            return {"error": "No results found"}
    except Exception as e:
        print(f"Error fetching the products!: {e}")
        return {"error": str(e)}


@app.route('/recommend', methods=['POST'])
def recommend():
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
                        "2. 'product_tags' - A list of four products as strings that excatly align with the user's needs. These tags should be formulated so that when searched on Amazon, the exact product the user is looking for appears first."
                        """Example for a json is: {
                        "message": "Aww, that's so exciting! I'm happy to help you find the paw-fect gift for your furry friend. Can you tell me a bit more about your dog? What's their breed, size, and personality like? That way, I can give you super tailored recommendations. In the meantime, here are some fun ideas to get you started:",
                        "product_tags": [
                            "Dog Toys",
                            "Dog Beds",
                            "Dog Food"
                        ]
                        }"""
                        f"The user asked: {user_query}"
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
        add_tags(email, product_tags)
        search_results = {}
        for tag in product_tags:
            search_results[tag] = search_product(tag)

        # Add search results to the response data
        response_data['search_results'] = search_results

        return jsonify(response_data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
