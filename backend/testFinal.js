const key = 'qa_sk_61b208774c94de2a1b6e446246733973f6bedc8e';
const difficulty = 'Easy';
const url = `https://quizapi.io/api/v1/questions?api_key=${key}&tags=cybersecurity&difficulty=${difficulty}&limit=2`;

fetch(url)
  .then(res => res.json())
  .then(result => {
    // Simulate backend logic
    let rawQuestions = Array.isArray(result) ? result : (result.data || []);
    const questions = rawQuestions.map(q => ({
      ...q,
      question: q.question || q.text
    }));
    
    console.log("Transformed Questions Count:", questions.length);
    if (questions.length > 0) {
      console.log("First Question:", questions[0].question);
      console.log("Answers array?", Array.isArray(questions[0].answers));
    }
  });
