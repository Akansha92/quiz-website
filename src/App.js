import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [quizData, setQuizData] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [streak, setStreak] = useState(0);
  const [achievements, setAchievements] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  const shuffleArray = (array) => array.sort(() => Math.random() - 0.5);

  // Fetch Topics on Load
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await axios.get("https://opentdb.com/api_category.php");
        setTopics(response.data.trivia_categories);
      } catch (error) {
        console.error("Error fetching topics:", error);
      }
    };
    fetchTopics();
    fetchLeaderboard();
  }, []);

  // Fetch Quiz Data when Topic is Selected
  const fetchQuizData = async (topicId) => {
    setLoading(true);
    try {
      const response = await axios.get(`https://opentdb.com/api.php?amount=10&category=${topicId}&type=multiple`);
      const formattedQuestions = response.data.results.map((question) => ({
        question: question.question,
        options: shuffleArray([
          ...question.incorrect_answers.map((answer) => ({ text: answer, isCorrect: false })),
          { text: question.correct_answer, isCorrect: true }
        ])
      }));
      setQuizData(formattedQuestions);
    } catch (error) {
      console.error("Error fetching quiz data:", error);
    }
    setLoading(false);
  };

  // Timer for each question
  useEffect(() => {
    if (quizStarted && !quizCompleted) {
      const timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime === 0) {
            handleAnswerClick(false);
            return 10;
          }
          return prevTime - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [quizStarted, quizCompleted, currentQuestionIndex]);

  // Handle Answer Click
  const handleAnswerClick = (isCorrect) => {
    setSelectedAnswer(isCorrect);
    if (isCorrect) {
      setScore((prev) => prev + 1);
      setCorrectAnswers((prev) => prev + 1);
      setStreak((prev) => prev + 1);
      if (streak + 1 >= 3) setScore((prev) => prev + 2); // Streak Bonus
    } else {
      setStreak(0);
    }

    setTimeout(() => {
      if (currentQuestionIndex < quizData.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setTimeLeft(10);
        setSelectedAnswer(null);
      } else {
        setQuizCompleted(true);
        checkAchievements();
        updateLeaderboard();
      }
    }, 1000);
  };

  // Start Quiz after selecting topic
  const startQuiz = () => {
    if (selectedTopic) {
      fetchQuizData(selectedTopic);
      setQuizStarted(true);
      setQuizCompleted(false);
    } else {
      alert("Please select a topic to start the quiz!");
    }
  };

  // Restart Quiz
  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizCompleted(false);
    setQuizStarted(false);
    setTimeLeft(10);
    setSelectedAnswer(null);
    setCorrectAnswers(0);
    setStreak(0);
    setAchievements([]);
  };

  // Check Achievements
  const checkAchievements = () => {
    let newAchievements = [];
    if (correctAnswers >= 1) newAchievements.push("First Quiz Completed!");
    if (score === quizData.length) newAchievements.push("Perfect Score!");
    if (streak >= 5) newAchievements.push("Streak Master!");
    setAchievements(newAchievements);
  };

  // Fetch Leaderboard
  const fetchLeaderboard = async () => {
    // Simulated leaderboard fetch
    const mockLeaderboard = [
      { name: "Alice", score: 8 },
      { name: "Bob", score: 7 },
      { name: "Charlie", score: 6 }
    ];
    setLeaderboard(mockLeaderboard);
  };

  // Update Leaderboard
  const updateLeaderboard = () => {
    const user = prompt("Enter your name for the leaderboard:", "Anonymous");
    const updatedLeaderboard = [...leaderboard, { name: user, score }].sort((a, b) => b.score - a.score);
    setLeaderboard(updatedLeaderboard);
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="app">
        <h1>Loading Quiz...</h1>
        <p>Please wait while we fetch the quiz questions.</p>
      </div>
    );
  }

  // Welcome Page with Topic Selection
  if (!quizStarted) {
    return (
      <div className="app welcome-page">
        <h1>Welcome to the Quiz!</h1>
        <select
          className="topic-select"
          onChange={(e) => setSelectedTopic(e.target.value)}
          value={selectedTopic}
        >
          <option value="">Select a Topic</option>
          {topics.map((topic) => (
            <option key={topic.id} value={topic.id}>{topic.name}</option>
          ))}
        </select>
        <button className="start-button" onClick={startQuiz}>Start Quiz</button>
      </div>
    );
  }

  // Quiz Completed Page
  if (quizCompleted) {
    return (
      <div className="app quiz-completed">
        <h1>Quiz Completed!</h1>
        <p>Your score: {score} / {quizData.length}</p>
        <p>Correct Answers: {correctAnswers}</p>
        <h2>Achievements Unlocked:</h2>
        <ul>
          {achievements.length > 0 ? achievements.map((ach, index) => <li key={index}>{ach}</li>) : <li>No Achievements Yet!</li>}
        </ul>
        <h2>Leaderboard</h2>
        <ol>
          {leaderboard.map((entry, index) => (
            <li key={index}>{entry.name}: {entry.score}</li>
          ))}
        </ol>
        <button onClick={restartQuiz} className="restart-button">Restart Quiz</button>
      </div>
    );
  }

  // Current Question Display
  const currentQuestion = quizData[currentQuestionIndex];

  return (
    <div className="app">
      <div className="sidebar">
        <h2>Quiz Info</h2>
        <p><strong>Topic:</strong> {topics.find(t => t.id === parseInt(selectedTopic))?.name || "N/A"}</p>
        <p><strong>Score:</strong> {score}</p>
        <p><strong>Streak:</strong> {streak}</p>
        <p><strong>Progress:</strong> {currentQuestionIndex + 1} / {quizData.length}</p>
        <p><strong>Time Left:</strong> {timeLeft}s</p>
        <button className="restart-button" onClick={restartQuiz}>Restart Quiz</button>
      </div>

      <div className="quiz-container">
        <h1>Question {currentQuestionIndex + 1}</h1>
        <p dangerouslySetInnerHTML={{ __html: currentQuestion.question }}></p>
        <div className="options">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => !selectedAnswer && handleAnswerClick(option.isCorrect)}
              disabled={selectedAnswer !== null}
              className={
                selectedAnswer !== null
                  ? option.isCorrect
                    ? "correct"
                    : selectedAnswer === option.isCorrect
                    ? "incorrect"
                    : ""
                  : ""
              }
              dangerouslySetInnerHTML={{ __html: option.text }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
