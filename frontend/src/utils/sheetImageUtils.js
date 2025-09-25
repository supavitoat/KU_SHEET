// Utility function for generating sheet cover images
export const getSheetImage = (sheet) => {
  // Define gradient colors based on faculty
  let color1, color2;
  
  if (sheet.faculty?.name?.includes('เกษตร')) {
    color1 = '#FEE800'; // สีเหลือง
    color2 = '#FED700';
  } else if (sheet.faculty?.name?.includes('วิศวกรรม')) {
    color1 = '#71242A'; // สีแดงเข้ม
    color2 = '#A53B43';
  } else if (sheet.faculty?.name?.includes('กีฬา') || sheet.faculty?.name?.includes('วิทยาศาสตร์การกีฬา')) {
    color1 = '#FEB81B'; // สีส้ม
    color2 = '#FFD080';
  } else if (sheet.faculty?.name?.includes('ศิลปะศาสตร์') || sheet.faculty?.name?.includes('ศิลปศาสตร์')) {
    color1 = '#D6D5D0'; // สีเทา
    color2 = '#EAE9E2';
  } else if (sheet.faculty?.name?.includes('ศึกษาศาสตร์') || sheet.faculty?.name?.includes('พัฒนศาสตร์')) {
    color1 = '#991D97'; // สีม่วง
    color2 = '#D74AD3';
  } else if (sheet.faculty?.name?.includes('อุตสาหกรรม') || sheet.faculty?.name?.includes('บริการ')) {
    color1 = '#008081'; // สีเขียวน้ำเงิน
    color2 = '#33B5B6';
  } else if (sheet.faculty?.name?.includes('สัตวแพทย')) {
    color1 = '#0EA5E9'; // สีฟ้า
    color2 = '#7DD3FC';
  } else {
    // Default colors for unknown faculty
    color1 = '#667eea'; // สีม่วง
    color2 = '#764ba2';
  }
  
  // Create SVG with gradient background
  const svg = `
    <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad${sheet.id}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad${sheet.id})"/>
      <g transform="translate(150,150)">
        <rect x="-40" y="-50" width="80" height="100" fill="rgba(255,255,255,0.2)" rx="8"/>
        <rect x="-35" y="-40" width="70" height="12" fill="rgba(255,255,255,0.3)" rx="4"/>
        <rect x="-35" y="-25" width="50" height="10" fill="rgba(255,255,255,0.3)" rx="4"/>
        <rect x="-35" y="-10" width="60" height="10" fill="rgba(255,255,255,0.3)" rx="4"/>
        <rect x="-35" y="5" width="45" height="10" fill="rgba(255,255,255,0.3)" rx="4"/>
        <rect x="-35" y="20" width="55" height="10" fill="rgba(255,255,255,0.3)" rx="4"/>
        <rect x="-35" y="35" width="50" height="10" fill="rgba(255,255,255,0.3)" rx="4"/>
        <circle cx="-20" cy="55" r="5" fill="rgba(255,255,255,0.4)"/>
        <circle cx="0" cy="55" r="5" fill="rgba(255,255,255,0.4)"/>
        <circle cx="20" cy="55" r="5" fill="rgba(255,255,255,0.4)"/>
      </g>
      <text x="150" y="250" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-family="Arial, sans-serif" font-size="16" font-weight="bold">
        ${sheet.subjectCode}
      </text>
      <text x="150" y="270" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-family="Arial, sans-serif" font-size="11">
        ${sheet.faculty?.name?.substring(0, 12) || 'KU Sheet'}
      </text>
    </svg>
  `;
  
  // Convert SVG to data URL
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  return dataUrl;
};

export { getFacultyColors } from './facultyColors';
