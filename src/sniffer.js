const http = require('http');
const httpProxy = require('http-proxy');
const chalk = require('chalk');
const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

function formatSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

function formatDuration(ms) {
  if (ms < 1000) return ms + 'ms';
  return (ms / 1000).toFixed(2) + 's';
}

function colorMethod(method) {
  const colors = {
    GET: chalk.bgGreen.black.bold,
    POST: chalk.bgYellow.black.bold,
    PUT: chalk.bgBlue.white.bold,
    PATCH: chalk.bgMagenta.white.bold,
    DELETE: chalk.bgRed.white.bold,
    OPTIONS: chalk.bgCyan.black.bold,
    HEAD: chalk.bgCyan.black.bold
  };
  return (colors[method] || chalk.bgWhite.black.bold)(` ${method} `);
}

function colorStatus(code) {
  if (code >= 200 && code < 300) return chalk.green.bold(code);
  if (code >= 300 && code < 400) return chalk.yellow.bold(code);
  if (code >= 400 && code < 500) return chalk.red.bold(code);
  if (code >= 500) return chalk.bgRed.white.bold(code);
  return chalk.white.bold(code);
}

function printSnifferBanner(targetPort, proxyPort) {
  const localIP = getLocalIP();
  console.clear();
  console.log(chalk.bgMagenta.black.bold(`
  ╔══════════════════════════════════════════════════════════════╗
  ║           🕵️  PORT-PILOT HTTP SNIFFER v1.0                  ║
  ╚══════════════════════════════════════════════════════════════╝
  `));
  console.log(`  ${chalk.cyan('Target:')}   ${chalk.green.bold('http://localhost:' + targetPort)}`);
  console.log(`  ${chalk.cyan('Sniffer:')}  ${chalk.yellow.bold('http://localhost:' + proxyPort)}`);
  console.log(`  ${chalk.cyan('Network:')}  ${chalk.white('http://' + localIP + ':' + proxyPort)}`);
  console.log(`  ${chalk.cyan('Status:')}   ${chalk.green.bold('ACTIVE')} ${chalk.dim('(intercepting all HTTP traffic)')}`);
  console.log(chalk.gray('\n  ' + '─'.repeat(62)));
  console.log(chalk.dim('  Point your browser/Postman/curl to the Sniffer URL above'));
  console.log(chalk.dim('  Press CTRL+C to stop\n'));
  console.log(chalk.gray('  ' + '─'.repeat(62) + '\n'));
}

function startSniffer(targetPort) {
  const proxyPort = parseInt(targetPort) + 1000;
  const proxy = httpProxy.createProxyServer({});
  let requestCount = 0;
  let totalBytes = 0;
  const startTime = Date.now();

  printSnifferBanner(targetPort, proxyPort);

  const server = http.createServer((req, res) => {
    requestCount++;
    const reqId = requestCount;
    const timestamp = new Date().toLocaleTimeString();
    const reqStart = Date.now();

    let bodyChunks = [];
    req.on('data', chunk => bodyChunks.push(chunk));
    req.on('end', () => {
      const body = Buffer.concat(bodyChunks);
      totalBytes += body.length;

      console.log(
        chalk.gray(`  [${timestamp}] `) +
        chalk.gray(`#${reqId} `) +
        colorMethod(req.method) +
        ` ${chalk.white.bold(req.url)}`
      );

      if (req.headers['host']) {
        console.log(`    ${chalk.dim('Host:')} ${chalk.white(req.headers['host'])}`);
      }

      if (req.headers['authorization']) {
        const auth = req.headers['authorization'];
        const preview = auth.length > 40 ? auth.substring(0, 40) + '...' : auth;
        console.log(`    ${chalk.red('Auth:')} ${chalk.yellow(preview)}`);
      }

      if (req.headers['content-type']) {
        console.log(`    ${chalk.dim('Content-Type:')} ${chalk.white(req.headers['content-type'])}`);
      }

      if (body.length > 0 && body.length < 2048) {
        try {
          const parsed = JSON.parse(body.toString());
          const preview = JSON.stringify(parsed, null, 2);
          const lines = preview.split('\n').slice(0, 8);
          console.log(`    ${chalk.dim('Body:')} ${chalk.cyan(formatSize(body.length))}`);
          lines.forEach(line => console.log(`      ${chalk.gray(line)}`));
          if (preview.split('\n').length > 8) {
            console.log(`      ${chalk.dim('... (' + (preview.split('\n').length - 8) + ' more lines)')}`);
          }
        } catch {
          console.log(`    ${chalk.dim('Body:')} ${chalk.cyan(formatSize(body.length))} ${chalk.gray(body.toString().substring(0, 80))}`);
        }
      } else if (body.length > 0) {
        console.log(`    ${chalk.dim('Body:')} ${chalk.cyan(formatSize(body.length))}`);
      }

      proxy.web(req, res, { target: `http://localhost:${targetPort}` }, (err) => {
        const duration = Date.now() - reqStart;
        if (err) {
          console.log(`    ${chalk.red('ERROR:')} ${err.message}`);
          console.log();
        } else {
          console.log(`    ${chalk.dim('->')} ${chalk.green('Forwarded')} ${chalk.dim('in ' + formatDuration(duration))}`);
          console.log();
        }
      });

      res.on('finish', () => {
        const duration = Date.now() - reqStart;
        const statusLine =
          chalk.gray(`  [${timestamp}] `) +
          chalk.gray(`#${reqId} `) +
          colorMethod(req.method) +
          ` ${chalk.white(req.url)} ` +
          `${chalk.dim('->')} ` +
          colorStatus(res.statusCode) +
          chalk.dim(` ${formatDuration(duration)}`);

        process.stdout.write('\x1B[A');
        process.stdout.write('\x1B[2K');
        console.log(statusLine);
      });
    });
  });

  server.listen(proxyPort, () => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    const statsInterval = setInterval(() => {
      const mins = Math.floor((Date.now() - startTime) / 60000);
      const secs = Math.floor(((Date.now() - startTime) % 60000) / 1000);
      process.stdout.write(
        `\r${chalk.gray('  ')}${chalk.dim('Stats: ')}${chalk.cyan(requestCount + ' reqs')} ${chalk.dim('|')} ${chalk.cyan(formatSize(totalBytes))} ${chalk.dim('|')} ${chalk.dim('Uptime: ' + mins + 'm ' + secs + 's')}${' '.repeat(20)}`
      );
    }, 1000);

    process.on('SIGINT', () => {
      clearInterval(statsInterval);
      console.log('\n');
      console.log(chalk.bgMagenta.black.bold('  SNIFFER STOPPED  '));
      console.log(`\n  ${chalk.dim('Summary:')}`);
      console.log(`    ${chalk.cyan('Requests:')} ${chalk.white.bold(requestCount)}`);
      console.log(`    ${chalk.cyan('Total:')}    ${chalk.white.bold(formatSize(totalBytes))}`);
      console.log(`    ${chalk.cyan('Duration:')} ${chalk.white.bold(formatDuration(Date.now() - startTime))}`);
      console.log();
      process.exit(0);
    });
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(chalk.red(`\n  Port ${proxyPort} is already in use. Trying ${proxyPort + 1}...`));
      server.listen(proxyPort + 1);
    } else {
      console.log(chalk.red(`\n  Sniffer error: ${err.message}`));
      process.exit(1);
    }
  });

  return server;
}

module.exports = { startSniffer };
