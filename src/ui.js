const blessed = require('blessed');
const chalk = require('chalk');
const os = require('os');
const { scanPorts, formatUptime } = require('./port-scanner');
const { smartKill, getProcessInfo } = require('./smart-kill');
const { streamProcessLogs, streamDockerLogs } = require('./log-streamer');

const DEV_PORTS = [3000, 3001, 3002, 3003, 3004, 3005, 4000, 4200, 5000, 5173, 5174,
  8000, 8080, 8081, 8443, 9000, 9090, 9229,
  5432, 5433, 3306, 3307, 27017, 6379, 1433, 5984, 9042, 7474];

const PORT_LABELS = {
  3000: 'Node/React', 3001: 'Node Alt', 3002: 'Node Alt',
  4000: 'Angular', 4200: 'Angular CLI', 5000: 'Flask/Docker',
  5173: 'Vite', 5174: 'Vite Alt',
  8000: 'Python/HTTP', 8080: 'HTTP Alt', 8081: 'HTTP Alt2',
  8443: 'HTTPS Alt', 9000: 'PHP-FPM', 9090: 'Prometheus',
  9229: 'Node Debug', 5432: 'PostgreSQL', 5433: 'PostgreSQL Alt',
  3306: 'MySQL', 3307: 'MySQL Alt', 27017: 'MongoDB',
  6379: 'Redis', 1433: 'MSSQL', 5984: 'CouchDB',
  9042: 'Cassandra', 7474: 'Neo4j'
};

function getPortLabel(port) {
  return PORT_LABELS[port] || '';
}

function formatBytes(bytes) {
  if (!bytes) return 'N/A';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

async function createDashboard() {
  const screen = blessed.screen({
    smartCSR: true,
    title: '⚓ Port-Pilot v1.0',
    fullUnicode: true
  });

  const headerBox = blessed.box({
    parent: screen,
    top: 0,
    left: 0,
    width: '100%',
    height: 3,
    content: '',
    tags: true,
    style: {
      fg: 'white',
      bg: 'blue'
    }
  });

  const statusBar = blessed.box({
    parent: screen,
    bottom: 0,
    left: 0,
    width: '100%',
    height: 1,
    content: '',
    tags: true,
    style: {
      fg: 'white',
      bg: 'gray'
    }
  });

  const tableBox = blessed.box({
    parent: screen,
    top: 3,
    left: 0,
    width: '100%',
    height: '100%-6',
    border: {
      type: 'line'
    },
    label: ' Active Ports ',
    tags: true,
    style: {
      border: { fg: 'cyan' },
      label: { fg: 'cyan', bold: true }
    }
  });

  const tableHeader = blessed.listtable({
    parent: tableBox,
    top: 0,
    left: 0,
    width: '100%',
    height: 3,
    tags: true,
    border: false,
    mouse: true,
    keys: true,
    vi: true,
    style: {
      header: { fg: 'white', bg: 'cyan', bold: true },
      cell: { fg: 'white' }
    }
  });

  const processList = blessed.list({
    parent: tableBox,
    top: 2,
    left: 0,
    width: '100%',
    height: '100%-2',
    tags: true,
    border: false,
    mouse: true,
    keys: true,
    vi: true,
    style: {
      selected: { fg: 'black', bg: 'cyan', bold: true },
      item: { fg: 'white' }
    },
    scrollbar: {
      style: {
        bg: 'cyan'
      }
    }
  });

  let currentServices = [];
  let selectedIndex = 0;

  async function refreshData() {
    try {
      currentServices = await scanPorts();

      const platform = os.platform();
      const platformIcon = platform === 'win32' ? '🪟' : platform === 'darwin' ? '' : '';

      headerBox.setContent(
        ` {bold}{white-fg}⚓ PORT-PILOT{/bold} {cyan-fg}│{/cyan-fg} ` +
        `${platformIcon} ${platform} ` +
        `{cyan-fg}│{/cyan-fg} ` +
        `{yellow-fg}${currentServices.length} port(s) open{/yellow-fg} ` +
        `{cyan-fg}│{/cyan-fg} ` +
        `Updated: {gray-fg}${new Date().toLocaleTimeString()}{/gray-fg} ` +
        `{cyan-fg}│{/cyan-fg} ` +
        `{magenta-fg}R:Refresh Q:Quit K:Kill L:Logs{/magenta-fg}`
      );

      processList.clearItems();

      if (currentServices.length === 0) {
        processList.addItem('{green-fg}  No listening ports found. Your system is clean!{/green-fg}');
        statusBar.setContent(' {green-fg}All clear{/green-fg} | Press R to refresh | Q to quit');
      } else {
        for (const svc of currentServices) {
          const label = getPortLabel(svc.port);
          const isDev = DEV_PORTS.includes(svc.port);
          const portColor = isDev ? 'green' : 'white';
          const labelStr = label ? ` {dim-fg}(${label}){/dim-fg}` : '';

          const memStr = svc.memory ? ` ${formatBytes(parseInt(svc.memory) * 1024)}` : '';
          const cpuStr = svc.cpu ? ` CPU:${svc.cpu}` : '';
          const uptimeStr = svc.uptime ? ` ${formatUptime(svc.uptime)}` : '';

          const line =
            ` {${portColor}-fg}${String(svc.port).padStart(6)}{/} ` +
            `{cyan-fg}${(svc.processName || 'unknown').substring(0, 18).padEnd(18)}{/} ` +
            `{yellow-fg}${String(svc.pid).padStart(8)}{/} ` +
            `{gray-fg}${memStr}${cpuStr}${uptimeStr}{/} ` +
            `{dim-fg}${svc.cwd ? svc.cwd.substring(0, 40) : ''}{/}` +
            labelStr;

          processList.addItem(line);
        }

        statusBar.setContent(
          ` {bold}{green-fg}Ports: ${currentServices.length}{/green-fg}{/bold}` +
          ` │ ↑↓:Navigate Enter:Select K:Kill L:Logs R:Refresh Q:Quit`
        );
      }

      screen.render();
    } catch (err) {
      statusBar.setContent(` {red-fg}Error: ${err.message}{/red-fg}`);
      screen.render();
    }
  }

  function showActionMenu(service) {
    const popup = blessed.list({
      parent: screen,
      top: 'center',
      left: 'center',
      width: '50%',
      height: 10,
      border: { type: 'line' },
      label: ` Port ${service.port} - ${service.processName} (PID: ${service.pid}) `,
      items: [
        `{red-fg}Kill process (tree kill){/red-fg}`,
        `{red-fg}Force kill (SIGKILL){/red-fg}`,
        `{cyan-fg}View logs (live){/cyan-fg}`,
        `{cyan-fg}View Docker logs (if container){/cyan-fg}`,
        `{cyan-fg}Show process info{/cyan-fg}`,
        `{gray-fg}Back{/gray-fg}`
      ],
      keys: true,
      vi: true,
      mouse: true,
      style: {
        border: { fg: 'red' },
        selected: { fg: 'white', bg: 'red' },
        item: { fg: 'white' },
        label: { fg: 'white', bold: true }
      }
    });

    screen.render();
    popup.focus();

    popup.on('select', async (item, index) => {
      popup.destroy();

      switch (index) {
        case 0: {
          statusBar.setContent(` {yellow-fg}Killing PID ${service.pid} (graceful)...{/yellow-fg}`);
          screen.render();
          const result = await smartKill(service.pid, false);
          if (result.success) {
            statusBar.setContent(` {green-fg}Process killed successfully (${result.method}){/green-fg}`);
          } else {
            statusBar.setContent(` {red-fg}Failed to kill process. Try force kill or use sudo.{/red-fg}`);
          }
          await refreshData();
          break;
        }
        case 1: {
          statusBar.setContent(` {red-fg}Force killing PID ${service.pid} (SIGKILL)...{/red-fg}`);
          screen.render();
          const result = await smartKill(service.pid, true);
          if (result.success) {
            statusBar.setContent(` {green-fg}Process force killed successfully{/green-fg}`);
          } else {
            statusBar.setContent(` {red-fg}Failed to force kill. Process may require admin privileges.{/red-fg}`);
          }
          await refreshData();
          break;
        }
        case 2: {
          streamProcessLogs(service.pid, service.processName);
          break;
        }
        case 3: {
          streamDockerLogs(service.processName);
          break;
        }
        case 4: {
          const info = await getProcessInfo(service.pid);
          const infoBox = blessed.box({
            parent: screen,
            top: 'center',
            left: 'center',
            width: '60%',
            height: 14,
            border: { type: 'line' },
            label: ` Process Info: PID ${service.pid} `,
            tags: true,
            content:
              `\n  Name: {cyan-fg}${info.name || service.processName}{/cyan-fg}\n` +
              `  PID: {yellow-fg}${info.pid}{/yellow-fg}\n` +
              `  Port: {green-fg}${service.port}{/green-fg}\n` +
              `  Memory: ${info.memory || info.mem || 'N/A'}\n` +
              `  CPU: ${info.cpu || 'N/A'}\n` +
              `  Uptime: ${service.uptime || info.uptime || 'N/A'}\n` +
              `  CWD: {dim-fg}${service.cwd || 'N/A'}{/dim-fg}\n` +
              `  Command: {dim-fg}${(service.processCommand || '').substring(0, 60)}{/dim-fg}\n`,
            style: {
              border: { fg: 'cyan' },
              label: { fg: 'cyan', bold: true }
            }
          });

          infoBox.on('click', () => {
            infoBox.destroy();
            screen.render();
          });

          infoBox.key(['escape', 'enter', 'q'], () => {
            infoBox.destroy();
            screen.render();
          });

          screen.render();
          break;
        }
        case 5: {
          await refreshData();
          break;
        }
      }
    });

    popup.key(['escape', 'q'], () => {
      popup.destroy();
      screen.render();
    });
  }

  processList.on('select', (item, index) => {
    if (index < currentServices.length) {
      showActionMenu(currentServices[index]);
    }
  });

  screen.key(['r', 'R'], async () => {
    statusBar.setContent(' {yellow-fg}Refreshing...{/yellow-fg}');
    screen.render();
    await refreshData();
  });

  screen.key(['k', 'K'], () => {
    if (currentServices.length > 0) {
      const idx = processList.selected || 0;
      if (idx < currentServices.length) {
        showActionMenu(currentServices[idx]);
      }
    }
  });

  screen.key(['l', 'L'], () => {
    if (currentServices.length > 0) {
      const idx = processList.selected || 0;
      if (idx < currentServices.length) {
        streamProcessLogs(currentServices[idx].pid, currentServices[idx].processName);
      }
    }
  });

  screen.key(['q', 'Q', 'C-c'], () => {
    process.exit(0);
  });

  await refreshData();

  setInterval(refreshData, 5000);

  return screen;
}

module.exports = { createDashboard };
