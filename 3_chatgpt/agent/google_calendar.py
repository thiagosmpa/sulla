"""
    parameters: {
        "desired_day": {
            "type": "string",
            "description": "the desired day to compare in google agenda. If no desired day, compare to today until weekend",
        },
    }
"""
from datetime import datetime, timedelta
from google.oauth2 import service_account
from googleapiclient.discovery import build
from dateutil.relativedelta import relativedelta

class Google_calendar_connect():
    def __init__(
        self,
        calendar_id: str = 'thiagosilveiragtr@gmail.com'
    ):
        
        scope = 'https://www.googleapis.com/auth/calendar.freebusy'
        scope2 = 'https://www.googleapis.com/auth/calendar.events'
        scope3 = 'https://www.googleapis.com/auth/calendar'

        credentials = service_account.Credentials.from_service_account_file(
                    'src/minner.json',
                    scopes=[scope, scope2, scope3]
                )
        delegated_credentials = credentials.with_subject('daniel.rocha@xtone.com.br')
        self.service = build('calendar', 'v3', credentials=delegated_credentials)
        self.calendar_id = calendar_id
        
    def list_events(
            self,
            date: str = 'now',
    ):
        if date == 'now':
            desired_day = datetime.now()
        else:
            desired_day = datetime.strptime(date, '%Y-%m-%d')
        
        # get first day of the current week:
        date_start = desired_day - timedelta(days=desired_day.weekday())
        days_until_end_of_week = (6 - date_start.weekday()) % 7
        end_of_week = date_start + timedelta(days=days_until_end_of_week, hours=23-date_start.hour)

        timeMin = date_start.isoformat() + '-03:00'
        timeMax = end_of_week.isoformat() + '-03:00'
        
        try:
            event_list = self.service.events().list(calendarId=self.calendar_id, timeMin=timeMin, timeMax=timeMax).execute()
            list_events = ''
            for event in event_list['items']:
                summary = event['summary']
                id = event['id']
                start_date = event['start']['dateTime'][0:10] + ' ' + event['start']['dateTime'][11:16]
                end_date = event['end']['dateTime'][0:10] + ' ' + event['end']['dateTime'][11:16]
                event_string = f'{summary}\nid:{id}\nHorário:{start_date} até {end_date} \n---------------------------------'
                list_events += event_string + '\n'
            return list_events
        except Exception as e:
            return str(e)
    
    def list_month_events(
            self,
    ):
        desired_day = datetime.now()
                
        # get first day of the current week:
        date_start = desired_day.replace(day=1)
        date_end = (desired_day.replace(day=1) + relativedelta(months=4)).replace(day=1)

        timeMin = date_start.isoformat() + '-03:00'
        timeMax = date_end.isoformat() + '-03:00'
        
        try:
            event_list = self.service.events().list(calendarId=self.calendar_id, timeMin=timeMin, timeMax=timeMax).execute()
            list_events = ''
            for event in event_list['items']:
                summary = event['summary']
                id = event['id']
                start_date = event['start']['dateTime'][0:10] + ' ' + event['start']['dateTime'][11:16]
                end_date = event['end']['dateTime'][0:10] + ' ' + event['end']['dateTime'][11:16]
                event_string = f'{summary}\nid:{id}\nHorário:{start_date} até {end_date} \n---------------------------------'
                list_events += event_string + '\n'
            return list_events
        except Exception as e:
            return str(e)

    def delete_event(
        self,
        event_id: str
    ):
        try:
            self.service.events().delete(calendarId=self.calendar_id, eventId=event_id, sendUpdates='all').execute()
            return 'Success'
        except Exception as e:
            return str(e)
        
    def create_event(
        self,
        nome_do_paciente: str,
        data_da_consulta: str,
        horario_da_consulta: str,
        duracao_da_consulta: int = 60,
        email_do_usuario: str = None
    ):
        start_datetime = datetime.strftime(datetime.strptime(f'{data_da_consulta} {horario_da_consulta}', '%Y-%m-%d %H:%M'), '%Y-%m-%dT%H:%M:%S-03:00')
        end_datetime = datetime.strftime(datetime.strptime(f'{data_da_consulta} {horario_da_consulta}', '%Y-%m-%d %H:%M') + timedelta(minutes=duracao_da_consulta), '%Y-%m-%dT%H:%M:%S-03:00')
        
        event = {
            'summary': f'Consulta com {nome_do_paciente}',
            'description': 'Marcação de consulta através do chatbot',
            'start': {
                'dateTime': start_datetime,
                'timeZone': 'UTC-3',
            },
            'end': {
                'dateTime': end_datetime,
                'timeZone': 'UTC-3',
            },
        }
        
        if email_do_usuario is not None:
            event['attendees'] = [
                {
                    'email': email,
                    'responseStatus': 'needsAction'
                }
                for email in email_do_usuario]
        try:
            event = self.service.events().insert(calendarId=self.calendar_id, body=event, sendUpdates='all').execute()
            return 'Success'
        except Exception as e:
            return str(e)
        
    def update_event(
        self,
        event_id: str,
        nova_data: str = None,
        novo_horario: str = None,
        nova_duracao: int = 60,
        email_do_usuario: str = None,
        
    ):
        try:
            event = self.service.events().get(calendarId=self.calendar_id, eventId=event_id).execute()
            
            if nova_data == None:
                nova_data = event['start']['dateTime'][0:10]
            if novo_horario == None:
                novo_horario = event['start']['dateTime'][11:16]
            
                
            start_datetime = datetime.strftime(datetime.strptime(f'{nova_data} {novo_horario}', '%Y-%m-%d %H:%M'), '%Y-%m-%dT%H:%M:%S-03:00')
            end_datetime = datetime.strftime(datetime.strptime(f'{nova_data} {novo_horario}', '%Y-%m-%d %H:%M') + timedelta(minutes=nova_duracao), '%Y-%m-%dT%H:%M:%S-03:00')
            
            event['start']['dateTime'] = start_datetime
            event['end']['dateTime'] = end_datetime
            
            if email_do_usuario is not None:
                email_list = [
                    email['email'] for email in event['attendees'] if email['email'] not in email_list and email['email'] != self.calendar_id
                ]
                event['attendees'] = [
                    {
                        'email': email,
                        'responseStatus': 'needsAction'
                    }
                    for email in email_list]
            
            updated_event = self.service.events().update(calendarId=self.calendar_id, eventId=event_id, body=event, sendUpdates='all').execute()
            return 'Success'
        
        except Exception as e:
            return str(e)