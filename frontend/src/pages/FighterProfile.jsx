import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import "./FighterProfile.css";

function FighterProfile() {
  const { name } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:8000/fighter/${encodeURIComponent(name)}`).then((res) => {
      setData(res.data);
    });
  }, [name]);

  if (!data) return <p>Loading profile...</p>;

  return (
    <motion.div className="page fighter-profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2>{data.name}</h2>
      {data.image_url && <img src={data.image_url} alt={data.name} className="fighter-image" />}
      <ul>
        <li><strong>Height:</strong> {data.height}</li>
        <li><strong>Reach:</strong> {data.reach}</li>
        <li><strong>Weight Class:</strong> {data.weight}</li>
        <li><strong>SLpM:</strong> {data.SLpM}</li>
        <li><strong>SApM:</strong> {data.SApM}</li>
        <li><strong>TD Avg:</strong> {data.TD_Avg}</li>
        {/* Add more stats if needed */}
      </ul>
    </motion.div>
  );
}

export default FighterProfile;
