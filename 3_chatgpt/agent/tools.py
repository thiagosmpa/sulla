from .crud import Google_crud

def tools():
    tools = [
        {
            "type": "function",
            "function": {
                "name": "listar_agenda",
                "description": "Retorna todas as datas ocupadas na agenda da semana selecionada",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "desired_day": {
                            "type": "string",
                            "description": "O dia escolhido pelo cliente"
                        }
                    },
                    "required": []
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "criar_agenda",
                "description": "Marca uma nova consulta na agenda com as informações fornecidas",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "nome_do_paciente": {
                            "type": "string",
                            "description": "Nome do paciente que deseja marcar a consulta"
                        },
                        "data_da_consulta": {
                            "type": "string",
                            "description": "Dia da consulta no formato YYYY-MM-DD"
                        },
                        "horario_da_consulta": {
                            "type": "string",
                            "description": "Hora da consulta no formato HH:MM",
                            "nullable": "true"
                        },
                        "duracao_da_consulta": {
                            "type": "integer",
                            "description": "Duração da consulta em minutos (opcional) - não perguntar ao cliente, definir o padrão 60 e só trocar caso o cliente peça"
                        },
                        "email_do_paciente": {
                            "type": "string",
                            "description": "Email do paciente (opcional)",
                            "nullable": "true"
                        }
                    },
                    "required": [
                        "nome_do_paciente",
                        "data_da_consulta",
                        "horario_da_consulta"
                    ]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "pesquisar_agenda",
                "description": "Pesquisaadatadaconsultadeumapessoafornecendoonomecompletodopaciente",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "nome_completo": {
                            "type": "string",
                            "description": "Nomecompletodopacienteparapesquisadeconsultas"
                        }
                    },
                    "required": [
                        "nome_completo"
                    ]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "apagar_agenda",
                "description": "Apaga um evento na agenda",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "id": {
                            "type": "string",
                            "description": "ID da consulta a ser apagada"
                        }
                    },
                    "required": [
                        "id"
                    ]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "atualizar_agenda",
                "description": "Altera a data, horário, duração de um evento na agenda",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "id": {
                            "type": "string",
                            "description": "ID da consulta a ser atualizada"
                        },
                        "nova_data": {
                            "type": "string",
                            "description": "Nova data da consulta no formato YYYY-MM-DD",
                            "nullable": "true"
                        },
                        "novo_horario": {
                            "type": "string",
                            "description": "Novo horário da consulta no formato HH:MM",
                            "nullable": "true"
                        },
                        "nova_duracao": {
                            "type": "integer",
                            "description": "Nova duração da consulta em minutos",
                            "nullable": "true"
                        },
                        "email_do_usuario": {
                            "type": "string",
                            "description": "Novo email do usuário",
                            "nullable": "true"
                        }
                    },
                    "required": [
                        "consulta_id"
                    ]
                }
            }
        }
    ]
    return tools

def run_tools(
    tool_calls, 
    messages, 
    calendar_connection = 'Google', 
    calendar_id = 'thiagosilveiragtr@gmail.com'
):
    
    if calendar_connection == 'Google':
        tool_choice = Google_crud(calendar_id)
        for tool in tool_calls:
            messages = tool_choice.run_tools(
                tool=tool, 
                messages=messages
            )
        return messages