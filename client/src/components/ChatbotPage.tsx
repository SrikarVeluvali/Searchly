import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, ArrowLeft, Star, RefreshCw, ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

type Message = {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  productTags?: string[];
  products?: Product[];
  recommendMore?: boolean;
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
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hello! I'm your AI shopping assistant. How can I help you find the perfect product today?", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendRecommendationRequest = async (query: string, endpoint: string): Promise<ApiResponse> => {
    try {
      const response = await fetch(`http://localhost:5000/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          "email":localStorage.getItem('email'),
          "query":query 
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
      };
      setMessages(prev => [...prev, botResponse]);

      // Add "Recommend more" button if products were returned
      if (products.length > 0) {
        setMessages(prev => [
          ...prev,
          {
            id: messages.length + 3,
            text: '',
            sender: 'bot',
            recommendMore: true,
            originalQuery: query,
          },
        ]);
      }
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
      };
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      setError("I'm sorry, I couldn't process your request at the moment. Please try again later.");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-r from-rose-100 to-teal-100">
      <div className="p-4 bg-white bg-opacity-80 backdrop-blur-sm border-b border-gray-200 flex items-center shadow-md">
        <Link to="/mood-selection" className="text-gray-600 hover:text-gray-800 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-xl font-semibold text-gray-800 ml-4">Chat with Aivy 🤖</h1>
      </div>
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
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
              <div className={`flex items-end max-w-[75%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`rounded-full p-2 ${message.sender === 'user' ? 'bg-teal-500' : 'bg-rose-500'}`}>
                  {message.sender === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                </div>
                <div className={`mx-2 p-3 rounded-2xl ${message.sender === 'user' ? 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-800'}`}>
                  <p className="text-sm">{message.text}</p>
                  {message.productTags && message.productTags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {message.productTags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-white text-gray-600 rounded-full text-xs font-medium border border-gray-200 shadow-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {message.products && message.products.length > 0 && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {message.products.map((product, index) => (
                        <motion.div
                          key={index}
                          className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 transition-all duration-300 ease-in-out flex flex-col"
                          whileHover={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
                        >
                          <div className="relative aspect-square">
                            {product.image ? (
                              <img src={product.image} alt={product.name || 'Product'} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                <ImageIcon className="w-12 h-12 text-gray-400" />
                              </div>
                            )}
                            {product.price && (
                              <div className="absolute top-0 right-0 bg-teal-500 text-white px-2 py-1 text-xs font-bold rounded-bl-lg">
                                {product.price}
                              </div>
                            )}
                          </div>
                          <div className="p-3 flex-grow flex flex-col justify-between">
                            <div>
                              <h3 className="font-semibold text-sm text-gray-800 line-clamp-2">{product.name || 'Product Name Unavailable'}</h3>
                            </div>
                            <div className="mt-2">
                              {(product.rating !== undefined || product.reviews !== undefined) && (
                                <div className="flex items-center justify-between">
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
                                  className="mt-2 block text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors duration-200 text-center bg-teal-50 rounded-full py-1 hover:bg-teal-100"
                                >
                                  View Product
                                </a>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                  {message.recommendMore && (
                    <button
                      onClick={() => handleRecommendMore(message.originalQuery!)}
                      className="mt-4 w-full bg-teal-500 text-white rounded-full py-2 px-4 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-300 transition-colors duration-300 flex items-center justify-center"
                    >
                      <RefreshCw className="w-5 h-5 mr-2" />
                      Don't like these? Recommend more
                    </button>
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
            <div className="bg-rose-500 rounded-full p-2">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="max-w-xs mx-2 p-3 rounded-2xl bg-rose-100 text-rose-800">
              <span className="animate-pulse">Typing...</span>
            </div>
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center"
          >
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          </motion.div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div className="p-4 bg-white bg-opacity-80 backdrop-blur-sm border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message here..."
            className="flex-grow px-4 py-2 rounded-full bg-gray-100 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-300 transition-all duration-300"
          />
          <button
            type="submit"
            className="ml-2 bg-teal-500 text-white rounded-full p-2 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-300 transition-colors duration-300"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}