#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const os = require('os');
const path = require('path');

function getPlatform() {
  return os.platform();
}

function execWithTimeout(cmd, timeout = 8000) {
  try {
    return execSync(cmd, {
      encoding: 'utf-8',
      windowsHide: true,
      timeout
    });
  } catch {
    return '';
  }
}

const SYSTEM_PROCESSES = new Set([
  'system', 'svchost.exe', 'lsass.exe', 'services.exe', 'wininit.exe',
  'csrss.exe', 'smss.exe', 'winlogon.exe', 'dwm.exe', 'conhost.exe',
  'spoolsv.exe', 'SearchIndexer.exe', 'RuntimeBroker.exe', 'taskhostw.exe',
  'dllhost.exe', 'sihost.exe', 'fontdrvhost.exe', 'Memory Compression'
]);

function parseWindowsNetstat() {
  const output = execWithTimeout('netstat -ano -p TCP');
  if (!output) return [];

  const lines = output.split('\n');
  const services = [];
  const seenPorts = new Set();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('TCP')) continue;

    const parts = trimmed.split(/\s+/);
    if (parts.length < 5) continue;

    const [proto, localAddr, foreignAddr, state, pid] = parts;
    if (state !== 'LISTENING') continue;

    const portMatch = localAddr.match(/:(\d+)$/);
    if (!portMatch) continue;

    const port = parseInt(portMatch[1]);
    if (port < 1024 || seenPorts.has(port)) continue;

    seenPorts.add(port);
    services.push({
      port,
      pid: parseInt(pid),
      protocol: proto,
      localAddress: localAddr,
      foreignAddress: foreignAddr,
      state,
      platform: 'win32'
    });
  }

  return services;
}

function parseWindowsProcessInfo(pid) {
  const output = execWithTimeout(
    `tasklist /FI "PID eq ${pid}" /FO CSV /NH 2>nul`,
    3000
  );
  if (!output || !output.trim()) return null;

  const parts = output.trim().split(',');
  if (parts.length < 5) return null;

  const name = parts[0]?.replace(/"/g, '');

  return {
    Name: name,
    ExecutablePath: '',
    CommandLine: '',
    CreationDate: '',
    MemoryKB: 0
  };
}

function parseLinuxSs() {
  const output = execWithTimeout('ss -tlnp');
  if (!output) return [];

  const lines = output.split('\n');
  const services = [];
  const seenPorts = new Set();

  for (const line of lines) {
    if (!line.includes('LISTEN')) continue;

    const parts = line.trim().split(/\s+/);
    if (parts.length < 5) continue;

    const localAddr = parts[3];
    const portMatch = localAddr.match(/:(\d+)$/);
    if (!portMatch) continue;

    const port = parseInt(portMatch[1]);
    if (port < 1024 || seenPorts.has(port)) continue;

    const pidMatch = line.match(/pid=(\d+)/);
    const pid = pidMatch ? parseInt(pidMatch[1]) : 0;

    seenPorts.add(port);
    services.push({
      port,
      pid,
      protocol: 'TCP',
      localAddress: localAddr,
      state: 'LISTEN',
      platform: 'linux'
    });
  }

  return services;
}

function parseLinuxLsof() {
  const output = execWithTimeout('lsof -iTCP -sTCP:LISTEN -P -n 2>/dev/null || true');
  if (!output) return [];

  const lines = output.split('\n').slice(1);
  const services = [];
  const seenPorts = new Set();

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 9) continue;

    const [command, pid, user, fd, type, device, size, protocol, name] = parts;
    const portMatch = name.match(/:(\d+)$/);
    if (!portMatch) continue;

    const port = parseInt(portMatch[1]);
    if (port < 1024 || seenPorts.has(port)) continue;

    seenPorts.add(port);
    services.push({
      port,
      pid: parseInt(pid),
      command,
      user,
      protocol: 'TCP',
      localAddress: name,
      state: 'LISTEN',
      platform: 'linux'
    });
  }

  return services;
}

function parseMacOsLsof() {
  const output = execWithTimeout('lsof -iTCP -sTCP:LISTEN -P -n 2>/dev/null || true');
  if (!output) return [];

  const lines = output.split('\n').slice(1);
  const services = [];
  const seenPorts = new Set();

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 9) continue;

    const [command, pid, user, fd, type, device, size, protocol, name] = parts;
    const portMatch = name.match(/:(\d+)$/);
    if (!portMatch) continue;

    const port = parseInt(portMatch[1]);
    if (port < 1024 || seenPorts.has(port)) continue;

    seenPorts.add(port);
    services.push({
      port,
      pid: parseInt(pid),
      command,
      user,
      protocol: 'TCP',
      localAddress: name,
      state: 'LISTEN',
      platform: 'darwin'
    });
  }

  return services;
}

async function getProcessDetails(pid, platform) {
  try {
    if (platform === 'win32') {
      const info = parseWindowsProcessInfo(pid);
      if (!info) return { name: 'unknown', path: '', command: '', cwd: '', uptime: '', isSystem: false };

      const name = info.Name || 'unknown';
      const isSystem = SYSTEM_PROCESSES.has(name.toLowerCase());
      const cwd = info.ExecutablePath ? path.dirname(info.ExecutablePath) : '';

      return {
        name,
        path: info.ExecutablePath || '',
        command: info.CommandLine || '',
        cwd,
        uptime: info.CreationDate || '',
        isSystem,
        memoryMB: 0
      };
    } else {
      const output = execWithTimeout(`ps -p ${pid} -o comm=,args=,etime= 2>/dev/null || true`);
      if (!output) return { name: 'unknown', path: '', command: '', cwd: '', uptime: '', isSystem: false };

      const trimmed = output.trim();
      const parts = trimmed.split(/\s+/);
      const name = parts[0] || 'unknown';
      const rest = trimmed.substring(name.length).trim();

      let cwd = '';
      try {
        cwd = execWithTimeout(
          `lsof -p ${pid} -d cwd 2>/dev/null | tail -1 | awk '{print $NF}'`
        ).trim();
      } catch {}

      return {
        name: path.basename(name),
        path: '',
        command: rest,
        cwd,
        uptime: '',
        isSystem: false,
        memoryMB: 0
      };
    }
  } catch {
    return { name: 'unknown', path: '', command: '', cwd: '', uptime: '', isSystem: false, memoryMB: 0 };
  }
}

function formatUptime(seconds) {
  if (!seconds || isNaN(seconds)) return 'N/A';
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

async function scanPorts() {
  const platform = getPlatform();
  let services;

  switch (platform) {
    case 'win32':
      services = parseWindowsNetstat();
      break;
    case 'linux':
      services = parseLinuxSs();
      if (services.length === 0) {
        services = parseLinuxLsof();
      }
      break;
    case 'darwin':
      services = parseMacOsLsof();
      break;
    default:
      services = [];
  }

  if (platform === 'win32') {
    const pidNameMap = {};
    try {
      const tasklistOutput = execWithTimeout('tasklist /FO CSV /NH 2>nul', 5000);
      if (tasklistOutput) {
        for (const line of tasklistOutput.split('\n')) {
          const parts = line.trim().split(',');
          if (parts.length >= 2) {
            const name = parts[0]?.replace(/"/g, '');
            const pid = parseInt(parts[1]?.replace(/"/g, ''));
            if (name && pid) pidNameMap[pid] = name;
          }
        }
      }
    } catch {}

    return services.map(svc => {
      const processName = pidNameMap[svc.pid] || 'unknown';
      const isSystem = SYSTEM_PROCESSES.has(processName.toLowerCase());
      return {
        ...svc,
        processName,
        processPath: '',
        processCommand: '',
        cwd: '',
        uptime: '',
        memoryMB: 0,
        isSystem
      };
    }).filter(svc => !svc.isSystem);
  }

  const enriched = [];
  for (const svc of services) {
    const details = await getProcessDetails(svc.pid, platform);
    if (details.isSystem) continue;

    enriched.push({
      ...svc,
      processName: details.name || svc.command || 'unknown',
      processPath: details.path,
      processCommand: details.command,
      cwd: details.cwd,
      uptime: details.uptime,
      memoryMB: details.memoryMB || 0
    });
  }

  return enriched;
}

module.exports = {
  scanPorts,
  getProcessDetails,
  formatUptime
};
