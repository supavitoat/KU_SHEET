// Script to drop legacy system_settings table if it exists (MySQL)
// Usage: node scripts/drop_system_settings.js

const { prisma } = require('../config/database');

async function main() {
  try {
    console.log('[DropSystemSettings] Checking for legacy table system_settings...');
    const rows = await prisma.$queryRawUnsafe(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'system_settings'"
    );

    if (Array.isArray(rows) && rows.length > 0) {
      console.log('[DropSystemSettings] Found table system_settings. Dropping...');
      await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS `system_settings`');
      console.log('[DropSystemSettings] Dropped table system_settings successfully.');
    } else {
      console.log('[DropSystemSettings] Table system_settings does not exist. Nothing to do.');
    }
  } catch (err) {
    console.error('[DropSystemSettings] Error while dropping table:', err?.message || err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
