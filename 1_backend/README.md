# BACKEND WHATSAPP SOFTWARE

## LIGAÇÕES E FUNÇÕES
O backend intermedia o frontend e os APIs (whatsapp-web e chatgpt)

O usuário envia a informação pelo frontend e faz a requisição ao backend através do protocolo HTTP. O backend então pega essa requisição e entende se o usuário quer autenticar, conectar no whatsapp ou simplesmente fazer uma pesquisa no banco de dados.

A ligação entre o backend e o whatsapp-web é feita através do socket.io, mantendo uma sessão ativa para cada sessão do whatsapp aberta.

## ROUTES
- /api/auth/login
    - método POST
    - espera email & password
    - função: login
- /api/users/current-user
    - método POST
    - espera ID
    - função: pega os detalhes do usuário através do ID
- /api/users/get-users
    - método GET
    - função: lista todos os usuários
- /api/users/create-user
    - método POST
    - espera email, username, password
    - função: cria um novo usuário