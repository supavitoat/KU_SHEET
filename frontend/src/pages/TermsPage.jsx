import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, ShieldCheckIcon, UserIcon, DocumentTextIcon, ExclamationTriangleIcon, MapPinIcon, MegaphoneIcon, StarIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-white/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link 
              to="/study-groups" 
              className="text-purple-600 hover:text-purple-700 transition-colors duration-200"
            >
              กลับไปเมนูกลุ่มติว
            </Link>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mt-4">
            เงื่อนไขการใช้งาน
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
                <ShieldCheckIcon className="w-8 h-8 text-purple-600" />
                <h2 className="text-2xl font-bold text-gray-800">ยินดีต้อนรับสู่ KU SHEET</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                KU SHEET เป็นแพลตฟอร์มสำหรับแบ่งปันชีทสรุปและจัด "กลุ่มติว" ระหว่างนักศึกษามหาวิทยาลัยเกษตรศาสตร์ 
                การใช้งานถือว่าคุณยอมรับเงื่อนไขทั้งหมดด้านล่าง รวมถึงนโยบายของเมนูกลุ่มติว
              </p>
            </div>

            {/* Study Groups sections removed per request */}

            {/* Terms Sections */}
            <div className="space-y-8">
              
              {/* Section 1: User Registration */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <UserIcon className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-semibold text-gray-800">1. การลงทะเบียนและบัญชีผู้ใช้</h3>
                </div>
                <div className="pl-9 space-y-3 text-gray-600">
                  <p>• คุณต้องเป็นนักศึกษาหรือบุคลากรของมหาวิทยาลัยเกษตรศาสตร์</p>
                  <p>• ข้อมูลที่ลงทะเบียนต้องถูกต้องและเป็นปัจจุบัน</p>
                  <p>• คุณมีหน้าที่รักษาความปลอดภัยของบัญชีและรหัสผ่าน</p>
                  <p>• ห้ามแชร์บัญชีกับผู้อื่นหรือใช้บัญชีของผู้อื่น</p>
                  <p>• KU SHEET ขอสงวนสิทธิ์ในการระงับหรือลบบัญชีที่ละเมิดเงื่อนไข</p>
                </div>
              </section>

              {/* Section 2: Content Guidelines */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <DocumentTextIcon className="w-6 h-6 text-green-600" />
                  <h3 className="text-xl font-semibold text-gray-800">2. ข้อกำหนดเนื้อหา</h3>
                </div>
                <div className="pl-9 space-y-3 text-gray-600">
                  <p className="font-semibold text-red-600">เนื้อหาที่ห้ามอัปโหลด:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>ข้อสอบหรือเฉลยข้อสอบ (รวมถึงชีทที่บอกว่าเป็นข้อสอบ)</li>
                    <li>เนื้อหาที่ละเมิดลิขสิทธิ์หรือทรัพย์สินทางปัญญา</li>
                    <li>เนื้อหาที่ไม่เหมาะสม สร้างความเสื่อมเสีย หรือขัดต่อกฎหมาย</li>
                    <li>เนื้อหาที่เป็นความลับของมหาวิทยาลัยหรือสถาบันการศึกษา</li>
                    <li>ชีทที่คัดลอกมาจากแหล่งอื่นโดยไม่ได้รับอนุญาต</li>
                  </ul>
                  <p className="font-semibold text-green-600 mt-4">เนื้อหาที่อนุญาต:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>ชีทสรุปที่เขียนขึ้นเองจากความรู้และความเข้าใจ</li>
                    <li>โน๊ตการเรียนที่รวบรวมจากหนังสือเรียนและเอกสารประกอบการสอน</li>
                    <li>สรุปเนื้อหาจากการเรียนในห้องเรียน</li>
                    <li>ชีทที่ได้รับอนุญาตจากอาจารย์หรือเจ้าของลิขสิทธิ์</li>
                  </ul>
                </div>
              </section>

              {/* Section 3: Intellectual Property */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <ShieldCheckIcon className="w-6 h-6 text-purple-600" />
                  <h3 className="text-xl font-semibold text-gray-800">3. สิทธิ์ในทรัพย์สินทางปัญญา</h3>
                </div>
                <div className="pl-9 space-y-3 text-gray-600">
                  <p>• ผู้อัปโหลดยังคงเป็นเจ้าของลิขสิทธิ์ในเนื้อหาที่อัปโหลด</p>
                  <p>• การอัปโหลดถือเป็นการอนุญาตให้ KU SHEET แสดงผลและแจกจ่ายเนื้อหา</p>
                  <p>• ผู้ใช้สามารถดาวน์โหลดเนื้อหาเพื่อการศึกษาเท่านั้น</p>
                  <p>• ห้ามคัดลอก แจกจ่าย หรือใช้เนื้อหาเพื่อการค้าโดยไม่ได้รับอนุญาต</p>
                  <p>• KU SHEET ไม่รับผิดชอบต่อการละเมิดลิขสิทธิ์ที่เกิดจากผู้ใช้</p>
                </div>
              </section>

              {/* Section 4: Payment and Revenue */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <DocumentTextIcon className="w-6 h-6 text-orange-600" />
                  <h3 className="text-xl font-semibold text-gray-800">4. การชำระเงินและรายได้</h3>
                </div>
                <div className="pl-9 space-y-3 text-gray-600">
                  <p>• ผู้ใช้สามารถตั้งราคาสำหรับชีทของตนเองได้</p>
                  <p>• KU SHEET จะหักค่าธรรมเนียม 10% จากรายได้</p>
                  <p>• การโอนเงินจะทำผ่านบัญชีธนาคารที่ผู้ใช้ระบุ</p>
                  <p>• รายได้จะถูกโอนภายใน 7 วันทำการหลังจากได้รับคำสั่งซื้อ</p>
                  <p>• ผู้ใช้ต้องรับผิดชอบในการเสียภาษีจากรายได้ที่ได้รับ</p>
                </div>
              </section>

              {/* Section 5: Privacy and Data */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <ShieldCheckIcon className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-semibold text-gray-800">5. ความเป็นส่วนตัวและข้อมูล</h3>
                </div>
                <div className="pl-9 space-y-3 text-gray-600">
                  <p>• KU SHEET จะเก็บรักษาข้อมูลส่วนตัวตามนโยบายความเป็นส่วนตัว</p>
                  <p>• ข้อมูลจะถูกใช้เพื่อการให้บริการและปรับปรุงแพลตฟอร์ม</p>
                  <p>• ข้อมูลจะไม่ถูกแชร์กับบุคคลที่สามโดยไม่ได้รับอนุญาต</p>
                  <p>• ผู้ใช้สามารถขอลบข้อมูลส่วนตัวได้ตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล</p>
                </div>
              </section>

              {/* Section 6: Prohibited Activities */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                  <h3 className="text-xl font-semibold text-gray-800">6. กิจกรรมที่ห้าม</h3>
                </div>
                <div className="pl-9 space-y-3 text-gray-600">
                  <p>• การใช้แพลตฟอร์มเพื่อวัตถุประสงค์ที่ผิดกฎหมาย</p>
                  <p>• การส่งสแปมหรือข้อความที่ไม่เหมาะสม</p>
                  <p>• การพยายามเข้าถึงระบบโดยไม่ได้รับอนุญาต</p>
                  <p>• การสร้างบัญชีปลอมหรือใช้ข้อมูลเท็จ</p>
                  <p>• การขัดขวางการทำงานของแพลตฟอร์ม</p>
                </div>
              </section>

              {/* Section 7: Liability */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <ShieldCheckIcon className="w-6 h-6 text-gray-600" />
                  <h3 className="text-xl font-semibold text-gray-800">7. ข้อจำกัดความรับผิดชอบ</h3>
                </div>
                <div className="pl-9 space-y-3 text-gray-600">
                  <p>• KU SHEET ไม่รับผิดชอบต่อความเสียหายที่เกิดจากการใช้งาน</p>
                  <p>• แพลตฟอร์มให้บริการ "ตามสภาพ" โดยไม่มีการรับประกัน</p>
                  <p>• KU SHEET ไม่รับผิดชอบต่อเนื้อหาที่ผู้ใช้อัปโหลด</p>
                  <p>• การใช้งานถือเป็นการยอมรับความเสี่ยงทั้งหมด</p>
                </div>
              </section>

              {/* Section 8: Termination */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <ExclamationTriangleIcon className="w-6 h-6 text-orange-600" />
                  <h3 className="text-xl font-semibold text-gray-800">8. การระงับและยกเลิกบริการ</h3>
                </div>
                <div className="pl-9 space-y-3 text-gray-600">
                  <p>• KU SHEET ขอสงวนสิทธิ์ในการระงับหรือยกเลิกบัญชีที่ละเมิดเงื่อนไข</p>
                  <p>• การระงับอาจเป็นชั่วคราวหรือถาวรขึ้นอยู่กับความรุนแรง</p>
                  <p>• ผู้ใช้สามารถยกเลิกบัญชีได้ทุกเมื่อ</p>
                  <p>• เนื้อหาที่อัปโหลดอาจถูกลบเมื่อยกเลิกบัญชี</p>
                </div>
              </section>

              {/* Section 9: Changes to Terms */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <DocumentTextIcon className="w-6 h-6 text-purple-600" />
                  <h3 className="text-xl font-semibold text-gray-800">9. การเปลี่ยนแปลงเงื่อนไข</h3>
                </div>
                <div className="pl-9 space-y-3 text-gray-600">
                  <p>• KU SHEET ขอสงวนสิทธิ์ในการเปลี่ยนแปลงเงื่อนไขการใช้งาน</p>
                  <p>• การเปลี่ยนแปลงจะประกาศให้ทราบล่วงหน้า</p>
                  <p>• การใช้งานต่อเนื่องถือเป็นการยอมรับเงื่อนไขใหม่</p>
                  <p>• หากไม่ยอมรับเงื่อนไขใหม่ กรุณาหยุดใช้งานแพลตฟอร์ม</p>
                </div>
              </section>

              {/* Section 10: Contact */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <ShieldCheckIcon className="w-6 h-6 text-green-600" />
                  <h3 className="text-xl font-semibold text-gray-800">10. ติดต่อเรา</h3>
                </div>
                                 <div className="pl-9 space-y-3 text-gray-600">
                   <p>หากมีคำถามเกี่ยวกับเงื่อนไขการใช้งาน กรุณาติดต่อ:</p>
                   <p>• อีเมล: thosapol.n@ku.th</p>
                   <p>• เบอร์โทร: 0656144703</p>
                   <p>• เวลาทำการ: จันทร์-ศุกร์ 9:00-17:00 น.</p>
                 </div>
              </section>

            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="text-center">
                <p className="text-gray-500 text-sm">
                  โดยการใช้งาน KU SHEET คุณยอมรับเงื่อนไขการใช้งานทั้งหมดข้างต้น
                </p>
                <div className="mt-4">
                  <Link 
                    to="/study-groups" 
                    className="inline-flex px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
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

export default TermsPage; 