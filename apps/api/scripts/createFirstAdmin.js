/**
 * Create First Platform Admin
 *
 * Run once: node apps/api/scripts/createFirstAdmin.js
 * Or with npm: npm run create:admin --workspace=apps/api
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Import User model
const User = (await import('../src/models/auth/User.model.js')).default;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

async function main() {
  console.log('\n🔐 CREATE FIRST PLATFORM ADMIN\n');
  console.log('This account will have SUPER ADMIN access to the entire platform.\n');

  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ platformRole: 'platform_admin' });
    if (existingAdmin) {
      console.log('⚠️  A platform admin already exists:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Name: ${existingAdmin.firstName} ${existingAdmin.lastName}\n`);
      const proceed = await question('Create another admin? (y/n): ');
      if (proceed.toLowerCase() !== 'y') {
        console.log('Cancelled.');
        process.exit(0);
      }
    }

    // Get admin info
    const firstName = await question('First name: ');
    const lastName = await question('Last name: ');
    const email = await question('Email: ');
    const password = await question('Password (min 8 chars): ');

    if (password.length < 8) {
      console.log('❌ Password must be at least 8 characters');
      process.exit(1);
    }

    // Check if email exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      // Upgrade existing user to admin
      const upgrade = await question(
        `User ${email} already exists. Upgrade to platform_admin? (y/n): `
      );
      if (upgrade.toLowerCase() === 'y') {
        existing.platformRole = 'platform_admin';
        existing.isEmailVerified = true;
        await existing.save();
        console.log(`\n✅ ${email} upgraded to platform_admin`);
        process.exit(0);
      } else {
        console.log('Cancelled.');
        process.exit(0);
      }
    }

    // Create the admin
    const admin = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password,
      platformRole: 'platform_admin',
      isEmailVerified: true,
      isActive: true,
    });

    console.log('\n✅ Platform admin created successfully!');
    console.log('\nDetails:');
    console.log(`   ID: ${admin._id}`);
    console.log(`   Name: ${admin.firstName} ${admin.lastName}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.platformRole}`);
    console.log('\nYou can now log in to the admin panel with these credentials.\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();