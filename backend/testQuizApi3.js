const key = 'qa_sk_61b208774c94de2a1b6e446246733973f6bedc8e';
const url = `https://quizapi.io/api/v1/questions?apiKey=${key}&limit=1`;

fetch(url)
  .then(res => res.json().then(data => ({status: res.status, data})))
  .then(res => {
    console.log("Status:", res.status);
    console.log("Data:", JSON.stringify(res.data, null, 2));
  });
