import { Kafka } from "kafkajs";

export const kafka = new Kafka({
  clientId: "quantumgrid-backend",
  brokers: ["localhost:9092"], // ✅ default if you use Docker
});

export const producer = kafka.producer();

export const initKafka = async () => {
  await producer.connect();
};
