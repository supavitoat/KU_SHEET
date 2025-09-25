import React from 'react';
import { Link } from 'react-router-dom';
import { 
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import logo from '../../assets/logo.png';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white relative z-50" style={{ position: 'relative', zIndex: 50 }}>
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Company Info & Logo */}
          <div className="lg:w-1/3">
            <div className="flex items-center mb-4">
              <div className="bg-white rounded-full p-1.5 mr-3">
                <img src={logo} alt="KU Sheet Logo" className="h-8 w-auto" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">KU Sheet</h3>
                <p className="text-blue-200 text-sm">แพลตฟอร์มชีทสรุปชั้นนำ</p>
              </div>
            </div>
            <p className="text-blue-100 text-sm leading-relaxed mb-4">
              แพลตฟอร์มสำหรับการซื้อขายชีทสรุปคุณภาพสูงจากนักศึกษามหาวิทยาลัยเกษตรศาสตร์ 
              เชื่อมต่อผู้เรียนกับผู้ขายผ่านระบบที่ปลอดภัยและน่าเชื่อถือ
            </p>
            <div className="flex space-x-4">
              <Link to="/contact" className="text-blue-200 hover:text-white transition-colors">
                <GlobeAltIcon className="h-5 w-5" />
              </Link>
              <Link to="/contact" className="text-blue-200 hover:text-white transition-colors">
                <EnvelopeIcon className="h-5 w-5" />
              </Link>
              <Link to="/contact" className="text-blue-200 hover:text-white transition-colors">
                <PhoneIcon className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Quick Links & Contact & Support - Combined */}
          <div className="lg:w-2/3 flex flex-col lg:flex-row gap-8 lg:gap-4">
            {/* Mobile Layout - Both sections side by side */}
            <div className="lg:hidden flex gap-4">
              {/* Quick Links - Mobile */}
              <div className="flex-1">
                <h4 className="text-base font-semibold text-white mb-3 flex items-center justify-end">
                  <DocumentTextIcon className="h-4 w-4 mr-1" />
                  ลิงก์ด่วน
                </h4>
                <ul className="space-y-1 text-right">
                  <li>
                    <Link to="/" className="text-blue-200 hover:text-white transition-colors text-xs">
                      หน้าแรก
                    </Link>
                  </li>
                  <li>
                     <Link to="/shop" className="text-blue-200 hover:text-white transition-colors text-xs">
                       ดาวน์โหลดชีท
                     </Link>
                   </li>
                   <li>
                     <Link to="/seller" className="text-blue-200 hover:text-white transition-colors text-xs">
                       อัพโหลดชีท
                     </Link>
                   </li>
                   <li>
                     <Link to="/wishlist" className="text-blue-200 hover:text-white transition-colors text-xs">
                       รายการโปรด
                     </Link>
                   </li>
                   <li>
                     <Link to="/cart" className="text-blue-200 hover:text-white transition-colors text-xs">
                       ตะกร้าสินค้า
                     </Link>
                   </li>
                   <li>
                      <Link to="/mysheet" className="text-blue-200 hover:text-white transition-colors text-xs">
                        ชีทของฉัน
                      </Link>
                    </li>
                </ul>
              </div>

              {/* Contact & Support - Mobile */}
              <div className="flex-1">
                <h4 className="text-base font-semibold text-white mb-3 flex items-center justify-end">
                  <UserIcon className="h-4 w-4 mr-1" />
                  ติดต่อ & สนับสนุน
                </h4>
                <ul className="space-y-1 text-right">
                  <li>
                    <Link to="/contact" className="text-blue-200 hover:text-white transition-colors text-xs">
                      ติดต่อเรา
                    </Link>
                  </li>
                  <li>
                    <Link to="/terms" className="text-blue-200 hover:text-white transition-colors text-xs">
                      เงื่อนไขการใช้งาน
                    </Link>
                  </li>
                  <li>
                    <Link to="/privacy" className="text-blue-200 hover:text-white transition-colors text-xs">
                      นโยบายความเป็นส่วนตัว
                    </Link>
                  </li>
                  <li>
                    <Link to="/faq" className="text-blue-200 hover:text-white transition-colors text-xs">
                      คำถามที่พบบ่อย
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:flex w-full gap-4">
              {/* Quick Links - Desktop */}
              <div className="w-1/2 ml-96">
                <h4 className="text-lg font-semibold text-white mb-4 text-right flex items-center justify-end">
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  ลิงก์ด่วน
                </h4>
                <ul className="space-y-2 text-right">
                  <li>
                    <Link to="/" className="text-blue-200 hover:text-white transition-colors text-sm">
                      หน้าแรก
                    </Link>
                  </li>
                  <li>
                     <Link to="/shop" className="text-blue-200 hover:text-white transition-colors text-sm">
                       ดาวน์โหลดชีท
                     </Link>
                   </li>
                   <li>
                     <Link to="/seller" className="text-blue-200 hover:text-white transition-colors text-sm">
                       อัพโหลดชีท
                     </Link>
                   </li>
                   <li>
                     <Link to="/wishlist" className="text-blue-200 hover:text-white transition-colors text-sm">
                       รายการโปรด
                     </Link>
                   </li>
                   <li>
                     <Link to="/cart" className="text-blue-200 hover:text-white transition-colors text-sm">
                       ตะกร้าสินค้า
                     </Link>
                   </li>
                   <li>
                      <Link to="/mysheet" className="text-blue-200 hover:text-white transition-colors text-sm">
                        ชีทของฉัน
                      </Link>
                    </li>
                </ul>
              </div>

              {/* Contact & Support - Desktop */}
              <div className="w-1/2">
                <h4 className="text-lg font-semibold text-white mb-4 text-right flex items-center justify-end">
                  <UserIcon className="h-5 w-5 mr-2" />
                  ติดต่อ & สนับสนุน
                </h4>
                <ul className="space-y-2 text-right">
                  <li>
                    <Link to="/contact" className="text-blue-200 hover:text-white transition-colors text-sm">
                      ติดต่อเรา
                    </Link>
                  </li>
                  <li>
                    <Link to="/terms" className="text-blue-200 hover:text-white transition-colors text-sm">
                      เงื่อนไขการใช้งาน
                    </Link>
                  </li>
                  <li>
                    <Link to="/privacy" className="text-blue-200 hover:text-white transition-colors text-sm">
                      นโยบายความเป็นส่วนตัว
                    </Link>
                  </li>
                  <li>
                    <Link to="/faq" className="text-blue-200 hover:text-white transition-colors text-sm">
                      คำถามที่พบบ่อย
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>


      </div>

      {/* Bottom Bar */}
      <div className="bg-blue-950 border-t border-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-blue-200 text-sm mb-2 md:mb-0">
              © {currentYear} KU Sheet. สงวนลิขสิทธิ์ทุกประการ
            </div>
            <div className="flex items-center space-x-4 text-blue-200 text-sm whitespace-nowrap">
              <span>พัฒนาโดย</span>
              <span className="text-blue-300 font-medium">KU Sheet Development Team</span>
              <span>•</span>
              <span>เวอร์ชัน 1.0.0</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
