// Fighters.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import "./Fighters.css";

function Fighters() {
  const [fighters, setFighters] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:8000/fighters").then((res) => {
      setFighters(res.data);
    });
  }, []);

  return (
    <motion.div
      className="fighters-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <h2>Fighter Roster</h2>
      <div className="fighter-grid">
        {fighters.map((name) => (
          <Link to={`/fighters/${encodeURIComponent(name)}`} key={name} className="fighter-card">
            <div className="card-inner">
              <div className="card-front">
                <img
                  src={`https://via.placeholder.com/200x200?text=${encodeURIComponent(name)}`}
                  alt={name}
                />
                <p>{name}</p>
              </div>
              <div className="card-back">
                <p>View Profile</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}

export default Fighters;
