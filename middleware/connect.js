const fs = require("fs");
const path = require("path");

const LOG_FILE = path.join(__dirname, "call.json");

function loadLogs() {
  try {
    if (fs.existsSync(LOG_FILE)) {
      const data = fs.readFileSync(LOG_FILE, "utf8");
      return data.trim() ? JSON.parse(data) : { logs: {}, counter: 0 };
    }
  } catch (error) {
    console.error("Error loading logs:", error);
  }
  return { logs: {}, counter: 0 };
}

function saveLogs(logs) {
  try {
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error("Error saving logs:", error);
  }
}

function logEndpointHit(req, res, next) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  const endpoint = `${req.method} ${req.originalUrl || req.url}`;

  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  const consoleLogs = [];

  console.log = (...args) => {
    consoleLogs.push({
      type: "log",
      timestamp: new Date().toISOString(),
      message: args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg) : String(arg)
        )
        .join(" "),
    });
    originalConsoleLog.apply(console, args);
  };

  console.error = (...args) => {
    consoleLogs.push({
      type: "error",
      timestamp: new Date().toISOString(),
      message: args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg) : String(arg)
        )
        .join(" "),
    });
    originalConsoleError.apply(console, args);
  };

  console.warn = (...args) => {
    consoleLogs.push({
      type: "warn",
      timestamp: new Date().toISOString(),
      message: args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg) : String(arg)
        )
        .join(" "),
    });
    originalConsoleWarn.apply(console, args);
  };

  const originalEnd = res.end;
  res.end = function (...args) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;

    const logs = loadLogs();
    logs.counter += 1;
    logs.logs[logs.counter] = {
      timestamp,
      endpoint,
      method: req.method,
      url: req.originalUrl || req.url,
      headers: req.headers,
      query: req.query,
      body: req.body,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      consoleLogs,
    };

    saveLogs(logs);
    originalEnd.apply(res, args);
  };

  next();
}

module.exports = {
  logEndpointHit,
  loadLogs,
  saveLogs,
};
