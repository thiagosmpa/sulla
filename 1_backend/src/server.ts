// BACKEND
// PORT 3001

import express, { Router } from "express";
import { connectProducer } from "./kafka/producer";

import userRouter from "./routes/user";
import whatsAppConnection from "./routes/whatsappConnect";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/", (req, res) => {
  const kafka_broker = process.env.KAFKA_BROKER;
  res.send(`Hello World from backend server! Kafka broker: ${kafka_broker}`);
});

(async () => {
  await connectProducer();
})();

app.use("/api", userRouter);
app.use("/api", whatsAppConnection);

export default app;
