// src/routes/seedEnergySources.ts

import dotenv from "dotenv";
import { EnergySource } from "../Models/EnergyListing"; // adjust this path if needed
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const dummyStates = [
  "Maharashtra",
  "Gujarat",
  "Rajasthan",
  "Tamil Nadu",
  "Karnataka",
];
const sourceTypes = ["solar", "wind", "hydro"];

const generateRandomCoordinate = (): [number, number] => {
  const lat = Math.random() * (35 - 10) + 10;
  const lng = Math.random() * (90 - 70) + 70;
  return [parseFloat(lng.toFixed(6)), parseFloat(lat.toFixed(6))];
};

export const createDummySources = () => {
  const sources = [];

  for (let i = 0; i < 20; i++) {
    const state = dummyStates[i % dummyStates.length];
    const type = sourceTypes[i % sourceTypes.length];

    sources.push({
      energy_listing_id: `listing-${uuidv4()}`,
      source_id: `source-${uuidv4()}`,
      user_id: `user-${String(i + 1).padStart(3, "0")}`,
      source_type: type as "solar" | "wind" | "hydro",
      capacity_kw: Math.floor(Math.random() * 90) + 10,
      efficiency_rating: parseFloat((Math.random() * 100).toFixed(2)),
      energy_price: parseFloat((Math.random() * 8 + 2).toFixed(2)), // ₹2–₹10
      status: "active",
      meter_id: `MTR-${uuidv4().slice(0, 8)}`,
      blockchain_hash: uuidv4().replace(/-/g, ""),
      state,
      source_location: {
        type: "Point",
        coordinates: generateRandomCoordinate(),
      },
    });
  }

  return sources;
};
