import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Star, Trash2, Loader2, Heart, ShoppingCart, ExternalLink } from 'lucide-react';

type Product = {
  name: string;
  description: string;
  image: string;
  price: string;
  rating: number;
  reviews: number;
  url: string;
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const userEmail = localStorage.getItem('email') || '';

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/get_favourites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch favorites');
      }

      const data = await response.json();
      if (data.message === "No data found for the provided email") {
        setFavorites([]);
      } else {
        setFavorites(data.fav_products || []);
      }
    } catch (err) {
      setError('Error fetching favorites. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const removeFavorite = async (productUrl: string) => {
    try {
      const response = await fetch('http://localhost:5000/remove_favourite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail, product_url: productUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove favorite');
      }

      setFavorites(favorites.filter(fav => fav.url !== productUrl));
      if (selectedProduct?.url === productUrl) {
        setSelectedProduct(null);
      }
    } catch (err) {
      setError('Error removing favorite. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 via-teal-100 to-indigo-100">
      <header className="bg-white bg-opacity-90 backdrop-blur-sm border-b border-gray-200 p-4 sticky top-0 z-10 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/products" className="text-indigo-600 hover:text-indigo-800 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl font-bold ">
            Your Favorites
          </h1>
          <div className="w-6 h-6"></div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md"
            role="alert"
          >
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </motion.div>
        ) : favorites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-gray-600 mt-16"
          >
            <Heart className="w-24 h-24 mx-auto mb-6 text-pink-400" />
            <h2 className="text-3xl font-bold mb-4 text-gray-800">Your Favorites List is Empty</h2>
            <p className="text-xl mb-8">Start exploring and add some products to your favorites!</p>
            <Link
              to="/products"
              className="bg-indigo-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-indigo-700 transition-colors duration-300"
            >
              Discover Products
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {favorites.map((product, index) => (
                <motion.div
                  key={product.url}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="relative">
                    <img
                      src={product.image || '/placeholder.svg?height=300&width=400'}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-black opacity-50" />
                    <div className="absolute bottom-0 left-0 w-full p-4">
                      <h3 className="text-lg font-semibold text-white mb-1 line-clamp-1">{product.name}</h3>
                      <p className="text-sm text-gray-300 line-clamp-2">{product.description}</p>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-indigo-600">{product.price}</span>
                      <div className="flex items-center bg-yellow-400 px-2 py-1 rounded-full">
                        <Star className="w-4 h-4 text-white fill-current" />
                        <span className="ml-1 text-sm font-medium text-white">
                          {typeof product.rating === 'number' ? product.rating.toFixed(1) : product.rating || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => setSelectedProduct(product)}
                        className="flex items-center justify-center bg-indigo-100 text-indigo-600 px-4 py-2 rounded-full font-medium hover:bg-indigo-200 transition-colors duration-300"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        View Details
                      </button>
                      <button
                        onClick={() => removeFavorite(product.url)}
                        className="text-red-500 hover:text-red-700 transition-colors duration-300"
                      >
                        <Trash2 className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl p-6 max-w-lg w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedProduct.image || '/placeholder.svg?height=300&width=400'}
                alt={selectedProduct.name}
                className="w-full h-64 object-cover rounded-lg mb-4"
              />
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{selectedProduct.name}</h3>
              <p className="text-gray-600 mb-4">{selectedProduct.description}</p>
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl font-bold text-indigo-600">{selectedProduct.price}</span>
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="ml-1 text-lg font-medium text-gray-700">
                    {typeof selectedProduct.rating === 'number' ? selectedProduct.rating.toFixed(1) : selectedProduct.rating || 'N/A'} ({selectedProduct.reviews} reviews)
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <a
                  href={selectedProduct.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center bg-indigo-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-indigo-700 transition-colors duration-300"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Buy Now
                </a>
                <button
                  onClick={() => removeFavorite(selectedProduct.url)}
                  className="flex items-center justify-center bg-red-100 text-red-600 px-4 py-2 rounded-full font-medium hover:bg-red-200 transition-colors duration-300"
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  Remove from Favorites
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

