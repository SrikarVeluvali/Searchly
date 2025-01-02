from flask import Flask, request, jsonify
from groq import Groq
import requests
import json
import time
from flask_cors import CORS
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
import time
import pandas as pd
from uuid import uuid4
from langchain_huggingface import HuggingFaceEmbeddings
from pinecone import Pinecone, ServerlessSpec
import random
from scrape_web import scrape
from auth import register, login
from favourites import add_fav, get_fav, remove_fav
from recommendations import recommend_from_db, getrecommendations, recommend_from_web, gethistory
from recommendations import remove_conversation

load_dotenv()


# Initialize the Groq client
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
PINECONE_API_KEY=os.getenv("PINECONE_API_KEY")
client = Groq(api_key=GROQ_API_KEY)

# Initialize the Flask app
app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)

# Configure the JWT
app.config['JWT_SECRET_KEY'] = 'ProductRecommendationSystemProjectKMIT'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
jwt = JWTManager(app)


mongo_client = MongoClient('mongodb://localhost:27017/')
db = mongo_client['product-recommendation-system']
users_collection = db['users']
tags_collection = db['tags']
history_collection = db['conversation_history']

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



@app.route('/userregister', methods=['POST'])
def user_register():
    return register(users_collection)

@app.route('/userlogin', methods=['POST'])
def user_login():
    return login(users_collection)




@app.route('/add_favourite', methods=['POST'])
def add_favo():
    """
    Add a favorited product to the user's document in the tags_collection.
    """
    return add_fav(tags_collection)

@app.route('/get_favourites', methods=['POST'])
def get_favo():
    """
    Retrieve the list of favorited products for a user.
    """
    return get_fav(tags_collection)

@app.route('/remove_favourite', methods=['POST'])
def remove_favo():
    """
    Remove a favorited product from the user's list.
    """
    return remove_fav(tags_collection)

@app.route('/clear_chat_history', methods=['POST'])
def clear_chat_history():
    """
    Clear the conversation history for a user.
    """
    return remove_conversation(history_collection)


@app.route('/recommend_from_db', methods=['POST'])
def recommendfromdb():
    """
    Handles the /recommend route. Accepts a query from the user,
    generates product recommendations using Groq, and fetches
    details for each product tag.
    """
    # Get the user query from the request
    return recommend_from_db(tags_collection, history_collection, embeddings, vector_store ,client)

@app.route('/get_recommendations', methods=['POST'])
def get_recommendations():
    return getrecommendations(users_collection, tags_collection ,embeddings, vector_store)


@app.route('/recommend', methods=['POST'])
def recommend():
    """
    Handles the /recommend route. Accepts a query from the user,
    generates product recommendations using Groq, and fetches
    details for each product tag.
    """
    return recommend_from_web(tags_collection, history_collection, embeddings, vector_store, client)

@app.route('/get_history', methods=['POST'])
def get_history():
    """
    Retrieves the conversation history for a user.
    """
    return gethistory(history_collection)

if __name__ == '__main__':
    app.run(debug=True)