// Shared helper: map faculty names to gradient and icon colors
export const getFacultyColors = (facultyName) => {
  if (!facultyName) {
    return { gradient: 'from-purple-100 to-blue-100', iconColor: 'text-purple-600' };
  }
  const name = String(facultyName).toLowerCase();

  if (name.includes('เกษตร')) return { gradient: 'from-[#FEE800] via-[#FFE066] to-[#FED700]', iconColor: 'text-yellow-800' };
  if (name.includes('วิศวกรรม')) return { gradient: 'from-[#71242A] via-[#8B2F36] to-[#A53B43]', iconColor: 'text-red-100' };
  if (name.includes('กีฬา') || name.includes('วิทยาศาสตร์การกีฬา')) return { gradient: 'from-[#FEB81B] via-[#FFC64D] to-[#FFD080]', iconColor: 'text-orange-800' };
  if (name.includes('ศิลปะศาสตร์') || name.includes('ศิลปศาสตร์')) return { gradient: 'from-[#D6D5D0] via-[#E0DFD9] to-[#EAE9E2]', iconColor: 'text-gray-700' };
  if (name.includes('ศึกษาศาสตร์') || name.includes('พัฒนศาสตร์')) return { gradient: 'from-[#991D97] via-[#B833B5] to-[#D74AD3]', iconColor: 'text-purple-100' };
  if (name.includes('อุตสาหกรรม') || name.includes('บริการ')) return { gradient: 'from-[#008081] via-[#00A3A4] to-[#33B5B6]', iconColor: 'text-teal-100' };
  if (name.includes('สัตวแพทย')) return { gradient: 'from-[#0EA5E9] via-[#38BDF8] to-[#7DD3FC]', iconColor: 'text-blue-800' };

  return { gradient: 'from-purple-100 to-blue-100', iconColor: 'text-purple-600' };
};
