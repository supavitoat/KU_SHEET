const { prisma } = require('../config/database');
const { sendMail } = require('../config/mailer');

let isRunningTwoHour = false;

function formatDateTimeThai(dt) {
  try {
    return new Date(dt).toLocaleString('th-TH', {
      year: 'numeric', month: 'long', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    });
  } catch (_) {
    return String(dt);
  }
}

async function sendTwoHourReminders() {
  if (isRunningTwoHour) return;
  isRunningTwoHour = true;
  try {
    const now = new Date();
    // 2 HOURS WINDOW: 119–121 minutes ahead (tolerance ±1 min)
    const windowStart = new Date(now.getTime() + 119 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 121 * 60 * 1000);

    const groups = await prisma.group.findMany({
      where: {
        status: 'upcoming',
        reminderOneHourSent: false,
        startAt: { gte: windowStart, lte: windowEnd },
      },
      select: {
        id: true,
        title: true,
        locationName: true,
        address: true,
        startAt: true,
        members: {
          where: { status: 'approved' },
          select: { user: { select: { email: true, fullName: true } } },
        },
      },
    });

    console.info('[GroupReminder] scan two-hour window', {
      count: groups.length,
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString(),
    });

    for (const g of groups) {
  console.debug('[GroupReminder] candidate', { id: g.id, title: g.title, startAt: g.startAt });

      // Idempotent claim: mark as sent BEFORE sending to avoid double-send from overlapping runs/processes
      const claim = await prisma.group.updateMany({
        where: { id: g.id, reminderOneHourSent: false },
        data: { reminderOneHourSent: true },
      });
      if (claim.count === 0) {
  console.warn('[GroupReminder] skip, already claimed', { groupId: g.id });
        continue;
      }

      const recipients = Array.from(new Set((g.members || [])
        .map(m => m.user?.email)
        .filter(Boolean)));
  console.debug('[GroupReminder] recipients', { groupId: g.id, recipients });

      if (recipients.length > 0) {
  const subject = `เตือนก่อนเริ่ม 2 ชั่วโมง — ${g.title}`;
        const startStr = formatDateTimeThai(g.startAt);
        const place = g.locationName || g.address || 'สถานที่นัด';
        const groupUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/groups/${g.id}`;

        const html = `<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>📣 เตือนก่อนเริ่ม 2 ชั่วโมง — ${g.title}</title>
  <style>
    a { color: #2563EB; text-decoration: none; }
    @media (max-width: 640px) {
      .container { width: 100% !important; border-radius: 0 !important; }
      .content { padding: 20px !important; }
      .title { font-size: 18px !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background:#f6f7fb;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f6f7fb; padding:24px 0;">
    <tr>
      <td align="center">
        <table class="container" role="presentation" cellpadding="0" cellspacing="0" width="600" style="width:600px; max-width:600px; background:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 8px 24px rgba(31,41,55,0.08);">
          <tr>
            <td style="background:#4F46E5; background-image:linear-gradient(90deg,#4F46E5,#3B82F6); padding:18px 24px; color:#ffffff;">
              <table width="100%" role="presentation">
                <tr>
                  <td style="font-weight:700; font-size:18px; letter-spacing:.2px;">KU SHEET • แจ้งเตือนกลุ่มติว</td>
                  <td align="right" style="font-size:12px; opacity:.9;">เริ่มในอีก ~2 ชั่วโมง</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="content" style="padding:28px; font-family:'Segoe UI', Arial, sans-serif; color:#111827;">
              <p style="margin:0 0 12px 0; font-size:16px;">สวัสดีค่ะ/ครับ,</p>
              <p style="margin:0 0 18px 0; font-size:16px;">แจ้งเตือนว่าใกล้ถึงเวลานัดกลุ่มติวของคุณแล้ว</p>

              <div style="margin:0 0 16px 0;">
                <div class="title" style="font-size:20px; font-weight:800; color:#111827; line-height:1.4;">${g.title}</div>
              </div>

              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:12px 0 20px 0; background:#F9FAFB; border:1px solid #E5E7EB; border-radius:12px;">
                <tr>
                  <td style="padding:14px 16px; font-size:14px; color:#374151;">
                    <div style="margin-bottom:8px;"><strong style="color:#111827;">วันเวลาเริ่ม:</strong> ${startStr}</div>
                    <div><strong style="color:#111827;">สถานที่/ลิงก์:</strong> ${place}</div>
                  </td>
                </tr>
              </table>

              <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin: 8px auto 6px auto;">
                <tr>
                  <td align="center" bgcolor="#4F46E5" style="border-radius:10px;">
                    <a href="${groupUrl}"
                       style="display:inline-block; padding:12px 18px; font-weight:700; font-size:14px; color:#ffffff; background:#4F46E5; background-image:linear-gradient(90deg,#4F46E5,#3B82F6); border-radius:10px;">
                      เปิดดูรายละเอียดกลุ่ม
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:18px 0 0 0; font-size:13px; color:#6B7280;">หากปุ่มกดไม่ได้ ให้เปิดลิงก์นี้แทน:<br>
                <a href="${groupUrl}" style="color:#2563EB; word-break:break-all;">${groupUrl}</a>
              </p>

              <hr style="border:none; border-top:1px solid #E5E7EB; margin:22px 0;">
              <p style="margin:0; font-size:12px; color:#9CA3AF;">
                อีเมลนี้ถูกส่งอัตโนมัติจากระบบ KU SHEET เพื่อเตือนกำหนดการของคุณ
              </p>
            </td>
          </tr>
        </table>
        <div style="font-family:'Segoe UI', Arial, sans-serif; font-size:12px; color:#9CA3AF; margin-top:12px;">
          © ${new Date().getFullYear()} KU SHEET
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;

        try {
          await sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: recipients,
            subject,
            html,
          });
        } catch (err) {
          console.error('[GroupReminder] sendMail failed', { groupId: g.id, error: err.message });
          // Revert claim so it can retry on next run
          try {
            await prisma.group.update({ where: { id: g.id }, data: { reminderOneHourSent: false } });
          } catch (revertErr) {
      console.error('[GroupReminder] revert flag failed', { groupId: g.id, error: revertErr.message });
          }
        }
      } else {
    console.info('[GroupReminder] no recipients', { groupId: g.id });
      }
    }
  } catch (error) {
  console.error('[GroupReminder] scheduler error', { error: error.message, stack: error.stack });
  } finally {
    isRunningTwoHour = false;
  }
}

function startGroupReminderScheduler() {
  // Run every 60 seconds
  setInterval(sendTwoHourReminders, 60 * 1000);
  // Kick once on boot (optional small delay to ensure prisma ready)
  setTimeout(sendTwoHourReminders, 10 * 1000);
  console.info('[GroupReminder] started (2h before start)');
}

module.exports = { startGroupReminderScheduler };


