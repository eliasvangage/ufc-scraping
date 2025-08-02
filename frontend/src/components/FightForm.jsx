import React, { useState, useEffect } from "react";
import axios from "axios";
import ResultCard from "./ResultCard";
import { motion, AnimatePresence } from "framer-motion";
import Select from "react-select";
import "./FightForm.css";

function FightForm() {
  const [fighter1, setFighter1] = useState("");
  const [fighter2, setFighter2] = useState("");
  const [fighterList, setFighterList] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    axios.get("http://localhost:8000/fighters")
      .then(res => {
        setFighterList(res.data);
      })
      .catch(() => {
        setLoadError(true);
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post("http://localhost:8000/predict", {
        fighter1,
        fighter2,
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "❌ Prediction failed.");
      setResult(null);
    }
  };

  const filteredOptions = (input) =>
    fighterList.filter(name =>
      name.toLowerCase().includes(input.toLowerCase())
    );

  return (
    <motion.div
      className="fight-form"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <form onSubmit={handleSubmit}>
        <input
          list="fighters1"
          value={fighter1}
          onChange={(e) => setFighter1(e.target.value)}
          placeholder="Enter Fighter 1"
        />
        <datalist id="fighters1">
          {filteredOptions(fighter1).map((name, i) => (
            <option key={i} value={name} />
          ))}
        </datalist>

        <input
          list="fighters2"
          value={fighter2}
          onChange={(e) => setFighter2(e.target.value)}
          placeholder="Enter Fighter 2"
        />
        <datalist id="fighters2">
          {filteredOptions(fighter2).map((name, i) => (
            <option key={i} value={name} />
          ))}
        </datalist>

        <button type="submit">Predict</button>
      </form>

      {error && <p className="error-msg">{error}</p>}
      {loadError && (
        <p className="error-msg">
          ⚠️ Unable to load fighter list. Please refresh.
        </p>
      )}

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <ResultCard result={result} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default FightForm;
