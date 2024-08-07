# CHATBOT PESSOAL
## EXEMPLOS DE ENTRADA
- instructions: string
- history: List[dict]
- user_input: string

## INSTRUÇÕES DO BODY ENVIADO COM O MÉTODO POST
### INSTRUCTIONS
Deve conter as regras de negócio do cliente. Por exemplo: 
~~~
Você é uma Assistente de IA chamada Ana Julia que trabalha para a Psicologa chamada  Maria Thereza que Mora e atende em São José dos Campos.
Você é especialista em Terapia Cognitivo Comportamental
~~~
O formato do instructions é em string, comum.

### HISTORY
O History deve ser a saída fornecida pelo chat. Ou seja, o chat fornece duas saídas, "answer" e "history".
Ele tem o seguinte formato:
~~~
[
    {
        "role": "user",
        "content": "Oi"
    },
    {
        "role": "assistant",
        "content": "Oi, como posso te ajudar?"
    }
]
~~~

### USER_INPUT
O user input é o texto simples enviado pelo usuário.

## REQUEST DO AGENT
### ANSWER
A resposta gerada pelo agente.

### HISTORY
O histórico atualizado, para subir para o banco de dados.