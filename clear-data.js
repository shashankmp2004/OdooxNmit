const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearNonUserData() {
  console.log('🗑️ Starting to clear all data except users...');

  try {
    // Delete in order to respect foreign key constraints
    console.log('Deleting Comments...');
    await prisma.comment.deleteMany({});

    console.log('Deleting Work Orders...');
    await prisma.workOrder.deleteMany({});

    console.log('Deleting Manufacturing Orders...');
    await prisma.manufacturingOrder.deleteMany({});

    console.log('Deleting BOM Components...');
    await prisma.bOMComponent.deleteMany({});

    console.log('Deleting BOMs...');
    await prisma.bOM.deleteMany({});

    console.log('Deleting Stock Entries...');
    await prisma.stockEntry.deleteMany({});

    console.log('Deleting Products...');
    await prisma.product.deleteMany({});

    console.log('Deleting Work Centers...');
    await prisma.workCenter.deleteMany({});

    // Keep Users and NextAuth related tables (Account, Session, VerificationToken)
    console.log('✅ Successfully cleared all data except users!');
    
    // Verify users are still there
    const userCount = await prisma.user.count();
    console.log(`👥 ${userCount} users preserved in database`);

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    console.log('\n📋 Remaining users:');
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}`);
    });

  } catch (error) {
    console.error('❌ Error clearing data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearNonUserData();