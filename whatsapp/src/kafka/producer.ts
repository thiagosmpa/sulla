import { JsonValue } from "@prisma/client/runtime/library";
import { Kafka } from "kafkajs";
import moment from "moment";
import prisma from "../db";

// const kafkaBroker = process.env.KAFKA_BROKER || "localhost:9092";
const kafkaBroker = "localhost:9092";

const kafka = new Kafka({
  clientId: "whatsapp-producer",
  brokers: [kafkaBroker],
});

export const producer = kafka.producer();

interface MessageBuffer {
  messages: string[];
  timer: NodeJS.Timeout | null;
}

const messageBuffer: { [key: string]: MessageBuffer } = {};

async function sendToKafka(
  sessionName: string,
  chatId: string,
  messageContent: string
): Promise<void> {
  await producer.send({
    topic: "whatsapp-messages",
    messages: [
      {
        key: chatId,
        value: JSON.stringify({ sessionName, chatId, messageContent }),
      },
    ],
  });
}

const connectProducer = async () => {
  try {
    await producer.connect();
    logging("Kafka Producer connected");
  } catch (error) {
    logging(`Error connecting to Kafka Producer: ${error}`);
  }

  process.on("SIGINT", async () => {
    await prisma.users.updateMany({ data: { connectionStatus: "DISCONNECTED" } });
    await producer.disconnect();
    logging("\nKafka Producer disconnected\n");
    process.exit();
  });
};

async function messageProducer(
  sessionName: string,
  chatId: string,
  messageContent: string
): Promise<void> {
  if (!messageBuffer[chatId]) {
    messageBuffer[chatId] = {
      messages: [],
      timer: null,
    };
  }
  messageBuffer[chatId].messages.push(messageContent);
  if (messageBuffer[chatId].timer !== null) {
    clearTimeout(messageBuffer[chatId].timer!);
  }
  messageBuffer[chatId].timer = setTimeout(async () => {
    const combinedMessage = messageBuffer[chatId].messages.join("\n");
    await sendToKafka(sessionName, chatId, combinedMessage);
    messageBuffer[chatId].messages = [];
    messageBuffer[chatId].timer = null;
  }, 15000); // 15 segundos de intervalo
}

async function agentRequestProducer(
  sessionName: string,
  chatId: string,
  message: string,
  history: string | JsonValue,
  instructions: string
) {
  try {
    logging(`Producing message to agent: ${message}`);
    await producer.send({
      topic: "agent-request",
      messages: [
        {
          value: JSON.stringify({
            sessionName,
            chatId,
            history,
            instructions,
            message,
          }),
        },
      ],
    });
  } catch (error) {
    logging(`Error producing message to agent: ${error}`);
  }
}

async function logging(log: string): Promise<void> {
  const now = moment().format("YYYY-MM-DD HH:mm:ss");

  console.log(`\n${now}:${log}\n`);

  const logMessage = `${now}: ${log}`;
  await producer.send({
    topic: "logs",
    messages: [{ value: JSON.stringify({ Whatsapp: logMessage }) }],
  });
}

export { connectProducer, messageProducer, agentRequestProducer, logging };
