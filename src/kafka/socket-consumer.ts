import { Kafka, Consumer, EachMessagePayload } from "kafkajs";
import WebSocket, { Server } from "ws";

const kafka = new Kafka({
  clientId: "multi-energy-consumer",
  brokers: ["localhost:9092"],
});
const consumer: Consumer = kafka.consumer({ groupId: "energy-consumers" });

const topics: string[] = ["energy-solar", "energy-wind", "energy-hydro"];

const wss: Server = new WebSocket.Server({ port: 8080 });
const clients: Set<WebSocket> = new Set<WebSocket>();

wss.on("connection", (ws: WebSocket) => {
  clients.add(ws);
  ws.on("close", () => clients.delete(ws));
});

const start = async (): Promise<void> => {
  try {
    await consumer.connect();
    for (const topic of topics) {
      await consumer.subscribe({ topic, fromBeginning: true });
    }

    await consumer.run({
      eachMessage: async ({ topic, message }: EachMessagePayload) => {
        const data = JSON.parse(message.value?.toString() || "{}");
        data.topic = topic; // include topic for frontend filtering

        for (const client of clients) {
          client.send(JSON.stringify(data));
        }
      },
    });
  } catch (error) {
    console.error("Error in Kafka consumer:", error);
  }
};

start();
