<h1 align="center">⚓ Port-Pilot v2.0</h1>

<p align="center">
  <b>O Canivete Suico Definitivo do Desenvolvedor</b><br>
  <i>Gerenciador de Portas • Sniffer HTTP • Tunnel Publico • Launcher de Workspace • Auditor de Ambiente</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/versao-2.0-blue" alt="Versao"/>
  <img src="https://img.shields.io/badge/node-%3E%3D14-green" alt="Node"/>
  <img src="https://img.shields.io/badge/plataforma-Windows%20%7C%20Linux%20%7C%20macOS-lightgrey" alt="Plataforma"/>
  <img src="https://img.shields.io/badge/licenca-MIT-yellow" alt="Licenca"/>
</p>

<p align="center">
  <a href="README.md">English</a> | <a href="README.pt-br.md">Portugues</a>
</p>

---

## Pre-visualizacao

```
  ╔══════════════════════════════════════════════════════════════╗
  ║              ⚓  PORT-PILOT v2.0                            ║
  ║     O Canivete Suico Definitivo do Desenvolvedor            ║
  ╚══════════════════════════════════════════════════════════════╝

  Plataforma: win32 | Node: v24.11.1 | Dir: C:\Projects\meu-app

  📦 Projeto Atual: meu-app (NODE)
  ⚡ Framework: Next.js

? O que deseja fazer? (Use as setas)
> 🚀 Launcher de Workspace (Detectar + Iniciar + Gerenciar)
  🔍 Gerenciador de Portas (Matar / Sniffer / Tunnel)
  🛡️  Auditor de Ambiente (Verificar .env & Seguranca)
  📊 Modo Dashboard (tela cheia estilo htop)
  ❌ Sair
```

---

## Blueprint da Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ⚓ PORT-PILOT v2.0                                │
│              O Canivete Suico Definitivo do Desenvolvedor                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    🖥️  PONTO DE ENTRADA (pp)                        │   │
│   │                                                                     │   │
│   │   Comandos: pp | pp launch | pp list | pp kill | pp sniff |        │   │
│   │             pp tunnel | pp audit | pp scan | pp dashboard | pp help │   │
│   └──────────────────────────────┬──────────────────────────────────────┘   │
│                                  │                                          │
│                                  ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    📋 MENU PRINCIPAL (inquirer)                     │   │
│   │                                                                     │   │
│   │   🚀 Launcher de Workspace   🔍 Gerenciador de Portas              │   │
│   │   🛡️  Auditor de Ambiente     📊 Modo Dashboard                    │   │
│   └─────┬──────────────┬──────────────┬──────────────┬─────────────────┘   │
│         │              │              │              │                      │
│         ▼              ▼              ▼              ▼                      │
│   ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐              │
│   │ LAUNCHER  │  │   PORTAS  │  │    ENV    │  │DASHBOARD  │              │
│   │   DE      │  │           │  │           │  │           │              │
│   │ WORKSPACE │  │           │  │           │  │           │              │
│   └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘              │
│         │              │              │              │                      │
│         ▼              ▼              ▼              ▼                      │
│   ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐              │
│   │ • Detectar│  │ • Mapear  │  │ • Checar  │  │ • blessed │              │
│   │   tipo de │  │   portas  │  │   .env    │  │   estilo  │              │
│   │   projeto │  │ • Matar   │  │ • Protecao│  │   htop    │              │
│   │ • Docker  │  │   processo│  │   no git  │  │ • Refresh │              │
│   │   compose │  │ • Sniffer │  │ • Sync    │  │   ao vivo │              │
│   │ • Limpar  │  │ • Tunnel  │  │   check   │  │ • Matar   │              │
│   │   portas  │  │ • Logs    │  │ • Chaves  │  │   da UI   │              │
│   │ • Iniciar │  │           │  │   sensiveis│  │           │              │
│   └─────┬─────┘  └─────┬─────┘  └───────────┘  └───────────┘              │
│         │              │                                                   │
│         ▼              ▼                                                   │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     🔧 MODULOS CORE                                 │   │
│   │                                                                     │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│   │  │ port-scanner │  │  smart-kill  │  │ log-streamer │              │   │
│   │  │              │  │              │  │              │              │   │
│   │  │ Windows:     │  │ • tree-kill  │  │ • /proc/*   │              │   │
│   │  │  netstat     │  │ • SIGTERM →  │  │ • Docker    │              │   │
│   │  │ Linux:       │  │   SIGKILL    │  │   logs      │              │   │
│   │  │  ss / lsof   │  │ • Arvore de  │  │ • Stream    │              │   │
│   │  │ macOS:       │  │   processos  │  │   ao vivo   │              │   │
│   │  │  lsof        │  │              │  │              │              │   │
│   │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│   │                                                                     │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│   │  │   sniffer    │  │    tunnel    │  │  workspace   │              │   │
│   │  │              │  │              │  │              │              │   │
│   │  │ • http-proxy │  │ • localtunnel│  │ • Detectar   │              │   │
│   │  │ • Proxy      │  │ • URL publica│  │   Node/Py/   │              │   │
│   │  │   reverso    │  │ • Compartilhar│ │   Docker/Go/ │              │   │
│   │  │ • Headers    │  │   com clientes│ │   Rust       │              │   │
│   │  │ • Body       │  │ • Webhooks   │  │ • Auto       │              │   │
│   │  │ • Status     │  │              │  │   iniciar    │              │   │
│   │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│   │                                                                     │   │
│   │  ┌──────────────┐  ┌──────────────┐                                │   │
│   │  │   auditor    │  │      ui      │                                │   │
│   │  │              │  │              │                                │   │
│   │  │ • dotenv     │  │ • blessed    │                                │   │
│   │  │ • Checar     │  │ • Estilo     │                                │   │
│   │  │   .env       │  │   htop       │                                │   │
│   │  │ • gitignore  │  │ • Navegacao  │                                │   │
│   │  │ • Sync       │  │   por teclado│                                │   │
│   │  │ • Chaves     │  │ • Stats      │                                │   │
│   │  │   sensiveis  │  │   ao vivo    │                                │   │
│   │  └──────────────┘  └──────────────┘                                │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    📦 DEPENDENCIAS                                 │   │
│   │                                                                     │   │
│   │  chalk • inquirer • blessed • tree-kill • http-proxy •              │   │
│   │  localtunnel • dotenv • package-json-path                          │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Por que Port-Pilot?

Todo desenvolvedor conhece a dor:

- Voce acabou de clonar um repo mas a porta ja esta ocupada por um processo antigo
- Voce precisa debugar uma API mas nao quer abrir Postman ou Wireshark
- Um cliente quer ver seu projeto local, mas voce nao pode fazer deploy
- Voce esqueceu de adicionar uma variavel no `.env` e o app trava em producao
- Voce tem 10 terminais abertos, cada um rodando um servico diferente

**Port-Pilot resolve todos os cinco problemas em uma unica ferramenta.**

---

## Funcionalidades

### 1. Launcher de Workspace Inteligente

Detecta automaticamente o tipo do projeto e inicia de forma inteligente.

```
  ⚡ LAUNCHER DE WORKSPACE INTELIGENTE

  📦 Detectado: NODE
  ⚡ Framework: Next.js
  🔌 Porta Padrao: 3000
  🐳 Docker: Sim
  🔑 .env: Encontrado

  🚀 Iniciando: npm run dev
```

**O que ele faz:**
- Detecta tipo do projeto: Node, Python, Docker, Go, Rust
- Identifica framework: React, Next.js, Vue, Angular, Express, Django, Flask
- Verifica Docker Compose e sobe containers automaticamente
- Escaneia conflitos de porta e mata processos travados antes de iniciar
- Roda o comando de dev apropriado com streaming de logs ao vivo

### 2. Gerenciador de Portas e Processos

Mapeia todas as portas ativas do seu sistema, identifica qual processo ocupa cada porta e mata processos travados com um clique.

```
  Porta     Processo             PID        Memoria     Uptime     CWD
  ──────────────────────────────────────────────────────────────────────
  3000    node.exe            11664     N/A         N/A         (Node/React)
  34144   vlmysqld.exe        11324     N/A         N/A         (MySQL)
  62608   OpenCode.exe        6516      N/A         N/A
```

**Suporte multiplataforma:**
- **Windows**: `netstat -ano` + `tasklist`
- **Linux**: `ss -tlnp` (fallback para `lsof`)
- **macOS**: `lsof -iTCP -sTCP:LISTEN`

### 3. Sniffer de Trafego HTTP

Leanta um proxy reverso transparente que intercepta e exibe todo o trafego HTTP em tempo real. Nenhuma alteracao de codigo necessaria.

```
  🕵️  PORT-PILOT SNIFFER HTTP v1.0

  Alvo:      http://localhost:3000
  Sniffer:   http://localhost:4000

  [14:32:10] #1  GET  /api/usuarios
      Host: localhost:4000
      Auth: Bearer eyJhbGciOiJIUzI1Ni...
      Content-Type: application/json
      Body: 45 B
        {"email":"teste@teste.com"}
      -> Encaminhado em 12ms

  [14:32:10] #1  GET  /api/usuarios -> 200 12ms
```

**O que voce ve:**
- Metodo HTTP (GET, POST, PUT, DELETE, PATCH)
- URL e headers da requisicao
- Tokens de autorizacao (preview de JWT)
- Body da requisicao (JSON formatado)
- Status code da resposta com tempo de resposta
- Stats ao vivo (requisicoes, bytes, uptime)

### 4. Tunnel Publico (Alternativa ao Ngrok)

Gera uma URL segura que faz tunel direto para seu servidor local. Compartilhe com clientes, teste webhooks ou acesse pelo celular.

```
  🚀 PORT-PILOT TUNNEL PUBLICO v1.0

  Status:    ATIVO
  Local:     http://localhost:3000

  URL PUBLICA: https://meuapp.localtunnel.me
```

**Casos de uso:**
- Demostrar seu projeto para um cliente sem fazer deploy
- Testar webhooks do Stripe/WhatsApp no localhost
- Acessar seu servidor de desenvolvimento pelo celular
- Compartilhamento rapido de API para testes de integracao

### 5. Auditor de Ambiente

Verifique a configuracao e seguranca do seu `.env` antes de fazer deploy.

```
  🛡️  PORT-PILOT AUDITOR DE AMBIENTE v1.0

  1. Verificacao de Protecao Git
  ✅ .env esta protegido no .gitignore

  2. Analise do Arquivo .env
  ✅ .env encontrado (12 variaveis, 24 linhas)
  ⚠️  Chaves sensiveis detectadas (3):
     • DATABASE_URL
     • JWT_SECRET
     • API_KEY

  3. Verificacao de Sync (.env vs .env.example)
  Faltando no .env:
     - SMTP_HOST
     - SMTP_PORT

  STATUS DO AMBIENTE: 1 PROBLEMA(S), 1 AVISO(S)
```

**O que ele verifica:**
- Protecao do `.env` no `.gitignore`
- Variaveis faltando ou vazias
- Exposicao de chaves sensiveis
- Sincronizacao entre `.env` e `.env.example`
- Presenca de variaveis comuns

---

## Instalacao

```bash
# Clone o repositorio
git clone https://github.com/anjggti-eng/port-pilot.git

# Navegue ate o projeto
cd port-pilot

# Instale as dependencias
npm install

# Vincule globalmente (opcional, mas recomendado)
npm link
```

Apos `npm link`, voce pode usar `pp` de qualquer lugar no seu terminal.

---

## Uso

### Menu Interativo

```bash
pp
```

Isso inicia o menu principal com 4 opcoes:
1. **Launcher de Workspace** — Detectar e iniciar seu projeto
2. **Gerenciador de Portas** — Mapear, matar, sniffer e tunnel
3. **Auditor de Ambiente** — Verificar seguranca do .env
4. **Modo Dashboard** — Tela cheia estilo htop

### Comandos CLI

| Comando | Descricao |
|---------|-----------|
| `pp` | Menu interativo principal |
| `pp launch` | Launcher de workspace inteligente |
| `pp list` | Listar todas as portas ativas |
| `pp kill <PID>` | Matar processo graciosamente (SIGTERM) |
| `pp kill <PID> -f` | Matar com forca (SIGKILL + arvore) |
| `pp sniff <PORTA>` | Iniciar sniffer de trafego HTTP |
| `pp tunnel <PORTA>` | Gerar URL publica para compartilhar |
| `pp audit` | Auditar .env e seguranca |
| `pp scan` | Saida JSON de todas as portas |
| `pp dashboard` | Dashboard estilo htop |
| `pp help` | Mostrar ajuda |

### Exemplos

**Iniciar um projeto:**
```bash
cd meu-projeto
pp launch
# Detecta automaticamente Node/Python/Docker, limpa portas, inicia dev server
```

**Listar todas as portas:**
```bash
pp list
```

**Matar um processo travado:**
```bash
pp kill 12345
pp kill 12345 -f    # Matar com forca se o graceful falhar
```

**Inspecionar trafego da API:**
```bash
pp sniff 3000
# Depois abra http://localhost:4000 no navegador
```

**Compartilhar seu servidor local:**
```bash
pp tunnel 3000
# Use a URL gerada para compartilhar com qualquer pessoa
```

**Auditar ambiente:**
```bash
pp audit
# Verifica seguranca do .env e sincronizacao
```

---

## Modo Dashboard

Para uma experiencia em tela cheia estilo htop:

```bash
pp dashboard
```

**Atalhos de teclado:**
| Tecla | Acao |
|-------|------|
| `↑↓` | Navegar entre portas |
| `Enter` | Abrir menu de acoes |
| `K` | Matar processo selecionado |
| `L` | Ver logs ao vivo |
| `R` | Atualizar lista de portas |
| `Q` | Sair |

---

## Estrutura do Projeto

```
port-pilot/
├── package.json          # Config CLI: comando "pp"
├── .gitignore
├── README.md             # Versao em ingles
├── README.pt-br.md       # Versao em portugues
├── assets/
│   └── screenshot.png    # Screenshot da ferramenta
└── src/
    ├── index.js          # Entrada principal + comandos CLI + menus
    ├── port-scanner.js   # Deteccao de portas multiplataforma
    ├── smart-kill.js     # Terminacao de processos com tree-kill
    ├── log-streamer.js   # Streaming de logs ao vivo por PID
    ├── sniffer.js        # Sniffer HTTP proxy reverso
    ├── tunnel.js         # Tunnel publico via localtunnel
    ├── workspace.js      # Launcher inteligente de projetos
    ├── auditor.js        # Auditor de ambiente
    └── ui.js             # Dashboard estilo htop com blessed
```

---

## Dependencias

| Pacote | Finalidade |
|--------|------------|
| `chalk` | Cores e estilo do terminal |
| `inquirer` | Menus interativos CLI |
| `blessed` | UI de tela cheia (dashboard) |
| `tree-kill` | Matar arvores de processos |
| `http-proxy` | Proxy reverso HTTP (sniffer) |
| `localtunnel` | Geracao de tunnel publico |
| `dotenv` | Parsing de variaveis de ambiente |
| `package-json-path` | Utilitarios de package.json |

---

## Requisitos

- **Node.js** 14+ (testado na v24)
- **npm** 6+
- **Windows**, **Linux** ou **macOS**
- **Docker** (opcional, para projetos Docker)

---

## Roteiro

- [x] Launcher de Workspace Inteligente
- [x] Auditor de Ambiente
- [x] Sniffer de Trafego HTTP
- [x] Tunnel Publico
- [x] Suporte multiplataforma
- [ ] Inspecao de trafego WebSocket
- [ ] Filtragem de body requisicao/resposta
- [ URLs de tunnel persistentes (subdominios customizados)
- [ ] Dashboard de monitoramento de memoria/CPU
- [ ] Exportar logs de trafego para arquivo
- [ ] Sistema de plugins para inspetores customizados

---

## Contribuindo

Contribuicoes sao bem-vindas! Sinta-se a vontade para abrir issues ou enviar pull requests.

```bash
# Faca fork do repo
# Crie sua branch de feature
git checkout -b feature/amazing-feature

# Faca seus commits
git commit -m "Add amazing feature"

# Push para a branch
git push origin feature/amazing-feature

# Abra um Pull Request
```

---

## Licenca

Licenca MIT. Use livremente em projetos pessoais e comerciais.

---

## Autor

Feito com carinho por **William John** da **Orbitan**.

**Port-Pilot** — Porque gerenciar servicos locais nao deveria ser mais dificil do que escrever o codigo.
