//-----------------------------------------------------------------------------
// Types and Interfaces
//-----------------------------------------------------------------------------

/**
 * Valid log levels for the logger
 */
type LogLevel = 'log' | 'error' | 'info' | 'warn';

/**
 * Function signature for logging methods
 */
type LogFunction = (...args: any[]) => void;

//-----------------------------------------------------------------------------
// Configuration
//-----------------------------------------------------------------------------

/**
 * Determines if development logs should be shown
 * Enabled in development environment or if manually enabled via localStorage
 */
const isDev = process.env.NODE_ENV === 'development' || localStorage.getItem('enableDevLogs') === 'true';

//-----------------------------------------------------------------------------
// Helper Functions
//-----------------------------------------------------------------------------

/**
 * Creates a logging function for the specified log level
 *
 * @param level - The log level to create a function for
 * @returns A function that logs messages at the specified level
 */
const createLogFunction = (level: LogLevel): LogFunction => {
  return (...args: any[]) => {
    if (isDev) {
      const timestamp = new Date().toISOString();
      console[level](`[DEV ${level.toUpperCase()}] [${timestamp}]`, ...args);
    }
  };
};

//-----------------------------------------------------------------------------
// Logger Object
//-----------------------------------------------------------------------------

/**
 * Logger utility for consistent logging throughout the application
 * Only outputs logs in development mode or when manually enabled
 */
export const logger = {
  // Basic logging methods
  log: createLogFunction('log'),
  error: createLogFunction('error'),
  info: createLogFunction('info'),
  warn: createLogFunction('warn'),

  // API specific logging
  api: {
    /**
     * Logs an outgoing API request
     *
     * @param method - The HTTP method (GET, POST, etc.)
     * @param url - The request URL
     * @param body - Optional request body or metadata
     */
    request: (method: string, url: string, body?: any) => {
      logger.info(`API Request: ${method} ${url}`, body ? { body } : '');
    },

    /**
     * Logs a successful API response
     *
     * @param method - The HTTP method that was used
     * @param url - The request URL
     * @param data - Response data or metadata
     */
    response: (method: string, url: string, data: any) => {
      logger.info(`API Response: ${method} ${url}`, { data });
    },

    /**
     * Logs an API error
     *
     * @param method - The HTTP method that was used
     * @param url - The request URL
     * @param error - The error that occurred
     */
    error: (method: string, url: string, error: any) => {
      logger.error(`API Error: ${method} ${url}`, { error });
    },
  },

  // Development utilities
  /**
   * Enables development logs in any environment
   * Useful for debugging issues in production
   */
  enableDevLogs: () => {
    localStorage.setItem('enableDevLogs', 'true');
    console.log('Developer logs enabled');
  },

  /**
   * Disables development logs
   */
  disableDevLogs: () => {
    localStorage.removeItem('enableDevLogs');
    console.log('Developer logs disabled');
  },
};

// Expose logger to window object for debugging
if (typeof window !== 'undefined') {
  (window as any).logger = logger;
}
