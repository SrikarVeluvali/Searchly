from flask import request, jsonify
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token

bcrypt = Bcrypt()

def register(users_collection):
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

    return jsonify({"message": "Registered Successfully", "user": new_user, "access_token": access_token, "name":name, "email":email}), 201


def login(users_collection):
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