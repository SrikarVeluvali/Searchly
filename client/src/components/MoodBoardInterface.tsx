import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Heart, X, Tag } from 'lucide-react';

type Product = {
  id: string;
  title: string;
  image: string;
  tags: string[];
};

export default function MoodBoardInterface() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const loader = useRef(null);

  const fetchProducts = async () => {
    setLoading(true);
    // Simulating API call with setTimeout
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newProducts: Product[] = Array.from({ length: 10 }, (_, i) => ({
      id: `product-${page}-${i}`,
      title: `Product ${page * 10 + i + 1}`,
      image: `https://picsum.photos/seed/${page * 10 + i + 1}/300/300`,
      tags: ['Tag 0', 'Tag 1', 'Tag 2']
    }));
    setProducts(prev => [...prev, ...newProducts]);
    setPage(prev => prev + 1);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '20px',
      threshold: 1.0
    };

    const observer = new IntersectionObserver(handleObserver, options);
    if (loader.current) {
      observer.observe(loader.current);
    }

    return () => {
      if (loader.current) {
        observer.unobserve(loader.current);
      }
    };
  }, []);

  const handleObserver = (entities: IntersectionObserverEntry[]) => {
    const target = entities[0];
    if (target.isIntersecting && !loading) {
      fetchProducts();
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <h1 className="text-4xl text-black font-bold text-center mb-8">Your Mood Board</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <motion.div
            key={product.id}
            className="bg-white rounded-lg shadow-md overflow-hidden"
            whileHover={{ scale: 1.05, boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
          >
            <div className="relative">
              <img src={product.image} alt={product.title} className="w-full h-48 object-cover" />
              <div className="absolute top-2 right-2 flex space-x-2">
                <button className="bg-white rounded-full p-2 shadow-md">
                  <Heart className="w-4 h-4 text-red-500" />
                </button>
                <button className="bg-white rounded-full p-2 shadow-md">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-2 text-black">{product.title}</h2>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {tag}
                  </span>
                ))}
              </div>
              <motion.div
                className="mt-4 text-sm text-gray-600"
                initial={{ opacity: 0, height: 0 }}
                whileHover={{ opacity: 1, height: 'auto' }}
              >
                <p className="flex items-center">
                  <Tag className="w-4 h-4 mr-2 text-black" />
                  Why You'll Love This:
                </p>
                <ul className="list-disc list-inside mt-2">
                  <li>Perfect match for your style</li>
                  <li>High-quality materials</li>
                  <li>Versatile design</li>
                </ul>
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>
      {loading && <p className="text-center mt-8">Loading more products...</p>}
      <div ref={loader} className="h-10" />
    </div>
  );
}