export const Logger = {
  info: (message: string, data?: unknown) => {
    console.log(`ℹ️  ${message}`, data !== undefined ? data : '');
  },

  success: (message: string, data?: unknown) => {
    console.log(`✅ ${message}`, data !== undefined ? data : '');
  },

  error: (message: string, error?: unknown) => {
    console.error(`❌ ${message}`, error !== undefined ? error : '');
  },

  warning: (message: string, data?: unknown) => {
    console.warn(`⚠️  ${message}`, data !== undefined ? data : '');
  },

  debug: (message: string, data?: unknown) => {
    console.log(`🔍 ${message}`, data !== undefined ? data : '');
  },

  transaction: (message: string, data?: unknown) => {
    console.log(`💳 ${message}`, data !== undefined ? data : '');
  },

  balance: (message: string, data?: unknown) => {
    console.log(`💰 ${message}`, data !== undefined ? data : '');
  },

  network: (message: string, data?: unknown) => {
    console.log(`🔗 ${message}`, data !== undefined ? data : '');
  },
};
