const apiKey = 'AIzaSyAWW-mfcarywRQlu5ADn4zNqi-AkIHmxPo';
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: "Hello" }] }],
  })
}).then(async r => {
  console.log("Status:", r.status);
  console.log("Response:", await r.text());
});
