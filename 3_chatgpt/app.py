import ast
from confluent_kafka import Consumer
from agent import Chatgpt
import json
from dotenv import load_dotenv
from kafka_connection import produceResponse, logging
import os

load_dotenv()
API_KEY =  os.getenv('API_KEY')
KAFKA_BROKER = os.getenv('KAFKA_BROKER') 

# Configurações do Kafka
consumer_config = {
    'bootstrap.servers': 'localhost:9092',
    'group.id': 'agent-group',
    'auto.offset.reset': 'earliest'
}

consumer = Consumer(consumer_config)
consumer.subscribe(['whatsapp-agent-message'])

def process_message(data):
    logging(f'Consuming message: {data}')
    Chatbot = Chatgpt()
    
    if "history" in data:
        if data['history'] == '':
            history = None
        else:
            history = ast.literal_eval(data['history'])
    else:
        history = None
    
    if "instructions" in data:
        if type(data['instructions']) == str:
            instructions = data['instructions']
        else:
            instructions = None
    else:
        instructions = None
    
    if "message" in data:
        message = data['message']
    
    if "sessionName" in data:
        session_name = data['sessionName']

    if "sessionId" in data:
        session_name = data['sessionId']
    
    if "chatId" in data:
        chat_id = data['chatId']

    try:
        answer, messages = Chatbot.create_answer(
            instructions_string=instructions,
            history=history,
            user_input=message
        )
        messages.pop(0)
        response = {
            "message": str(answer),
            "history": str(messages),
            "sessionName": str(session_name),
            "chatId": str(chat_id)
        }
        return response
    
    except Exception as e:
        logging(f"Error processing messages: {str(e)}")
        return {"error": "Failed to process messages", "details": str(e)}
    
if __name__ == "__main__":
    print('\nConecting Agent Python\n')
    
    while True:
        msg = consumer.poll(1.0)
        
        if msg is None:
            continue
        if msg.error():
            logging(f'Consumer error: {msg.error()}')
            continue
        
        data = json.loads(msg.value().decode('utf-8'))
        logging(f"Consuming message: {data}")
        response = process_message(data)
        
        produceResponse(response)
