const mongoose = require('mongoose');
const { UserModel } = require('./src/modules/users/models/user.model');
const config = require('./src/config/env');

async function makeAdmin() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(config.mongoUri);
    console.log('Connected.');

    const user = await UserModel.findOne({}).sort({ createdAt: 1 });
    
    if (!user) {
      console.log('No user found in the database. Please register a user first.');
      process.exit(1);
    }

    user.role = 'super_admin';
    await user.save();

    console.log('==============================================');
    console.log('SUCCESS! Account updated to Super Admin.');
    console.log('Phone number to login: ', user.phone);
    console.log('Display Name: ', user.displayName);
    console.log('==============================================');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

makeAdmin();
