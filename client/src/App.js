import React, { useContext } from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage.tsx';
import MoodSelectionScreen from './components/MoodSelectionScreen.tsx';
import MoodBoardInterface from './components/MoodBoardInterface.tsx';
import ChatbotPage from './components/ChatbotPage.tsx';
import AuthScreen from './components/AuthScreen.tsx';
import ProtectedRoutes from './components/ProtectedRoutes.tsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
          <Route path ="/auth" element={<AuthScreen />} />
          <Route path="/" element={<ProtectedRoutes />}>
            <Route index element={<LandingPage />} />
            <Route path="/mood-selection" element={<MoodSelectionScreen/>}/>
            <Route path="/mood-board" element={<MoodBoardInterface/>}/>
            <Route path="/chatbot" element={<ChatbotPage/>}/>
          </Route>
      </Routes>
    </BrowserRouter>
  );
}