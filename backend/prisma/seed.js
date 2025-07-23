const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding with Prisma...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@kusheet.com' },
    update: {},
    create: {
      email: 'admin@kusheet.com',
      password: hashedPassword,
      fullName: 'Admin User',
      role: 'ADMIN',
      isSeller: false,
      isFirstLogin: false,
      profileCompleted: true,
    },
  });
  console.log('✅ Admin user created');

  // Create faculties
  const faculties = [
    { name: 'Faculty of Engineering', code: 'ENG' },
    { name: 'Faculty of Medicine', code: 'MED' },
    { name: 'Faculty of Science', code: 'SCI' },
    { name: 'Faculty of Liberal Arts', code: 'LA' },
    { name: 'Faculty of Social Sciences', code: 'SS' },
    { name: 'Faculty of Economics', code: 'ECON' },
    { name: 'Faculty of Business Administration', code: 'BBA' },
    { name: 'Faculty of Law', code: 'LAW' },
    { name: 'Faculty of Education', code: 'EDU' },
    { name: 'Faculty of Communication Arts', code: 'COMM' },
  ];

  for (const faculty of faculties) {
    await prisma.faculty.upsert({
      where: { code: faculty.code },
      update: {},
      create: faculty,
    });
  }
  console.log('✅ Faculties created');

  // Get faculty IDs for subjects
  const engFaculty = await prisma.faculty.findUnique({ where: { code: 'ENG' } });
  const sciFaculty = await prisma.faculty.findUnique({ where: { code: 'SCI' } });
  const bbaFaculty = await prisma.faculty.findUnique({ where: { code: 'BBA' } });
  const laFaculty = await prisma.faculty.findUnique({ where: { code: 'LA' } });

  // Create subjects
  const subjects = [
    // Engineering
    { code: 'ENG101', name: 'Introduction to Engineering', facultyId: engFaculty.id, credits: 3 },
    { code: 'ENG201', name: 'Engineering Mathematics I', facultyId: engFaculty.id, credits: 3 },
    { code: 'ENG202', name: 'Engineering Mathematics II', facultyId: engFaculty.id, credits: 3 },
    { code: 'ENG301', name: 'Digital Logic Design', facultyId: engFaculty.id, credits: 4 },
    { code: 'ENG401', name: 'Senior Project I', facultyId: engFaculty.id, credits: 3 },
    { code: 'CS101', name: 'Computer Programming I', facultyId: engFaculty.id, credits: 3 },
    { code: 'CS102', name: 'Computer Programming II', facultyId: engFaculty.id, credits: 3 },
    { code: 'CS201', name: 'Data Structures and Algorithms', facultyId: engFaculty.id, credits: 4 },
    { code: 'CS301', name: 'Database Systems', facultyId: engFaculty.id, credits: 3 },
    { code: 'CS401', name: 'Software Engineering', facultyId: engFaculty.id, credits: 3 },

    // Science
    { code: 'SCI101', name: 'General Chemistry', facultyId: sciFaculty.id, credits: 3 },
    { code: 'SCI102', name: 'General Physics', facultyId: sciFaculty.id, credits: 3 },
    { code: 'SCI201', name: 'Organic Chemistry', facultyId: sciFaculty.id, credits: 4 },
    { code: 'SCI301', name: 'Biochemistry', facultyId: sciFaculty.id, credits: 3 },
    { code: 'MATH101', name: 'Calculus I', facultyId: sciFaculty.id, credits: 3 },

    // Business Administration
    { code: 'BBA101', name: 'Introduction to Business', facultyId: bbaFaculty.id, credits: 3 },
    { code: 'BBA201', name: 'Principles of Marketing', facultyId: bbaFaculty.id, credits: 3 },
    { code: 'BBA301', name: 'Strategic Management', facultyId: bbaFaculty.id, credits: 3 },
    { code: 'ACC101', name: 'Financial Accounting', facultyId: bbaFaculty.id, credits: 3 },
    { code: 'FIN201', name: 'Corporate Finance', facultyId: bbaFaculty.id, credits: 3 },

    // Liberal Arts
    { code: 'ENG001', name: 'English Communication I', facultyId: laFaculty.id, credits: 3 },
    { code: 'ENG002', name: 'English Communication II', facultyId: laFaculty.id, credits: 3 },
    { code: 'THA101', name: 'Thai Language and Literature', facultyId: laFaculty.id, credits: 3 },
    { code: 'PHIL101', name: 'Introduction to Philosophy', facultyId: laFaculty.id, credits: 3 },
    { code: 'HIST101', name: 'World History', facultyId: laFaculty.id, credits: 3 },
  ];

  for (const subject of subjects) {
    await prisma.subject.upsert({
      where: { 
        code_facultyId: { 
          code: subject.code, 
          facultyId: subject.facultyId 
        } 
      },
      update: {},
      create: subject,
    });
  }
  console.log('✅ Subjects created');

  console.log('🎉 Database seeding completed successfully with Prisma!');
  console.log('\n🔑 Admin credentials:');
  console.log('📧 Email: admin@kusheet.com');
  console.log('🔒 Password: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });