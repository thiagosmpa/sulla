from openai import OpenAI
from .tools import tools, run_tools
from typing import List
from .instructions import instructions
import os
from dotenv import load_dotenv
load_dotenv()

API_KEY = os.getenv("API_KEY")

class Chatgpt():
    def __init__(self):
        self.client = OpenAI(api_key=API_KEY)
        
    def create_answer(
        self,
        instructions_string: str = None,
        history: List = None,
        user_input: str = None,
    ):
        
        tool_list = tools()
        messages = instructions(instructions_string, history, user_input)
        response = self.client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.2,
            tools=tool_list,
            tool_choice='auto',
        )
        
        response_message = response.choices[0].message
        content = response_message.content if response_message.content else ''
        role = response_message.role if response_message.role else ''
        output_messages = messages + [{
            "role": role,
            "content": content
        }]
        
        messages.append(response_message)
        tool_calls = response_message.tool_calls
        while tool_calls:
            print('\nTools required.\n')
            messages = run_tools(tool_calls, messages)
            
            role = 'system'
            content = messages[-1]['content']
            output_messages = output_messages + [{
                "role": role,
                "content": content
            }]
            
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
            )
            
            response_message = response.choices[0].message
            content = response_message.content if response_message.content else ''
            role = response_message.role if response_message.role else ''
            output_messages = output_messages + [{
                "role": role,
                "content": content
            }]
            
            messages.append(response_message)
            tool_calls = response_message.tool_calls
            
        response = response.choices[0].message.content
        return response, output_messages