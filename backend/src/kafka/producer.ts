import { Kafka } from 'kafkajs';
import moment from 'moment';

const kafkaBroker = process.env.KAFKA_BROKER || 'localhost:9092';

const kafka = new Kafka({
  clientId: 'whatsapp-producer',
  brokers: [kafkaBroker]
});

const producer = kafka.producer();

const connectProducer = async () => {
  await producer.connect();
  console.log('\n\nKafka Broker:', kafkaBroker, '\n\n');
  logging('Kafka Producer connected');

  process.on('SIGINT', async () => {
    await producer.disconnect();
    logging('Kafka Producer disconnected');
    process.exit();
  });
};

async function logging(log: string): Promise<void> {
  const now = moment().format('YYYY-MM-DD HH:mm:ss');
  
  console.log(`\n${now}: ${log}\n`);
  
  const logMessage = `${now}:${log}`;
  await producer.send({
    topic: 'logs',
    messages: [
      { value: JSON.stringify({ Backend: logMessage }) }
    ]
  });
}

const sendMessage = async (topic: string, messages: any[]) => {
  await producer.send({ topic, messages });
};

export { logging, sendMessage, connectProducer, producer };