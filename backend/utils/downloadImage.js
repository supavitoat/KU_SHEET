const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * ดาวน์โหลดรูปจาก URL และเซฟไว้ใน server
 * @param {string} url - URL ของรูปที่ต้องการดาวน์โหลด
 * @param {string} filename - ชื่อไฟล์ที่จะเซฟ
 * @returns {Promise<string>} - Path ที่ public ได้
 */
async function downloadImage(url, filename) {
  try {
    console.log('🔍 Downloading image from:', url);
    
    // สร้างโฟลเดอร์ถ้ายังไม่มี
    const uploadDir = path.join(__dirname, '../uploads/profiles');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, filename);
    
    // ดาวน์โหลดรูป
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      timeout: 10000, // 10 วินาที
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    // ตรวจสอบ content type
    const contentType = response.headers['content-type'];
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error(`Invalid content type: ${contentType}`);
    }

    // เขียนไฟล์
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log('✅ Image downloaded successfully:', filePath);
        resolve(`/uploads/profiles/${filename}`);
      });
      writer.on('error', (error) => {
        console.error('❌ Error writing file:', error);
        reject(error);
      });
    });
  } catch (error) {
    console.error('❌ Error downloading image:', error.message);
    throw error;
  }
}

/**
 * ตรวจสอบว่า URL เป็นรูปโปรไฟล์ Google หรือไม่
 * @param {string} url - URL ที่ต้องการตรวจสอบ
 * @returns {boolean}
 */
function isGoogleProfilePicture(url) {
  return url && url.startsWith('https://lh3.googleusercontent.com/');
}

/**
 * สร้างชื่อไฟล์สำหรับรูปโปรไฟล์
 * @param {string} userId - ID ของผู้ใช้
 * @param {string} googleId - Google ID (ถ้ามี)
 * @returns {string}
 */
function generateProfileFilename(userId, googleId = null) {
  const timestamp = Date.now();
  const id = googleId || userId;
  return `profile_${id}_${timestamp}.jpg`;
}

module.exports = {
  downloadImage,
  isGoogleProfilePicture,
  generateProfileFilename
}; 