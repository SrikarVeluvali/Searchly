from flask import request, jsonify

def add_fav(tags_collection):
    data = request.get_json()
    email = data.get('email')
    product = data.get('product')

    if not (email and product):
        print("Hi1")
        return jsonify({"message": "Email and product are required"}), 400

    # Add the product to the user's `fav_products` list in the `tags_collection`
    tags_collection.update_one(
        {"email": email},
        {"$addToSet": {"fav_products": product}}  # Add the product to the list, ensuring no duplicates
    )

    # Retrieve the updated user's document for verification
    updated_user = tags_collection.find_one({"email": email}, {"fav_products": 1})

    if updated_user:
        return jsonify({
            "message": "Product favorited successfully!",
            "fav_products": updated_user.get("fav_products", [])
        }), 200
    else:
        print("Hi2")
        return jsonify({"message": "Error updating favorites"}), 500

def get_fav(tags_collection):
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({"message": "Email is required"}), 400

    # Fetch the user's favorited products from the `tags_collection`
    user_data = tags_collection.find_one({"email": email}, {"fav_products": 1})

    if not user_data:
        print("hi")
        return jsonify({"message": "No data found for the provided email"}), 404

    fav_products = user_data.get("fav_products", [])

    return jsonify({
        "message": "Favorited products retrieved successfully!",
        "fav_products": fav_products
    }), 200

def remove_fav(tags_collection):
    data = request.get_json()
    email = data.get('email')
    product_url = data.get('product_url')  # Use the product's URL as a unique identifier

    if not (email and product_url):
        return jsonify({"message": "Email and product URL are required"}), 400

    # Remove the product from the `fav_products` array in the `tags_collection`
    result = tags_collection.update_one(
        {"email": email},
        {"$pull": {"fav_products": {"url": product_url}}}  # Match product by its URL
    )

    if result.modified_count > 0:
        # Fetch the updated favorites list for confirmation
        updated_user = tags_collection.find_one({"email": email}, {"fav_products": 1})
        fav_products = updated_user.get("fav_products", [])

        return jsonify({
            "message": "Product removed successfully!",
            "fav_products": fav_products
        }), 200
    else:
        return jsonify({"message": "Product not found or already removed"}), 404