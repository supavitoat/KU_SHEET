import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { sellerAPI, adminAPI, getBaseURL } from '../../services/api';
import { facultiesList, majorsList } from '../../constants/academics';
import {
  DocumentTextIcon,
  PhotoIcon,
  XMarkIcon,
  CloudArrowUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// ฟังก์ชันช่วยตัด /api ออกจาก VITE_API_URL
function getStaticUrl(path) {
  const base = getBaseURL() || (typeof window !== 'undefined' ? window.location.origin.replace(/\/+$/,'') : '');
  return `${base}${path}`.replace(/([^:]\/)(\/)+/g, '$1/');
}

const EditSheetPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, syncSellerProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
  const [existingSheetData, setExistingSheetData] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    thaiSubjectName: '',
    englishSubjectName: '',
    subjectCode: '',
    faculty: '',
    facultyId: '',
    major: '',
    majorId: '',
    section: '',
    semester: '',
    academicYear: '',
    description: '',
    price: '',
    bankDetails: ''
  });
  const [errors, setErrors] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [sellerProfile, setSellerProfile] = useState(null);
  const [selectedPreviews, setSelectedPreviews] = useState([]); // array
  const [previewImageUrls, setPreviewImageUrls] = useState([]); // array
  const [existingPreviews, setExistingPreviews] = useState([]); // string[]
  const [previewsToRemove, setPreviewsToRemove] = useState([]); // string[]

  // Check if we're editing an existing sheet
  useEffect(() => {
    if (id) {
      setIsEditing(true);
      fetchSheetData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // preload seller profile ตอน mount และ sync กับ AuthContext
  useEffect(() => {
    const loadSellerProfile = async () => {
      try {
        // แอดมินไม่ต้องโหลด seller profile
        if (user?.role === 'ADMIN') {
          // Admin สามารถแก้ไขชีทของ seller ได้ แต่ต้องโหลดข้อมูล seller ของชีทนั้น
          setSellerProfile({ isAdmin: true });
          // ไม่ return ออก เพราะต้องโหลดข้อมูล seller ของชีทนั้น
        }
        
        // โหลดข้อมูล seller profile โดยตรง ไม่ต้อง sync กับ AuthContext ทุกครั้ง
        const res = await sellerAPI.getSellerProfile();
    if (res.data.success && res.data.data) {
          setSellerProfile(res.data.data);
          
          // อัปเดต bankInfo จาก sellerProfile
          const sellerData = res.data.data;
          if (sellerData.bankName || sellerData.bankAccount || sellerData.accountName || sellerData.promptPayId || 
              sellerData.bank_name || sellerData.bank_account || sellerData.account_name || sellerData.prompt_pay_id) {
            
            const bankInfoData = {
              bankName: sellerData.bankName || sellerData.bank_name || '',
              bankAccount: sellerData.bankAccount || sellerData.bank_account || '',
              accountName: sellerData.accountName || sellerData.account_name || '',
              promptPayId: sellerData.promptPayId || sellerData.prompt_pay_id || ''
            };
            
            setBankInfo(bankInfoData);
            
            // ตรวจสอบสถานะข้อมูลธนาคาร
            const isComplete = !!((sellerData.bankName || sellerData.bank_name)?.trim() && (sellerData.bankAccount || sellerData.bank_account)?.trim() && (sellerData.accountName || sellerData.account_name)?.trim());
            setBankInfoStatus(isComplete ? 'complete' : 'incomplete');
      }
        } else {
          console.error('❌ Failed to load seller profile:', res.data);
          toast.error('ไม่สามารถโหลดข้อมูลโปรไฟล์ได้');
        }
      } catch (err) {
        console.error('❌ Error loading seller profile:', err);
        // ถ้าเกิด error ให้ลอง sync กับ AuthContext เป็น fallback
        try {
          await syncSellerProfile();
        } catch (syncErr) {
          console.error('❌ Error syncing seller profile:', syncErr);
          toast.error('ไม่สามารถโหลดข้อมูลโปรไฟล์ได้ กรุณาลองใหม่อีกครั้ง');
        }
      }
    };
    
    if (user) {
      loadSellerProfile();
    }
  }, [user, syncSellerProfile]); // track whole user to satisfy exhaustive-deps

  // 2. ใช้ facultiesList และ majorsList แทน state faculties/majors
  // use facultiesList and majorsList directly; remove extra state

  const fileInputRef = useRef(null);
  const previewInputRef = useRef(null);

  // 1. ใน state bankInfo ให้เหลือ bankName, bankAccount
  const [bankInfo, setBankInfo] = useState({ bankName: '', bankAccount: '', accountName: '', promptPayId: '' });
  const bankInfoRef = React.useRef(bankInfo);
  useEffect(() => { bankInfoRef.current = bankInfo; }, [bankInfo]);
  // เก็บค่าล่าสุดที่บันทึกลงฐานข้อมูลไว้เพื่อกันการอัปเดตซ้ำ
  const lastSavedBankRef = React.useRef(null);
  const [bankInfoStatus, setBankInfoStatus] = useState('unknown'); // 'unknown' | 'complete' | 'incomplete'
  const [bankInfoLoading, setBankInfoLoading] = useState(false);

  // useEffect: เมื่อกรอกราคา (และราคา > 0) ให้เช็คข้อมูลธนาคาร (คงไว้)
  useEffect(() => {
    if (formData.price && Number(formData.price) > 0) {
      setBankInfoLoading(true);
      // ใช้ข้อมูลจาก sellerProfile แทนการเรียก API แยก
      if (sellerProfile) {
        const bankName = sellerProfile.bankName || '';
        const bankAccount = sellerProfile.bankAccount || '';
        const accountName = sellerProfile.accountName || '';
        
        // ตรวจสอบว่าข้อมูลครบถ้วนจริงหรือไม่
        const isComplete = !!(bankName.trim() && bankAccount.trim() && accountName.trim());
        
        if (isComplete) {
          setBankInfoStatus('complete');
          // use ref to read latest promptPayId without adding as dependency
          setBankInfo({ bankName, bankAccount, accountName, promptPayId: bankInfoRef.current.promptPayId || '' });
        } else {
          setBankInfoStatus('incomplete');
          setBankInfo({ bankName, bankAccount, accountName, promptPayId: bankInfoRef.current.promptPayId || '' });
        }
      } else {
        setBankInfoStatus('incomplete');
        setBankInfo({ bankName: '', bankAccount: '', accountName: '', promptPayId: '' });
      }
      setBankInfoLoading(false);
    } else {
      setBankInfoStatus('unknown');
    }
  }, [formData.price, sellerProfile]);

  // useEffect: ดึงข้อมูลธนาคารจาก sellerProfile เมื่อโหลดหน้าครั้งแรก (เฉพาะ seller)
  useEffect(() => {
    // Admin ไม่ต้องโหลดข้อมูลธนาคารจาก seller profile
    if (user?.role === 'ADMIN') {
      return;
    }
    
    if (sellerProfile && !sellerProfile.isAdmin) {
      const bankData = {
        bankName: sellerProfile.bankName || sellerProfile.bank_name || '',
        bankAccount: sellerProfile.bankAccount || sellerProfile.bank_account || '',
        accountName: sellerProfile.accountName || sellerProfile.account_name || '',
        promptPayId: sellerProfile.promptPayId || sellerProfile.prompt_pay_id || ''
      };
      
  // อัพเดท bankInfo state ทันที
  setBankInfo(bankData);
      
      // ถ้ามีราคาและข้อมูลธนาคารครบ ให้ set status เป็น complete
      if (formData.price && Number(formData.price) > 0) {
        const isComplete = !!((sellerProfile.bankName || sellerProfile.bank_name)?.trim() && (sellerProfile.bankAccount || sellerProfile.bank_account)?.trim() && (sellerProfile.accountName || sellerProfile.account_name)?.trim());
        setBankInfoStatus(isComplete ? 'complete' : 'incomplete');
        }
    }
  }, [sellerProfile, formData.price, user?.role]);

  // useEffect เพื่อติดตามการเปลี่ยนแปลงของ bankInfo
  // removed empty effect watching bankInfo

  // เมื่อโหลด sellerProfile แล้ว ให้ตั้งค่า lastSavedBankRef เป็นค่าจากโปรไฟล์ล่าสุด
  useEffect(() => {
    if (sellerProfile && user?.role !== 'ADMIN') {
      lastSavedBankRef.current = {
        bankName: sellerProfile.bankName || sellerProfile.bank_name || '',
        bankAccount: sellerProfile.bankAccount || sellerProfile.bank_account || '',
        accountName: sellerProfile.accountName || sellerProfile.account_name || '',
        promptPayId: sellerProfile.promptPayId || sellerProfile.prompt_pay_id || ''
      };
    }
  }, [sellerProfile, user?.role]);

  // Auto-save ข้อมูลธนาคารทันทีที่กรอกครบ (เฉพาะผู้ขาย ไม่ใช่แอดมิน)
  useEffect(() => {
    if (user?.role === 'ADMIN') return; // แอดมินไม่อัปเดตโปรไฟล์ผู้ขาย
    const priceNum = Number(formData.price || 0);
    const { bankName, bankAccount, accountName, promptPayId } = bankInfo;

    // ต้องมีราคา > 0 และกรอกข้อมูลครบถ้วนก่อน
    if (!(priceNum > 0 && bankName?.trim() && bankAccount?.trim() && accountName?.trim())) {
      return;
    }

    // ถ้าไม่มีการเปลี่ยนแปลงจากค่าที่บันทึกล่าสุด ให้ข้าม
    const last = lastSavedBankRef.current || {};
    const changed = (
      bankName !== (last.bankName || '') ||
      bankAccount !== (last.bankAccount || '') ||
      accountName !== (last.accountName || '') ||
      (promptPayId || '') !== (last.promptPayId || '')
    );
    if (!changed) return;

    // หน่วงเวลาเล็กน้อยเพื่อกันการยิง API ถี่เกินไป ขณะพิมพ์
    const t = setTimeout(async () => {
      try {
        await sellerAPI.updateSellerProfile({
          pen_name: sellerProfile?.penName || sellerProfile?.pen_name || '',
          phone: sellerProfile?.phone || '0000000000',
          bank_name: bankName,
          bank_account: bankAccount,
          account_name: accountName,
          prompt_pay_id: promptPayId,
        });
        // อัปเดต state และตัวชี้วัดว่าบันทึกล่าสุดเป็นค่าไหน
        lastSavedBankRef.current = { bankName, bankAccount, accountName, promptPayId };
        setSellerProfile(prev => ({
          ...prev,
          bankName,
          bankAccount,
          accountName,
          promptPayId,
        }));
        // ไม่แสดง toast เพื่อเลี่ยงสแปม UI ในการพิมพ์
      } catch (e) {
        console.error('Auto-save bank info failed:', e);
      }
    }, 800);

    return () => clearTimeout(t);
    // ใส่เฉพาะ dependency ที่จำเป็น เพื่อกันการวนลูปไม่จำเป็น
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bankInfo.bankName, bankInfo.bankAccount, bankInfo.accountName, bankInfo.promptPayId, formData.price, user?.role]);

  // removed unused semesters and academicYears arrays

  const fetchSheetData = useCallback(async () => {
    try {
      setIsLoadingSheet(true);
      // แอดมินใช้ adminAPI, seller ใช้ sellerAPI
          const response = user?.role === 'ADMIN' 
      ? await adminAPI.getSheetById(id)
      : await sellerAPI.getSheetById(id);
    

      const sheet = response.data.data;
      
      // ตรวจสอบสถานะของชีท (แอดมินสามารถดูได้ทุกสถานะ)
      if (user?.role !== 'ADMIN' && sheet.status !== 'PENDING' && sheet.status !== 'REJECTED') {
        toast.error('ไม่สามารถแก้ไขชีทได้ เนื่องจากชีทนี้ได้รับการอนุมัติแล้ว');
        navigate('/seller/manage');
        return;
      }
      
      // แอดมินสามารถดูข้อมูลชีทได้ทุกสถานะ
  // แอดมินสามารถดูข้อมูลชีทได้ทุกสถานะ
      
      // Debug: แสดงข้อมูลที่ได้จาก API
      // Parse subject names from JSON if available
      let thaiSubjectName = '';
      let englishSubjectName = '';
      
      if (sheet.subjectNameJSON) {
        try {
          // Try to parse as JSON first
          const subjectNames = JSON.parse(sheet.subjectNameJSON);
          if (subjectNames.th && subjectNames.en) {
            thaiSubjectName = subjectNames.th;
            englishSubjectName = subjectNames.en;
          } else {
            // Fallback to original value
            thaiSubjectName = sheet.subjectNameJSON;
            englishSubjectName = sheet.subjectNameJSON;
          }
  } catch {
          // If not JSON, use as is
          thaiSubjectName = sheet.subjectNameJSON;
          englishSubjectName = sheet.subjectNameJSON;
        }
      } else {
        // Fallback to subject name from database
        thaiSubjectName = sheet.subject?.name || '';
        englishSubjectName = sheet.subject?.name || '';
      }
      
      // Debug: แสดงข้อมูลที่ parse ได้
      // Map the sheet data to form data
      const mappedFormData = {
        title: sheet.title || '',
        thaiSubjectName: thaiSubjectName || '',
        englishSubjectName: englishSubjectName || '',
        subjectCode: sheet.subjectCode || '',
        faculty: sheet.faculty || '', // ใช้ชื่อคณะโดยตรง
        major: sheet.major || '', // ใช้ชื่อสาขาโดยตรง
        section: sheet.section || '',
        semester: sheet.term || '',
        academicYear: sheet.year?.toString() || '',
        description: sheet.shortDescription || '',
        price: sheet.price?.toString() || '',
        bankDetails: ''
      };

      setFormData(mappedFormData);

      // Set bank info from sheet data if available (ทั้ง admin และ seller)
      if (sheet.seller) {
        const bankData = {
          bankName: sheet.seller.bankName || sheet.seller.bank_name || '',
          bankAccount: sheet.seller.bankAccount || sheet.seller.bank_account || '',
          accountName: sheet.seller.accountName || sheet.seller.account_name || '',
          promptPayId: sheet.seller.promptPayId || sheet.seller.prompt_pay_id || ''
        };
        
    // อัพเดท bankInfo state ทันที
    setBankInfo(bankData);
        
        // Check if bank info is complete
        const isComplete = !!((sheet.seller.bankName || sheet.seller.bank_name)?.trim() && 
                              (sheet.seller.bankAccount || sheet.seller.bank_account)?.trim() && 
                              (sheet.seller.accountName || sheet.seller.account_name)?.trim());
        setBankInfoStatus(isComplete ? 'complete' : 'incomplete');
        
        // อัปเดต sellerProfile สำหรับ admin เพื่อแสดงข้อมูลธนาคาร
        if (user?.role === 'ADMIN') {
          setSellerProfile(prev => ({
            ...prev,
            ...sheet.seller,
            isAdmin: true
          }));
        }
      } else {
        setBankInfo({ bankName: '', bankAccount: '', accountName: '', promptPayId: '' });
        setBankInfoStatus('incomplete');
      }



      // Set preview URLs and create file objects if files exist
  // Preview images handled below via existingPreviews/previewImageUrls
      
      // ใช้ pdfFile เป็นหลัก (ไม่ใช้ filePath)
      const pdfFileName = sheet.pdfFile;
  if (pdfFileName) {
        const pdfFile = {
          name: pdfFileName, // ชื่อไฟล์จริง
          type: 'application/pdf',
          size: 0,
          isExisting: true
        };
        setSelectedFile(pdfFile);
        }

      // Update available majors based on faculty
  // available majors derived lazily from facultiesList when rendering options

      setExistingSheetData(sheet); // เก็บข้อมูลชีทที่มีอยู่

      // ใน fetchSheetData หลังจากได้ previewImageNames แล้ว
  // ใน fetchSheetData หลังจากได้ previewImageNames แล้ว
      let previewImageNames = [];
      if (sheet.previewImages) {
        try {
          previewImageNames = typeof sheet.previewImages === 'string'
            ? JSON.parse(sheet.previewImages)
            : sheet.previewImages;
        } catch {
          previewImageNames = [];
        }
      }
      setExistingPreviews(previewImageNames);
      setPreviewImageUrls(previewImageNames.map(name => getStaticUrl(`/uploads/previews/${name}`)));
      setSelectedPreviews([]); // reset รูปใหม่



    } catch (error) {
      console.error('Error fetching sheet data:', error);
      toast.error('😔 ไม่สามารถโหลดข้อมูลชีทได้ กรุณาลองใหม่อีกครั้ง');
      navigate('/seller/manage');
    } finally {
      setIsLoadingSheet(false);
    }
  }, [id, navigate, user?.role]);

  const handleInputChange = (e) => {
    let { name, value } = e.target;

    // For subject code: allow only digits
    if (name === 'subjectCode') {
      value = (value || '').toString().replace(/\D/g, '');
    }

    // Round price to integer if price field
    if (name === 'price' && value) {
      const roundedValue = Math.round(parseFloat(value) || 0);
      setFormData(prev => ({
        ...prev,
        [name]: roundedValue.toString()
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // 3. handleInputChange: เมื่อเลือกคณะ ให้ filter majorsList ตาม facultyId
    if (name === 'faculty') {
      const selectedFaculty = facultiesList.find(f => f.name === value);
      if (selectedFaculty) {
        setFormData(prev => ({
          ...prev,
          major: '' // Reset major when faculty changes
        }));
      }
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        toast.error('📄 ไฟล์ชีทต้องมีขนาดไม่เกิน 50MB');
        return;
      }

      if (!file.type.includes('pdf')) {
        toast.error('📄 กรุณาเลือกไฟล์ PDF เท่านั้น');
        return;
      }

      setSelectedFile(file);
    }
  };

  // removed unused handleCoverSelect

  const handlePreviewSelect = (event) => {
    const files = Array.from(event.target.files);
    // รวมไฟล์เดิมกับไฟล์ใหม่ (ไม่ซ้ำ) จำกัดรวมกันไม่เกิน 5
    const allFiles = [...selectedPreviews, ...files].slice(0, 5 - existingPreviews.length);
    setSelectedPreviews(allFiles);
    setPreviewImageUrls([
      ...existingPreviews.map(name => getStaticUrl(`/uploads/previews/${name}`)),
      ...allFiles.map(file => URL.createObjectURL(file))
    ]);
  };

  const validateForm = () => {
    const newErrors = {};

    // ตรวจสอบข้อมูลพื้นฐาน
    if (!formData.title.trim()) {
      newErrors.title = 'กรุณากรอกชื่อชีทสรุป';
    }

    if (!formData.thaiSubjectName.trim()) {
      newErrors.thaiSubjectName = 'กรุณากรอกชื่อวิชาภาษาไทย';
    }

    if (!formData.englishSubjectName.trim()) {
      newErrors.englishSubjectName = 'กรุณากรอกชื่อวิชาภาษาอังกฤษ';
    }

    if (!formData.subjectCode.trim()) {
      newErrors.subjectCode = 'กรุณากรอกรหัสวิชา';
    }

    if (!formData.faculty || formData.faculty.trim() === '') {
      newErrors.faculty = 'กรุณาเลือกคณะ';
    }

    if (!formData.major || formData.major.trim() === '') {
      newErrors.major = 'กรุณาเลือกสาขา';
    }

    if (!formData.section.trim()) {
      newErrors.section = 'กรุณากรอกหมู่เรียน';
    }

    if (!formData.semester) {
      newErrors.semester = 'กรุณาเลือกเทอม';
    }

    if (!formData.academicYear) {
      newErrors.academicYear = 'กรุณาเลือกปีการศึกษา';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'กรุณากรอกรายละเอียดชีท';
    }

    if (formData.price && formData.price < 0) {
      newErrors.price = 'ราคาต้องไม่ติดลบ';
    }

    if (formData.price && formData.price % 1 !== 0) {
      newErrors.price = 'ราคาต้องเป็นจำนวนเต็มเท่านั้น';
    }

    // ตรวจสอบข้อมูลธนาคารเมื่อมีราคา
    if (formData.price && Number(formData.price) > 0) {
      if (!bankInfo.accountName || !bankInfo.accountName.trim()) {
        newErrors.accountName = 'กรุณากรอกชื่อเจ้าของบัญชี';
      }
      if (!bankInfo.bankName || !bankInfo.bankName.trim()) {
        newErrors.bankName = 'กรุณากรอกชื่อธนาคาร';
      }
      if (!bankInfo.bankAccount || !bankInfo.bankAccount.trim()) {
        newErrors.bankAccount = 'กรุณากรอกเลขบัญชีธนาคาร';
      }
      if (!bankInfo.promptPayId || !bankInfo.promptPayId.trim()) {
        newErrors.promptPayId = 'กรุณากรอกหมายเลข PromptPay';
      }
      
      // ตรวจสอบว่าข้อมูลธนาคารครบถ้วนหรือไม่
      if (!bankInfo.accountName?.trim() || !bankInfo.bankName?.trim() || !bankInfo.bankAccount?.trim()) {
        newErrors.bankInfo = 'กรุณากรอกข้อมูลธนาคารให้ครบถ้วน';
      }
    }

    // ตรวจสอบไฟล์ PDF
    if (!isEditing && !selectedFile) {
      newErrors.file = 'กรุณาเลือกไฟล์ชีท (PDF)';
    } else if (isEditing && !selectedFile && !existingSheetData?.pdfFile) {
      newErrors.file = 'กรุณาเลือกไฟล์ชีท (PDF)';
    }

    // ตรวจสอบข้อมูล seller profile (เฉพาะเมื่อไม่ใช่แอดมิน)
    if (user?.role !== 'ADMIN') {
      if (!sellerProfile?.penName && !sellerProfile?.pen_name) {
        newErrors.sellerProfile = 'กรุณากรอกข้อมูล pen name ในโปรไฟล์ก่อน';
      }
      
      // ตรวจสอบข้อมูลธนาคารเมื่อมีราคา
      if (formData.price && Number(formData.price) > 0) {
        if (!bankInfo.bankName || !bankInfo.bankAccount || !bankInfo.accountName) {
          newErrors.bankInfo = 'กรุณากรอกข้อมูลธนาคารให้ครบถ้วน';
        }
        if (!bankInfo.promptPayId || !bankInfo.promptPayId.trim()) {
          newErrors.promptPayId = 'กรุณากรอกหมายเลข PromptPay';
        }
      }
    }

    // Debug: แสดง error ที่เกิดขึ้น
  // set errors for display

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      // แสดง error message ที่ชัดเจนขึ้น
      const errorMessages = Object.values(errors);
      if (errorMessages.length > 0) {
        // แสดง error แรกที่เจอ
        const firstError = errorMessages[0];
        toast.error(`กรุณากรอกข้อมูลให้ครบถ้วน: ${firstError}`);
        
        // แสดง error ทั้งหมดใน console เพื่อ debug
        } else {
        toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      }
      return;
    }

    setIsLoading(true);

    try {
      // 1. ตรวจสอบและเตรียมข้อมูล seller profile ก่อน
      let penName = '';
      let phone = '';
      
      // ถ้าเป็นแอดมิน ให้ใช้ข้อมูล default
      if (user?.role === 'ADMIN') {
        penName = 'Admin User';
        phone = '0000000000';
      } else {
        // ถ้าเป็น seller ปกติ ให้ใช้ข้อมูลจาก sellerProfile
        penName = sellerProfile?.penName || sellerProfile?.pen_name || user?.full_name || 'Seller';
        phone = sellerProfile?.phone || '0000000000';
        
        // ตรวจสอบว่ามี pen_name หรือไม่
        if (!penName || penName.trim() === '') {
          toast.error('กรุณากรอกข้อมูล pen name ในโปรไฟล์ก่อน');
          setIsLoading(false);
          return;
        }
        
        // ตรวจสอบว่าข้อมูลธนาคารครบถ้วนหรือไม่ (เฉพาะเมื่อมีราคา)
        if (formData.price && Number(formData.price) > 0) {
          if (!bankInfo.bankName || !bankInfo.bankAccount || !bankInfo.accountName) {
            toast.error('กรุณากรอกข้อมูลธนาคารให้ครบถ้วน');
            setIsLoading(false);
            return;
          }
        }
      }

      // 2. Sync bank info to seller profile (สำหรับ seller ปกติเท่านั้น, admin จะส่งผ่าน bankDetails ใน form)
      if (user?.role !== 'ADMIN' && bankInfo.bankName && bankInfo.bankAccount && bankInfo.accountName) {
        try {
          const profileRes = await sellerAPI.updateSellerProfile({
            pen_name: penName,
            phone: phone,
            bank_name: bankInfo.bankName,
            bank_account: bankInfo.bankAccount,
            account_name: bankInfo.accountName,
            prompt_pay_id: bankInfo.promptPayId
          });
          
          if (!profileRes.data.success) {
            toast.error('เกิดข้อผิดพลาดในการอัปเดตข้อมูลธนาคาร');
            setIsLoading(false);
            return;
          }

          // อัปเดตข้อมูลใน state หลังจากอัปเดตสำเร็จ
          setSellerProfile(prev => ({
            ...prev,
            bankName: bankInfo.bankName,
            bankAccount: bankInfo.bankAccount,
            accountName: bankInfo.accountName,
            promptPayId: bankInfo.promptPayId
          }));
        } catch (error) {
          console.error('❌ Error updating seller profile:', error);
          toast.error('เกิดข้อผิดพลาดในการอัปเดตข้อมูลธนาคาร');
          setIsLoading(false);
          return;
        }
      }

      // 3. ดำเนินการ submit ชีทตามปกติ
      const formDataToSend = new FormData();
      
      // ส่งข้อมูลตาม field names ที่ backend ต้องการ
      formDataToSend.append('title', formData.title);
      formDataToSend.append('thaiSubjectName', formData.thaiSubjectName);
      formDataToSend.append('englishSubjectName', formData.englishSubjectName);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('subjectCode', formData.subjectCode);
      formDataToSend.append('section', formData.section);
      formDataToSend.append('semester', formData.semester);
      formDataToSend.append('academicYear', parseInt(formData.academicYear));
      formDataToSend.append('price', Math.round(parseFloat(formData.price) || 0));
      
      // ตรวจสอบและส่ง faculty_id และ subject_id
  // ตรวจสอบว่าข้อมูลถูกต้องหรือไม่
      if (!formData.faculty || formData.faculty.trim() === '') {
        toast.error('กรุณาเลือกคณะ');
        return;
      }
      if (!formData.major || formData.major.trim() === '') {
        toast.error('กรุณาเลือกสาขา');
        return;
      }
      
      // ส่งแค่ชื่อคณะและสาขา (ไม่ใช้ ID)
      formDataToSend.append('faculty', formData.faculty);     // ส่งชื่อคณะ
      formDataToSend.append('major', formData.major);         // ส่งชื่อสาขา

      // ส่งข้อมูลธนาคาร (ทั้ง seller และ admin)
      if (formData.price && Number(formData.price) > 0 && bankInfo.bankName && bankInfo.bankAccount && bankInfo.accountName) {
        const bankDetails = {
          accountName: bankInfo.accountName,
          accountNumber: bankInfo.bankAccount,
          bankName: bankInfo.bankName
        };
        formDataToSend.append('bankDetails', JSON.stringify(bankDetails));
        }

      // จัดการไฟล์ PDF
      if (selectedFile) {
        if (selectedFile.isExisting) {
          // ไฟล์เดิม ไม่ต้องส่งไฟล์ใหม่
          formDataToSend.append('keep_existing_pdf', 'true');
        } else if (selectedFile instanceof File) {
          // ไฟล์ใหม่ - ตรวจสอบให้แน่ใจว่าเป็น File object
          formDataToSend.append('pdf_file', selectedFile);
        }
      } else if (isEditing && existingSheetData?.pdfFile) {
        // เมื่อแก้ไขชีทและไม่มีไฟล์ใหม่ แต่มีไฟล์เดิม
        formDataToSend.append('keep_existing_pdf', 'true');
      }

      // จัดการรูปตัวอย่าง - ใช้ selectedPreviews เป็นหลัก
      if (selectedPreviews && selectedPreviews.length > 0) {
        selectedPreviews.forEach((file) => {
          if (file instanceof File) {
            formDataToSend.append('preview_images', file);
          }
        });
      }
      if (isEditing) {
        // เฉพาะตอนแก้ไขเท่านั้น
        formDataToSend.append('keep_previews', JSON.stringify(existingPreviews));
        if (previewsToRemove.length > 0) {
          formDataToSend.append('remove_previews', JSON.stringify(previewsToRemove));
        }
      }

      // Debug: แสดงข้อมูลที่ส่งไป
      // console.log('🔍 Form data being sent:');
      // for (let [key, value] of formDataToSend.entries()) {
      //   if (value instanceof File) {
      //     console.log(`${key}:`, `File(${value.name}, ${value.size} bytes, ${value.type})`);
      //   } else {
      //     console.log(`${key}:`, value);
      //   }
      // }
      if (isEditing) {
        await sellerAPI.updateSheet(id, formDataToSend);
        toast.success('🎉 อัปเดตชีทสำเร็จ!');
      } else {
        await sellerAPI.createSheet(formDataToSend);
        toast.success('🎉 อัพโหลดชีทสำเร็จ!');
      }
      
      navigate('/seller/manage');

    } catch (error) {
      console.error('Error uploading sheet:', error);
      const message = error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัพโหลดชีท';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleViewPdf = (fileName) => {
    if (fileName) {
      const pdfUrl = getStaticUrl(`/uploads/sheets/${fileName}`);
      window.open(pdfUrl, '_blank');
    }
  };

  // removed unused removeCover (no longer needed)

  const removePreview = (idx) => {
    if (idx < existingPreviews.length) {
      // ลบรูปเดิม
      setPreviewsToRemove(prev => [...prev, existingPreviews[idx]]);
      const newExisting = existingPreviews.filter((_, i) => i !== idx);
      setExistingPreviews(newExisting);
      setPreviewImageUrls([
        ...newExisting.map(name => getStaticUrl(`/uploads/previews/${name}`)),
        ...selectedPreviews.map(file => URL.createObjectURL(file))
      ]);
    } else {
      // ลบรูปใหม่
      const newIdx = idx - existingPreviews.length;
      const newSelected = selectedPreviews.filter((_, i) => i !== newIdx);
      setSelectedPreviews(newSelected);
      setPreviewImageUrls([
        ...existingPreviews.map(name => getStaticUrl(`/uploads/previews/${name}`)),
        ...newSelected.map(file => URL.createObjectURL(file))
      ]);
    }
  };

  // removed unused thaiBanks list

  return (
    <div className="min-h-screen bg-white relative">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.3s ease-out forwards;
          opacity: 0;
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animate-gradient-flow {
          background: linear-gradient(90deg, #9333ea, #7c3aed, #3b82f6, #4f46e5, #9333ea, #7c3aed, #3b82f6, #4f46e5);
          background-size: 200% 100%;
          animation: gradientFlow 6s ease-in-out infinite;
        }
        
        @keyframes gradientFlow {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>

      

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-4 mt-6">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent leading-tight py-2 animate-fadeInUp" style={{ animationDelay: '0.02s' }}>
              {isEditing ? 'แก้ไขชีท' : 'สร้างชีทใหม่'}
            </h1>
          </div>
          <p className="text-gray-600 mb-6 animate-fadeInUp" style={{ animationDelay: '0.05s' }}>
            {isEditing ? 'แก้ไขข้อมูลชีทของคุณ' : 'อัปโหลดชีทสรุปของคุณและแบ่งปันความรู้กับชุมชนนักศึกษา'}
          </p>
          <p className="text-red-600 font-semibold mb-6 text-lg animate-fadeInUp" style={{ animationDelay: '0.08s' }}>*ห้ามนำข้อสอบ รวมถึงเฉลยข้อสอบ มาแชร์ลงใน KU SHEET โดดเด็ดขาด*</p>

          {/* Gradient Divider */}
          <div className="flex justify-center mb-8 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            <div className="w-24 h-1 rounded-full hover:w-32 transition-all duration-300 shadow-lg animate-gradient-flow"></div>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-4xl mx-auto">
          {isLoadingSheet ? (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">กำลังโหลดข้อมูลชีท...</p>
              </div>
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 pb-12 md:pb-16 animate-fadeInUp" style={{ animationDelay: '0.25s' }}>
            {/* ฟอร์มหลัก */}
            <form onSubmit={handleSubmit} className="space-y-10">
              {/* แสดง error message สำหรับ seller profile */}
              {errors.sellerProfile && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl animate-fadeInUp" style={{ animationDelay: '0.25s' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-red-700 font-medium">⚠️ {errors.sellerProfile}</span>
                  </div>
                  <p className="text-red-600 text-sm mt-1">
                    กรุณาไปที่ <button type="button" onClick={() => navigate('/seller/profile')} className="text-blue-600 hover:underline font-medium">หน้าโปรไฟล์</button> เพื่อกรอกข้อมูลที่จำเป็นก่อน
                  </p>
                </div>
              )}

              {errors.bankInfo && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl animate-fadeInUp" style={{ animationDelay: '0.25s' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-red-700 font-medium">⚠️ {errors.bankInfo}</span>
                  </div>
                  <p className="text-red-600 text-sm mt-1">
                    กรุณากรอกข้อมูลธนาคารด้านล่างเพื่อรับเงินจากการขายชีท
                  </p>
                </div>
              )}



              {/* ชื่อชีทสรุป - ด้านบนสุด */}
              <div className="group">
                <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-purple-600 transition-colors animate-fadeInUp" style={{ animationDelay: '0.3s' }}>ชื่อชีทสรุป <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input 
                    type="text" 
                    name="title" 
                    value={formData.title || ''} 
                    onChange={handleInputChange} 
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm ${errors.title ? 'border-red-500' : 'border-gray-300 group-hover:border-purple-300'} animate-fadeInUp`} 
                    style={{ animationDelay: '0.35s' }}
                    placeholder="ชื่อชีทที่คุณอยากตั้งได้เลย เช่น สรุปทุกเรื่องก่อนสอบไฟนอล" 
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 transition-all duration-300 pointer-events-none"></div>
                </div>
                {errors.title && (<p className="mt-1 text-sm text-red-600 animate-pulse animate-fadeInUp" style={{ animationDelay: '0.4s' }}>{errors.title}</p>)}
              </div>

              {/* กลุ่มข้อมูลวิชา */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-purple-600 transition-colors animate-fadeInUp" style={{ animationDelay: '0.45s' }}>ชื่อวิชาภาษาไทย <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type="text" name="thaiSubjectName" value={formData.thaiSubjectName} onChange={handleInputChange} className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm ${errors.thaiSubjectName ? 'border-red-500' : 'border-gray-300 group-hover:border-purple-300'} animate-fadeInUp`} style={{ animationDelay: '0.5s' }} placeholder="เช่น แคลคูลัส I" />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 transition-all duration-300 pointer-events-none"></div>
                  </div>
                  {errors.thaiSubjectName && (<p className="mt-1 text-sm text-red-600 animate-pulse animate-fadeInUp" style={{ animationDelay: '0.55s' }}>{errors.thaiSubjectName}</p>)}
                </div>
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-purple-600 transition-colors animate-fadeInUp" style={{ animationDelay: '0.6s' }}>ชื่อวิชาภาษาอังกฤษ <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type="text" name="englishSubjectName" value={formData.englishSubjectName} onChange={handleInputChange} className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm ${errors.englishSubjectName ? 'border-red-500' : 'border-gray-300 group-hover:border-purple-300'} animate-fadeInUp`} style={{ animationDelay: '0.65s' }} placeholder="เช่น Calculus I" />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 transition-all duration-300 pointer-events-none"></div>
                  </div>
                  {errors.englishSubjectName && (<p className="mt-1 text-sm text-red-600 animate-pulse animate-fadeInUp" style={{ animationDelay: '0.7s' }}>{errors.englishSubjectName}</p>)}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-purple-600 transition-colors animate-fadeInUp" style={{ animationDelay: '0.75s' }}>รหัสวิชา <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type="text" name="subjectCode" value={formData.subjectCode} onChange={handleInputChange} inputMode="numeric" pattern="[0-9]*" className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm ${errors.subjectCode ? 'border-red-500' : 'border-gray-300 group-hover:border-purple-300'} animate-fadeInUp`} style={{ animationDelay: '0.8s' }} placeholder="เช่น 01417111" onPaste={(e) => {
                      const paste = e.clipboardData.getData('text') || '';
                      const digits = paste.replace(/\D/g, '');
                      if (!digits) {
                        e.preventDefault();
                        return;
                      }
                      e.preventDefault();
                      // Insert sanitized digits at current cursor position
                      const input = e.target;
                      const start = input.selectionStart || 0;
                      const end = input.selectionEnd || 0;
                      const current = input.value || '';
                      const newVal = (current.slice(0, start) + digits + current.slice(end)).replace(/\D/g, '');
                      setFormData(prev => ({ ...prev, subjectCode: newVal }));
                    }} />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 transition-all duration-300 pointer-events-none"></div>
                  </div>
                  {errors.subjectCode && (<p className="mt-1 text-sm text-red-600 animate-pulse animate-fadeInUp" style={{ animationDelay: '0.85s' }}>{errors.subjectCode}</p>)}
                </div>
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-purple-600 transition-colors animate-fadeInUp" style={{ animationDelay: '0.9s' }}>คณะ <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select 
                      name="faculty" 
                      value={formData.faculty} 
                      onChange={handleInputChange} 
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm ${errors.faculty ? 'border-red-500' : 'border-gray-300 group-hover:border-purple-300'} animate-fadeInUp appearance-none`} 
                      style={{ animationDelay: '0.95s' }}
                    >
                      <option value="">เลือกคณะ</option>
                      {facultiesList.map(faculty => (
                        <option key={faculty.id} value={faculty.name}>{faculty.name}</option>
                      ))}
                    </select>
                    <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none transition-transform duration-300 group-hover:scale-110" />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 transition-all duration-300 pointer-events-none"></div>
                  </div>
                  {errors.faculty && (<p className="mt-1 text-sm text-red-600 animate-pulse animate-fadeInUp" style={{ animationDelay: '1.0s' }}>{errors.faculty}</p>)}
                </div>
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-purple-600 transition-colors animate-fadeInUp" style={{ animationDelay: '1.05s' }}>สาขา <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select 
                      name="major" 
                      value={formData.major} 
                      onChange={handleInputChange} 
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm ${errors.major ? 'border-red-500' : 'border-gray-300 group-hover:border-purple-300'} ${!formData.faculty ? 'bg-gray-100 cursor-not-allowed' : ''} animate-fadeInUp appearance-none`} 
                      style={{ animationDelay: '1.1s' }}
                      disabled={!formData.faculty}
                    >
                      <option value="">เลือกสาขา</option>
                      {majorsList
                        .filter(major => !formData.faculty || major.facultyId === facultiesList.find(f => f.name === formData.faculty)?.id)
                        .map(major => (
                          <option key={major.id} value={major.name}>{major.name}</option>
                        ))}
                    </select>
                    <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none transition-transform duration-300 group-hover:scale-110" />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 transition-all duration-300 pointer-events-none"></div>
                  </div>
                  {errors.major && (<p className="mt-1 text-sm text-red-600 animate-pulse animate-fadeInUp" style={{ animationDelay: '1.15s' }}>{errors.major}</p>)}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-purple-600 transition-colors animate-fadeInUp" style={{ animationDelay: '1.2s' }}>หมู่ <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type="text" name="section" value={formData.section} onChange={handleInputChange} className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm ${errors.section ? 'border-red-500' : 'border-gray-300 group-hover:border-purple-300'} animate-fadeInUp`} style={{ animationDelay: '1.25s' }} placeholder="เช่น 820" />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 transition-all duration-300 pointer-events-none"></div>
                  </div>
                  {errors.section && (<p className="mt-1 text-sm text-red-600 animate-pulse animate-fadeInUp" style={{ animationDelay: '1.3s' }}>{errors.section}</p>)}
                </div>
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-purple-600 transition-colors animate-fadeInUp" style={{ animationDelay: '1.35s' }}>เทอม <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select 
                      name="semester" 
                      value={formData.semester} 
                      onChange={handleInputChange} 
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm ${errors.semester ? 'border-red-500' : 'border-gray-300 group-hover:border-purple-300'} animate-fadeInUp appearance-none`} 
                      style={{ animationDelay: '1.4s' }}
                    >
                      <option value="">เลือกเทอม</option>
                      <option value="เทอมต้น">เทอมต้น</option>
                      <option value="เทอมปลาย">เทอมปลาย</option>
                      <option value="ซัมเมอร์">ซัมเมอร์</option>
                    </select>
                    <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none transition-transform duration-300 group-hover:scale-110" />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 transition-all duration-300 pointer-events-none"></div>
                  </div>
                  {errors.semester && (<p className="mt-1 text-sm text-red-600 animate-pulse animate-fadeInUp" style={{ animationDelay: '1.45s' }}>{errors.semester}</p>)}
                </div>
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-purple-600 transition-colors animate-fadeInUp" style={{ animationDelay: '1.5s' }}>ปีการศึกษา <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select 
                      name="academicYear" 
                      value={formData.academicYear} 
                      onChange={handleInputChange} 
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm ${errors.academicYear ? 'border-red-500' : 'border-gray-300 group-hover:border-purple-300'} animate-fadeInUp appearance-none`} 
                      style={{ animationDelay: '1.55s' }}
                    >
                      <option value="">เลือกปีการศึกษา</option>
                      <option value="2568">2568</option>
                      <option value="2567">2567</option>
                      <option value="2566">2566</option>
                      <option value="2565">2565</option>
                      <option value="2564">2564</option>
                      <option value="2563">2563</option>
                      <option value="2562">2562</option>
                      <option value="2561">2561</option>
                      <option value="2560">2560</option>
                    </select>
                    <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none transition-transform duration-300 group-hover:scale-110" />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 transition-all duration-300 pointer-events-none"></div>
                  </div>
                  {errors.academicYear && (<p className="mt-1 text-sm text-red-600 animate-pulse animate-fadeInUp" style={{ animationDelay: '1.6s' }}>{errors.academicYear}</p>)}
                </div>
              </div>
              <div className="group">
                <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-purple-600 transition-colors animate-fadeInUp" style={{ animationDelay: '1.65s' }}>รายละเอียดสั้นๆ <span className="text-red-500">*</span></label>
                <div className="relative">
                  <textarea 
                    name="description" 
                    value={formData.description} 
                    onChange={handleInputChange} 
                    rows="4" 
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm ${errors.description ? 'border-red-500' : 'border-gray-300 group-hover:border-purple-300'} animate-fadeInUp`} 
                    style={{ animationDelay: '1.7s' }}
                    placeholder="อธิบายรายละเอียดของชีทสั้นๆ เช่น สรุปเนื้อหาก่อนสอบ หรือบอกหัวข้อที่เอามาสรุป..." 
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 transition-all duration-300 pointer-events-none"></div>
                </div>
                {errors.description && (<p className="mt-1 text-sm text-red-600 animate-pulse animate-fadeInUp" style={{ animationDelay: '1.75s' }}>{errors.description}</p>)}
              </div>
              {/* 1. เปลี่ยน grid ราคาและฟอร์มธนาคารให้ input ราคาอยู่เดี่ยว ๆ */}
              <div className="mb-8 group">
                <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-purple-600 transition-colors animate-fadeInUp" style={{ animationDelay: '1.8s' }}>ราคา (บาท)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    name="price" 
                    value={formData.price} 
                    onChange={handleInputChange} 
                    onWheel={(e) => e.target.blur()} 
                    min="0" 
                    step="1" 
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm ${errors.price ? 'border-red-500' : 'border-gray-300 group-hover:border-purple-300'} animate-fadeInUp`} 
                    style={{ animationDelay: '1.85s' }} 
                    placeholder="ถ้าต้องให้ผู้ใช้โหลด ฟรี!! ให้เว้นว่าง" 
                  />
                  <style>{`
                    input[type="number"]::-webkit-outer-spin-button,
                    input[type="number"]::-webkit-inner-spin-button {
                      -webkit-appearance: none;
                      margin: 0;
                    }
                    input[type="number"] {
                      -moz-appearance: textfield;
                    }
                  `}</style>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 transition-all duration-300 pointer-events-none"></div>
                </div>
                {errors.price && (<p className="mt-1 text-sm text-red-600 animate-pulse animate-fadeInUp" style={{ animationDelay: '1.9s' }}>{errors.price}</p>)}
              </div>
              {formData.price && Number(formData.price) > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-purple-700 mb-4">ข้อมูลธนาคาร (สำหรับรับเงิน)</h3>
                  
                  {/* แสดงสถานะข้อมูลธนาคาร */}
                  {bankInfoLoading ? (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-blue-700">กำลังตรวจสอบข้อมูลธนาคาร...</span>
                      </div>
                    </div>
                  ) : bankInfoStatus === 'incomplete' ? (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-700">⚠️ กรุณากรอกข้อมูลธนาคารให้ครบถ้วน</span>
                      </div>
                      <p className="text-yellow-600 text-sm mt-1">
                        ข้อมูลนี้จะถูกบันทึกในโปรไฟล์ของคุณและใช้สำหรับการรับเงิน
                      </p>
                    </div>
                  ) : null}
                  
                  {/* แสดง error message สำหรับข้อมูลธนาคาร */}
                  {errors.bankInfo && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-red-700">❌ {errors.bankInfo}</span>
                      </div>
                    </div>
                  )}
                  

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="group">
                      <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-purple-600 transition-colors">ชื่อเจ้าของบัญชี <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <input 
                          type="text" 
                          className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-purple-300" 
                          value={bankInfo.accountName} 
                          onChange={e => {
                            const newValue = e.target.value;
                            setBankInfo({ ...bankInfo, accountName: newValue });
                            // อัพเดทสถานะเมื่อมีการเปลี่ยนแปลง
                            if (newValue.trim() && bankInfo.bankName.trim() && bankInfo.bankAccount.trim()) {
                              setBankInfoStatus('complete');
                            } else {
                              setBankInfoStatus('incomplete');
                            }
                          }} 
                          placeholder="กรอกชื่อเจ้าของบัญชี" 
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 transition-all duration-300 pointer-events-none"></div>
                      </div>
                      {errors.accountName && <p className="mt-1 text-sm text-red-600 animate-pulse">{errors.accountName}</p>}
                    </div>
                    <div className="group">
                      <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-purple-600 transition-colors">ชื่อธนาคาร <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <select 
                          className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-purple-300 appearance-none" 
                          value={bankInfo.bankName} 
                          onChange={e => {
                            const newValue = e.target.value;
                            setBankInfo({ ...bankInfo, bankName: newValue });
                            // อัพเดทสถานะเมื่อมีการเปลี่ยนแปลง
                            if (newValue.trim() && bankInfo.accountName.trim() && bankInfo.bankAccount.trim()) {
                              setBankInfoStatus('complete');
                            } else {
                              setBankInfoStatus('incomplete');
                            }
                          }}
                        >
                          <option value="">เลือกธนาคาร</option>
                          <option value="กสิกรไทย">กสิกรไทย</option>
                          <option value="ไทยพาณิชย์">ไทยพาณิชย์</option>
                          <option value="ธนาคารกรุงเทพ">ธนาคารกรุงเทพ</option>
                          <option value="กรุงเทพ">กรุงเทพ</option>
                          <option value="กรุงไทย">กรุงไทย</option>
                          <option value="กรุงศรีอยุธยา">กรุงศรีอยุธยา</option>
                          <option value="ทหารไทยธนชาต">ทหารไทยธนชาต</option>
                          <option value="ออมสิน">ออมสิน</option>
                          <option value="ธ.ก.ส.">ธ.ก.ส.</option>
                          <option value="ยูโอบี">ยูโอบี</option>
                          <option value="ซีไอเอ็มบี">ซีไอเอ็มบี</option>
                          <option value="แลนด์แอนด์เฮ้าส์">แลนด์แอนด์เฮ้าส์</option>
                          {/** Removed 'อื่นๆ' option per requirement */}
                        </select>
                        <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none transition-transform duration-300 group-hover:scale-110" />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 transition-all duration-300 pointer-events-none"></div>
                      </div>
                      {errors.bankName && <p className="mt-1 text-sm text-red-600 animate-pulse">{errors.bankName}</p>}
                    </div>
                    <div className="group">
                      <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-purple-600 transition-colors">เลขบัญชีธนาคาร <span className="text-red-500">*</span></label>
                      <div className="relative">
                          <input 
                            type="text" 
                            inputMode="numeric" 
                            pattern="[0-9]*" 
                            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-purple-300" 
                            value={bankInfo.bankAccount} 
                            onChange={e => {
                              // allow only digits
                              const digits = (e.target.value || '').toString().replace(/\D/g, '');
                              setBankInfo({ ...bankInfo, bankAccount: digits });
                              // อัพเดทสถานะเมื่อมีการเปลี่ยนแปลง
                              if (digits.trim() && bankInfo.accountName.trim() && bankInfo.bankName.trim()) {
                                setBankInfoStatus('complete');
                              } else {
                                setBankInfoStatus('incomplete');
                              }
                            }} 
                            onPaste={(e) => {
                              const paste = e.clipboardData.getData('text') || '';
                              const digits = paste.replace(/\D/g, '');
                              if (!digits) {
                                e.preventDefault();
                                return;
                              }
                              e.preventDefault();
                              const input = e.target;
                              const start = input.selectionStart || 0;
                              const end = input.selectionEnd || 0;
                              const current = input.value || '';
                              const newVal = (current.slice(0, start) + digits + current.slice(end)).replace(/\D/g, '');
                              setBankInfo(prev => ({ ...prev, bankAccount: newVal }));
                            }}
                            placeholder="กรอกเลขบัญชีธนาคาร (เฉพาะตัวเลข)" 
                          />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 transition-all duration-300 pointer-events-none"></div>
                      </div>
                      {errors.bankAccount && <p className="mt-1 text-sm text-red-600 animate-pulse">{errors.bankAccount}</p>}
                    </div>
                    <div className="group">
                      <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-purple-600 transition-colors">หมายเลข PromptPay <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <input 
                          type="text" 
                          inputMode="numeric" 
                          pattern="[0-9]*" 
                          maxLength={13}
                          className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-purple-300" 
                          value={bankInfo.promptPayId || ''} 
                          onChange={e => {
                            // allow only digits for PromptPay id and limit to 13
                            const digits = (e.target.value || '').toString().replace(/\D/g, '').slice(0, 13);
                            setBankInfo({ ...bankInfo, promptPayId: digits });
                          }} 
                          onPaste={(e) => {
                            const paste = e.clipboardData.getData('text') || '';
                            const digits = paste.replace(/\D/g, '');
                            if (!digits) {
                              e.preventDefault();
                              return;
                            }
                            e.preventDefault();
                            const input = e.target;
                            const start = input.selectionStart || 0;
                            const end = input.selectionEnd || 0;
                            const current = input.value || '';
                            // combine and then slice to max 13
                            const combined = (current.slice(0, start) + digits + current.slice(end)).replace(/\D/g, '').slice(0, 13);
                            setBankInfo(prev => ({ ...prev, promptPayId: combined }));
                          }}
                          placeholder="หมายเลข PromptPay (ไม่เกิน 13 ตัวเลข)" 
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 transition-all duration-300 pointer-events-none"></div>
                      </div>
                      {errors.promptPayId && <p className="mt-1 text-sm text-red-600 animate-pulse">{errors.promptPayId}</p>}
                    </div>
                  </div>
                </div>
              )}
              {/* อัพโหลดไฟล์/รูป */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="group">
                  {/* Preview Image Upload */}
                  <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-purple-600 transition-colors animate-fadeInUp animation-delay-2800">รูปตัวอย่าง (ไม่บังคับ)</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-purple-400 transition-colors flex flex-col justify-center items-center h-full">
                    <input
                      type="file"
                      ref={previewInputRef}
                      onChange={handlePreviewSelect}
                      accept="image/*"
                      multiple
                      className="hidden"
                    />
                    {previewImageUrls.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2 justify-center">
                          {previewImageUrls.slice(0, 2).map((url, idx) => (
                            <div key={idx} className="relative">
                              <img src={url} alt={`Preview ${idx + 1}`} className="w-24 h-24 object-cover rounded-lg" />
                              <button type="button" onClick={() => removePreview(idx)} className="absolute top-0 right-0 p-1">
                                <XMarkIcon className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          ))}
                          {previewImageUrls.length < 2 && existingPreviews.length + selectedPreviews.length < 5 && (
                            <button
                              type="button"
                              onClick={() => previewInputRef.current?.click()}
                              className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-purple-300 rounded-lg text-purple-400 hover:bg-purple-50"
                              title="เพิ่มรูป"
                            >
                              <span className="text-2xl">+</span>
                            </button>
                          )}
                        </div>
                        <div className="flex gap-2 justify-center">
                          {previewImageUrls.slice(2, 5).map((url, idx) => (
                            <div key={idx + 2} className="relative">
                              <img src={url} alt={`Preview ${idx + 3}`} className="w-24 h-24 object-cover rounded-lg" />
                              <button type="button" onClick={() => removePreview(idx + 2)} className="absolute top-0 right-0 p-1">
                                <XMarkIcon className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          ))}
                          {previewImageUrls.length >= 2 && existingPreviews.length + selectedPreviews.length < 5 && (
                            <button
                              type="button"
                              onClick={() => previewInputRef.current?.click()}
                              className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-purple-300 rounded-lg text-purple-400 hover:bg-purple-50"
                              title="เพิ่มรูป"
                            >
                              <span className="text-2xl">+</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={() => previewInputRef.current?.click()} className="flex flex-col items-center">
                        <PhotoIcon className="w-12 h-12 text-gray-400 mb-4" />
                        <p className="text-gray-600 mb-2">คลิกเพื่อเลือกรูปตัวอย่างเนื้อหาในชีท</p>
                  <p className="text-sm text-gray-500">ขนาดไฟล์ไม่เกิน 2MB</p>
                      </button>
                    )}
                  </div>
                </div>
                <div className="group">
                  {/* File Upload */}
                  <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-purple-600 transition-colors animate-fadeInUp animation-delay-2900">ไฟล์ชีท (PDF) <span className="text-red-500">*</span></label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-purple-400 transition-colors flex flex-col justify-center items-center h-full">
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".pdf" className="hidden" />
                    {!selectedFile ? (
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center">
                        <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mb-4" />
                        <p className="text-gray-600 mb-2">คลิกเพื่อเลือกไฟล์ชีทตัวเต็ม</p>
                        <p className="text-sm text-gray-500">ขนาดไฟล์ไม่เกิน 50MB</p>
                      </button>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <DocumentTextIcon className="w-8 h-8 text-purple-600 mr-3" />
                          <div>
                            <button
                              onClick={() => handleViewPdf(selectedFile.name)}
                              className="font-medium text-gray-900 hover:text-purple-600 hover:underline cursor-pointer text-left"
                            >
                              {selectedFile.name}
                            </button>
                            <p className="text-sm text-gray-500">
                              {selectedFile.isExisting ? 'ไฟล์เดิม - คลิกเพื่อดู' : `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`}
                            </p>
                          </div>
                        </div>
                        <button type="button" onClick={removeFile} className="p-2 hover:bg-red-50 rounded-full transition-colors">
                          <XMarkIcon className="w-5 h-5 text-red-500" />
                        </button>
                      </div>
                    )}
                  </div>
                  {errors.file && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600 font-medium">⚠️ {errors.file}</p>
                      <p className="text-xs text-red-500 mt-1">กรุณาคลิกปุ่มด้านบนเพื่อเลือกไฟล์ PDF</p>
                    </div>
                  )}
                </div>
              </div>
              {/* ปุ่ม submit */}
              <div className="pt-6 mt-28 md:mt-36">
                <button type="submit" disabled={isLoading} className="mt-12 md:mt-14 w-full px-8 py-4 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white rounded-2xl hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 transition-all duration-300 font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <span className="relative z-10 flex items-center justify-center">
                    {isLoading ? (
                      <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
                      {isEditing 
                        ? (existingSheetData?.status === 'REJECTED' ? 'กำลังส่งชีทใหม่...' : 'กำลังอัปเดต...')
                        : 'กำลังอัพโหลด...'
                      }
                      </>
                    ) : (
                      isEditing 
                        ? (existingSheetData?.status === 'REJECTED' ? 'ส่งชีทใหม่อีกครั้ง' : 'อัปเดตชีท')
                        : 'อัพโหลดชีท'
                    )}
                  </span>
                </button>
              </div>
            </form>
            </div>
          )}
        </div>

        {/* Back Button - Outside Form */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/seller/manage')}
            className="mx-auto px-8 py-3 text-purple-600 hover:text-purple-700 hover:underline transition-all duration-300 font-medium"
          >
            กลับไปหน้าจัดการชีท
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditSheetPage;