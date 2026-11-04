const config = require('../config');

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel = LEVELS[config.server.env === 'production' ? 'info' : 'debug'] || 0;

function ts() {
  return new Date().toISOString();
}

const logger = {
  debug: (...args) => { if (currentLevel <= 0) console.log(`\x1b[90m[${ts()}] [DEBUG]\x1b[0m`, ...args); },
  info: (...args) => { if (currentLevel <= 1) console.log(`\x1b[36m[${ts()}] [INFO]\x1b[0m`, ...args); },
  warn: (...args) => { if (currentLevel <= 2) console.warn(`\x1b[33m[${ts()}] [WARN]\x1b[0m`, ...args); },
  error: (...args) => { if (currentLevel <= 3) console.error(`\x1b[31m[${ts()}] [ERROR]\x1b[0m`, ...args); },
};

module.exports = logger;
