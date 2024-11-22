import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Star, ChevronDown, Loader2, MessageSquare, ArrowLeft } from 'lucide-react'
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

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true)
      try {
        const email = localStorage.getItem('email')
        if (!email) {
          console.error('User email not found in localStorage')
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
        
        // Remove duplicate products
        const uniqueProducts = productsArray.filter((product, index, self) =>
          index === self.findIndex((t) => t.name === product.name && t.price === product.price)
        )
        
        setProducts(uniqueProducts)
      } catch (error) {
        console.error('Error fetching products:', error)
        setProducts([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [])

  useEffect(() => {
    if (products.length === 0) {
      setFilteredProducts([])
      return
    }

    const filtered = products.filter((product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    const sorted = filtered.sort((a, b) => {
      if (sortBy === 'priceLowToHigh') {
        const priceA = parseFloat(a.price.replace(/[^\d.]/g, '')) || 0
        const priceB = parseFloat(b.price.replace(/[^\d.]/g, '')) || 0
        return priceA - priceB
      } else if (sortBy === 'priceHighToLow') {
        const priceA = parseFloat(a.price.replace(/[^\d.]/g, '')) || 0
        const priceB = parseFloat(b.price.replace(/[^\d.]/g, '')) || 0
        return priceB - priceA
      } else if (sortBy === 'rating') {
        const ratingA = parseFloat(a.rating || '0')
        const ratingB = parseFloat(b.rating || '0')
        return ratingB - ratingA
      } else {
        // 'recommended' or default case: show latest recommendations first
        return filtered.indexOf(b) - filtered.indexOf(a)
      }
    })
    console.log('Filtered Products:', sorted)
    setFilteredProducts(sorted)
  }, [searchQuery, sortBy, products])

  return (
    <div className="min-h-screen bg-gradient-to-r from-rose-100 to-teal-100 p-8">
      <div className="flex items-center mb-8">
        <Link to="/" className="flex items-center text-blue-600 hover:text-blue-800 mr-4">
          <ArrowLeft className="mr-2" size={20} />
          Back
        </Link>
        <h1 className="text-4xl font-bold text-gray-800 text-center flex-grow">Recommended Products</h1>
      </div>
      
      <div className="max-w-4xl mx-auto mb-8">
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search for products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full border-2 border-gray-300 focus:border-blue-500 focus:outline-none"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
        <div className="flex justify-between items-center">
          <Link to="/chatbot" className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors">
            <MessageSquare className="mr-2" size={20} />
            Chat with AI for Recommendations
          </Link>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-8 leading-tight focus:outline-none focus:border-blue-500"
            >
              <option value="recommended">Recommended</option>
              <option value="priceLowToHigh">Price: Low to High</option>
              <option value="priceHighToLow">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
        </div>
      ) : (
        <>
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={index}
                  className="bg-white rounded-lg shadow-md overflow-hidden transition-shadow hover:shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
                  <div className="p-4">
                    <h2 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">{product.name}</h2>
                    <p className="text-2xl font-bold text-blue-600 mb-2">{product.price}</p>
                    <div className="flex items-center mb-2">
                      <Star className="text-yellow-400 mr-1" />
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
                      className="block w-full text-center bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors"
                    >
                      View Product
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-600 mt-8">
              No products found. Try adjusting your search or filters.
            </div>
          )}
        </>
      )}
    </div>
  )
}

