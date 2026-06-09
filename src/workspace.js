const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');
const { scanPorts } = require('./port-scanner');
const { smartKill } = require('./smart-kill');

const DEV_PORTS = {
  3000: 'Node/React/Next.js',
  3001: 'Node Alt',
  3002: 'Node Alt',
  4000: 'Angular',
  4200: 'Angular CLI',
  5000: 'Flask/Docker',
  5173: 'Vite',
  5174: 'Vite Alt',
  8000: 'Python/Django',
  8080: 'HTTP Alt',
  8443: 'HTTPS',
  9000: 'PHP-FPM',
  9229: 'Node Debug'
};

function detectProjectType(dir) {
  const result = {
    type: 'unknown',
    name: path.basename(dir),
    scripts: {},
    hasDocker: false,
    hasEnv: false,
    hasEnvExample: false,
    port: null,
    framework: null
  };

  const pkgPath = path.join(dir, 'package.json');
  const dockerPath = path.join(dir, 'docker-compose.yml');
  const dockerPath2 = path.join(dir, 'docker-compose.yaml');
  const envPath = path.join(dir, '.env');
  const envExamplePath = path.join(dir, '.env.example');
  const requirementsPath = path.join(dir, 'requirements.txt');
  const pyProjectPath = path.join(dir, 'pyproject.toml');
  const goModPath = path.join(dir, 'go.mod');
  const cargoPath = path.join(dir, 'Cargo.toml');

  result.hasEnv = fs.existsSync(envPath);
  result.hasEnvExample = fs.existsSync(envExamplePath);
  result.hasDocker = fs.existsSync(dockerPath) || fs.existsSync(dockerPath2);

  if (fs.existsSync(pkgPath)) {
    result.type = 'node';
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      result.name = pkg.name || result.name;
      result.scripts = pkg.scripts || {};

      if (pkg.dependencies) {
        if (pkg.dependencies.next) result.framework = 'Next.js';
        else if (pkg.dependencies.react) result.framework = 'React';
        else if (pkg.dependencies.vue) result.framework = 'Vue.js';
        else if (pkg.dependencies.nuxt) result.framework = 'Nuxt.js';
        else if (pkg.dependencies.express) result.framework = 'Express';
        else if (pkg.dependencies.fastify) result.framework = 'Fastify';
        else if (pkg.dependencies.koa) result.framework = 'Koa';
      }

      if (pkg.devDependencies) {
        if (pkg.devDependencies.vite) result.framework = result.framework || 'Vite';
        if (pkg.devDependencies.webpack) result.framework = result.framework || 'Webpack';
        if (pkg.devDependencies['@angular/cli']) result.framework = 'Angular';
      }

      const devScript = pkg.scripts?.dev || pkg.scripts?.start;
      if (devScript) {
        const portMatch = devScript.match(/(?:--port|--port=|-p\s*)(\d+)/);
        if (portMatch) result.port = parseInt(portMatch[1]);
      }
    } catch {}
  } else if (fs.existsSync(dockerPath) || fs.existsSync(dockerPath2)) {
    result.type = 'docker';
    try {
      const composeFile = fs.existsSync(dockerPath) ? dockerPath : dockerPath2;
      const content = fs.readFileSync(composeFile, 'utf8');
      const portMatch = content.match(/(\d+):\d+/);
      if (portMatch) result.port = parseInt(portMatch[1]);
    } catch {}
  } else if (fs.existsSync(requirementsPath) || fs.existsSync(pyProjectPath)) {
    result.type = 'python';
  } else if (fs.existsSync(goModPath)) {
    result.type = 'go';
  } else if (fs.existsSync(cargoPath)) {
    result.type = 'rust';
  }

  if (!result.port) {
    for (const [port, label] of Object.entries(DEV_PORTS)) {
      if (result.framework?.includes(label.split('/')[0])) {
        result.port = parseInt(port);
        break;
      }
    }
  }

  if (!result.port) result.port = 3000;

  return result;
}

function printProjectInfo(project) {
  const typeIcons = {
    node: '📦',
    python: '🐍',
    docker: '🐳',
    go: '🔵',
    rust: '🦀',
    unknown: '📁'
  };

  console.log(chalk.cyan('\n  Project Detection Results:'));
  console.log(chalk.gray('  ' + '─'.repeat(50)));
  console.log(`  ${typeIcons[project.type] || '📁'} Type:      ${chalk.white.bold(project.type.toUpperCase())}`);
  console.log(`  📛 Name:      ${chalk.white.bold(project.name)}`);
  if (project.framework) {
    console.log(`  ⚡ Framework: ${chalk.green.bold(project.framework)}`);
  }
  console.log(`  🔌 Port:      ${chalk.yellow.bold(project.port)}`);
  console.log(`  🐳 Docker:    ${project.hasDocker ? chalk.green('Yes') : chalk.gray('No')}`);
  console.log(`  🔑 .env:      ${project.hasEnv ? chalk.green('Found') : chalk.red('Missing')}`);
  console.log(chalk.gray('  ' + '─'.repeat(50)));
}

async function cleanConflictingPorts(project) {
  try {
    const services = await scanPorts();
    const conflicts = services.filter(s => s.port === project.port);

    if (conflicts.length > 0) {
      console.log(chalk.yellow(`\n  ⚠️  Port ${project.port} is occupied by:`));
      conflicts.forEach(c => {
        console.log(chalk.red(`     → PID ${c.pid}: ${c.processName}`));
      });

      const { shouldKill } = await inquirer.prompt([{
        type: 'confirm',
        name: 'shouldKill',
        message: `Kill process on port ${project.port} before launching?`,
        default: true
      }]);

      if (shouldKill) {
        for (const conflict of conflicts) {
          console.log(chalk.yellow(`  Killing PID ${conflict.pid}...`));
          await smartKill(conflict.pid, true);
        }
        console.log(chalk.green('  ✅ Port cleared'));
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  } catch {}
}

async function launchDocker(dir) {
  const dockerPath = path.join(dir, 'docker-compose.yml');
  const dockerPath2 = path.join(dir, 'docker-compose.yaml');
  const composeFile = fs.existsSync(dockerPath) ? dockerPath : dockerPath2;

  if (!composeFile) return false;

  console.log(chalk.cyan('\n  🐳 Docker Compose detected. Starting containers...'));

  try {
    const output = execSync('docker-compose up -d 2>&1 || docker compose up -d 2>&1', {
      encoding: 'utf-8',
      cwd: dir,
      timeout: 60000
    });
    console.log(chalk.green('  ✅ Containers started successfully'));
    return true;
  } catch (err) {
    console.log(chalk.red('  ❌ Failed to start Docker containers'));
    console.log(chalk.dim('     Make sure Docker Desktop is running'));
    return false;
  }
}

async function launchProject(dir) {
  const project = detectProjectType(dir);
  printProjectInfo(project);

  await cleanConflictingPorts(project);

  if (project.hasDocker) {
    await launchDocker(dir);
  }

  if (project.type === 'node') {
    const devScript = project.scripts.dev ? 'dev' :
                      project.scripts.start ? 'start' : null;

    if (devScript) {
      console.log(chalk.green(`\n  🚀 Launching: npm run ${devScript}\n`));
      console.log(chalk.gray('  ' + '─'.repeat(50)));

      const child = spawn('npm', ['run', devScript], {
        stdio: 'inherit',
        cwd: dir,
        shell: true
      });

      child.on('error', (err) => {
        console.log(chalk.red(`\n  ❌ Launch failed: ${err.message}`));
      });

      child.on('close', (code) => {
        if (code !== 0) {
          console.log(chalk.yellow(`\n  Process exited with code: ${code}`));
        }
      });

      return true;
    } else {
      console.log(chalk.yellow('\n  ⚠️  No "dev" or "start" script found in package.json'));
      const availableScripts = Object.keys(project.scripts);
      if (availableScripts.length > 0) {
        console.log(chalk.dim(`  Available scripts: ${availableScripts.join(', ')}`));

        const { script } = await inquirer.prompt([{
          type: 'list',
          name: 'script',
          message: 'Select a script to run:',
          choices: availableScripts.map(s => ({
            name: `${s}: ${chalk.dim(project.scripts[s])}`,
            value: s
          }))
        }]);

        console.log(chalk.green(`\n  🚀 Launching: npm run ${script}\n`));
        const child = spawn('npm', ['run', script], {
          stdio: 'inherit',
          cwd: dir,
          shell: true
        });

        return true;
      }
    }
  }

  if (project.type === 'python') {
    const hasManagePy = fs.existsSync(path.join(dir, 'manage.py'));
    const hasAppPy = fs.existsSync(path.join(dir, 'app.py'));
    const hasMainPy = fs.existsSync(path.join(dir, 'main.py'));

    if (hasManagePy) {
      console.log(chalk.green('\n  🐍 Django detected. Launching...\n'));
      const child = spawn('python', ['manage.py', 'runserver'], {
        stdio: 'inherit',
        cwd: dir,
        shell: true
      });
      return true;
    } else if (hasAppPy || hasMainPy) {
      console.log(chalk.green('\n  🐍 Python app detected. Launching...\n'));
      const entryFile = hasAppPy ? 'app.py' : 'main.py';
      const child = spawn('python', [entryFile], {
        stdio: 'inherit',
        cwd: dir,
        shell: true
      });
      return true;
    }
  }

  if (project.type === 'docker') {
    console.log(chalk.dim('\n  Docker project launched via compose above.'));
    return false;
  }

  console.log(chalk.red('\n  ❌ Could not determine how to launch this project.'));
  return false;
}

module.exports = { launchProject, detectProjectType, printProjectInfo };
