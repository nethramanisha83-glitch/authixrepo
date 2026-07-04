const Question = require('../models/Question');

// @desc    Get all questions with optional category filter
// @route   GET /api/community/questions
exports.getQuestions = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category && category !== 'All' ? { category } : {};
    
    // Sort by newest first
    const questions = await Question.find(filter)
      .sort({ createdAt: -1 });

    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single question with answers
// @route   GET /api/community/questions/:id
exports.getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new question
// @route   POST /api/community/questions
// @access  Protected
exports.createQuestion = async (req, res) => {
  try {
    const { title, body, category } = req.body;
    
    const question = await Question.create({
      title,
      body,
      category,
      authorId: req.user._id,
      authorName: req.user.username,
    });

    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Post an answer to a question
// @route   POST /api/community/questions/:id/answers
// @access  Protected
exports.addAnswer = async (req, res) => {
  try {
    const { body } = req.body;
    const question = await Question.findById(req.params.id);
    
    if (!question) return res.status(404).json({ message: 'Question not found' });

    const newAnswer = {
      body,
      authorId: req.user._id,
      authorName: req.user.username,
      likes: [],
    };

    question.answers.push(newAnswer);
    await question.save();

    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle like on an answer
// @route   POST /api/community/answers/:id/like
// @access  Protected
exports.toggleLike = async (req, res) => {
  try {
    const { id } = req.params; // Answer ID
    const userId = req.user._id;

    // Find the question that contains this answer
    const question = await Question.findOne({ 'answers._id': id });
    if (!question) return res.status(404).json({ message: 'Answer not found' });

    const answer = question.answers.id(id);
    const likeIndex = answer.likes.indexOf(userId);

    if (likeIndex === -1) {
      // Like
      answer.likes.push(userId);
    } else {
      // Unlike
      answer.likes.splice(likeIndex, 1);
    }

    await question.save();
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a question (Author only)
// @route   DELETE /api/community/questions/:id
// @access  Protected (Author only)
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    // Verify authorship
    if (question.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized: You are not the author of this question.' });
    }

    await Question.findByIdAndDelete(req.params.id);
    res.json({ message: 'Question and all its answers deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an answer
// @route   PUT /api/community/answers/:id
// @access  Protected
exports.updateAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    const { body } = req.body;
    
    // Find the question that contains this answer
    const question = await Question.findOne({ 'answers._id': id });
    if (!question) return res.status(404).json({ message: 'Answer not found' });

    const answer = question.answers.id(id);
    
    // Check authorization: only author can update
    if (answer.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized: You can only edit your own answers.' });
    }

    // Update only the body and set updatedAt
    answer.body = body;
    answer.updatedAt = Date.now();
    
    await question.save();
    
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an answer
// @route   DELETE /api/community/answers/:id
// @access  Protected
exports.deleteAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the question that contains this answer
    const question = await Question.findOne({ 'answers._id': id });
    if (!question) return res.status(404).json({ message: 'Answer not found' });

    const answer = question.answers.id(id);
    
    // Check authorization: only author can delete
    if (answer.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized: You can only delete your own answers.' });
    }

    question.answers.pull({ _id: id });
    await question.save();
    
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
