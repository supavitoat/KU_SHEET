import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, ShieldCheckIcon, EyeIcon, LockClosedIcon, DocumentTextIcon, ExclamationTriangleIcon, UserIcon, CogIcon, MapPinIcon } from '@heroicons/react/24/outline';

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-white/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link 
              to="/study-groups" 
              className="text-blue-600 hover:text-blue-700 transition-colors duration-200"
            >
              กลับไปเมนูกลุ่มติว
            </Link>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-4">
            นโยบายความเป็นส่วนตัว
          </h1>
          <p className="text-gray-600 mt-2">อัปเดตล่าสุด: 1 กันยายน 2568</p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-8 border border-white/50">
            
            {/* Introduction */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheckIcon className="w-8 h-8 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-800">การคุ้มครองข้อมูลส่วนบุคคลของคุณ</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                KU SHEET ให้ความสำคัญกับการคุ้มครองข้อมูลส่วนบุคคลของคุณเป็นอย่างยิ่ง นโยบายนี้ครอบคลุมทั้งการใช้งานทั่วไปและฟีเจอร์ "กลุ่มติว" เช่น การเช็คชื่อ การให้คะแนน การแจ้งเตือนอีเมล และข้อมูลแผนที่
              </p>
            </div>

            {/* Privacy Sections */}
            <div className="space-y-8">
              
              {/* Section 1: Information We Collect */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <UserIcon className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-semibold text-gray-800">1. ข้อมูลที่เรารวบรวม</h3>
                </div>
                <div className="pl-9 space-y-3 text-gray-600">
                  <p className="font-semibold text-blue-600">ข้อมูลส่วนตัว:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>ชื่อ-นามสกุล</li>
                    <li>อีเมล</li>
                    <li>เบอร์โทรศัพท์</li>
                    <li>คณะ/สาขา</li>
                    <li>รูปโปรไฟล์ของอีเมล</li>
                  </ul>
                  
                  <p className="font-semibold text-blue-600 mt-4">ข้อมูลการใช้งาน:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>ประวัติการเข้าสู่ระบบ</li>
                    <li>ชีทที่อัปโหลดและดาวน์โหลด</li>
                    <li>การค้นหาและดูชีท</li>
                    <li>การชำระเงินและรายได้</li>
                    <li>การติดต่อกับผู้ใช้คนอื่น</li>
                  </ul>

                  <p className="font-semibold text-blue-600 mt-4">ข้อมูลทางเทคนิค:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>IP Address</li>
                    <li>Browser และ Device Information</li>
                    <li>Cookies และ Session Data</li>
                    <li>Log Files</li>
                  </ul>
                </div>
              </section>

              {/* Section 2: How We Use Information */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <CogIcon className="w-6 h-6 text-green-600" />
                  <h3 className="text-xl font-semibold text-gray-800">2. การใช้ข้อมูล</h3>
                </div>
                <div className="pl-9 space-y-3 text-gray-600">
                  <p className="font-semibold text-green-600">เพื่อการให้บริการ:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>สร้างและจัดการบัญชีผู้ใช้</li>
                    <li>อัปโหลดและแชร์ชีท</li>
                    <li>ค้นหาและดาวน์โหลดชีท</li>
                    <li>ประมวลผลการชำระเงิน</li>
                    <li>ส่งการแจ้งเตือนและอัปเดต</li>
                  </ul>
                  
                  <p className="font-semibold text-green-600 mt-4">เพื่อการปรับปรุงบริการ:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>วิเคราะห์การใช้งานเพื่อปรับปรุงฟีเจอร์</li>
                    <li>แก้ไขปัญหาและข้อผิดพลาด</li>
                    <li>พัฒนาอัลกอริทึมการแนะนำ</li>
                    <li>เพิ่มความปลอดภัยของระบบ</li>
                  </ul>

                  <p className="font-semibold text-green-600 mt-4">เพื่อการสื่อสาร:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>ส่งอีเมลยืนยันและรีเซ็ตรหัสผ่าน</li>
                    <li>แจ้งเตือนเกี่ยวกับชีทใหม่</li>
                    <li>ส่งข่าวสารและอัปเดตสำคัญ</li>
                    <li>ตอบคำถามและให้การสนับสนุน</li>
                  </ul>
                </div>
              </section>

              {/* Section 3: Information Sharing */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <LockClosedIcon className="w-6 h-6 text-purple-600" />
                  <h3 className="text-xl font-semibold text-gray-800">3. การแชร์ข้อมูล</h3>
                </div>
                <div className="pl-9 space-y-3 text-gray-600">
                  <p className="font-semibold text-red-600">เราไม่ขาย แลกเปลี่ยน หรือให้เช่าข้อมูลส่วนตัวของคุณ</p>
                  
                  <p className="font-semibold text-purple-600 mt-4">การแชร์ข้อมูลที่จำเป็น:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>กับผู้ให้บริการชำระเงิน (เพื่อประมวลผลการชำระเงิน)</li>
                    <li>กับผู้ให้บริการคลาวด์ (เพื่อจัดเก็บข้อมูล)</li>
                    <li>กับผู้ให้บริการวิเคราะห์ (เพื่อปรับปรุงบริการ)</li>
                    <li>ตามกฎหมายหรือคำสั่งศาล</li>
                  </ul>

                  <p className="font-semibold text-purple-600 mt-4">ข้อมูลที่แชร์สาธารณะ:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>ชื่อผู้ใช้และคณะ (ในชีทที่อัปโหลด)</li>
                    <li>ชีทที่คุณอัปโหลด (เนื้อหาและข้อมูลพื้นฐาน)</li>
                    <li>คะแนนและรีวิว (ถ้ามี)</li>
                  </ul>
                </div>
              </section>

              {/* Section 4: Data Security */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <ShieldCheckIcon className="w-6 h-6 text-indigo-600" />
                  <h3 className="text-xl font-semibold text-gray-800">4. ความปลอดภัยของข้อมูล</h3>
                </div>
                <div className="pl-9 space-y-3 text-gray-600">
                  <p>เราใช้มาตรการความปลอดภัยหลายชั้นเพื่อปกป้องข้อมูลของคุณ:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>การเข้ารหัสข้อมูล (Encryption) ทั้งในขณะส่งและจัดเก็บ</li>
                    <li>การยืนยันตัวตนแบบสองชั้น (2FA)</li>
                    <li>การตรวจสอบการเข้าถึงอย่างสม่ำเสมอ</li>
                    <li>การสำรองข้อมูลอย่างปลอดภัย</li>
                    <li>การอัปเดตระบบความปลอดภัยอย่างต่อเนื่อง</li>
                    <li>การฝึกอบรมพนักงานเกี่ยวกับความปลอดภัยข้อมูล</li>
                  </ul>
                  
                  <p className="mt-4 text-orange-600 font-semibold">
                    อย่างไรก็ตาม ไม่มีระบบใดที่ปลอดภัย 100% 
                    เราขอให้คุณช่วยรักษาความปลอดภัยของบัญชีด้วย
                  </p>
                </div>
              </section>

              {/* Section 5: Data Retention */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <DocumentTextIcon className="w-6 h-6 text-orange-600" />
                  <h3 className="text-xl font-semibold text-gray-800">5. การเก็บรักษาข้อมูล</h3>
                </div>
                <div className="pl-9 space-y-3 text-gray-600">
                  <p>เราจะเก็บข้อมูลของคุณตามระยะเวลาที่จำเป็น:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>ข้อมูลบัญชี:</strong> จนกว่าคุณจะลบบัญชี</li>
                    <li><strong>ข้อมูลการใช้งาน:</strong> 3 ปีหลังจากใช้งานล่าสุด</li>
                    <li><strong>ข้อมูลการชำระเงิน:</strong> 7 ปีตามกฎหมายภาษี</li>
                    <li><strong>Log Files:</strong> 1 ปี</li>
                    <li><strong>Cookies:</strong> ตามประเภทของ Cookie</li>
                  </ul>
                  
                  <p className="mt-4">
                    เมื่อครบกำหนด เราจะลบหรือทำให้ข้อมูลไม่สามารถระบุตัวตนได้
                  </p>
                </div>
              </section>

              {/* Section 6: Your Rights */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <UserIcon className="w-6 h-6 text-green-600" />
                  <h3 className="text-xl font-semibold text-gray-800">6. สิทธิ์ของคุณ</h3>
                </div>
                <div className="pl-9 space-y-3 text-gray-600">
                  <p>ตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล คุณมีสิทธิ์:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>สิทธิ์ในการเข้าถึง:</strong> ขอดูข้อมูลส่วนตัวที่เรามี</li>
                    <li><strong>สิทธิ์ในการแก้ไข:</strong> แก้ไขข้อมูลที่ไม่ถูกต้อง</li>
                    <li><strong>สิทธิ์ในการลบ:</strong> ลบข้อมูลส่วนตัว</li>
                    <li><strong>สิทธิ์ในการจำกัดการประมวลผล:</strong> ระงับการประมวลผลข้อมูล</li>
                    <li><strong>สิทธิ์ในการโอนข้อมูล:</strong> ขอข้อมูลในรูปแบบที่สามารถโอนได้</li>
                    <li><strong>สิทธิ์ในการคัดค้าน:</strong> คัดค้านการประมวลผลข้อมูล</li>
                    <li><strong>สิทธิ์ในการเพิกถอนความยินยอม:</strong> ถอนความยินยอมที่ให้ไว้</li>
                  </ul>
                  
                  <p className="mt-4">
                    หากต้องการใช้สิทธิ์เหล่านี้ กรุณาติดต่อเราที่ privacy@kusheet.com
                  </p>
                </div>
              </section>

              {/* Section 7: Cookies */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <CogIcon className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-semibold text-gray-800">7. การใช้ Cookies</h3>
                </div>
                <div className="pl-9 space-y-3 text-gray-600">
                  <p>เราใช้ Cookies เพื่อ:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>จดจำการเข้าสู่ระบบและตั้งค่าของคุณ</li>
                    <li>ปรับปรุงประสบการณ์การใช้งาน</li>
                    <li>วิเคราะห์การใช้งานเว็บไซต์</li>
                    <li>แสดงโฆษณาที่เกี่ยวข้อง</li>
                  </ul>
                  
                  <p className="font-semibold text-blue-600 mt-4">ประเภทของ Cookies:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Essential Cookies:</strong> จำเป็นสำหรับการทำงานของเว็บไซต์</li>
                    <li><strong>Functional Cookies:</strong> จดจำการตั้งค่าและความชอบ</li>
                    <li><strong>Analytics Cookies:</strong> วิเคราะห์การใช้งาน</li>
                    <li><strong>Marketing Cookies:</strong> แสดงโฆษณาที่เกี่ยวข้อง</li>
                  </ul>
                  
                  <p className="mt-4">
                    คุณสามารถจัดการ Cookies ได้ในการตั้งค่าบราวเซอร์
                  </p>
                </div>
              </section>

              {/* Section 8: Third-Party Services */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <ExclamationTriangleIcon className="w-6 h-6 text-orange-600" />
                  <h3 className="text-xl font-semibold text-gray-800">8. บริการของบุคคลที่สาม</h3>
                </div>
                <div className="pl-9 space-y-3 text-gray-600">
                  <p>เราใช้บริการของบุคคลที่สามเพื่อ:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>การชำระเงิน (Stripe, PayPal)</li>
                    <li>การวิเคราะห์ (Google Analytics)</li>
                    <li>การจัดเก็บข้อมูล (AWS, Google Cloud)</li>
                    <li>การส่งอีเมล (SendGrid, Mailgun)</li>
                    <li>การจัดการฐานข้อมูล (Prisma, SQLite)</li>
                  </ul>
                  
                  <p className="mt-4 text-orange-600 font-semibold">
                    บริการเหล่านี้มีนโยบายความเป็นส่วนตัวของตนเอง 
                    กรุณาอ่านนโยบายของพวกเขาเพื่อความเข้าใจที่ครบถ้วน
                  </p>
                </div>
              </section>

              {/* Section 9: Children's Privacy */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <UserIcon className="w-6 h-6 text-purple-600" />
                  <h3 className="text-xl font-semibold text-gray-800">9. ความเป็นส่วนตัวของเด็ก</h3>
                </div>
                <div className="pl-9 space-y-3 text-gray-600">
                  <p>KU SHEET ไม่ได้ออกแบบมาสำหรับเด็กอายุต่ำกว่า 13 ปี</p>
                  <p>เราไม่รวบรวมข้อมูลส่วนตัวจากเด็กอายุต่ำกว่า 13 ปีโดยเจตนา</p>
                  <p>หากคุณเป็นผู้ปกครองและพบว่าเด็กของคุณได้ให้ข้อมูลกับเรา กรุณาติดต่อเรา</p>
                  <p>เราจะลบข้อมูลดังกล่าวโดยเร็วที่สุด</p>
                </div>
              </section>

              {/* Section 10: International Transfers */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <ShieldCheckIcon className="w-6 h-6 text-indigo-600" />
                  <h3 className="text-xl font-semibold text-gray-800">10. การโอนข้อมูลระหว่างประเทศ</h3>
                </div>
                <div className="pl-9 space-y-3 text-gray-600">
                  <p>ข้อมูลของคุณอาจถูกโอนไปยังประเทศอื่นเพื่อ:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>การจัดเก็บในคลาวด์เซิร์ฟเวอร์</li>
                    <li>การประมวลผลโดยผู้ให้บริการ</li>
                    <li>การสำรองข้อมูล</li>
                  </ul>
                  
                  <p className="mt-4">
                    เราจะใช้มาตรการความปลอดภัยที่เหมาะสมเพื่อปกป้องข้อมูลของคุณ
                    และปฏิบัติตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล
                  </p>
                </div>
              </section>

              {/* Section 11: Changes to Privacy Policy */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-semibold text-gray-800">11. การเปลี่ยนแปลงนโยบายความเป็นส่วนตัว</h3>
                </div>
                <div className="pl-9 space-y-3 text-gray-600">
                  <p>เราอาจอัปเดตนโยบายความเป็นส่วนตัวเป็นครั้งคราว</p>
                  <p>การเปลี่ยนแปลงที่สำคัญจะประกาศให้ทราบล่วงหน้าผ่าน:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>อีเมลแจ้งเตือน</li>
                    <li>ประกาศในเว็บไซต์</li>
                    <li>การแจ้งเตือนในแอปพลิเคชัน</li>
                  </ul>
                  
                  <p className="mt-4">
                    การใช้งานต่อเนื่องถือเป็นการยอมรับนโยบายใหม่
                  </p>
                </div>
              </section>

              {/* Section 12: Contact Information */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <ShieldCheckIcon className="w-6 h-6 text-green-600" />
                  <h3 className="text-xl font-semibold text-gray-800">12. ติดต่อเรา</h3>
                </div>
                <div className="pl-9 space-y-3 text-gray-600">
                  <p>หากมีคำถามเกี่ยวกับนโยบายความเป็นส่วนตัว กรุณาติดต่อ:</p>
                                     <div className="bg-gray-50 p-4 rounded-lg">
                     <p><strong>Data Protection Officer</strong></p>
                     <p>• อีเมล: thosapol.n@ku.th</p>
                     <p>• เบอร์โทร: 0656144703</p>
                     <p>• เวลาทำการ: จันทร์-ศุกร์ 9:00-17:00 น.</p>
                   </div>
                  
                                     <p className="mt-4">
                     เราจะตอบกลับภายใน 7 วันหลังจากได้รับคำขอ
                   </p>
                </div>
              </section>

            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="text-center">
                <p className="text-gray-500 text-sm">
                  โดยการใช้งาน KU SHEET คุณยอมรับนโยบายความเป็นส่วนตัวนี้
                </p>
                <div className="mt-4">
                  <Link 
                    to="/study-groups" 
                    className="inline-flex px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    ไปที่เมนูกลุ่มติว
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage; 