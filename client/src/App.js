import React, { useContext } from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage.tsx';
import Products from './components/Products.tsx';
import ChatbotPage from './components/ChatbotPage.tsx';
import AuthScreen from './components/AuthScreen.tsx';
import ProtectedRoutes from './components/ProtectedRoutes.tsx';
import FavoritesPage from './components/FavouritesPage.tsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
          <Route path ="/auth" element={<AuthScreen />} />
          <Route path="/" element={<ProtectedRoutes />}>
            <Route index element={<LandingPage />} />
            <Route path="/products" element={<Products/>}/>
            <Route path="/chatbot" element={<ChatbotPage/>}/>
            <Route path="/favourites" element={<FavoritesPage/>}/>
          </Route>
      </Routes>
    </BrowserRouter>
  );
}