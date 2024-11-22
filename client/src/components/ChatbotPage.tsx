import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, ArrowLeft, Star, RefreshCw, ImageIcon, Loader2, Heart, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

type Message = {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  productTags?: string[];
  products?: Product[];
  originalQuery?: string;
};

type Product = {
  name?: string;
  description?: string;
  image?: string;
  price?: string;
  rating?: number | string;
  reviews?: number;
  url?: string;
  isFavorite?: boolean;
};

type ApiResponse = {
  message?: string;
  product_tags?: string[];
  products?: Product[];
  search_results?: {
    [key: string]: Product;
  };
};

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedMessages = localStorage.getItem('chatMessages');
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    } else {
      setMessages([
        { id: 1, text: "Hello! I'm Aivy, your AI shopping assistant. How can I help you find the perfect product today?", sender: 'bot' }
      ]);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
    }
  }, [messages]);

  const fetchFavorites = async () => {
    const email = localStorage.getItem('email');
    if (!email) return;

    try {
      const response = await fetch('http://localhost:5000/get_favourites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch favorites');
      }

      const data = await response.json();
      return data.fav_products || [];
    } catch (error) {
      console.error('Error fetching favorites:', error);
      return [];
    }
  };

  const sendRecommendationRequest = async (query: string, endpoint: string): Promise<ApiResponse> => {
    try {
      const response = await fetch(`http://localhost:5000/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          "email": localStorage.getItem('email'),
          "query": query 
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent, customQuery?: string) => {
    e.preventDefault();
    const query = customQuery || input;
    if (query.trim() === '') return;

    const newUserMessage: Message = { id: messages.length + 1, text: query, sender: 'user' };
    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    setIsTyping(true);
    setError(null);

    try {
      const response = await sendRecommendationRequest(query, 'recommend_from_db');
      const products = response.search_results ? Object.values(response.search_results) : [];
      const botResponse: Message = {
        id: messages.length + 2,
        text: response.message || "Here are some product recommendations:",
        sender: 'bot',
        productTags: response.product_tags || [],
        products: products,
        originalQuery: query,
      };
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      setError("I'm sorry, I couldn't process your request at the moment. Please try again later.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleRecommendMore = async (originalQuery: string) => {
    setIsTyping(true);
    setError(null);

    try {
      const response = await sendRecommendationRequest(originalQuery, 'recommend');
      const products = response.search_results ? Object.values(response.search_results) : [];
      const botResponse: Message = {
        id: messages.length + 1,
        text: "Here are some more recommendations based on your query:",
        sender: 'bot',
        productTags: response.product_tags || [],
        products: products,
        originalQuery: originalQuery,
      };
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      setError("I'm sorry, I couldn't process your request at the moment. Please try again later.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleFavorite = async (product: Product) => {
    const email = localStorage.getItem('email');
    if (!email) {
      console.error('User email not found in localStorage');
      return;
    }

    const endpoint = product.isFavorite ? 'remove_favourite' : 'add_favourite';

    try {
      const response = await fetch(`http://localhost:5000/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, product: product }),
      });
      if (!response.ok) {
        throw new Error(`Failed to ${product.isFavorite ? 'remove from' : 'add to'} favorites`);
      }

      setMessages(prevMessages => 
        prevMessages.map(message => ({
          ...message,
          products: message.products?.map(p => 
            p.url === product.url ? { ...p, isFavorite: !p.isFavorite } : p
          )
        }))
      );
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  useEffect(() => {
    const initializeFavorites = async () => {
      const favorites = await fetchFavorites();
      setMessages(prevMessages => 
        prevMessages.map(message => ({
          ...message,
          products: message.products?.map(product => ({
            ...product,
            isFavorite: favorites.some((fav: Product) => fav.url === product.url)
          }))
        }))
      );
    };

    initializeFavorites();
  }, []);

  const clearChat = () => {
    localStorage.removeItem('chatMessages');
    setMessages([
      { id: 1, text: "Hello! I'm Aivy, your AI shopping assistant. How can I help you find the perfect product today?", sender: 'bot' }
    ]);
  };

  const ProductTiles = ({ products }: { products: Product[] }) => {
    return (
      <div className="mt-4 overflow-x-auto">
        <div className="flex space-x-4 pb-4">
          {products.map((product, index) => (
            <div key={index} className="flex-shrink-0 w-48 bg-white rounded-lg overflow-hidden shadow-md border border-gray-200 transition-all duration-300 hover:shadow-xl">
              <div className="relative h-48">
                {product.image ? (
                  <img src={product.image} alt={product.name || 'Product'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                {product.price && (
                  <div className="absolute top-2 right-2 bg-teal-500 text-white px-2 py-1 text-xs font-bold rounded-full shadow-md">
                    {product.price}
                  </div>
                )}
                <button
                  onClick={() => handleFavorite(product)}
                  className="absolute bottom-2 right-2 bg-white bg-opacity-70 p-2 rounded-full shadow-md hover:bg-opacity-100 transition-all duration-200"
                >
                  <Heart className={`w-5 h-5 ${product.isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-600'}`} />
                </button>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-sm text-gray-800 line-clamp-2 mb-2">{product.name || 'Product Name Unavailable'}</h3>
                {(product.rating !== undefined || product.reviews !== undefined) && (
                  <div className="flex items-center justify-between mb-2">
                    {product.rating !== undefined && (
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-xs font-medium text-gray-700 ml-1">
                          {product.rating}
                        </span>
                      </div>
                    )}
                    {product.reviews !== undefined && (
                      <span className="text-xs text-gray-500">{product.reviews} reviews</span>
                    )}
                  </div>
                )}
                {product.url && (
                  <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200 rounded-full py-2 px-4 shadow-md hover:shadow-lg"
                  >
                    View Product
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-rose-100 via-teal-100 to-indigo-100">
      <header className="bg-white bg-opacity-90 backdrop-blur-sm border-b border-gray-200 p-4 shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/products" className="text-indigo-600 hover:text-indigo-800 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Chat with Aivy 🤖</h1>
          <button
            onClick={clearChat}
            className="text-red-600 hover:text-red-800 transition-colors flex items-center"
          >
            <Trash2 className="w-5 h-5 mr-1" />
            Clear Chat
          </button>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto p-4 space-y-6">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-end max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`rounded-full p-2 ${message.sender === 'user' ? 'bg-indigo-500' : 'bg-rose-500'} shadow-lg`}>
                  {message.sender === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
                </div>
                <div className={`mx-2 p-4 rounded-2xl ${message.sender === 'user' ? 'bg-indigo-100 text-indigo-900' : 'bg-white text-gray-800'} shadow-lg`}>
                  <p className="text-sm">{message.text}</p>
                  {message.productTags && message.productTags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.productTags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-medium shadow-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {message.products && message.products.length > 0 && (
                    <>
                      <ProductTiles products={message.products} />
                      <button
                        onClick={() => handleRecommendMore(message.originalQuery!)}
                        className="mt-4 w-full bg-indigo-600 text-white rounded-full py-2 px-4 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all duration-300 flex items-center justify-center shadow-md"
                      >
                        <RefreshCw className="w-5 h-5 mr-2" />
                        Show more products
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-rose-500 rounded-full p-2 shadow-lg">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="max-w-xs mx-2 p-4 rounded-2xl bg-white text-gray-800 shadow-lg">
              <Loader2 className="w-5 h-5 animate-spin text-rose-500" />
            </div>
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center"
          >
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-md" role="alert">
              <div className="flex">
                <div className="py-1"><svg className="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/></svg></div>
                <div>
                  <p className="font-bold">Error</p>
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={chatEndRef} />
      </main>

      <footer className="bg-white bg-opacity-90 backdrop-blur-sm border-t border-gray-200 p-4 sticky bottom-0 z-10 shadow-lg">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message here..."
            className="flex-grow px-4 py-2 rounded-full bg-gray-100 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all duration-300 shadow-inner"
          />
          <button
            type="submit"
            className="ml-2 bg-indigo-500 text-white rounded-full p-3 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors duration-300 transform hover:scale-105 shadow-md"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </footer>
    </div>
  );
}

