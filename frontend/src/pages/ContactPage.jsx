import React from 'react';
import { 
  PhoneIcon, 
  EnvelopeIcon, 
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import facebookIcon from '../assets/facebook.png';
import instagramIcon from '../assets/instagram.png';

const ContactPage = () => {

  const contactInfo = [
    {
      icon: PhoneIcon,
      title: 'โทรศัพท์',
      details: ['0656144703'],
      color: 'text-blue-600',
      type: 'heroicon'
    },
    {
      icon: EnvelopeIcon,
      title: 'อีเมล',
      details: ['thosapol.n@ku.th'],
      color: 'text-green-600',
      type: 'heroicon'
    },
    {
      icon: facebookIcon,
      title: 'Facebook',
      details: ['Thosapol Nirandorn'],
      color: 'text-blue-500',
      type: 'image'
    },
    {
      icon: instagramIcon,
      title: 'Instagram',
      details: ['thosapol.z'],
      color: 'text-pink-500',
      type: 'image'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-full shadow-lg">
              <ChatBubbleLeftRightIcon className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            ติดต่อเรา
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            เราพร้อมให้ความช่วยเหลือและตอบคำถามของคุณ ติดต่อเราได้หลายช่องทาง
          </p>
        </div>

        {/* Contact Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mb-16">
          {contactInfo.map((info, index) => (
            <div key={index} className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center mb-6">
                <div className={`${info.color} bg-gradient-to-r from-blue-100 to-purple-100 p-3 rounded-xl mr-4`}>
                  {info.type === 'image' ? (
                    <img src={info.icon} alt={info.title} className="h-8 w-8" />
                  ) : (
                    <info.icon className="h-8 w-8" />
                  )}
                </div>
                <h3 className="text-2xl font-bold text-gray-800">{info.title}</h3>
              </div>
              <div className="space-y-2">
                {info.details.map((detail, detailIndex) => (
                  <p key={detailIndex} className="text-gray-600 text-lg font-medium">
                    {detail}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Study Group help section removed per request */}


      </div>
    </div>
  );
};

export default ContactPage;
