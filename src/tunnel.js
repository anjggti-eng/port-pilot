const localtunnel = require('localtunnel');
const chalk = require('chalk');
const os = require('os');
const inquirer = require('inquirer');

function printTunnelBanner() {
  console.clear();
  console.log(chalk.bgGreen.black.bold(`
  ╔══════════════════════════════════════════════════════════════╗
  ║          🚀 PORT-PILOT PUBLIC TUNNEL v1.0                   ║
  ╚══════════════════════════════════════════════════════════════╝
  `));
}

function getNetworkInfo() {
  const interfaces = os.networkInterfaces();
  const results = { local: '127.0.0.1', network: '', hostname: os.hostname() };
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        results.network = iface.address;
        break;
      }
    }
  }
  return results;
}

async function startTunnel(targetPort) {
  printTunnelBanner();

  const networkInfo = getNetworkInfo();

  console.log(chalk.gray('  Connecting to localtunnel servers...\n'));

  try {
    const subdomainInput = await inquirer.prompt([{
      type: 'input',
      name: 'subdomain',
      message: 'Custom subdomain (leave empty for random):',
      default: ''
    }]);

    const options = {
      port: parseInt(targetPort)
    };

    if (subdomainInput.subdomain.trim()) {
      options.subdomain = subdomainInput.subdomain.trim();
    }

    console.log(chalk.yellow('  Establishing tunnel connection...\n'));

    const tunnel = await localtunnel(options);

    printTunnelBanner();

    console.log(`  ${chalk.cyan('Status:')}    ${chalk.green.bold('ACTIVE')}`);
    console.log(`  ${chalk.cyan('Local:')}     ${chalk.white.bold('http://localhost:' + targetPort)}`);
    console.log(`  ${chalk.cyan('Network:')}   ${chalk.white('http://' + networkInfo.network + ':' + targetPort)}`);
    console.log();
    console.log(`  ${chalk.green.bold('PUBLIC URL:')} ${chalk.cyan.bold.underline(tunnel.url)}`);
    console.log();
    console.log(chalk.gray('  ' + '─'.repeat(62)));
    console.log(chalk.dim('  Share this link with:'));
    console.log(chalk.dim('    • Clients for demo/review'));
    console.log(chalk.dim('    • Mobile devices for testing'));
    console.log(chalk.dim('    • Webhook services (Stripe, WhatsApp, etc.)'));
    console.log(chalk.dim('    • External API integrations'));
    console.log(chalk.gray('  ' + '─'.repeat(62)));
    console.log(chalk.dim('\n  Press CTRL+C to close tunnel and protect your port.\n'));

    let requestCount = 0;
    const startTime = Date.now();

    tunnel.on('request', (evt) => {
      requestCount++;
      const timestamp = new Date().toLocaleTimeString();
      const method = evt.req ? evt.req.method : 'UNKNOWN';
      const url = evt.req ? evt.req.url : '/';

      console.log(
        chalk.gray(`  [${timestamp}] `) +
        chalk.bgGreen.black(` ${method} `) +
        ` ${chalk.white(url)}`
      );
    });

    tunnel.on('close', () => {
      const elapsed = Date.now() - startTime;
      const mins = Math.floor(elapsed / 60000);
      const secs = Math.floor((elapsed % 60000) / 1000);

      console.log('\n');
      console.log(chalk.bgYellow.black.bold('  TUNNEL CLOSED  '));
      console.log(`\n  ${chalk.dim('Summary:')}`);
      console.log(`    ${chalk.cyan('URL:')}          ${chalk.white(tunnel.url)}`);
      console.log(`    ${chalk.cyan('Requests:')}     ${chalk.white.bold(requestCount)}`);
      console.log(`    ${chalk.cyan('Duration:')}     ${chalk.white.bold(mins + 'm ' + secs + 's')}`);
      console.log();
      process.exit(0);
    });

    tunnel.on('error', (err) => {
      console.log(chalk.red(`\n  Tunnel error: ${err.message}`));
    });

    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n  Closing tunnel...'));
      tunnel.close();
    });

  } catch (err) {
    console.log(chalk.red(`\n  Failed to create tunnel: ${err.message}`));
    console.log(chalk.dim('  Tips:'));
    console.log(chalk.dim('    • Check your internet connection'));
    console.log(chalk.dim('    • Try a different subdomain'));
    console.log(chalk.dim('    • Wait a moment and try again'));
  }
}

module.exports = { startTunnel };
