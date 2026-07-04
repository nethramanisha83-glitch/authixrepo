const key = 'qa_sk_61b208774c94de2a1b6e446246733973f6bedc8e';
const url = 'https://quizapi.io/api/v1/questions?limit=1';

fetch(url, {
  headers: {
    'X-Api-Key': key
  }
})
  .then(res => res.json().then(data => ({status: res.status, data})))
  .then(res => {
    console.log("Status:", res.status);
    console.log("Data:", JSON.stringify(res.data, null, 2));
  })
  .catch(err => {
    console.error("Error:", err);
  });
