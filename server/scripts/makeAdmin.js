// Usage: npm run make-admin -- <username>
const mongoose = require('mongoose');
const config = require('../config');
const User = require('../models/User');

(async () => {
    const username = process.argv[2];
    if (!username) {
        console.error('Usage: npm run make-admin -- <username>');
        process.exit(1);
    }
    await mongoose.connect(config.mongoUri);
    const user = await User.findOneAndUpdate({ username }, { role: 'admin' }, { new: true });
    console.log(user ? `${username} is now an admin.` : `User ${username} not found.`);
    await mongoose.disconnect();
    process.exit(user ? 0 : 1);
})();
