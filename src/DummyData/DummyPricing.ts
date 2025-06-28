// src/utils/generatePriceLimitData.ts
import { PriceLimit } from "../Models/PriceLimit";
import mongoose from "mongoose";

const indianStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Puducherry",
  "Chandigarh",
  "Andaman and Nicobar Islands",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Lakshadweep",
];

const getRandomCoords = (): [number, number] => {
  // Rough bounding box around India
  const lat = +(8 + Math.random() * 30).toFixed(6);
  const lng = +(68 + Math.random() * 30).toFixed(6);
  return [lng, lat];
};

const generatePriceLimits = () => {
  return indianStates.map((state, i) => {
    const [lng, lat] = getRandomCoords();
    const min = +(5 + Math.random() * 2).toFixed(2);
    const max = +(min + 1 + Math.random() * 2).toFixed(2);

    return {
      user_id: `user_${i + 1}`,
      status: "verified",
      maximum_price_per_kwh: max,
      minimum_price_per_kwh: min,
      updatedAt: new Date(),
      Location_update: {
        type: "Point" as const,
        coordinates: [lng, lat],
      },
      state,
    };
  });
};

export const insertDummyPriceLimits = async () => {
  const existing = await PriceLimit.countDocuments();
  if (existing > 0) {
    console.log("Dummy data already exists. Skipping insertion.");
    return;
  }
  const docs = generatePriceLimits();
  await PriceLimit.insertMany(docs);
  console.log("Inserted dummy price limits for all Indian states.");
};
