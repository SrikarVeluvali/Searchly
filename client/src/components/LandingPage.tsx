import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Zap, Heart, ChevronRight, LogOut, User } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('Discover Products Made for You');
  const [searchQuery, setSearchQuery] = useState('');
  const [backgroundIndex, setBackgroundIndex] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const greetings = [
    'Discover Products Made for You',
    'Start Your Unique Shopping Journey',
    'Find Your Perfect Style Match'
  ];
  const backgrounds = [
    'bg-gradient-to-br from-rose-100 via-teal-100 to-indigo-100',
  ];

  const userName = localStorage.getItem('name') || 'Shopper';
  const userEmail = localStorage.getItem('email') || 'shopper@example.com';

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

  const handleLogout = () => {
    localStorage.clear();
    navigate('/auth');
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center text-gray-800 transition-all duration-1000 ${backgrounds[backgroundIndex]}`}>
      <div className="w-full max-w-6xl px-4 py-8 md:py-16 relative">
        {/* Profile Section */}
        <div className="absolute top-4 right-4 z-10">
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 bg-white bg-opacity-70 rounded-full p-2 hover:bg-opacity-100 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xl font-bold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="hidden md:inline font-medium">{userName}</span>
            </button>
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
                <div className="px-4 py-2 text-sm text-gray-700 border-b">
                  <p className="font-semibold">{userName}</p>
                  <p className="text-xs text-gray-500">{userEmail}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <LogOut className="inline-block w-4 h-4 mr-2" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        <motion.header
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Welcome to Searchly!
          </h1>
          <p className="text-xl md:text-2xl font-light">
            Hello, {userName} ❤️
          </p>
        </motion.header>

        <AnimatePresence mode="wait">
          <motion.p
            key={greeting}
            className="text-2xl md:text-3xl text-center mb-12 h-16 font-medium"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            {greeting}
          </motion.p>
        </AnimatePresence>

        <motion.form
          className="w-full max-w-2xl mx-auto mb-12"
          onSubmit={handleSearch}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {/* Search form content removed as per the previous code */}
        </motion.form>
        <motion.div
          className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <Link
            to="/products"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-full transition duration-300 ease-in-out transform hover:scale-105 flex items-center"
          >
            Start Searching!
            <ChevronRight className="ml-2" size={20} />
          </Link>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          {[
            { icon: ShoppingBag, title: "Personalized Shopping", description: "Discover products tailored to your unique style and preferences." },
            { icon: Zap, title: "AI-Powered Recommendations", description: "Our advanced AI learns your taste to suggest the perfect items for you." },
            { icon: Heart, title: "Save Your Favorites", description: "Create personalized collections of your most-loved products." }
          ].map((feature, index) => (
            <motion.div
              key={index}
              className="bg-white bg-opacity-70 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <feature.icon className="w-12 h-12 mb-4 text-indigo-600" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.footer
          className="text-center text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.6 }}
        >
          <p>&copy; 2024 Searchly. All rights reserved.</p>
          <p className="mt-2">Powered by AI. Designed for you.</p>
        </motion.footer>
      </div>
    </div>
  );
}

