const mongoose = require('mongoose');
require('dotenv').config();
const Alert = require('./models/Alert');

const MONGO_URI = process.env.MONGO_URI;

const seedAlerts = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected...');

    // Optionally clear existing alerts
    await Alert.deleteMany({});
    
    const alerts = [
      {
        threatName: 'Phishing Campaign Detected',
        severity: 'Critical',
        category: 'Phishing',
        description: 'A widespread phishing campaign impersonating university IT has been detected. Several emails have been blocked.',
        action: 'Do not click on links in unexpected emails. Report suspicious emails to IT Helpdesk immediately.'
      },
      {
        threatName: 'Unrecognized Device Login',
        severity: 'Medium',
        category: 'Account Security',
        description: 'A login attempt from an unrecognized IP address was detected on your account.',
        action: 'Review your recent login activity. If this was not you, change your password immediately.'
      },
      {
        threatName: 'System Maintenance Scheduled',
        severity: 'Low',
        category: 'System Info',
        description: 'The CyberSafe Campus Portal will undergo scheduled maintenance this Sunday at 2 AM.',
        action: 'Please ensure all your learning progress is saved before the maintenance window.'
      },
      {
        threatName: 'New Ransomware Variant',
        severity: 'Critical',
        category: 'Malware',
        description: 'A new ransomware variant targeting educational institutions has been observed globally.',
        action: 'Ensure your devices are updated and avoiding downloading attachments from untrusted sources.'
      },
      {
        threatName: 'Security Policy Update',
        severity: 'Low',
        category: 'Policy',
        description: 'The campus password policy has been updated to require 12 characters minimum.',
        action: 'You will be prompted to update your password upon your next login if it does not meet the requirements.'
      }
    ];

    await Alert.insertMany(alerts);
    console.log('Default alerts seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding alerts:', error);
    process.exit(1);
  }
};

seedAlerts();
