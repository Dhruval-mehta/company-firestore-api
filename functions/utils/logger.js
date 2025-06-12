const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...(data && { data })
    };
    
    return JSON.stringify(logEntry);
  }

  writeToFile(level, formattedMessage) {
    const today = new Date().toISOString().split('T')[0];
    const logFile = path.join(this.logDir, `${today}.log`);
    const errorLogFile = path.join(this.logDir, `error-${today}.log`);
    
    // Write to general log file
    fs.appendFileSync(logFile, formattedMessage + '\n');
    
    // Write errors to separate error log file
    if (level === 'error') {
      fs.appendFileSync(errorLogFile, formattedMessage + '\n');
    }
  }

  log(level, message, data = null) {
    const formattedMessage = this.formatMessage(level, message, data);
    
    // Console output with colors
    const colors = {
      info: '\x1b[36m',    // Cyan
      warn: '\x1b[33m',    // Yellow
      error: '\x1b[31m',   // Red
      debug: '\x1b[35m',   // Magenta
      success: '\x1b[32m', // Green
      reset: '\x1b[0m'     // Reset
    };
    
    const color = colors[level] || colors.reset;
    console.log(`${color}${formattedMessage}${colors.reset}`);
    
    // Write to file in production or if LOG_TO_FILE is true
    if (process.env.NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'true') {
      this.writeToFile(level, formattedMessage);
    }
  }

  info(message, data = null) {
    this.log('info', message, data);
  }

  warn(message, data = null) {
    this.log('warn', message, data);
  }

  error(message, data = null) {
    this.log('error', message, data);
  }

  debug(message, data = null) {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
      this.log('debug', message, data);
    }
  }

  success(message, data = null) {
    this.log('success', message, data);
  }

  // HTTP request logging
  logRequest(req, res, next) {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const logData = {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      };
      
      if (res.statusCode >= 400) {
        this.warn('HTTP Request Failed', logData);
      } else {
        this.info('HTTP Request', logData);
      }
    });
    
    if (next) next();
  }

  // Clean old log files (keep last 30 days)
  cleanOldLogs() {
    try {
      const files = fs.readdirSync(this.logDir);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      files.forEach(file => {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < thirtyDaysAgo) {
          fs.unlinkSync(filePath);
          this.info(`Cleaned old log file: ${file}`);
        }
      });
    } catch (error) {
      this.error('Error cleaning old logs:', error);
    }
  }
}

// Create singleton instance
const logger = new Logger();

// Clean old logs on startup
logger.cleanOldLogs();

module.exports = logger;