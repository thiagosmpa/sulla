import express, { Router } from "express";
import { connectProducer } from "./kafka/producer";
import { connectConsumer, startConsumer } from "./kafka/consumer";
import { startServer } from "./controllers/whatsapp";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

(async () => {
  await connectProducer();
  await connectConsumer();
  await startConsumer();
  // await startServer();
})();

export default app;
