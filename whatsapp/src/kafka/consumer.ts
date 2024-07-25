import { Kafka } from "kafkajs";
import { sendMessage } from "../controllers/message/sendMessage";
import { checkConnection, connectSession } from "../controllers/whatsapp";
import { agentRequestProducer, logging } from "./producer";
import { getChatHistory, updateChatHistory } from "./chatHistory";
import { getInstructions } from "./instructions";
import redisClient from "../redis/client";

const agentURL = process.env.agentURL || "http://localhost:18070";
const kafkaBroker = process.env.KAFKA_BROKER || "localhost:9092";

const kafka = new Kafka({
  clientId: "whatsapp",
  brokers: [kafkaBroker],
});

const consumer = kafka.consumer({ groupId: "whatsapp-group" });

async function processMessage(
  message: any,
  topic: any,
  partition: any
): Promise<void> {
  const chatMessage = JSON.parse(message.value.toString());
  const sessionName = chatMessage.sessionName;
  const chatId = chatMessage.chatId;
  const messageContent = chatMessage.messageContent;
  logging(`Consuming Message: ${sessionName}/${chatId}:${messageContent}`);

  try {
    const chatHistory = (await getChatHistory(sessionName, chatId)) ?? "";
    logging(`Chat History: ${chatHistory}`);
    const instructions = (await getInstructions(sessionName)) ?? "";
    logging(`Instructions: ${instructions}`);

    agentRequestProducer(
      sessionName,
      chatId,
      messageContent,
      chatHistory,
      instructions
    );
    await redisClient.set(chatId, "bot", { EX: 60 }); // a chave expira em 60 segundos
    await consumer.commitOffsets([
      { topic, partition, offset: (Number(message.offset) + 1).toString() },
    ]);
  } catch (error) {
    logging(`Error sending message to agent: ${error}`);
  }
}

function processAgentResponse(data: any) {
  const agentResponse = JSON.parse(data.value.toString());
  const agentMessage = agentResponse.message;
  const history = agentResponse.history;
  const sessionName = agentResponse.sessionName;
  const chatId = agentResponse.chatId;

  logging(`Consuming Agent Response: ${sessionName}/${chatId}:${agentMessage}`);
  getChatHistory(sessionName, chatId);
  updateChatHistory(chatId, history);
  logging(`Agent Response: ${agentMessage}`);
  logging(`Updated History: ${history}`);

  sendMessage(chatId, { text: agentMessage });
}

async function processConnection(message: any) {
  const sessionMessage = JSON.parse(message.value.toString());
  const sessionName = sessionMessage.id;
  connectSession(sessionName);
}

async function startConsumer(): Promise<void> {
  try {
    await consumer.subscribe({
      topic: "whatsapp-messages",
      fromBeginning: false,
    });
    await consumer.subscribe({
      topic: "whatsapp-connection",
      fromBeginning: false,
    });
    await consumer.subscribe({
      topic: "agent-response",
      fromBeginning: false,
    });
    logging(
      "Subscribed to topics \n- whatsapp-messages,\n- whatsapp-connection,\n- agent-response"
    );

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        if (message.value) {
          if (topic === "whatsapp-messages") {
            processMessage(message, topic, partition);
          } else if (topic === "whatsapp-connection") {
            if ((await redisClient.get(message.value.toString())) === "sent") {
              logging(`Session ${message.value.toString()} already sent`);
              return;
            }
            await redisClient.set(message.value.toString(), "sent", { EX: 20 });
            logging(`Connecting to Session Name: ${message.value.toString()}`);
            processConnection(message);
          } else if (topic === "agent-response") {
            processAgentResponse(message);
          }
        } else {
          logging("Consuming Message: null");
        }
      },
    });

    process.on("SIGINT", async () => {
      await consumer.disconnect();
      logging("Kafka Consumer disconnected");
      process.exit();
    });
  } catch (error) {
    logging(`Error in Kafka consumer: ${error}`);
  }
}

const connectConsumer = async () => {
  try {
    await consumer.connect();
    logging("Kafka Consumer connected");
  } catch (error) {
    logging(`Error connecting to Kafka Consumer: ${error}`);
  }

  process.on("SIGINT", async () => {
    await consumer.disconnect();
    logging("Kafka Consumer disconnected");
    process.exit();
  });
};

export { startConsumer, connectConsumer };
