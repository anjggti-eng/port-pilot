const { spawn, execSync } = require('child_process');
const os = require('os');
const chalk = require('chalk');

function streamProcessLogs(pid, processName) {
  const platform = os.platform();

  console.log(chalk.cyan(`\n--- Logs for PID ${pid} (${processName}) | Press Ctrl+C to stop ---\n`));

  if (platform === 'win32') {
    try {
      const proc = spawn('powershell.exe', [
        '-Command',
        `Get-Process -Id ${pid} | Select-Object -First 1`
      ], { stdio: ['ignore', 'pipe', 'pipe'] });

      proc.stdout.on('data', (data) => {
        process.stdout.write(chalk.gray(data.toString()));
      });

      const fallback = spawn('tail', ['-f', '/dev/null'], { stdio: ['ignore', 'pipe', 'pipe'] });

      const pollInterval = setInterval(() => {
        try {
          const output = execSync(
            `powershell -Command "(Get-Process -Id ${pid}).WorkingSet64" 2>nul`,
            { encoding: 'utf-8', windowsHide: true }
          );
          process.stdout.write(chalk.dim(`\r[${processName}] PID:${pid} | Memory: ${(parseInt(output) / 1024 / 1024).toFixed(1)}MB\r`));
        } catch {
          clearInterval(pollInterval);
          console.log(chalk.red(`\nProcess ${pid} seems to have exited.`));
          process.exit(0);
        }
      }, 3000);

      process.on('SIGINT', () => {
        clearInterval(pollInterval);
        fallback.kill();
        console.log(chalk.yellow('\nStopped log streaming.'));
        process.exit(0);
      });

    } catch (err) {
      console.log(chalk.red(`Cannot stream logs for PID ${pid} on Windows: ${err.message}`));
    }
  } else {
    try {
      const proc = spawn('tail', [
        '-f',
        `/proc/${pid}/fd/1`,
        `/proc/${pid}/fd/2`
      ], {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false
      });

      proc.stdout.on('data', (data) => {
        const lines = data.toString().split('\n').filter(Boolean);
        lines.forEach(line => {
          if (line.includes('ERROR') || line.includes('error')) {
            console.log(chalk.red(`  [${pid}] ${line}`));
          } else if (line.includes('WARN') || line.includes('warn')) {
            console.log(chalk.yellow(`  [${pid}] ${line}`));
          } else {
            console.log(chalk.gray(`  [${pid}] ${line}`));
          }
        });
      });

      proc.stderr.on('data', (data) => {
        console.log(chalk.red(`  [${pid}] ${data.toString()}`));
      });

      proc.on('error', () => {
        console.log(chalk.yellow('\nFalling back to /dev/null poll...'));
        const pollProc = spawn('sh', [
          '-c',
          `while true; do ls -la /proc/${pid}/fd 2>/dev/null || exit 1; sleep 2; done`
        ], { stdio: ['ignore', 'pipe', 'pipe'] });

        pollProc.stdout.on('data', (data) => {
          process.stdout.write(chalk.dim(`[${processName}] alive: ${data.toString().trim().split('\n').length} open FDs\r`));
        });

        process.on('SIGINT', () => {
          pollProc.kill();
          console.log(chalk.yellow('\nStopped log streaming.'));
          process.exit(0);
        });
      });

      proc.on('exit', () => {
        console.log(chalk.red(`\nProcess ${pid} exited.`));
        process.exit(0);
      });

      process.on('SIGINT', () => {
        proc.kill();
        console.log(chalk.yellow('\nStopped log streaming.'));
        process.exit(0);
      });

    } catch (err) {
      console.log(chalk.red(`Cannot stream logs: ${err.message}`));
    }
  }
}

function streamDockerLogs(containerName) {
  console.log(chalk.cyan(`\n--- Docker Logs: ${containerName} | Press Ctrl+C to stop ---\n`));

  const proc = spawn('docker', ['logs', '-f', '--tail', '100', containerName], {
    stdio: ['ignore', 'pipe', 'pipe']
  });

  proc.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(Boolean);
    lines.forEach(line => {
      console.log(chalk.gray(`  [docker] ${line}`));
    });
  });

  proc.stderr.on('data', (data) => {
    const lines = data.toString().split('\n').filter(Boolean);
    lines.forEach(line => {
      if (line.includes('ERROR') || line.includes('error')) {
        console.log(chalk.red(`  [docker] ${line}`));
      } else {
        console.log(chalk.yellow(`  [docker] ${line}`));
      }
    });
  });

  process.on('SIGINT', () => {
    proc.kill();
    console.log(chalk.yellow('\nStopped Docker log streaming.'));
    process.exit(0);
  });
}

module.exports = {
  streamProcessLogs,
  streamDockerLogs
};
