# ⚓ Port-Pilot

**Local Port Manager, HTTP Sniffer & Public Tunnel — All in One CLI**

Port-Pilot is a powerful command-line tool that gives you full control over your local development environment. Map running services, inspect HTTP traffic, and expose your local server to the internet — without leaving the terminal.

![Port-Pilot Screenshot](assets/screenshot.png)

---

## Why Port-Pilot?

Every developer knows the pain:

- You have 10 terminals open, each running a different service
- A port (3000, 5432, 8080) is stuck and you can't restart your app
- You need to debug an API but don't want to open Postman or Wireshark
- A client wants to see your local project, but you can't deploy it yet

**Port-Pilot solves all three problems in a single tool.**

---

## Features

### 1. Port Scanner & Process Manager

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

### 2. HTTP Traffic Sniffer

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

### 3. Public Tunnel (Ngrok Alternative)

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

This launches the interactive panel where you can:
1. See all listening ports
2. Navigate with arrow keys
3. Select a port to manage
4. Choose an action (Sniffer, Tunnel, Kill, Logs, etc.)

### CLI Commands

| Command | Description |
|---------|-------------|
| `pp` | Interactive menu (default) |
| `pp list` | List all listening ports |
| `pp kill <PID>` | Kill a process gracefully (SIGTERM) |
| `pp kill <PID> -f` | Force kill (SIGKILL + tree kill) |
| `pp sniff <PORT>` | Start HTTP traffic sniffer |
| `pp tunnel <PORT>` | Generate public shareable URL |
| `pp scan` | JSON output of all ports |
| `pp help` | Show help |

### Examples

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
    ├── index.js          # Main entry point + CLI commands
    ├── port-scanner.js   # Cross-platform port detection
    ├── smart-kill.js     # Process termination with tree-kill
    ├── log-streamer.js   # Live log streaming per PID
    ├── sniffer.js        # HTTP reverse proxy sniffer
    ├── tunnel.js         # Public tunnel via localtunnel
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
| `command-exists` | Check if commands exist |

---

## Requirements

- **Node.js** 14+ (tested on v24)
- **npm** 6+
- **Windows**, **Linux**, or **macOS**

---

## Roadmap

- [ ] Docker container detection and management
- [ ] WebSocket traffic inspection
- [ ] Request/response body filtering
- [ ] Persistent tunnel URLs (custom subdomains)
- [ ] Port conflict detection and auto-resolve
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
