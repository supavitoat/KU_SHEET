// Lightweight retry wrapper for transient Prisma errors (e.g., timeouts)

const TRANSIENT_CODES = new Set([
  'P1001', // database connection error
  'P1002', // timeout
]);

async function withPrismaRetry(fn, { attempts = 3, delayMs = 150 } = {}) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      const code = err.code || err.meta?.code;
      const transient = code && TRANSIENT_CODES.has(code);
      if (!transient || i === attempts - 1) {
        lastErr = err;
        break;
      }
  console.warn('[PrismaRetry] transient error, retrying', { attempt: i + 1, code, message: err.message });
      await new Promise(r => setTimeout(r, delayMs * (i + 1))); // linear backoff
    }
  }
  throw lastErr;
}

module.exports = { withPrismaRetry };
