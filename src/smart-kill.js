const { execSync, spawn } = require('child_process');
const os = require('os');
const kill = require('tree-kill');

async function getProcessChildren(pid) {
  const platform = os.platform();
  try {
    if (platform === 'win32') {
      const output = execSync(
        `wmic process where ParentProcessId=${pid} get ProcessId 2>nul`,
        { encoding: 'utf-8', windowsHide: true }
      );
      return output.split('\n')
        .map(l => parseInt(l.trim()))
        .filter(n => !isNaN(n));
    } else {
      const output = execSync(
        `pgrep -P ${pid} 2>/dev/null || true`,
        { encoding: 'utf-8', windowsHide: true }
      );
      return output.split('\n')
        .map(l => parseInt(l.trim()))
        .filter(n => !isNaN(n));
    }
  } catch {
    return [];
  }
}

async function smartKill(pid, force = false) {
  return new Promise((resolve) => {
    if (force) {
      try {
        kill(pid, 'SIGKILL', (err) => {
          if (err) {
            try {
              if (os.platform() === 'win32') {
                execSync(`taskkill /F /PID ${pid} /T 2>nul`, { windowsHide: true });
              } else {
                execSync(`kill -9 ${pid} 2>/dev/null || true`, { windowsHide: true });
              }
              resolve({ success: true, method: 'force' });
            } catch {
              resolve({ success: false, method: 'force' });
            }
          } else {
            resolve({ success: true, method: 'tree-kill' });
          }
        });
      } catch {
        resolve({ success: false, method: 'error' });
      }
    } else {
      kill(pid, 'SIGTERM', (err) => {
        if (err) {
          resolve({ success: false, method: 'graceful' });
        } else {
          setTimeout(() => {
            isProcessRunning(pid).then(running => {
              if (running) {
                kill(pid, 'SIGKILL', () => {
                  resolve({ success: true, method: 'escalated' });
                });
              } else {
                resolve({ success: true, method: 'graceful' });
              }
            });
          }, 2000);
        }
      });
    }
  });
}

async function isProcessRunning(pid) {
  const platform = os.platform();
  try {
    if (platform === 'win32') {
      execSync(`tasklist /FI "PID eq ${pid}" 2>nul | findstr "${pid}"`, {
        encoding: 'utf-8',
        windowsHide: true
      });
      return true;
    } else {
      execSync(`kill -0 ${pid} 2>/dev/null`, {
        windowsHide: true
      });
      return true;
    }
  } catch {
    return false;
  }
}

async function getProcessInfo(pid) {
  const platform = os.platform();
  try {
    if (platform === 'win32') {
      const output = execSync(
        `tasklist /FI "PID eq ${pid}" /FO CSV /NH 2>nul`,
        { encoding: 'utf-8', windowsHide: true }
      );
      const parts = output.split(',');
      return {
        name: parts[0]?.replace(/"/g, ''),
        pid,
        memory: parts[4]?.replace(/"/g, ''),
        cpu: parts[3]?.replace(/"/g, '')
      };
    } else {
      const output = execSync(
        `ps -p ${pid} -o comm=,%cpu=,%mem=,etime= 2>/dev/null`,
        { encoding: 'utf-8', windowsHide: true }
      ).trim().split(/\s+/);
      return {
        name: output[0],
        pid,
        cpu: output[1],
        mem: output[2],
        uptime: output[3]
      };
    }
  } catch {
    return { name: 'unknown', pid };
  }
}

module.exports = {
  smartKill,
  isProcessRunning,
  getProcessInfo,
  getProcessChildren
};
