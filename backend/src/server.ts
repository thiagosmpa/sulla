// BACKEND
// PORT 3001

import express, { Router } from "express";
import { connectProducer } from "./kafka/producer";

import userRouter from "./routes/user";
import groupRouter from "./routes/group";
import professionalRouter from "./routes/professional";
import authRouter from "./routes/auth";
import whatsAppConnection from "./routes/whatsapp/connection";
import chatsRouter from "./routes/whatsapp/chats";
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
app.use("/api", groupRouter);
app.use("/api", chatsRouter);
app.use("/api", professionalRouter);
app.use("/api", authRouter);
app.use("/api", whatsAppConnection);

export default app;
