# Frontend de avaliações

## Testar localmente sem Auth0

Use este fluxo enquanto testa a API com o PostgreSQL do seu Docker. As telas consultam e gravam na API real; não há dados fictícios ou token inventado.

1. Deixe o PostgreSQL local e a API Java executando. A API deve estar em http://localhost:8080, com o perfil local ativo.
2. No PowerShell, abra a pasta frontend, onde está package.json.
3. Execute:

```powershell
npm ci
npm run dev:local
```

4. Abra o endereço Local informado pelo Vite, normalmente http://127.0.0.1:5173.
5. A tela deve exibir o aviso Teste local sem login. Clique em Nova avaliação, preencha os cinco campos e salve.
6. Atualize a página para verificar que a listagem é carregada novamente da API.
7. No PowerShell, confira o registro no banco:

```powershell
docker exec postgres-local psql -U avaliacoes -d avaliacoes -c "SELECT * FROM avaliacoes;"
```

O comando dev:local usa `vite --host 127.0.0.1 --mode teste-local`. O modo sem login só é ativado em desenvolvimento, com esse modo e acesso por localhost/loopback. Ele não precisa de variáveis Auth0 e não é ativado no build de produção. A tela libera o formulário para testar o cadastro; isso não testa os papéis ADMIN/USER do Auth0.

## Endereço da API

O front chama `/api/avaliacoes`. O proxy em vite.config.js encaminha `/api` para `http://127.0.0.1:8080`. Dessa forma, o navegador usa a mesma origem do Vite e o teste não exige configurar CORS no perfil local do backend. A porta 5433 é do PostgreSQL e não deve ser usada como endereço da API.

Se existir um .env antigo com VITE_API_URL apontando para a AWS, altere para:

```dotenv
VITE_API_URL=/api
```

Reinicie o Vite depois de mudar .env. Nenhuma senha do PostgreSQL pertence ao front.

## Executar com Auth0

Use `npm run dev` para o modo normal, com as variáveis de frontend/.env.example em frontend/.env. Nesse fluxo, configure Domain, Client ID, audience, roles e URLs permitidas no Auth0, conforme ../docs/AUTH0.md. O backend também deve estar no modo protegido.

```powershell
npm run dev
npm test
npm run build
```

O build permanece com login Auth0. O modo local do front não altera a segurança da API: se o backend estiver protegido, chamadas sem token recebem 401/403.
