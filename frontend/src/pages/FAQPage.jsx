import React, { useState } from 'react';
import { 
  QuestionMarkCircleIcon, 
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ShoppingCartIcon,
  UserIcon,
  CreditCardIcon,
  AcademicCapIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const FAQPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState(new Set());

  const allFAQs = [
    // General Questions
    {
      category: 'general',
      question: 'KU Sheet คืออะไร?',
      answer: 'KU Sheet เป็นแพลตฟอร์มสำหรับการซื้อขายชีทสรุปคุณภาพสูงจากนักศึกษามหาวิทยาลัยเกษตรศาสตร์ โดยเชื่อมต่อผู้เรียนกับผู้ขายผ่านระบบที่ปลอดภัยและน่าเชื่อถือ'
    },
    {
      category: 'general',
      question: 'ใครสามารถใช้งานได้บ้าง?',
      answer: 'ทุกคนสามารถใช้งานได้ แต่การซื้อชีทสรุปต้องสมัครสมาชิกและยืนยันตัวตนก่อน'
    },
    {
      category: 'general',
      question: 'ชีทสรุปมีคุณภาพอย่างไร?',
      answer: 'ชีทสรุปทั้งหมดผ่านการตรวจสอบคุณภาพจากทีมงาน และมีระบบรีวิวจากผู้ซื้อเพื่อประกันคุณภาพ'
    },
    {
      category: 'general',
      question: 'ระบบมีความปลอดภัยหรือไม่?',
      answer: 'ใช่ครับ เราใช้เทคโนโลยีการเข้ารหัสขั้นสูงและมาตรการความปลอดภัยที่เข้มงวดเพื่อปกป้องข้อมูลของผู้ใช้'
    },

    // Account Questions
    {
      category: 'account',
      question: 'สมัครสมาชิกอย่างไร?',
      answer: 'คลิกที่ปุ่ม "สมัครสมาชิก" ที่มุมขวาบนของเว็บไซต์ กรอกข้อมูลที่จำเป็น และยืนยันอีเมล'
    },
    {
      category: 'account',
      question: 'ลืมรหัสผ่านทำอย่างไร?',
      answer: 'คลิกที่ "ลืมรหัสผ่าน" ในหน้าเข้าสู่ระบบ และทำตามขั้นตอนการรีเซ็ตรหัสผ่าน'
    },
    {
      category: 'account',
      question: 'แก้ไขข้อมูลส่วนตัวได้หรือไม่?',
      answer: 'ได้ครับ สามารถแก้ไขข้อมูลส่วนตัวได้ในหน้าโปรไฟล์หลังจากเข้าสู่ระบบแล้ว'
    },
    {
      category: 'account',
      question: 'ลบบัญชีได้หรือไม่?',
      answer: 'ได้ครับ แต่ต้องติดต่อทีมสนับสนุนเพื่อดำเนินการลบบัญชีอย่างถาวร'
    },

    // Shopping Questions
    {
      category: 'shopping',
      question: 'ซื้อชีทสรุปอย่างไร?',
      answer: 'เลือกชีทสรุปที่ต้องการ คลิก "เพิ่มลงตะกร้า" แล้วไปที่ตะกร้าสินค้าเพื่อทำการสั่งซื้อ'
    },
    {
      category: 'shopping',
      question: 'มีวิธีการชำระเงินอะไรบ้าง?',
      answer: 'รองรับการชำระเงินผ่าน PromptPay และการโอนเงินผ่านธนาคาร'
    },
    {
      category: 'shopping',
      question: 'ดาวน์โหลดชีทสรุปได้เมื่อไหร่?',
      answer: 'สามารถดาวน์โหลดได้ทันทีหลังจากชำระเงินเสร็จสิ้นและได้รับการยืนยัน'
    },
    {
      category: 'shopping',
      question: 'มีชีทสรุปฟรีหรือไม่?',
      answer: 'มีครับ เรามีชีทสรุปฟรีให้ดาวน์โหลดในหมวดหมู่พิเศษ'
    },
    {
      category: 'shopping',
      question: 'สามารถขอคืนเงินได้หรือไม่?',
      answer: 'สามารถขอคืนเงินได้ภายใน 7 วันหลังจากซื้อ หากมีปัญหาด้านเทคนิค'
    },

    // Selling Questions
    {
      category: 'selling',
      question: 'ขายชีทสรุปได้หรือไม่?',
      answer: 'ได้ครับ นักศึกษาสามารถสมัครเป็นผู้ขายและอัปโหลดชีทสรุปของตนเองได้'
    },
    {
      category: 'selling',
      question: 'ต้องมีคุณสมบัติอะไรบ้าง?',
      answer: 'ต้องเป็นนักศึกษามหาวิทยาลัยเกษตรศาสตร์ และมีชีทสรุปที่มีคุณภาพดี'
    },
    {
      category: 'selling',
      question: 'ได้เงินอย่างไร?',
      answer: 'เงินจะถูกโอนเข้าบัญชีธนาคารที่ระบุหลังจากหักค่าธรรมเนียมแล้ว'
    },
    {
      category: 'selling',
      question: 'ค่าธรรมเนียมเท่าไหร่?',
      answer: 'ค่าธรรมเนียม 15% ของราคาขาย เพื่อใช้ในการพัฒนาระบบและบริการ'
    },
    {
      category: 'selling',
      question: 'ต้องส่งชีทสรุปแบบไหน?',
      answer: 'รองรับไฟล์ PDF เท่านั้น และต้องมีคุณภาพดี อ่านง่าย'
    },

    // Technical Questions
    {
      category: 'technical',
      question: 'เว็บไซต์ไม่โหลดทำอย่างไร?',
      answer: 'ลองรีเฟรชหน้าเว็บ หรือล้างแคชของเบราว์เซอร์ หากยังไม่ได้ให้ติดต่อทีมสนับสนุน'
    },
    {
      category: 'technical',
      question: 'ดาวน์โหลดไม่สำเร็จทำอย่างไร?',
      answer: 'ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต และลองดาวน์โหลดใหม่อีกครั้ง'
    },
    {
      category: 'technical',
      question: 'ใช้ได้กับมือถือหรือไม่?',
      answer: 'ได้ครับ เว็บไซต์รองรับการใช้งานบนอุปกรณ์ทุกขนาด'
    },
    {
      category: 'technical',
      question: 'เบราว์เซอร์ที่แนะนำ?',
      answer: 'แนะนำ Chrome, Firefox, Safari และ Edge เวอร์ชันล่าสุด'
    }
    ,
    // Study groups (moved to bottom)
    {
      category: 'general',
      question: 'กลุ่มติวคืออะไร ใช้อย่างไร?',
      answer: 'กลุ่มติวช่วยนัดหมายการติวแบบพบปะหรือออนไลน์ ผู้จัดสร้างกลุ่ม ระบุสถานที่/เวลา และสมาชิกกดเข้าร่วมตามนโยบาย (อนุมัติทันที/ต้องอนุมัติ)'
    },
    {
      category: 'general',
      question: 'ระบบเช็คชื่อทำงานอย่างไร?',
      answer: 'เฉพาะผู้จัดที่สามารถกดเช็คชื่อให้สมาชิกในช่วงสถานะกำลังดำเนินการ เมื่อเช็คชื่อแล้วจึงสามารถให้คะแนนกันได้หลังจบกิจกรรม'
    },
    {
      category: 'account',
      question: 'ให้คะแนนผู้จัด/สมาชิกได้ไหม?',
      answer: 'ได้ หลังจบกิจกรรม ผู้ที่เช็คชื่อแล้วสามารถให้คะแนนคนอื่นในกิจกรรมเดียวกันได้ คนละ 1 ครั้งต่อคน คะแนนจะถูกรวมเป็นคะแนนความน่าเชื่อถือ'
    },
    {
      category: 'technical',
      question: 'อีเมลเตือน 2 ชั่วโมงคืออะไร?',
      answer: 'ระบบจะส่งอีเมลแจ้งเตือนผู้เข้าร่วมล่วงหน้า 2 ชั่วโมงก่อนเริ่มกิจกรรม เพื่อช่วยให้มาตรงเวลา'
    },
    {
      category: 'technical',
      question: 'แผนที่ไม่แสดงหรือปักหมุดไม่ได้ทำอย่างไร?',
      answer: 'ตรวจสอบว่าอนุญาตการเข้าถึงตำแหน่งและอินเทอร์เน็ตปกติ ลองรีเฟรช ถ้ายังไม่ได้ให้ติดต่อทีมงานที่หน้า ติดต่อเรา'
    }
  ];

  const categories = [
    { id: 'all', name: 'ทั้งหมด', icon: QuestionMarkCircleIcon, count: allFAQs.length },
    { id: 'general', name: 'ทั่วไป', icon: DocumentTextIcon, count: allFAQs.filter(faq => faq.category === 'general').length },
    { id: 'account', name: 'บัญชีผู้ใช้', icon: UserIcon, count: allFAQs.filter(faq => faq.category === 'account').length },
    { id: 'shopping', name: 'การซื้อ', icon: ShoppingCartIcon, count: allFAQs.filter(faq => faq.category === 'shopping').length },
    { id: 'selling', name: 'การขาย', icon: AcademicCapIcon, count: allFAQs.filter(faq => faq.category === 'selling').length },
    { id: 'technical', name: 'เทคนิค', icon: ShieldCheckIcon, count: allFAQs.filter(faq => faq.category === 'technical').length }
  ];

  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredFAQs = allFAQs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleExpanded = (index) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <QuestionMarkCircleIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">คำถามที่พบบ่อย</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            ค้นหาคำตอบสำหรับคำถามที่พบบ่อยเกี่ยวกับ KU Sheet
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาคำถาม..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <category.icon className="h-4 w-4 mr-2" />
              {category.name}
              <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                {category.count}
              </span>
            </button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="bg-white rounded-lg shadow-md">
          {filteredFAQs.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredFAQs.map((faq, index) => (
                <div key={index} className="p-6">
                  <button
                    className="w-full text-left flex items-center justify-between hover:bg-gray-50 transition-colors rounded-lg p-2"
                    onClick={() => toggleExpanded(index)}
                  >
                    <h3 className="font-medium text-gray-900 text-lg pr-4">
                      {faq.question}
                    </h3>
                    {expandedItems.has(index) ? (
                      <ChevronUpIcon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    ) : (
                      <ChevronDownIcon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    )}
                  </button>
                  {expandedItems.has(index) && (
                    <div className="mt-4 pl-2">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <QuestionMarkCircleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบคำถามที่ตรงกับคำค้นหา</h3>
              <p className="text-gray-600">ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่น</p>
            </div>
          )}
        </div>

        {/* Contact Support */}
        <div className="mt-12 bg-blue-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            ยังไม่พบคำตอบที่ต้องการ?
          </h2>
          <p className="text-gray-600 mb-6">
            ติดต่อทีมสนับสนุนของเราเพื่อรับความช่วยเหลือเพิ่มเติม
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              ติดต่อเรา
            </a>
            <a
                              href="#"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors border border-blue-600"
            >
              ศูนย์ช่วยเหลือ
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
