// ✅ Updated Home.jsx
import React, { useState } from "react";
import FightForm from "../components/FightForm";
import ResultCard from "../components/ResultCard";
import { motion } from "framer-motion";
import UpcomingCardList from "../components/UpcomingCardList"; // ✅ New upcoming matchups
import "./Home.css";

function Home() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePrediction = (data) => {
    setResult(data);
    setLoading(false);
  };

  return (
    <motion.div
      className="home-wrapper"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <div className="octagon-section">
        <h1 className="page-header">UFC Fight Predictor</h1>
        <FightForm onPredict={handlePrediction} setLoading={setLoading} />
        {loading && <p style={{ textAlign: "center" }}>Loading...</p>}
        {result && <ResultCard result={result} />}
      </div>

      {/* ✅ New Section */}
      <div className="upcoming-section">
        <h2>Upcoming Fights</h2>
        <UpcomingCardList />
      </div>
    </motion.div>
  );
}

export default Home;
