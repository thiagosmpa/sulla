from confluent_kafka import Producer
import json
import datetime

producer_config = {
    'bootstrap.servers': 'localhost:9092'
}
producer = Producer(producer_config)

def produceResponse(data):
    logging(f'Producing message: {data}')
    producer.produce('agent-response', value=json.dumps(data))
    producer.flush()
    
def logging(log: str):
    now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    log_message = f"{now}:{log}"
    print(f"\n{log_message}\n")
    message = {
        'Agent': log_message
    }
    
    producer.produce('logs', value=json.dumps(message))
    producer.flush()
    