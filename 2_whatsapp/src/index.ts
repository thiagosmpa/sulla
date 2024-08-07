import cors from "cors";
import express, { type Request, type Response } from "express";
import routes from "./routes";
import { init } from "./whatsapp";
import dotenv from "dotenv";
import { connectProducer } from "./kafka/producer";
import { connectConsumer, startConsumer } from "./kafka/consumer";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/", routes);
app.all("*", (_: Request, res: Response) => res.status(404).json({ error: "URL not found" }));

const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 3002);

(async () => {
	await connectProducer().catch((error) => {console.error(error)});
	await connectConsumer();
	await startConsumer();
	await init();
	app.listen(port, host, () => {
		console.log(`[server]: Server is running at http://${host}:${port}`);
	});
})();
