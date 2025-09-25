const { prisma } = require('../config/database');

// Ensure there is a singleton settings row (id = 1)
async function ensureSettings() {
  let settings = await prisma.appSettings.findUnique({ where: { id: 1 } });
  if (!settings) {
    settings = await prisma.appSettings.create({
      data: {
        id: 1,
        commissionRate: 15,
        payoutSchedule: 'weekly'
      }
    });
  }
  return settings;
}

async function getSettings() {
  const settings = await ensureSettings();
  return settings;
}

async function updateSettings(partial) {
  await ensureSettings();
  const updated = await prisma.appSettings.update({
    where: { id: 1 },
    data: { ...partial }
  });
  return updated;
}

async function getCommissionRateFraction() {
  const { commissionRate } = await getSettings();
  const rate = typeof commissionRate === 'number' ? commissionRate : parseFloat(commissionRate || '15');
  return rate / 100;
}

async function getCommissionRatePercent() {
  const { commissionRate } = await getSettings();
  return typeof commissionRate === 'number' ? commissionRate : parseFloat(commissionRate || '15');
}

async function setCommissionRatePercent(ratePercent) {
  return updateSettings({ commissionRate: ratePercent });
}

async function getPayoutSchedule() {
  const { payoutSchedule } = await getSettings();
  return payoutSchedule || 'weekly';
}

async function setPayoutSchedule(schedule) {
  return updateSettings({ payoutSchedule: schedule });
}

module.exports = {
  getSettings,
  updateSettings,
  getCommissionRateFraction,
  getCommissionRatePercent,
  setCommissionRatePercent,
  getPayoutSchedule,
  setPayoutSchedule
};
