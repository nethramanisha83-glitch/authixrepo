const key = 'qa_sk_61b208774c94de2a1b6e446246733973f6bedc8e';
const url = `https://quizapi.io/api/v1/questions?limit=1&api_key=${key}`;

fetch(url)
  .then(res => res.json().then(data => ({status: res.status, data})))
  .then(res => {
    console.log("Status param:", res.status);
    console.log("Data param:", JSON.stringify(res.data, null, 2));
  });

fetch('https://quizapi.io/api/v1/questions?limit=1', { headers: { 'X-Api-Key': key } })
  .then(res => res.json().then(data => ({status: res.status, data})))
  .then(res => {
    console.log("Status header:", res.status);
    console.log("Data header:", JSON.stringify(res.data, null, 2));
  });
