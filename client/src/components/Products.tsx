import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Star, ChevronDown, Loader2, MessageSquare, ArrowLeft, RefreshCw, X, Heart } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Product {
  image: string
  name: string
  price: string
  rating: string | null
  reviews: string | null
  url: string
}

export default function ProductRecommendations() {
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('recommended')
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])

  const fetchProducts = useCallback(async (forceRefresh = false) => {
    setIsLoading(true)
    try {
      const email = localStorage.getItem('email')
      if (!email) {
        console.error('User email not found in localStorage')
        setIsLoading(false)
        return
      }

      const cachedProducts = localStorage.getItem('cachedProducts')
      if (cachedProducts && !forceRefresh) {
        setProducts(JSON.parse(cachedProducts))
        setIsLoading(false)
        return
      }

      const response = await fetch('http://localhost:5000/get_recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }

      const data = await response.json()
      console.log('API Response:', data)
      const productsArray = Array.isArray(data.result) ? data.result : []
      console.log('Products Array:', productsArray)
      
      const uniqueProducts = productsArray.filter((product, index, self) =>
        index === self.findIndex((t) => t.name === product.name && t.price === product.price)
      )
      
      setProducts(uniqueProducts)
      localStorage.setItem('cachedProducts', JSON.stringify(uniqueProducts))
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([])
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    const fetchFavorites = async () => {
      const email = localStorage.getItem('email')
      if (!email) {
        console.error('User email not found in localStorage')
        return
      }

      try {
        const response = await fetch('http://localhost:5000/get_favourites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        })

        if (!response.ok) {
          throw new Error('Failed to fetch favorites')
        }

        const data = await response.json()
        setFavorites(data.favorites || [])
      } catch (error) {
        console.error('Error fetching favorites:', error)
      }
    }

    fetchFavorites()
  }, [])

  useEffect(() => {
    if (products.length === 0) {
      setFilteredProducts([]);
      return;
    }
  
    const filtered = products.filter((product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  
    // Sorting logic
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'priceLowToHigh') {
        // Parse prices, treating "Not Available" as Infinity
        const cleanedPriceA = a.price.replace(/[^\d]/g, ''); // Remove all non-numeric characters
        const cleanedPriceB = b.price.replace(/[^\d]/g, ''); // Remove all non-numeric characters

        console.log('Cleaned priceA:', cleanedPriceA);
        console.log('Cleaned priceB:', cleanedPriceB);

        const priceA = a.price === 'Not Available' ? Infinity : (parseFloat(cleanedPriceA) || Infinity);
        const priceB = b.price === 'Not Available' ? Infinity : (parseFloat(cleanedPriceB) || Infinity);

        console.log('Parsed priceA:', priceA);
        console.log('Parsed priceB:', priceB);

        return priceA-priceB
      } else if (sortBy === 'priceHighToLow') {
        // Parse prices, treating "Not Available" as 0
        const cleanedPriceA = a.price.replace(/[^\d]/g, ''); // Remove all non-numeric characters
        const cleanedPriceB = b.price.replace(/[^\d]/g, ''); // Remove all non-numeric characters

        console.log('Cleaned priceA:', cleanedPriceA);
        console.log('Cleaned priceB:', cleanedPriceB);

        const priceA = a.price === 'Not Available' ? 0 : (parseFloat(cleanedPriceA) || 0);
        const priceB = b.price === 'Not Available' ? 0 : (parseFloat(cleanedPriceB) || 0);

        console.log('Parsed priceA:', priceA);
        console.log('Parsed priceB:', priceB);

        return priceB - priceA; // Sort in descending order
      } else if (sortBy === 'rating') {
        // Parse ratings, treating missing ratings as 0
        const ratingA = parseFloat(a.rating || '0');
        const ratingB = parseFloat(b.rating || '0');
        return ratingB - ratingA; // Sort in descending order
      } else {
        // Default sorting order (if no sortBy criteria match)
        return filtered.indexOf(b) - filtered.indexOf(a);
      }
    });
  
    // Set sorted and filtered products
    console.log("Filtered products",sorted)
    setFilteredProducts(sorted);
  
  }, [products, searchQuery, sortBy]); // Make sure all dependencies are included

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchProducts(true)
  }

  const handleFavorite = async (product: Product) => {
    const email = localStorage.getItem('email')
    if (!email) {
      console.error('User email not found in localStorage')
      return
    }

    try {
      const response = await fetch('http://localhost:5000/add_favourite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, product }),
      })

      if (!response.ok) {
        throw new Error('Failed to add favorite')
      }

      const data = await response.json()
      setFavorites(data.fav_products)
    } catch (error) {
      console.error('Error adding favorite:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 via-teal-100 to-indigo-100">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <Link to="/" className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors">
            <ArrowLeft className="mr-2" size={20} />
            <span className="font-semibold">Back</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Your Personalized Picks</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center bg-teal-500 text-white px-4 py-2 rounded-full hover:bg-teal-600 transition-colors disabled:bg-teal-300"
            >
              <RefreshCw className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} size={18} />
              Refresh
            </button>
            <Link
              to="/chatbot"
              className="flex items-center bg-indigo-500 text-white px-4 py-2 rounded-full hover:bg-indigo-600 transition-colors"
            >
              <MessageSquare className="mr-2" size={18} />
              AI Chat
            </Link>
            <Link
              to="/favourites"
              className="flex items-center bg-rose-500 text-white px-4 py-2 rounded-full hover:bg-rose-600 transition-colors"
            >
              <Heart className="mr-2" size={18} />
              Favourites
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="relative flex-grow md:max-w-md">
            <input
              type="text"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full border-2 border-gray-300 focus:border-indigo-500 focus:outline-none transition-colors"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden flex items-center justify-center bg-gray-200 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-300 transition-colors"
          >
            <ChevronDown className={`mr-2 transform ${showFilters ? 'rotate-180' : ''} transition-transform`} size={18} />
            Filters
          </button>
          <div className={`md:flex items-center space-x-4 ${showFilters ? 'block' : 'hidden'}`}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-full py-2 pl-4 pr-8 leading-tight focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="recommended">Recommended</option>
              <option value="priceLowToHigh">Price: Low to High</option>
              <option value="priceHighToLow">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none md:hidden" size={18} />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
          </div>
        ) : (
          <AnimatePresence>
            {filteredProducts.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
              >
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden transition-shadow hover:shadow-xl"
                  >
                    <div className="relative">
                      <img src={product.image} alt={product.name} className="w-full h-56 object-cover" />
                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-black opacity-50" />
                      <div className="absolute bottom-0 left-0 w-full p-4">
                        <h2 className="text-lg font-semibold text-white mb-1 line-clamp-2">{product.name}</h2>
                        <p className="text-2xl font-bold text-white">{product.price}</p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleFavorite(product)}
                        className="absolute top-2 right-2 bg-white bg-opacity-70 p-2 rounded-full"
                      >
                        <Heart
                          className={`w-6 h-6 ${
                            favorites.some(fav => fav.url === product.url) ? 'text-red-500 fill-red-500' : 'text-gray-600'
                          }`}
                        />
                      </motion.button>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center mb-4">
                        <Star className="text-yellow-400 mr-1" size={18} />
                        <span className="text-gray-600">
                          {product.rating && product.reviews
                            ? `${product.rating} (${product.reviews} reviews)`
                            : 'No ratings yet'}
                        </span>
                      </div>
                      <a
                        href={product.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full text-center bg-indigo-500 text-white py-2 rounded-full hover:bg-indigo-600 transition-colors"
                      >
                        View Product
                      </a>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-gray-600 mt-16"
              >
                <X className="mx-auto mb-4" size={48} />
                <p className="text-xl font-semibold">No products found</p>
                <p className="mt-2">Try adjusting your search or filters</p>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  )
}

