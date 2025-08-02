// src/components/Navbar.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "./Navbar.css";

function Navbar() {
  const [darkMode, setDarkMode] = useState(true);

  const toggleTheme = () => {
    document.body.classList.toggle("light-mode");
    setDarkMode(!darkMode);
  };

  return (
    <motion.nav
      className="navbar"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="navbar-inner">
        <Link to="/" className="logo-text">
        🥊 UFC Fight Predictor
        </Link>

        <div className="navbar-links">
          <div className="dropdown">
            <button className="dropbtn">Fighters ▾</button>
            <div className="dropdown-content">
              <Link to="/fighters">All Fighters</Link>
            </div>
          </div>

          <button onClick={toggleTheme} className="theme-toggle">
            {darkMode ? "🌞 Light" : "🌙 Dark"}
          </button>
        </div>
      </div>
    </motion.nav>
  );
}

export default Navbar;
