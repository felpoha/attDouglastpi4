# Servidor de teste para atividade Upload Múltiplo

Este pequeno servidor Node.js usa Express + Multer para aceitar uploads múltiplos no endpoint `POST /upload`.

Regras implementadas:

- Máximo de 10 arquivos por requisição
- Tipos permitidos: PNG e JPEG
- Tamanho máximo por arquivo: 5 MB

Instruções (PowerShell):

1. Instalar dependências (Node.js e npm devem estar instalados):

```powershell
Set-Location 'C:\Users\felpoha\Documents\attDouglastpi4'
npm install
```

2. Iniciar servidor:

```powershell
npm start
```

O servidor ficará disponível em `http://localhost:3000`.

Endpoint de upload:

- POST http://localhost:3000/upload
- chave dos arquivos: `meusArquivos`

Exemplo de resposta de sucesso:

```
{ "message": "Recebidos 2 arquivo(s).", "files": [ {"originalname":"a.png","size":12345}, ... ] }
```

Observações:

- O diretório `uploads/` será criado automaticamente e os arquivos enviados serão gravados nele.
- O servidor retorna mensagens de erro amigáveis para validações (tipo, tamanho, quantidade).

# attDouglastpi4
