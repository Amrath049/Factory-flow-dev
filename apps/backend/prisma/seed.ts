import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

const dbUrl = process.env.DATABASE_URL;
console.log(`Connecting to DB: ${dbUrl ? 'URL Loaded' : 'MISSING URL'}`);

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding initial SaaS tenant businesses and admin accounts...');

  const defaultPassword = await bcrypt.hash('factory@123', 10);

  // 1. Business A: Siri Enterprises
  const siriBusiness = await prisma.business.upsert({
    where: { id: 'siri-enterprises-tenant-uuid' },
    update: {},
    create: {
      id: 'siri-enterprises-tenant-uuid',
      name: 'Siri Enterprises',
      email: 'contact@sirienterprises.com',
      phone: '8088467281',
      address: 'Mahatma Gandhi Nagar, Cherkady, Udupi - 576215',
      plan: 'PRO',
      status: 'ACTIVE',
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@factory.com' },
    update: {
      password: defaultPassword,
      businessId: siriBusiness.id,
    },
    create: {
      name: 'Siri Owner',
      email: 'admin@factory.com',
      password: defaultPassword,
      role: 'BUSINESS_ADMIN',
      businessId: siriBusiness.id,
    },
  });

  await prisma.invoiceSettings.upsert({
    where: { businessId: siriBusiness.id },
    update: {},
    create: {
      businessId: siriBusiness.id,
      companyName: 'Siri Enterprises',
      tagline: 'Areca Palm Leaf Plates and Products Manufacturer',
      website: 'www.sirienterprises.com',
      addressLine1: 'Mahatma Gandhi Nagar, Cherkady',
      city: 'Udupi',
      state: 'Karnataka',
      pincode: '576215',
      phone: '8088467281, 9187567281',
      email: 'sirienterprises.business@gmail.com',
      gstin: '29ABCDE1234F1Z5',
      bankName: 'Canara Bank',
      accountName: 'Siri Enterprises',
      accountNumber: '012345678901',
      ifscCode: 'CNRB0001234',
      branch: 'Brahmavar',
      termsAndConditions: '1. Goods once sold cannot be returned.\n2. Transportation charges extra.',
      declaration: 'We declare that this invoice shows the actual price of the goods described.',
      signatureTitle: 'Authorized Signatory',
    },
  });

  // 2. Business B: GreenLeaf Manufacturing
  const greenleafBusiness = await prisma.business.upsert({
    where: { id: 'greenleaf-mfg-tenant-uuid' },
    update: {},
    create: {
      id: 'greenleaf-mfg-tenant-uuid',
      name: 'GreenLeaf Manufacturing',
      email: 'info@greenleafmfg.com',
      phone: '9876543210',
      address: 'Industrial Area, Phase 2, Bangalore - 560058',
      plan: 'BASIC',
      status: 'ACTIVE',
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@greenleaf.com' },
    update: {
      password: defaultPassword,
      businessId: greenleafBusiness.id,
    },
    create: {
      name: 'GreenLeaf Admin',
      email: 'admin@greenleaf.com',
      password: defaultPassword,
      role: 'BUSINESS_ADMIN',
      businessId: greenleafBusiness.id,
    },
  });

  await prisma.invoiceSettings.upsert({
    where: { businessId: greenleafBusiness.id },
    update: {},
    create: {
      businessId: greenleafBusiness.id,
      companyName: 'GreenLeaf Manufacturing',
      tagline: 'Eco-Friendly Bio Packaging Solutions',
      website: 'www.greenleafmfg.com',
      addressLine1: 'Industrial Area, Phase 2',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560058',
      phone: '9876543210',
      email: 'billing@greenleafmfg.com',
      gstin: '29XYZAB5678C1Z2',
      bankName: 'HDFC Bank',
      accountName: 'GreenLeaf Manufacturing Pvt Ltd',
      accountNumber: '50200012345678',
      ifscCode: 'HDFC0000123',
      branch: 'Peenya',
      termsAndConditions: '1. Payment due within 15 days of invoice date.\n2. Interest @ 18% per annum will be charged on overdue bills.',
      declaration: 'Certified true and correct copy of invoice.',
      signatureTitle: 'For GreenLeaf Manufacturing',
    },
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
