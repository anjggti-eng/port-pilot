const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const dotenv = require('dotenv');

const SENSITIVE_KEYS = [
  'SECRET', 'PASSWORD', 'TOKEN', 'API_KEY', 'PRIVATE_KEY',
  'AWS_SECRET', 'STRIPE_SECRET', 'GITHUB_TOKEN', 'NPM_TOKEN',
  'DATABASE_URL', 'REDIS_URL', 'MONGO_URI'
];

const COMMON_KEYS = [
  'NODE_ENV', 'PORT', 'HOST', 'DATABASE_URL', 'REDIS_URL',
  'JWT_SECRET', 'API_KEY', 'API_SECRET', 'ACCESS_TOKEN',
  'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS',
  'AWS_ACCESS_KEY', 'AWS_SECRET_KEY', 'AWS_REGION',
  'STRIPE_SECRET', 'STRIPE_PUBLISHABLE',
  'GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET'
];

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const keys = [];
  const comments = [];
  let emptyCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === '') {
      emptyCount++;
      continue;
    }
    if (trimmed.startsWith('#')) {
      comments.push(trimmed);
      continue;
    }
    if (trimmed.includes('=')) {
      const key = trimmed.split('=')[0].trim();
      const value = trimmed.split('=').slice(1).join('=').trim();
      keys.push({ key, hasValue: value.length > 0, isQuoted: value.startsWith('"') || value.startsWith("'") });
    }
  }

  return { keys, comments, emptyCount, totalLines: lines.length };
}

function checkGitignoreProtection(dir) {
  const gitignorePath = path.join(dir, '.gitignore');
  const envPath = path.join(dir, '.env');

  if (!fs.existsSync(envPath)) {
    return { protected: false, reason: 'no-env-file' };
  }

  if (!fs.existsSync(gitignorePath)) {
    return { protected: false, reason: 'no-gitignore' };
  }

  const content = fs.readFileSync(gitignorePath, 'utf8');
  const lines = content.split('\n').map(l => l.trim());

  const isProtected = lines.some(line => {
    if (line === '.env') return true;
    if (line === '*.env') return true;
    if (line === '.env*') return true;
    if (line === '/.env') return true;
    return false;
  });

  return {
    protected: isProtected,
    reason: isProtected ? 'protected' : 'exposed'
  };
}

function findSensitiveKeys(keys) {
  return keys.filter(({ key }) => {
    const upperKey = key.toUpperCase();
    return SENSITIVE_KEYS.some(sensitive => upperKey.includes(sensitive));
  });
}

function findMissingCommonKeys(envKeys, exampleKeys) {
  const envKeyNames = envKeys.map(k => k.key.toUpperCase());
  return COMMON_KEYS.filter(common => {
    const upperCommon = common.toUpperCase();
    const inEnv = envKeyNames.includes(upperCommon);
    const inExample = exampleKeys.some(ek => ek.key.toUpperCase() === upperCommon);
    return inExample && !inEnv;
  });
}

function checkWeakValues(keys) {
  const weak = [];
  const weakPatterns = [
    /^(password|secret|token|key)$/i,
    /^(test|dev|local|example)$/i,
    /^(123|abc|password)$/i,
    /^$/i
  ];

  for (const { key, hasValue } of keys) {
    if (!hasValue) {
      weak.push({ key, issue: 'empty value' });
    }
  }

  return weak;
}

function auditEnvironment(dir) {
  console.clear();
  console.log(chalk.bgYellow.black.bold(`
  ╔══════════════════════════════════════════════════════════════╗
  ║          🛡️  PORT-PILOT ENVIRONMENT AUDITOR v1.0            ║
  ╚══════════════════════════════════════════════════════════════╝
  `));

  const envPath = path.join(dir, '.env');
  const envExamplePath = path.join(dir, '.env.example');
  const envLocalPath = path.join(dir, '.env.local');

  let issues = 0;
  let warnings = 0;

  console.log(chalk.cyan('  1. Git Protection Check'));
  console.log(chalk.gray('  ' + '─'.repeat(50)));

  const protection = checkGitignoreProtection(dir);
  if (protection.reason === 'no-env-file') {
    console.log(chalk.dim('  No .env file found in this directory'));
  } else if (protection.reason === 'no-gitignore') {
    console.log(chalk.red('  🚨 CRITICAL: No .gitignore found!'));
    console.log(chalk.red('     Your .env file could be committed to git.'));
    issues++;
  } else if (protection.reason === 'exposed') {
    console.log(chalk.red('  🚨 CRITICAL: .env is NOT in .gitignore!'));
    console.log(chalk.red('     Your secrets could be exposed in version control.'));
    issues++;
  } else {
    console.log(chalk.green('  ✅ .env is protected in .gitignore'));
  }

  console.log();
  console.log(chalk.cyan('  2. Environment File Analysis'));
  console.log(chalk.gray('  ' + '─'.repeat(50)));

  if (!fs.existsSync(envPath)) {
    console.log(chalk.yellow('  ⚠️  No .env file found'));
    if (fs.existsSync(envExamplePath)) {
      console.log(chalk.dim('     .env.example exists - copy it to create .env'));
    }
    return { issues, warnings };
  }

  const envData = parseEnvFile(envPath);
  console.log(chalk.green(`  ✅ .env found (${envData.keys.length} variables, ${envData.totalLines} lines)`));

  const sensitiveKeys = findSensitiveKeys(envData.keys);
  if (sensitiveKeys.length > 0) {
    console.log(chalk.yellow(`\n  ⚠️  Sensitive keys detected (${sensitiveKeys.length}):`));
    sensitiveKeys.forEach(({ key }) => {
      console.log(chalk.dim(`     • ${key}`));
    });
    warnings++;
  }

  const weakKeys = checkWeakValues(envData.keys);
  if (weakKeys.length > 0) {
    console.log(chalk.red(`\n  🚨 Weak/empty values (${weakKeys.length}):`));
    weakKeys.forEach(({ key, issue }) => {
      console.log(chalk.red(`     • ${key}: ${issue}`));
    });
    issues++;
  }

  if (fs.existsSync(envExamplePath)) {
    console.log();
    console.log(chalk.cyan('  3. Sync Check (.env vs .env.example)'));
    console.log(chalk.gray('  ' + '─'.repeat(50)));

    const exampleData = parseEnvFile(envExamplePath);
    const envKeyNames = envData.keys.map(k => k.key.toUpperCase());
    const exampleKeyNames = exampleData.keys.map(k => k.key.toUpperCase());

    const missingInEnv = exampleData.keys.filter(k => !envKeyNames.includes(k.key.toUpperCase()));
    const extraInEnv = envData.keys.filter(k => !exampleKeyNames.includes(k.key.toUpperCase()));

    if (missingInEnv.length === 0 && extraInEnv.length === 0) {
      console.log(chalk.green('  ✅ Perfect sync with .env.example'));
    } else {
      if (missingInEnv.length > 0) {
        console.log(chalk.red(`\n  Missing in .env (${missingInEnv.length}):`));
        missingInEnv.forEach(({ key }) => {
          console.log(chalk.red(`     - ${key}`));
        });
        issues++;
      }
      if (extraInEnv.length > 0) {
        console.log(chalk.yellow(`\n  Extra in .env (${extraInEnv.length}):`));
        extraInEnv.forEach(({ key }) => {
          console.log(chalk.yellow(`     + ${key}`));
        });
        warnings++;
      }
    }
  }

  console.log();
  console.log(chalk.cyan('  4. Common Variables Check'));
  console.log(chalk.gray('  ' + '─'.repeat(50)));

  const envKeyUpper = envData.keys.map(k => k.key.toUpperCase());
  const presentCommon = COMMON_KEYS.filter(k => envKeyUpper.includes(k.toUpperCase()));
  const missingCommon = COMMON_KEYS.filter(k => !envKeyUpper.includes(k.toUpperCase()));

  console.log(chalk.green(`  Found: ${presentCommon.length}/${COMMON_KEYS.length} common variables`));
  if (missingCommon.length > 0 && missingCommon.length <= 5) {
    console.log(chalk.dim(`  Consider adding: ${missingCommon.slice(0, 5).join(', ')}`));
  }

  console.log();
  console.log(chalk.gray('  ' + '═'.repeat(50)));
  if (issues === 0 && warnings === 0) {
    console.log(chalk.bgGreen.black.bold('  ENVIRONMENT STATUS: HEALTHY  '));
  } else if (issues === 0) {
    console.log(chalk.bgYellow.black.bold(`  ENVIRONMENT STATUS: ${warnings} WARNING(S)  `));
  } else {
    console.log(chalk.bgRed.white.bold(`  ENVIRONMENT STATUS: ${issues} ISSUE(S), ${warnings} WARNING(S)  `));
  }
  console.log();

  return { issues, warnings };
}

module.exports = { auditEnvironment, parseEnvFile, checkGitignoreProtection };
