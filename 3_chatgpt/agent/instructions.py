from datetime import datetime, timedelta
from typing import List

def instructions(
        instructions: str = None,
        history: List[dict] = None,
        user_input: str = None
    ):
        if history is not None:
            history = history[:20] # Limit history to 20 messages
        string_inicial = f"Forneça o output sempre em Português do Brasil. \n\nConsidere a data atual: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n "
        instructions = {
            "role": "system",
            "content": string_inicial + instructions
        }
        message = {
            "role": "user",
            "content": user_input
        }
        if type(history) == list:
            messages_list = [ instructions ] + history + [ message ]
        
        else:
            messages_list = [ instructions ] + [ message ]
        
        return messages_list