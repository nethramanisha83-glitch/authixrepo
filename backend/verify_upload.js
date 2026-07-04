const fs = require('fs');
const path = require('path');

async function verify() {
  const fetch = (await import('node-fetch')).default;
  const { FormData, fileFromSync } = await import('node-fetch');

  const baseUrl = 'http://localhost:5000/api';
  const username = 'testuser_' + Date.now();
  const email = `${username}@example.com`;
  const password = 'Password123!';

  console.log('--- Registering user ---');
  const signupRes = await fetch(`${baseUrl}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });
  const signupData = await signupRes.json();
  if (!signupRes.ok) {
    console.error('Signup failed:', signupData);
    return;
  }
  const token = signupData.token;
  console.log('Signup successful, token received.');

  console.log('\n--- Uploading profile picture ---');
  // Create a dummy image file
  const dummyImagePath = path.join(__dirname, 'dummy.png');
  fs.writeFileSync(dummyImagePath, 'fake image data');

  const form = new FormData();
  form.append('profilePic', fileFromSync(dummyImagePath, 'image/png'));

  const uploadRes = await fetch(`${baseUrl}/portal/profile/picture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: form
  });

  const uploadData = await uploadRes.json();
  if (!uploadRes.ok) {
    console.error('Upload failed:', uploadData);
  } else {
    console.log('Upload successful!');
    console.log('Response:', JSON.stringify(uploadData, null, 2));
    
    // Verify file exists in uploads folder
    const fileName = uploadData.imageUrl.split('/').pop();
    const filePath = path.join(__dirname, 'uploads', fileName);
    if (fs.existsSync(filePath)) {
      console.log(`\nSUCCESS: File found at ${filePath}`);
    } else {
      console.error(`\nFAILURE: File NOT found at ${filePath}`);
    }
  }

  // Cleanup
  if (fs.existsSync(dummyImagePath)) fs.unlinkSync(dummyImagePath);
}

verify().catch(console.error);
