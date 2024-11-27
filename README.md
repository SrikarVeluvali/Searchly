# Searchly: AI-Powered Product Recommendation System

Welcome to **Searchly**, your go-to AI-powered e-commerce assistant! Searchly is a cutting-edge product recommendation system designed to deliver highly personalized shopping experiences. Powered by **AI-driven algorithms**, **real-time data scraping**, and a **modern frontend**, Searchly bridges the gap between user intent and the perfect product match.

---

## Table of Contents

1. [Features](#features)
2. [Project Structure](#project-structure)
3. [Architecture Diagram](#architecture)
4. [Tech Stack](#tech-stack)
5. [Workflow Diagram](#workflow)
6. [Setup Instructions](#setup-instructions)
7. [Detailed Component Overview](#detailed-component-overview)
    - [Backend](#backend)
    - [Frontend](#frontend)
8. [Usage](#usage)
9. [API Endpoints](#api-endpoints)
10. [Screenshots](#screenshots)
11. [Contributing](#contributing)

---

## Features

- **AI Chat Assistant**: "Aivy" guides users through product discovery with natural language queries.
- **Personalized Recommendations**: Provides tailored suggestions based on user preferences.
- **Favorites Management**: Add and remove products from a personal favorites list.
- **Search Filters**: Sort and filter products by price, ratings, and relevance.
- **Real-Time Product Scraping**: Fetch live product data for up-to-date recommendations.
- **Secure Authentication**: Secure user registration and login with JWT tokens.
- **Responsive Design**: Works seamlessly across devices.

---

## Project Structure

```
📁 Searchly
├── 📁 client (Frontend)
│   ├── 📁 public
│   ├── 📁 src
│   │   ├── 📁 components
│   │   ├── 📁 data
│   │   ├── App.js
│   │   ├── index.js
│   │   └── Tailwind CSS config files
│   └── package.json
├── 📁 server (Backend)
│   ├── app.py
│   ├── scrape_web.py
│   ├── 📁 .env (Configuration variables)
│   └── requirements.txt
├── README.md
```

---
## Architecture Diagram
![Workflow](https://github.com/user-attachments/assets/4862b7ab-3111-4cc9-897e-ea5b2a052140)


---

## Tech Stack

### Backend:
- **Python** (Flask)
- **MongoDB** for data persistence
- **Pinecone** for vector similarity search
- **HuggingFace Embeddings** for query-product matching
- **Groq API** for AI-based query understanding
- **BeautifulSoup/Requests** for web scraping

### Frontend:
- **React** for UI
- **Framer Motion** for animations
- **Tailwind CSS** for styling
- **Lucide Icons** for vector icons

---
## Workflow Diagram
![Workflow](https://github.com/user-attachments/assets/085f2d73-51e3-48d2-99aa-fc7f9460d456)


---

## Setup Instructions

### Prerequisites:
1. **Node.js** (v14+)
2. **Python** (v3.9+)
3. **MongoDB** installed locally or hosted
4. **Pinecone API Key**
5. **Groq API Key**

---

### Backend Setup:
1. Clone the repository:
   ```bash
   git clone https://github.com/SrikarVeluvali/Searchly
   cd Searchly/server
   ```

2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   source venv/bin/activate  # For Windows: venv\Scripts\activate
   ```

3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file with the following variables:
   ```
   GROQ_API_KEY=your_groq_api_key
   PINECONE_API_KEY=your_pinecone_api_key
   ```

5. Run the server:
   ```bash
   python app.py
   ```

6. The server will run on `http://localhost:5000`.

---

### Frontend Setup:
1. Navigate to the client folder:
   ```bash
   cd Searchly/client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm start
   ```

4. Access the application at `http://localhost:3000`.

---

### MongoDB Configuration:
- Ensure MongoDB is running locally or connect to a hosted instance.
- Update the database connection string in `app.py` if necessary.

---

## Detailed Component Overview

### Backend

#### Key Features:
1. **AI Recommendations**:
   - Processes user queries with the Groq API.
   - Embeds and indexes product data using HuggingFace and Pinecone.

2. **Data Management**:
   - MongoDB manages user data, tags, and favorites.
   - Handles CRUD operations for favorites and tags.

3. **Web Scraping**:
   - Dynamically fetches product details using `scrape_web.py`.

---

### Frontend

#### Pages:
1. **Landing Page**:
   - Introduces users to Searchly's capabilities.

2. **Authentication**:
   - Secure login and registration via React.

3. **AI Chatbot**:
   - Interactive UI to converse with "Aivy" for product suggestions.

4. **Product Recommendations**:
   - Displays personalized product lists with sorting/filtering.

5. **Favorites**:
   - Displays saved products for quick access.

#### Components:
- **AuthScreen**:
  - Handles login and registration flows.
- **ChatbotPage**:
  - Implements the AI assistant.
- **FavouritesPage**:
  - Manages user favorites.
- **Products**:
  - Renders the recommendation grid with search and filters.

---

## Usage

1. Launch both the backend (`http://localhost:5000`) and frontend (`http://localhost:3000`).
2. Navigate to `http://localhost:3000` to use the application.
3. **Key User Actions**:
   - Register/Login to create an account.
   - Interact with the chatbot to get product suggestions.
   - Add/remove products to/from your favorites.

---

## API Endpoints

Here is a comprehensive list of all API endpoints in the provided code:

### Authentication Endpoints

- **`/userregister`** (POST): Registers a new user. Requires `name`, `email`, and `password` in the request body.
- **`/userlogin`** (POST): Logs in an existing user. Requires `email` and `password` in the request body.

---

### Recommendation Endpoints

- **`/recommend`** (POST): Handles user queries to generate AI-based product recommendations using Groq. Requires `query` and `email` in the request body.
- **`/recommend_from_db`** (POST): Similar to `/recommend` but focuses on finding recommendations based on previously indexed products. Requires `query` and `email` in the request body.

---

### Favorites Management Endpoints

- **`/add_favourite`** (POST): Adds a product to the user's favorites list. Requires `email` and `product` (product details) in the request body.
- **`/get_favourites`** (POST): Retrieves the list of favorited products for a user. Requires `email` in the request body.
- **`/remove_favourite`** (POST): Removes a product from the user's favorites list. Requires `email` and `product_url` (unique product URL) in the request body.

---

### Tag and Recommendation Retrieval Endpoints

- **`/get_recommendations`** (POST): Retrieves product recommendations based on a user's stored tags. Requires `email` in the request body.

---

### Utilities

- **`search_product(query)`** (Function): Helper function to scrape e-commerce websites (e.g., Amazon and Flipkart) for products based on a search query. This is not exposed as an endpoint but is used within `/recommend` and `/recommend_from_db`.


---

## Screenshots

### 1. Landing Page
![image](https://github.com/user-attachments/assets/c5f0377b-6a58-4388-8bed-b93aedb76540)

### 2. AI Chatbot
![image](https://github.com/user-attachments/assets/5b5152a7-3009-4cf1-a6de-35ae47318c59)

### 3. Product Recommendations
![image](https://github.com/user-attachments/assets/4b7de88b-e6e1-46e1-9942-42c7b62e1a4a)

### 4. Favorites Management
![image](https://github.com/user-attachments/assets/10cc55b9-28f3-477c-9e37-b4e38d155530)
![image](https://github.com/user-attachments/assets/cfa3670f-3bae-4d50-8c1f-f3ed0a36fd25)


---

## Contributing

1. Fork the repository.
2. Create a feature branch:
   ```bash
   git checkout -b feature-name
   ```
3. Commit changes and push to your fork:
   ```bash
   git push origin feature-name
   ```
4. Open a pull request.


---
