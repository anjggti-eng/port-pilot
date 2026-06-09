<h1 align="center">⚓ Port-Pilot v2.0</h1>

<p align="center">
  <b>The Ultimate Developer Swiss-Army Knife</b><br>
  <i>Local Port Manager • HTTP Sniffer • Public Tunnel • Workspace Launcher • Environment Auditor</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-2.0-blue" alt="Version"/>
  <img src="https://img.shields.io/badge/node-%3E%3D14-green" alt="Node"/>
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20macOS-lightgrey" alt="Platform"/>
  <img src="https://img.shields.io/badge/license-MIT-yellow" alt="License"/>
</p>

---

## Preview

```
  ╔══════════════════════════════════════════════════════════════╗
  ║              ⚓  PORT-PILOT v2.0                            ║
  ║     The Ultimate Developer Swiss-Army Knife                 ║
  ╚══════════════════════════════════════════════════════════════╝

  Platform: win32 | Node: v24.11.1 | Dir: C:\Projects\my-app

  📦 Current Project: my-app (NODE)
  ⚡ Framework: Next.js

? What would you like to do? (Use arrow keys)
> 🚀 Workspace Launcher (Detect + Launch + Manage)
  🔍 Port Manager (Scan / Kill / Sniffer / Tunnel)
  🛡️  Environment Auditor (Check .env & Security)
  📊 Dashboard Mode (htop-style full screen)
  ❌ Exit
```

---

## Blueprint Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ⚓ PORT-PILOT v2.0                                │
│                   The Ultimate Developer Swiss-Army Knife                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      🖥️  CLI ENTRY POINT (pp)                      │   │
│   │                                                                     │   │
│   │   Commands: pp | pp launch | pp list | pp kill | pp sniff |        │   │
│   │             pp tunnel | pp audit | pp scan | pp dashboard | pp help │   │
│   └──────────────────────────────┬──────────────────────────────────────┘   │
│                                  │                                          │
│                                  ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    📋 MAIN MENU (inquirer)                         │   │
│   │                                                                     │   │
│   │   🚀 Workspace Launcher    🔍 Port Manager                        │   │
│   │   🛡️  Environment Auditor   📊 Dashboard Mode                      │   │
│   └─────┬──────────────┬──────────────┬──────────────┬─────────────────┘   │
│         │              │              │              │                      │
│         ▼              ▼              ▼              ▼                      │
│   ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐              │
│   │ WORKSPACE │  │   PORT    │  │   ENV     │  │ DASHBOARD │              │
│   │ LAUNCHER  │  │  MANAGER  │  │  AUDITOR  │  │   (UI)    │              │
│   └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘              │
│         │              │              │              │                      │
│         ▼              ▼              ▼              ▼                      │
│   ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐              │
│   │ • Detect  │  │ • Scan    │  │ • .env    │  │ • blessed │              │
│   │   project │  │   ports   │  │   check   │  │   htop    │              │
│   │   type    │  │ • Kill    │  │ • Git     │  │   style   │              │
│   │ • Docker  │  │   process │  │   protect │  │ • Live    │              │
│   │   compose │  │ • Sniffer │  │ • Sync    │  │   refresh │              │
│   │ • Clean   │  │ • Tunnel  │  │   check   │  │ • Kill    │              │
│   │   ports   │  │ • Logs    │  │ • Sensitive│  │   from UI │              │
│   │ • Launch  │  │           │  │   keys    │  │           │              │
│   └─────┬─────┘  └─────┬─────┘  └───────────┘  └───────────┘              │
│         │              │                                                   │
│         ▼              ▼                                                   │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     🔧 CORE MODULES                                 │   │
│   │                                                                     │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│   │  │ port-scanner │  │  smart-kill  │  │ log-streamer │              │   │
│   │  │              │  │              │  │              │              │   │
│   │  │ Windows:     │  │ • tree-kill  │  │ • /proc/*   │              │   │
│   │  │  netstat     │  │ • SIGTERM →  │  │ • Docker    │              │   │
│   │  │ Linux:       │  │   SIGKILL    │  │   logs      │              │   │
│   │  │  ss / lsof   │  │ • Process    │  │ • Live      │              │   │
│   │  │ macOS:       │  │   tree       │  │   stream    │              │   │
│   │  │  lsof        │  │              │  │              │              │   │
│   │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│   │                                                                     │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│   │  │   sniffer    │  │    tunnel    │  │  workspace   │              │   │
│   │  │              │  │              │  │              │              │   │
│   │  │ • http-proxy │  │ • localtunnel│  │ • Detect     │              │   │
│   │  │ • Reverse    │  │ • Public URL │  │   Node/Py/   │              │   │
│   │  │   proxy      │  │ • Share with │  │   Docker/Go/ │              │   │
│   │  │ • Headers    │  │   clients    │  │   Rust       │              │   │
│   │  │ • Body       │  │ • Webhooks   │  │ • Auto       │              │   │
│   │  │ • Status     │  │              │  │   launch     │              │   │
│   │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│   │                                                                     │   │
│   │  ┌──────────────┐  ┌──────────────┐                                │   │
│   │  │   auditor    │  │      ui      │                                │   │
│   │  │              │  │              │                                │   │
│   │  │ • dotenv     │  │ • blessed    │                                │   │
│   │  │ • .env check │  │ • htop-style │                                │   │
│   │  │ • gitignore  │  │ • Keyboard   │                                │   │
│   │  │ • sync       │  │   nav        │                                │   │
│   │  │ • sensitive  │  │ • Real-time  │                                │   │
│   │  │   keys       │  │   stats      │                                │   │
│   │  └──────────────┘  └──────────────┘                                │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    📦 DEPENDENCIES                                 │   │
│   │                                                                     │   │
│   │  chalk • inquirer • blessed • tree-kill • http-proxy •              │   │
│   │  localtunnel • dotenv • package-json-path                          │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Why Port-Pilot?

Every developer knows the pain:

- You just cloned a repo but the port is already occupied by an old process
- You need to debug an API but don't want to open Postman or Wireshark
- A client wants to see your local project, but you can't deploy it yet
- You forgot to add a variable to your `.env` and the app crashes in production
- You have 10 terminals open, each running a different service

**Port-Pilot solves all five problems in a single tool.**

---

## Features

### 1. Smart Workspace Launcher

Auto-detects your project type and launches it intelligently.

```
  ⚡ SMART WORKSPACE LAUNCHER

  📦 Detected: NODE
  ⚡ Framework: Next.js
  🔌 Default Port: 3000
  🐳 Docker: Yes
  🔑 .env: Found

  🚀 Launching: npm run dev
```

**What it does:**
- Detects project type: Node, Python, Docker, Go, Rust
- Identifies framework: React, Next.js, Vue, Angular, Express, Django, Flask
- Checks for Docker Compose and starts containers automatically
- Scans for port conflicts and kills stuck processes before launch
- Runs the appropriate dev command with live log streaming

### 2. Port Scanner & Process Manager

Scan all listening ports on your system, identify which process owns each port, and kill stuck processes with one keystroke.

```
  Port     Process              PID        Memory       Uptime     CWD
  ──────────────────────────────────────────────────────────────────────
  3000    node.exe            11664     N/A         N/A         (Node/React)
  34144   vlmysqld.exe        11324     N/A         N/A         (MySQL)
  62608   OpenCode.exe        6516      N/A         N/A
```

**Cross-platform support:**
- **Windows**: `netstat -ano` + `tasklist`
- **Linux**: `ss -tlnp` (fallback to `lsof`)
- **macOS**: `lsof -iTCP -sTCP:LISTEN`

### 3. HTTP Traffic Sniffer

Spin up a transparent reverse proxy that intercepts and displays all HTTP traffic in real-time. No code changes needed.

```
  🕵️  PORT-PILOT HTTP SNIFFER v1.0

  Target:   http://localhost:3000
  Sniffer:  http://localhost:4000

  [14:32:10] #1  GET  /api/users
      Host: localhost:4000
      Auth: Bearer eyJhbGciOiJIUzI1Ni...
      Content-Type: application/json
      Body: 45 B
        {"email":"test@test.com"}
      -> Forwarded in 12ms

  [14:32:10] #1  GET  /api/users -> 200 12ms
```

**What you see:**
- HTTP method (GET, POST, PUT, DELETE, PATCH)
- Request URL and headers
- Authorization tokens (JWT preview)
- Request body (JSON formatted)
- Response status code with timing
- Live stats (requests, bytes, uptime)

### 4. Public Tunnel (Ngrok Alternative)

Generate a secure public URL that tunnels directly to your local server. Share with clients, test webhooks, or access from your phone.

```
  🚀 PORT-PILOT PUBLIC TUNNEL v1.0

  Status:    ACTIVE
  Local:     http://localhost:3000

  PUBLIC URL: https://myapp.localtunnel.me
```

**Use cases:**
- Demo your project to a client without deploying
- Test Stripe/WhatsApp webhooks on localhost
- Access your dev server from mobile devices
- Quick API sharing for integration testing

### 5. Environment Auditor

Check your `.env` configuration and security before deploying.

```
  🛡️  PORT-PILOT ENVIRONMENT AUDITOR v1.0

  1. Git Protection Check
  ✅ .env is protected in .gitignore

  2. Environment File Analysis
  ✅ .env found (12 variables, 24 lines)
  ⚠️  Sensitive keys detected (3):
     • DATABASE_URL
     • JWT_SECRET
     • API_KEY

  3. Sync Check (.env vs .env.example)
  Missing in .env:
     - SMTP_HOST
     - SMTP_PORT

  ENVIRONMENT STATUS: 1 ISSUE(S), 1 WARNING(S)
```

**What it checks:**
- `.env` protection in `.gitignore`
- Missing or empty variables
- Sensitive keys exposure
- Sync between `.env` and `.env.example`
- Common variable presence

---

## Installation

```bash
# Clone the repository
git clone https://github.com/anjggti-eng/port-pilot.git

# Navigate to the project
cd port-pilot

# Install dependencies
npm install

# Link globally (optional, but recommended)
npm link
```

After `npm link`, you can use `pp` from anywhere in your terminal.

---

## Usage

### Interactive Menu

```bash
pp
```

This launches the main menu with 4 options:
1. **Workspace Launcher** — Detect and launch your project
2. **Port Manager** — Scan, kill, sniff, and tunnel ports
3. **Environment Auditor** — Check .env security
4. **Dashboard Mode** — htop-style full screen

### CLI Commands

| Command | Description |
|---------|-------------|
| `pp` | Interactive main menu |
| `pp launch` | Smart workspace launcher |
| `pp list` | List all listening ports |
| `pp kill <PID>` | Kill a process gracefully (SIGTERM) |
| `pp kill <PID> -f` | Force kill (SIGKILL + tree kill) |
| `pp sniff <PORT>` | Start HTTP traffic sniffer |
| `pp tunnel <PORT>` | Generate public shareable URL |
| `pp audit` | Audit .env and security |
| `pp scan` | JSON output of all ports |
| `pp dashboard` | htop-style dashboard |
| `pp help` | Show help |

### Examples

**Launch a project:**
```bash
cd my-project
pp launch
# Auto-detects Node/Python/Docker, cleans ports, starts dev server
```

**List all ports:**
```bash
pp list
```

**Kill a stuck process:**
```bash
pp kill 12345
pp kill 12345 -f    # Force kill if graceful fails
```

**Inspect API traffic:**
```bash
pp sniff 3000
# Then open http://localhost:4000 in your browser
```

**Share your local server:**
```bash
pp tunnel 3000
# Use the generated URL to share with anyone
```

**Audit environment:**
```bash
pp audit
# Checks .env security and sync
```

---

## Dashboard Mode

For a full-screen htop-style experience:

```bash
pp dashboard
```

**Keyboard shortcuts:**
| Key | Action |
|-----|--------|
| `↑↓` | Navigate between ports |
| `Enter` | Open action menu |
| `K` | Kill selected process |
| `L` | Stream live logs |
| `R` | Refresh port list |
| `Q` | Quit |

---

## Project Structure

```
port-pilot/
├── package.json          # CLI config: "pp" command
├── .gitignore
├── README.md
├── assets/
│   └── screenshot.png    # Tool screenshot
└── src/
    ├── index.js          # Main entry + CLI commands + menus
    ├── port-scanner.js   # Cross-platform port detection
    ├── smart-kill.js     # Process termination with tree-kill
    ├── log-streamer.js   # Live log streaming per PID
    ├── sniffer.js        # HTTP reverse proxy sniffer
    ├── tunnel.js         # Public tunnel via localtunnel
    ├── workspace.js      # Smart project launcher
    ├── auditor.js        # Environment auditor
    └── ui.js             # Blessed htop-style dashboard
```

---

## Dependencies

| Package | Purpose |
|---------|---------|
| `chalk` | Terminal colors and styling |
| `inquirer` | Interactive CLI menus |
| `blessed` | Full-screen terminal UI (dashboard) |
| `tree-kill` | Kill process trees |
| `http-proxy` | HTTP reverse proxy (sniffer) |
| `localtunnel` | Public tunnel generation |
| `dotenv` | Environment variable parsing |
| `package-json-path` | Package.json utilities |

---

## Requirements

- **Node.js** 14+ (tested on v24)
- **npm** 6+
- **Windows**, **Linux**, or **macOS**
- **Docker** (optional, for Docker projects)

---

## Roadmap

- [x] Smart Workspace Launcher
- [x] Environment Auditor
- [x] HTTP Traffic Sniffer
- [x] Public Tunnel
- [x] Cross-platform support
- [ ] WebSocket traffic inspection
- [ ] Request/response body filtering
- [ ] Persistent tunnel URLs (custom subdomains)
- [ ] Process memory/CPU monitoring dashboard
- [ ] Export traffic logs to file
- [ ] Plugin system for custom inspectors

---

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

```bash
# Fork the repo
# Create your feature branch
git checkout -b feature/amazing-feature

# Commit your changes
git commit -m "Add amazing feature"

# Push to the branch
git push origin feature/amazing-feature

# Open a Pull Request
```

---

## License

MIT License. Use freely in personal and commercial projects.

---

## Author

Built with care for developers who live in the terminal.

**Port-Pilot** — Because managing local services shouldn't be harder than writing the code itself.
