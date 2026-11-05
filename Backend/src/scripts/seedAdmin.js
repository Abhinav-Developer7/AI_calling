import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { logger } from '../utils/logger.js';

async function seedAdmin() {
  await connectDB();

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@jewellery.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const adminName = process.env.ADMIN_NAME || 'Store Owner';

  const existing = await User.findOne({ email: adminEmail });
  if (existing) {
    logger.info(`Admin user ${adminEmail} already exists.`);
  } else {
    await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
    });
    logger.info(`Created default admin: ${adminEmail} / ${adminPassword}`);
  }

  await disconnectDB();
}

seedAdmin().catch((err) => {
  logger.error({ err }, 'Failed to seed admin user');
  process.exit(1);
});

