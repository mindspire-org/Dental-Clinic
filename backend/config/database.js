const mongoose = require('mongoose');
const User = require('../models/User');
const Staff = require('../models/Staff');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

        const email = process.env.SUPERADMIN_EMAIL;
        const username = process.env.SUPERADMIN_USERNAME;
        const password = process.env.SUPERADMIN_PASSWORD;
        if (email && username && password) {
            const existing = await User.findOne({ $or: [{ email }, { username }] });
            if (!existing) {
                await User.create({
                    email,
                    username,
                    password,
                    role: 'superadmin',
                    firstName: 'Software',
                    lastName: 'Owner',
                    permissions: [],
                });
                console.log('✅ Super Admin seeded');
            }
        }

        const defaultAdminUsername = 'admin';
        const defaultAdminEmail = 'admin@clinic.local';
        const defaultAdminPassword = '123456';
        const existingAdmin = await User.findOne({ $or: [{ username: defaultAdminUsername }, { email: defaultAdminEmail }] });
        if (!existingAdmin) {
            const adminUser = await User.create({
                email: defaultAdminEmail,
                username: defaultAdminUsername,
                password: defaultAdminPassword,
                role: 'admin',
                firstName: 'Admin',
                lastName: 'User',
                permissions: [],
            });

            await Staff.create({
                user: adminUser._id,
                specialization: 'other',
            });

            console.log('✅ Default Admin staff seeded (admin / 123456)');
        } else {
            const existingStaff = await Staff.findOne({ user: existingAdmin._id });
            if (!existingStaff) {
                await Staff.create({
                    user: existingAdmin._id,
                    specialization: 'other',
                });
                console.log('✅ Default Admin staff record created');
            }
        }
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
