from datetime import datetime
from typing import List, Dict

def instructions(
        message: List[Dict[str, str]],
        instructions: str = ''
    ) -> List[Dict[str, str]]:
    # Gera a string inicial com a data e hora atuais
    string_inicial = (
        f"Forneça o output sempre em Português do Brasil. \n\n"
        f"Considere a data atual: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
    )
    
    system_instruction = {
        "role": "system",
        "content": string_inicial + instructions
    }
    
    messages_list = [system_instruction] + message

    return messages_list