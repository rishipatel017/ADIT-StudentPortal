
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const notices = await prisma.notice.findMany({
    where: { attachment: { not: null } },
    select: { id: true, title: true, attachment: true }
  });
  console.log('Notices with attachments:', JSON.stringify(notices, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
