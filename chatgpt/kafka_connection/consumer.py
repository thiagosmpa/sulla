import logging
from kafka_connection import KafkaConsumer
from agent import Chatgpt
import ast
import json

class KafkaMessageProcessor:
    def __init__(self, kafka_topic, kafka_servers):
        self.consumer = KafkaConsumer(
            kafka_topic,
            bootstrap_servers=kafka_servers,
            auto_offset_reset='earliest',
            enable_auto_commit=True,
            group_id='my-group',
            value_deserializer=lambda x: json.loads(x.decode('utf-8'))
        )
        self.chatbot = Chatgpt()

    def process_messages(self):
        for message in self.consumer:
            data = message.value
            logging.info(f"Received data: {data}")

            if "history" in data:
                if data['history'] == '':
                    history = None
                else:
                    history = ast.literal_eval(data['history'])
            else:
                history = None

            if "instructions" in data:
                if isinstance(data['instructions'], str):
                    instructions = data['instructions']
                else:
                    instructions = None
            else:
                instructions = None

            if "message" in data:
                message_content = data['message']

            try:
                answer, messages = self.chatbot.create_answer(
                    instructions_string=instructions,
                    history=history,
                    user_input=message_content
                )
                messages.pop(0)
                logging.info({
                    "message": str(answer),
                    "history": str(messages)
                })
            except Exception as e:
                logging.error(f"Error processing messages: {str(e)}")

if __name__ == "__main__":
    processor = KafkaMessageProcessor(kafka_topic='your_topic', kafka_servers=['localhost:9092'])
    processor.process_messages()
