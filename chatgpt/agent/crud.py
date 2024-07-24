import json
from .google_calendar import Google_calendar_connect

class Google_crud():
    def __init__(
        self,
        calendar_id
    ):
        self.calendar_id = calendar_id
        self.google_connection = Google_calendar_connect(calendar_id)

    def run_tools(
        self,
        tool,
        messages
    ):        
        tool_call_id = tool.id
        tool_function_name = tool.function.name
        arguments = json.loads(tool.function.arguments)
        if tool.function.name == "listar_agenda":
            print(f"Running listar_agenda tool with arguments: {arguments}.")
            start_day = arguments['desired_day']
            print(f'\n\n\n desired_day: {start_day} \n\n\n')
            
            results = self.google_connection.list_events(start_day)
            if results == '':
                results = 'Nada marcado para o dia.'
            
        elif tool.function.name == "criar_agenda":
            print(f"Running criar_agenda tool with arguments: {arguments}.")
            
            nome_do_paciente = arguments['nome_do_paciente']
            data_da_consulta = arguments['data_da_consulta']
            horario_da_consulta = arguments['horario_da_consulta']
            
            if 'duracao_da_consulta' in arguments:
                duracao_da_consulta = arguments['duracao_da_consulta']
            else:
                duracao_da_consulta = 60
            if 'email_do_usuario' in arguments:
                email_do_usuario = arguments['email_do_usuario']
            else:
                email_do_usuario = None
                
            results = self.google_connection.create_event(
                nome_do_paciente=nome_do_paciente,
                data_da_consulta=data_da_consulta,
                horario_da_consulta=horario_da_consulta,
                duracao_da_consulta=duracao_da_consulta,
                email_do_usuario=email_do_usuario
            )
            
        elif tool.function.name == 'pesquisar_agenda':
            print(f"Running pesquisar_consulta tool with arguments: {arguments}.")
            nome_do_paciente = arguments['nome_completo']
            results = self.google_connection.list_month_events()
            print(f'\n\n{results}\n\n')
        
        elif tool.function.name == 'apagar_agenda':
            print(f"Running apagar_agenda tool with arguments: {arguments}.")
            id_do_evento = arguments['id']
            results = self.google_connection.delete_event(id_do_evento)
        
        elif tool.function.name == 'atualizar_agenda':
            print(f"Running atualizar_agenda tool with arguments: {arguments}.")
            id_do_evento = arguments['id']
            if 'nova_data' in arguments:
                nova_data = arguments['nova_data']
            else:
                nova_data = None
            if 'novo_horario' in arguments:
                novo_horario = arguments['novo_horario']
            else:
                novo_horario = None
            if 'nova_duracao' in arguments:
                nova_duracao = arguments['nova_duracao']
            else:
                nova_duracao = 60
            if 'email_do_usuario' in arguments:
                email_do_usuario = arguments['email_do_usuario']
            else:
                email_do_usuario = None
                
            results = self.google_connection.update_event(
                event_id=id_do_evento,
                nova_data=nova_data,
                novo_horario=novo_horario,
                nova_duracao=nova_duracao,
                email_do_usuario=email_do_usuario
            )
        
        messages.append({
            "role":"tool", 
            "tool_call_id":tool_call_id, 
            "name": tool_function_name, 
            "content":results
        })
        return messages