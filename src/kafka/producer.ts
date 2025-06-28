const { Kafka } = require("kafkajs");
import { Request, Response } from "express";
import { PriceLimit } from "../Models/PriceLimit"; // Adjust path as needed

const kafka = new Kafka({
  clientId: "multi-energy-producer",
  brokers: ["localhost:9092"],
});
const producer = kafka.producer();

const energyTypes = ["solar", "wind", "hydro"];
const regions = ["North", "South", "East", "West"];

const randomRate = () => parseFloat((Math.random() * 10 + 1).toFixed(2));

const sendEnergyData = async () => {
  await producer.connect();

  setInterval(async () => {
    for (const type of energyTypes) {
      const data = {
        type,
        region: regions[Math.floor(Math.random() * regions.length)],
        rate: randomRate(),
        timestamp: new Date(),
      };

      const topic = `energy-${type}`;

      await producer.send({
        topic,
        messages: [{ value: JSON.stringify(data) }],
      });

      console.log(`📤 Sent to ${topic}: ${JSON.stringify(data)}`);
    }
  }, 5000);
};

sendEnergyData();

export const updatePriceLimit = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { state } = req.params;
    const { maximum_price_per_kwh, minimum_price_per_kwh } = req.body;

    // Validate input
    if (!state || (!maximum_price_per_kwh && !minimum_price_per_kwh)) {
      res.status(400).json({
        success: false,
        error: "Missing required fields: state or price limits",
      });
      return;
    }

    // Fetch the price limit for the state
    const priceLimit = await PriceLimit.findOne({ state });

    if (!priceLimit) {
      res.status(404).json({
        success: false,
        error: `No price limit found for state: ${state}`,
      });
      return;
    }

    // Update the price limits
    if (maximum_price_per_kwh) {
      priceLimit.maximum_price_per_kwh = maximum_price_per_kwh;
    }
    if (minimum_price_per_kwh) {
      priceLimit.minimum_price_per_kwh = minimum_price_per_kwh;
    }
    priceLimit.updatedAt = new Date();

    await priceLimit.save();

    res.status(200).json({
      success: true,
      message: "Price limits updated successfully",
      priceLimit,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to update price limits",
    });
  }
};
