const { connectMongo, disconnectMongo, registerModels } = require("../../database/mongo");
const config = require("../../src/config/env");
const { UserModel } = require("../../src/modules/users/models/user.model");
const authMiddleware = require("../../src/modules/auth/middleware/auth.middleware");

async function seedSuperAdmin() {
  registerModels();
  await connectMongo(config.mongoUri);

  const superAdminPhone = process.env.SUPER_ADMIN_PHONE;
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
  const superAdminDisplayName = process.env.SUPER_ADMIN_DISPLAY_NAME || "Super Admin";

  if (!superAdminPhone || !superAdminPassword) {
    console.error("[seed-super-admin] SUPER_ADMIN_PHONE and SUPER_ADMIN_PASSWORD environment variables are required.");
    process.exit(1);
  }

  // Check if super admin already exists
  const existingSuperAdmin = await UserModel.findOne({ phone: superAdminPhone });
  if (existingSuperAdmin) {
    console.log(`[seed-super-admin] Super admin with phone ${superAdminPhone} already exists. Skipping creation.`);
    return;
  }

  // Hash password
  const passwordHash = authMiddleware.hashToken(superAdminPassword);

  // Create super admin
  const now = new Date();
  const superAdmin = await UserModel.create({
    phone: superAdminPhone,
    username: superAdminPhone,
    displayName: superAdminDisplayName,
    passwordHash,
    role: "super_admin",
    createdAt: now,
    updatedAt: now,
  });

  console.log(`[seed-super-admin] Super admin created successfully.`);
  console.log(`[seed-super-admin] Phone: ${superAdminPhone}`);
  console.log(`[seed-super-admin] Display Name: ${superAdminDisplayName}`);
  console.log(`[seed-super-admin] Role: super_admin`);
  console.log(`[seed-super-admin] IMPORTANT: Keep these credentials secure!`);
}

seedSuperAdmin()
  .then(() => {
    console.log("[seed-super-admin] Seed completed.");
  })
  .catch((error) => {
    console.error("[seed-super-admin] Failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectMongo();
  });
