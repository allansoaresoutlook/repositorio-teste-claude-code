# Evolution API - Disparador de Mensagens WhatsApp

Aplicação Node.js + React para disparar mensagens WhatsApp em massa via Evolution API.

## Pré-requisitos

- Node.js 18+
- npm 9+

## Instalação

```bash
npm install
```

## Configuração

Copie o arquivo de exemplo e ajuste se necessário:

```bash
cp .env.example .env
```

O `.env` já vem preenchido com as configurações padrão:

```
EVOLUTION_API_URL=https://testen8n-evolution-api.uoycgg.easypanel.host/
EVOLUTION_API_KEY=E99A0662876F-454C-B41D-343E40DDD605
INSTANCE_NAME=Marcus Cabral
BACKEND_PORT=3001
```

## Como rodar

```bash
npm start
```

Isso inicia simultaneamente:
- **Frontend** → http://localhost:3000
- **Backend** → http://localhost:3001

## Como usar

1. Acesse http://localhost:3000
2. Faça upload de uma planilha Excel (.xlsx)
3. Digite a mensagem
4. Clique em **Enviar Mensagens**
5. Acompanhe os resultados na tabela

## Formato da planilha Excel

Os números devem estar na **primeira coluna (A)**, um por linha:

| A              |
|----------------|
| 558591241426   |
| 5511987654321  |
| 5521999999999  |

- Linhas vazias são ignoradas automaticamente
- Duplicatas são removidas
- Os números devem ter entre 10 e 15 dígitos (sem espaços ou caracteres especiais)
- Recomendado incluir o código do país (ex: `55` para Brasil)

## Estrutura do projeto

```
src/
├── server.js              # Backend Express
├── App.jsx                # Componente principal React
├── index.jsx              # Entrada React
├── index.css              # Tailwind CSS
└── components/
    ├── FileUpload.jsx      # Upload de planilha Excel
    ├── MessageInput.jsx    # Campo de mensagem
    ├── ResultsTable.jsx    # Tabela de resultados
    └── LoadingSpinner.jsx  # Indicador de carregamento
```

## API

### POST /api/send-messages

**Body:**
```json
{
  "numbers": ["558591241426", "5511987654321"],
  "message": "Olá! Esta é uma mensagem de teste."
}
```

**Response:**
```json
{
  "success": 2,
  "failed": 0,
  "details": [
    { "number": "558591241426", "status": "success" },
    { "number": "5511987654321", "status": "success" }
  ]
}
```
