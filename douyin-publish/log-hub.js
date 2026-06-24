/**
 * 日志采集与推送（供 GUI 日志面板使用）
 */
const fs = require('fs');
const path = require('path');
const { APP_ROOT } = require('./load-env');

const LOG_FILE = path.join(APP_ROOT, 'run_log.txt');
const MAX_BUFFER = 2000;

/** @type {Array<{level: string, text: string, time: string}>} */
const buffer = [];
/** @type {Set<Function>} */
const subscribers = new Set();

let installed = false;
let _origLog;
let _origError;
let _origWarn;

function ts() {
  return new Date().toLocaleString('zh-CN');
}

function formatArgs(args) {
  return args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
}

function pushEntry(level, text) {
  const entry = { level, text, time: ts() };
  buffer.push(entry);
  if (buffer.length > MAX_BUFFER) buffer.shift();

  const line = `[${entry.time}]${level === 'error' ? ' [ERROR]' : level === 'warn' ? ' [WARN]' : ''} ${text}\n`;
  try {
    fs.appendFileSync(LOG_FILE, line);
  } catch { /* ignore */ }

  for (const fn of subscribers) {
    try { fn(entry); } catch { /* ignore */ }
  }
}

function installLogCapture() {
  if (installed) return;
  installed = true;

  _origLog = console.log;
  _origError = console.error;
  _origWarn = console.warn;

  console.log = (...args) => {
    _origLog(...args);
    pushEntry('info', formatArgs(args));
  };
  console.error = (...args) => {
    _origError(...args);
    pushEntry('error', formatArgs(args));
  };
  console.warn = (...args) => {
    _origWarn(...args);
    pushEntry('warn', formatArgs(args));
  };
}

function subscribe(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

function getRecent(limit = 500) {
  return buffer.slice(-limit);
}

function readLogFileTail(limit = 500) {
  try {
    if (!fs.existsSync(LOG_FILE)) return [];
    const content = fs.readFileSync(LOG_FILE, 'utf8');
    const lines = content.split('\n').filter(Boolean).slice(-limit);
    return lines.map(line => {
      const m = line.match(/^\[(.+?)\](?:\s\[(ERROR|WARN)\])?\s(.*)$/);
      if (!m) return { time: ts(), level: 'info', text: line };
      return {
        time: m[1],
        level: m[2] === 'ERROR' ? 'error' : m[2] === 'WARN' ? 'warn' : 'info',
        text: m[3],
      };
    });
  } catch {
    return [];
  }
}

module.exports = {
  LOG_FILE,
  installLogCapture,
  subscribe,
  getRecent,
  readLogFileTail,
  pushEntry,
};
