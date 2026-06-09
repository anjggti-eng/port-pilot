#!/usr/bin/env node

const chalk = require('chalk');
const inquirer = require('inquirer');
const os = require('os');
const path = require('path');
const { scanPorts, formatUptime } = require('./port-scanner');
const { smartKill, isProcessRunning } = require('./smart-kill');
const { streamProcessLogs, streamDockerLogs } = require('./log-streamer');
const { createDashboard } = require('./ui');
const { startSniffer } = require('./sniffer');
const { startTunnel } = require('./tunnel');
const { launchProject, detectProjectType } = require('./workspace');
const { auditEnvironment } = require('./auditor');

const DEV_PORTS = [3000, 3001, 3002, 3003, 3004, 3005, 4000, 4200, 5000, 5173, 5174,
  8000, 8080, 8081, 8443, 9000, 9090, 9229,
  5432, 5433, 3306, 3307, 27017, 6379, 1433, 5984, 9042, 7474];

const PORT_LABELS = {
  3000: 'Node/React', 3001: 'Node', 3002: 'Node',
  4000: 'Angular', 4200: 'Angular CLI', 5000: 'Flask/Docker',
  5173: 'Vite', 5174: 'Vite',
  8000: 'Python', 8080: 'HTTP', 8081: 'HTTP',
  8443: 'HTTPS', 9000: 'PHP-FPM', 9090: 'Prometheus',
  9229: 'Node Debug', 5432: 'PostgreSQL', 5433: 'PostgreSQL',
  3306: 'MySQL', 3307: 'MySQL', 27017: 'MongoDB',
  6379: 'Redis', 1433: 'MSSQL', 5984: 'CouchDB',
  9042: 'Cassandra', 7474: 'Neo4j'
};

function printHeader() {
  console.log(chalk.magenta.bold(`
  ╔══════════════════════════════════════════════════════════════╗
  ║              ⚓  PORT-PILOT v2.0                            ║
  ║     The Ultimate Developer Swiss-Army Knife                 ║
  ╚══════════════════════════════════════════════════════════════╝
  `));
  console.log(chalk.gray(`  Platform: ${os.platform()} | Node: ${process.version} | Dir: ${process.cwd()}\n`));
}

async function portManager() {
  printHeader();
  console.log(chalk.cyan('  Scanning open ports...\n'));
  const services = await scanPorts();

  if (services.length === 0) {
    console.log(chalk.green('  ✨ No listening ports found. System is clean!\n'));
    await inquirer.prompt([{ type: 'input', name: 'any', message: 'Press Enter to continue...' }]);
    return main();
  }

  console.log(chalk.green(`  Found ${services.length} listening port(s):\n`));

  const choices = services.map(svc => {
    const label = PORT_LABELS[svc.port] || '';
    const labelStr = label ? chalk.dim(` (${label})`) : '';
    const isDev = DEV_PORTS.includes(svc.port);
    const portColor = isDev ? chalk.green.bold : chalk.white;
    const memStr = svc.memoryMB ? ` ${svc.memoryMB.toFixed(1)}MB` : '';

    return {
      name: `  ${portColor(String(svc.port).padStart(6))} │ ${chalk.cyan(svc.processName.padEnd(18))} │ PID: ${chalk.yellow(String(svc.pid).padStart(8))} │ ${chalk.gray(svc.cwd || '')}${labelStr}${chalk.dim(memStr)}`,
      value: svc
    };
  });

  choices.push(new inquirer.Separator());
  choices.push({ name: `${chalk.gray('Dashboard Mode (htop-style)')}`, value: 'dashboard' });
  choices.push({ name: `${chalk.gray('Back to Main Menu')}`, value: 'back' });

  const { selectedService } = await inquirer.prompt([{
    type: 'list',
    name: 'selectedService',
    message: 'Select a port to manage:',
    choices,
    pageSize: 20
  }]);

  if (selectedService === 'back') return main();
  if (selectedService === 'dashboard') {
    await createDashboard();
    return main();
  }

  await handleServiceAction(selectedService);
}

async function handleServiceAction(service) {
  const { action } = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: `Port ${service.port} (PID: ${service.pid}) — What to do?`,
    choices: [
      { name: `${chalk.magenta.bold('HTTP Traffic Sniffer (Proxy Inspector)')}`, value: 'sniff' },
      { name: `${chalk.green.bold('Public Tunnel (Generate Shareable URL)')}`, value: 'tunnel' },
      { name: `${chalk.red.bold('Kill process (graceful)')}`, value: 'kill' },
      { name: `${chalk.red.bold('Force kill (SIGKILL + tree)')}`, value: 'force-kill' },
      { name: `${chalk.cyan.bold('Stream logs (live)')}`, value: 'logs' },
      { name: `${chalk.cyan.bold('Docker logs')}`, value: 'docker-logs' },
      { name: `${chalk.yellow.bold('Check if alive')}`, value: 'check' },
      { name: `${chalk.gray('Back to list')}`, value: 'back' }
    ]
  }]);

  switch (action) {
    case 'sniff':
      startSniffer(service.port);
      return;

    case 'tunnel':
      await startTunnel(service.port);
      return;

    case 'kill':
      console.log(chalk.yellow(`\n  Killing PID ${service.pid}...`));
      const result1 = await smartKill(service.pid, false);
      if (result1.success) {
        console.log(chalk.green(`  ✅ Process killed (${result1.method})`));
      } else {
        console.log(chalk.red('  ❌ Failed to kill. Try force kill or sudo.'));
      }
      break;

    case 'force-kill':
      console.log(chalk.red(`\n  Force killing PID ${service.pid}...`));
      const result2 = await smartKill(service.pid, true);
      if (result2.success) {
        console.log(chalk.green('  ✅ Process force killed'));
      } else {
        console.log(chalk.red('  ❌ Failed. May require admin privileges.'));
      }
      break;

    case 'logs':
      streamProcessLogs(service.pid, service.processName);
      return;

    case 'docker-logs':
      streamDockerLogs(service.processName);
      return;

    case 'check':
      const running = await isProcessRunning(service.pid);
      if (running) {
        console.log(chalk.green(`\n  ✅ PID ${service.pid} is alive`));
      } else {
        console.log(chalk.red(`\n  ❌ PID ${service.pid} is not running`));
      }
      break;

    case 'back':
      return portManager();
  }

  const { again } = await inquirer.prompt([{
    type: 'confirm',
    name: 'again',
    message: 'Manage another service?',
    default: true
  }]);

  if (again) {
    await portManager();
  } else {
    await main();
  }
}

async function workspaceMenu() {
  printHeader();
  console.log(chalk.bgBlue.white.bold('  ⚡ SMART WORKSPACE LAUNCHER  \n'));

  const project = detectProjectType(process.cwd());

  const typeIcons = {
    node: '📦', python: '🐍', docker: '🐳', go: '🔵', rust: '🦀', unknown: '📁'
  };

  console.log(`  ${typeIcons[project.type] || '📁'} Detected: ${chalk.white.bold(project.type.toUpperCase())}`);
  if (project.framework) console.log(`  ⚡ Framework: ${chalk.green.bold(project.framework)}`);
  console.log(`  🔌 Default Port: ${chalk.yellow(project.port)}`);
  console.log(`  🐳 Docker: ${project.hasDocker ? chalk.green('Yes') : chalk.gray('No')}`);
  console.log(`  🔑 .env: ${project.hasEnv ? chalk.green('Found') : chalk.yellow('Missing')}`);
  console.log();

  const choices = [
    { name: `${chalk.green.bold('🚀 Launch Project')} (Clean ports + Start)`, value: 'launch' },
    { name: `${chalk.cyan.bold('🔍 Scan & Manage Ports')}`, value: 'ports' },
    { name: `${chalk.yellow.bold('🛡️  Audit .env & Security')}`, value: 'audit' },
    { name: `${chalk.magenta.bold('🕵️  HTTP Sniffer')}`, value: 'sniff' },
    { name: `${chalk.green.bold('🌐 Public Tunnel')}`, value: 'tunnel' },
    new inquirer.Separator(),
    { name: `${chalk.gray('Back to Main Menu')}`, value: 'back' }
  ];

  const { choice } = await inquirer.prompt([{
    type: 'list',
    name: 'choice',
    message: 'Workspace actions:',
    choices
  }]);

  switch (choice) {
    case 'launch':
      const launched = await launchProject(process.cwd());
      if (!launched) {
        await inquirer.prompt([{ type: 'input', name: 'any', message: 'Press Enter to continue...' }]);
        return workspaceMenu();
      }
      break;

    case 'ports':
      return portManager();

    case 'audit':
      auditEnvironment(process.cwd());
      await inquirer.prompt([{ type: 'input', name: 'any', message: 'Press Enter to continue...' }]);
      return workspaceMenu();

    case 'sniff':
      const { port: snifferPort } = await inquirer.prompt([{
        type: 'input',
        name: 'port',
        message: 'Port to sniff:',
        default: String(project.port)
      }]);
      startSniffer(parseInt(snifferPort));
      break;

    case 'tunnel':
      const { port: tunnelPort } = await inquirer.prompt([{
        type: 'input',
        name: 'port',
        message: 'Port to expose:',
        default: String(project.port)
      }]);
      await startTunnel(parseInt(tunnelPort));
      break;

    case 'back':
      return main();
  }
}

async function main() {
  printHeader();

  const project = detectProjectType(process.cwd());
  const typeIcons = {
    node: '📦', python: '🐍', docker: '🐳', go: '🔵', rust: '🦀', unknown: '📁'
  };

  console.log(`  ${typeIcons[project.type] || '📁'} Current Project: ${chalk.white.bold(project.name)} (${project.type.toUpperCase()})`);
  if (project.framework) console.log(`  ⚡ Framework: ${chalk.green.bold(project.framework)}`);
  console.log();

  const choices = [
    { name: `  🚀 ${chalk.bold('Workspace Launcher')} ${chalk.dim('(Detect + Launch + Manage)')}`, value: 'workspace' },
    { name: `  🔍 ${chalk.bold('Port Manager')} ${chalk.dim('(Scan / Kill / Sniffer / Tunnel)')}`, value: 'ports' },
    { name: `  🛡️  ${chalk.bold('Environment Auditor')} ${chalk.dim('(Check .env & Security)')}`, value: 'audit' },
    { name: `  📊 ${chalk.bold('Dashboard Mode')} ${chalk.dim('(htop-style full screen)')}`, value: 'dashboard' },
    new inquirer.Separator(),
    { name: `  ❌ ${chalk.gray('Exit')}`, value: 'exit' }
  ];

  const { mainMenu } = await inquirer.prompt([{
    type: 'list',
    name: 'mainMenu',
    message: 'What would you like to do?',
    choices,
    pageSize: 10
  }]);

  switch (mainMenu) {
    case 'workspace':
      return workspaceMenu();

    case 'ports':
      return portManager();

    case 'audit':
      auditEnvironment(process.cwd());
      await inquirer.prompt([{ type: 'input', name: 'any', message: 'Press Enter to continue...' }]);
      return main();

    case 'dashboard':
      await createDashboard();
      return main();

    case 'exit':
      console.log(chalk.gray('\n  Goodbye! ⚓\n'));
      process.exit(0);
  }
}

async function cli() {
  const args = process.argv.slice(2);

  switch (args[0]) {
    case 'launch':
    case 'start':
      return workspaceMenu();

    case 'dashboard':
    case 'dash':
    case 'ui':
      await createDashboard();
      break;

    case 'list':
    case 'ls':
      printHeader();
      const services = await scanPorts();
      if (services.length === 0) {
        console.log(chalk.green('  No listening ports found.\n'));
        return;
      }
      console.log(chalk.cyan(`  ${'Port'.padEnd(8)} ${'Process'.padEnd(20)} ${'PID'.padEnd(10)} ${'Memory'.padEnd(12)} ${'Uptime'.padEnd(10)} CWD`));
      console.log(chalk.gray('  ' + '─'.repeat(90)));
      for (const svc of services) {
        const label = PORT_LABELS[svc.port] || '';
        const memStr = svc.memoryMB ? `${svc.memoryMB.toFixed(1)}MB` : 'N/A';
        console.log(
          `  ${chalk.green(String(svc.port).padEnd(8))}` +
          `${chalk.cyan((svc.processName || '').padEnd(20))}` +
          `${chalk.yellow(String(svc.pid).padEnd(10))}` +
          `${memStr.padEnd(12)}` +
          `${formatUptime(svc.uptime).padEnd(10)}` +
          `${chalk.gray(svc.cwd || '')}` +
          (label ? chalk.dim(` (${label})`) : '')
        );
      }
      console.log();
      break;

    case 'kill':
      if (!args[1]) {
        console.log(chalk.red('  Usage: pp kill <PID>'));
        process.exit(1);
      }
      const pid = parseInt(args[1]);
      const force = args.includes('--force') || args.includes('-f');
      console.log(chalk.yellow(`  Killing PID ${pid} (force: ${force})...`));
      const kr = await smartKill(pid, force);
      if (kr.success) {
        console.log(chalk.green(`  ✅ Killed (${kr.method})`));
      } else {
        console.log(chalk.red('  ❌ Failed'));
      }
      break;

    case 'sniff':
    case 'sniffer':
      if (!args[1]) {
        console.log(chalk.red('  Usage: pp sniff <PORT>'));
        process.exit(1);
      }
      startSniffer(parseInt(args[1]));
      break;

    case 'tunnel':
    case 'share':
    case 'expose':
      if (!args[1]) {
        console.log(chalk.red('  Usage: pp tunnel <PORT>'));
        process.exit(1);
      }
      await startTunnel(parseInt(args[1]));
      break;

    case 'audit':
    case 'env':
      auditEnvironment(process.cwd());
      break;

    case 'scan':
    case 'scan-all':
      printHeader();
      console.log(chalk.cyan('  Full port scan:\n'));
      const all = await scanPorts();
      console.log(JSON.stringify(all, null, 2));
      break;

    case 'help':
    case '--help':
    case '-h':
      printHeader();
      console.log(`
  ${chalk.cyan('Commands:')}
    ${chalk.green('pp')}               Interactive menu (default)
    ${chalk.green('pp launch')}         Smart workspace launcher
    ${chalk.green('pp list')}          List all listening ports
    ${chalk.green('pp kill <PID>')}    Kill a process by PID
    ${chalk.green('pp kill <PID> -f')} Force kill (SIGKILL + tree)
    ${chalk.green('pp sniff <PORT>')}  Start HTTP traffic sniffer
    ${chalk.green('pp tunnel <PORT>')} Generate public shareable URL
    ${chalk.green('pp audit')}         Audit .env and security
    ${chalk.green('pp scan')}          JSON output of all ports
    ${chalk.green('pp help')}          Show this help
      `);
      break;

    default:
      await main();
      break;
  }
}

process.on('uncaughtException', (err) => {
  if (err.message && err.message.includes('read')) return;
  console.error(chalk.red(`\nError: ${err.message}`));
  process.exit(1);
});

cli().catch(err => {
  console.error(chalk.red(`Fatal: ${err.message}`));
  process.exit(1);
});
