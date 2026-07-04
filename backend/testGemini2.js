const apiKey = 'AIzaSyAWW-mfcarywRQlu5ADn4zNqi-AkIHmxPo';
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

fetch(url)
.then(async r => {
  const data = await r.json();
  console.log("Models:", data.models.map(m => m.name).join("\n"));
});
