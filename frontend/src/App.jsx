// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Fighters from "./pages/Fighters";
import FighterProfile from "./pages/FighterProfile";
import { AnimatePresence } from "framer-motion";
import "./App.css";

function AppWrapper() {
  const location = useLocation();
  return (
    <div className="app-container">
      <Navbar />
      <div className="main-content">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/fighters" element={<Fighters />} />
            <Route path="/fighters/:name" element={<FighterProfile />} />
          </Routes>
        </AnimatePresence>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppWrapper />
    </BrowserRouter>
  );
}

export default App;
