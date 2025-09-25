// Shared academic constants: faculties and majors

export const facultiesList = [
  { id: 1, name: 'คณะเกษตร กำแพงแสน', code: 'AGRI' },
  { id: 2, name: 'คณะวิศวกรรมศาสตร์ กำแพงแสน', code: 'ENG' },
  { id: 3, name: 'คณะวิทยาศาสตร์การกีฬาและสุขภาพ', code: 'SPORT' },
  { id: 4, name: 'คณะศิลปศาสตร์และวิทยาศาสตร์', code: 'LA' },
  { id: 5, name: 'คณะศึกษาศาสตร์และพัฒนศาสตร์', code: 'EDU' },
  { id: 6, name: 'คณะอุตสาหกรรมบริการ', code: 'SERVICE' },
  { id: 7, name: 'คณะสัตวแพทยศาสตร์', code: 'VET' },
];

export const majorsList = [
  // คณะเกษตร กำแพงแสน
  { id: 1, name: 'ภาควิชากีฏวิทยา', facultyId: 1, code: 'AGRI001' },
  { id: 2, name: 'ภาควิชาเกษตรกลวิธาน', facultyId: 1, code: 'AGRI002' },
  { id: 3, name: 'ภาควิชาปฐพีวิทยา', facultyId: 1, code: 'AGRI003' },
  { id: 4, name: 'ภาควิชาโรคพืช', facultyId: 1, code: 'AGRI004' },
  { id: 5, name: 'ภาควิชาพืชไร่นา', facultyId: 1, code: 'AGRI005' },
  { id: 6, name: 'ภาควิชาพืชสวน', facultyId: 1, code: 'AGRI006' },

  // คณะวิศวกรรมศาสตร์ กำแพงแสน
  { id: 7, name: 'ภาควิชาวิศวกรรมการอาหาร', facultyId: 2, code: 'ENG001' },
  { id: 8, name: 'ภาควิชาวิศวกรรมคอมพิวเตอร์', facultyId: 2, code: 'ENG002' },
  { id: 9, name: 'ภาควิชาวิศวกรรมชลประทาน', facultyId: 2, code: 'ENG003' },
  { id: 10, name: 'ภาควิชาวิศวกรรมโยธา', facultyId: 2, code: 'ENG004' },
  { id: 11, name: 'ภาควิชาวิศวกรรมเครื่องกล', facultyId: 2, code: 'ENG005' },
  { id: 12, name: 'ภาควิชาวิศวกรรมอุตสาหการ', facultyId: 2, code: 'ENG006' },
  { id: 13, name: 'ภาควิชาวิศวกรรมเกษตร', facultyId: 2, code: 'ENG007' },

  // คณะวิทยาศาสตร์การกีฬาและสุขภาพ
  { id: 14, name: 'ภาควิชาการจัดการการกีฬาและสุขภาพ', facultyId: 3, code: 'SPORT001' },
  { id: 15, name: 'ภาควิชาวิทยาศาสตร์การกีฬา', facultyId: 3, code: 'SPORT002' },
  { id: 16, name: 'ภาควิชาวิทยาศาสตร์สุขภาพและการเคลื่อนไหว', facultyId: 3, code: 'SPORT003' },

  // คณะศิลปศาสตร์และวิทยาศาสตร์
  { id: 17, name: 'สาขาวิชาการจัดการ', facultyId: 4, code: 'LA001' },
  { id: 18, name: 'สาขาวิชาการตลาด', facultyId: 4, code: 'LA002' },
  { id: 19, name: 'สาขาวิชาการบัญชี', facultyId: 4, code: 'LA003' },
  { id: 20, name: 'สาขาวิชาชีวเคมี', facultyId: 4, code: 'LA004' },
  { id: 21, name: 'สาขาวิชาชีววิทยา', facultyId: 4, code: 'LA005' },
  { id: 22, name: 'สาขาวิชาบรรณารักษศาสตร์', facultyId: 4, code: 'LA006' },
  { id: 23, name: 'สาขาวิชาปรัชญาและศาสนา', facultyId: 4, code: 'LA007' },
  { id: 24, name: 'สาขาวิชาพันธุศาสตร์', facultyId: 4, code: 'LA008' },
  { id: 25, name: 'สาขาวิชาฟิสิกส์', facultyId: 4, code: 'LA009' },
  { id: 26, name: 'สาขาวิชารัฐศาสตร์', facultyId: 4, code: 'LA010' },
  { id: 27, name: 'สาขาวิชานวัตกรรมสังคม รัฐประศาสนศาสตร์ และนิติศาสตร์', facultyId: 4, code: 'LA011' },
  { id: 28, name: 'สาขาวิชาภาษาไทย', facultyId: 4, code: 'LA012' },
  { id: 29, name: 'สาขาวิชาภาษาจีน', facultyId: 4, code: 'LA013' },
  { id: 30, name: 'สาขาวิชาภาษาญี่ปุ่น', facultyId: 4, code: 'LA014' },
  { id: 31, name: 'สาขาวิชาภาษาฝรั่งเศส', facultyId: 4, code: 'LA015' },
  { id: 32, name: 'สาขาวิชาวิทยาการคอมพิวเตอร์', facultyId: 4, code: 'LA016' },
  { id: 33, name: 'สาขาวิชาเทคโนโลยีสารสนเทศและการสื่อสาร', facultyId: 4, code: 'LA017' },
  { id: 34, name: 'สาขาวิชาคณิตศาสตร์และสถิติ', facultyId: 4, code: 'LA018' },
  { id: 35, name: 'สาขาวิชาสัตววิทยา', facultyId: 4, code: 'LA019' },
  { id: 36, name: 'สาขาวิชาเคมี', facultyId: 4, code: 'LA020' },

  // คณะศึกษาศาสตร์และพัฒนศาสตร์
  { id: 37, name: 'ภาควิชาการพัฒนาทรัพยากรมนุษย์และชุมชน', facultyId: 5, code: 'EDU001' },
  { id: 38, name: 'ภาควิชาครุศึกษา', facultyId: 5, code: 'EDU002' },
  { id: 39, name: 'ภาควิชาพลศึกษาและกีฬา', facultyId: 5, code: 'EDU003' },

  // คณะอุตสาหกรรมบริการ
  { id: 40, name: 'สาขาวิชาการจัดการธุรกิจการบิน', facultyId: 6, code: 'SERVICE001' },
  { id: 41, name: 'สาขาวิชาการจัดการธุรกิจบริการและอุตสาหกรรมไมซ์', facultyId: 6, code: 'SERVICE002' },
  { id: 42, name: 'สาขาวิชาการสร้างสรรค์การบริการเพื่อธุรกิจการท่องเที่ยว', facultyId: 6, code: 'SERVICE003' },
  { id: 43, name: 'สาขาวิชาการโรงแรมและภัตตาคาร', facultyId: 6, code: 'SERVICE004' },
  { id: 44, name: 'สาขาวิชานวัตกรรมบริการและการสื่อสารระหว่างวัฒนธรรม', facultyId: 6, code: 'SERVICE005' },
  { id: 45, name: 'สาขาวิชาภาษาอังกฤษเพื่ออุตสาหกรรมบริการ', facultyId: 6, code: 'SERVICE006' },
  { id: 46, name: 'สาขาอุตสาหกรรมการท่องเที่ยวและบริการ', facultyId: 6, code: 'SERVICE007' },

  // คณะสัตวแพทยศาสตร์
  { id: 47, name: 'ภาควิชาสัตวแพทยสาธารณสุขศาสตร์', facultyId: 7, code: 'VET001' },
  { id: 48, name: 'ภาควิชาเวชศาสตร์คลินิกสัตว์เลี้ยง', facultyId: 7, code: 'VET002' },
  { id: 49, name: 'ภาควิชาวิทยาศาสตร์และทรัพยากรการผลิตสัตว์', facultyId: 7, code: 'VET003' },
  { id: 50, name: 'ภาควิชาวิทยาศาสตร์คลินิกสัตว์ใหญ่และสัตว์ป่า', facultyId: 7, code: 'VET004' },
];
