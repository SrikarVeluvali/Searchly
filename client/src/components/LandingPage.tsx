import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, ShoppingBag, Zap, Heart } from 'lucide-react';

export default function LandingPage() {
  const [greeting, setGreeting] = useState('Discover Products Made for You');
  const [searchQuery, setSearchQuery] = useState('');
  const [backgroundIndex, setBackgroundIndex] = useState(0);
  const greetings = [
    'Discover Products Made for You',
    'Start Your Unique Shopping Journey',
    'Find Your Perfect Style Match'
  ];
  const backgrounds = [
    'bg-gradient-to-r from-rose-100 to-teal-100',
    'bg-gradient-to-r from-rose-100 to-teal-100',
    'bg-gradient-to-r from-rose-100 to-teal-100'
  ];

  useEffect(() => {
    const greetingInterval = setInterval(() => {
      setGreeting(greetings[Math.floor(Math.random() * greetings.length)]);
    }, 5000);

    const backgroundInterval = setInterval(() => {
      setBackgroundIndex((prevIndex) => (prevIndex + 1) % backgrounds.length);
    }, 10000);

    return () => {
      clearInterval(greetingInterval);
      clearInterval(backgroundInterval);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center text-neutral-800 transition-all duration-1000 ${backgrounds[backgroundIndex]}`}>
      <motion.div
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
      >
        
      </motion.div>

      <motion.h1
        className="text-2xl md:text-6xl font-bold text-center m-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        Welcome to Searchly! {localStorage.getItem('name')} ❤️
      </motion.h1>

      <AnimatePresence mode="wait">
        <motion.p
          key={greeting}
          className="text-xl md:text-2xl text-center mb-12 h-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
        >
          {greeting}
        </motion.p>
      </AnimatePresence>

      <motion.form
        className="w-full max-w-md mb-8"
        onSubmit={handleSearch}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <div className="relative">
          {/* <input
            type="text"
            placeholder="Search for products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full border-2 border-gray-300 focus:border-blue-500 focus:outline-none"
          /> */}
          {/* <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" /> */}
        </div>
      </motion.form>

      <motion.div
        className="flex space-x-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
      >
        <Link
          to="/mood-selection"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full transition duration-300 ease-in-out transform hover:scale-105"
        >
          Start Now
        </Link>
        <button
          className="bg-white bg-opacity-50 hover:bg-opacity-100 text-blue-600 font-bold py-3 px-6 rounded-full transition duration-300 ease-in-out transform hover:scale-105"
        >
          Learn More
        </button>
      </motion.div>

      <motion.div
        className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.2 }}
      >
        <div className="flex flex-col items-center text-center">
          <ShoppingBag className="w-12 h-12 mb-4 text-blue-600" />
          <h3 className="text-xl font-semibold mb-2">Personalized Shopping</h3>
          <p className="text-sm text-gray-600">Discover products tailored to your unique style and preferences.</p>
        </div>
        <div className="flex flex-col items-center text-center">
          <Zap className="w-12 h-12 mb-4 text-blue-600" />
          <h3 className="text-xl font-semibold mb-2">AI-Powered Recommendations</h3>
          <p className="text-sm text-gray-600">Our advanced AI learns your taste to suggest the perfect items for you.</p>
        </div>
        <div className="flex flex-col items-center text-center">
          <Heart className="w-12 h-12 mb-4 text-blue-600" />
          <h3 className="text-xl font-semibold mb-2">Save Your Favorites</h3>
          <p className="text-sm text-gray-600">Create personalized collections of your most-loved products.</p>
        </div>
      </motion.div>

      <motion.footer
        className="mt-16 text-sm text-center text-gray-600"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.6 }}
      >
        <p>&copy; 2024 Searchly. All rights reserved.</p>
        <p className="mt-2">Powered by AI. Designed for you.</p>
      </motion.footer>
    </div>
  );
}