import { useState, useEffect } from 'react';
import { Question, Category, GameState, LeaderboardEntry } from './types';
import { questions } from './data/questions';
import { categories } from './data/categories';
import { saveToLeaderboard, getLeaderboard } from './utils/leaderboard';
import Footer from './components/Footer';

function App() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [playerName, setPlayerName] = useState('');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [score, setScore] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
  const [categorySelections, setCategorySelections] = useState<Record<string, string[]>>({});
  const [availableNumbers, setAvailableNumbers] = useState<string[]>([]);
  const [gameResults, setGameResults] = useState<{
    correct: number;
    wrong: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    if (gameState === 'playing') {
      const timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameState]);

  useEffect(() => {
    const loadLeaderboard = async () => {
      const entries = await getLeaderboard();
      setLeaderboard(entries);
    };
    loadLeaderboard();
  }, []);

  const getRandomQuestions = (count: number = 20) => {
    // Create a copy of the questions array
    const shuffled = [...questions];
    
    // Fisher-Yates shuffle algorithm
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Take the first 'count' questions
    return shuffled.slice(0, count);
  };

  const startGame = () => {
    if (!playerName.trim()) return;
    setGameState('playing');
    setTimeElapsed(0);
    setScore(0);
    setCategorySelections({});
    setSelectedNumber(null);
    setGameResults(null);
    // Get 20 random questions
    const selectedQuestions = getRandomQuestions(20);
    setAvailableNumbers(selectedQuestions.map(q => q.number));
  };

  const handleLeaderboardClick = () => {
    setShowLeaderboard(true);
  };

  const handleBackFromLeaderboard = () => {
    setShowLeaderboard(false);
  };

  const calculateResults = () => {
    let correct = 0;
    let wrong = 0;

    Object.entries(categorySelections).forEach(([categoryId, numbers]) => {
      numbers.forEach((number) => {
        const question = questions.find((q) => q.number === number);
        if (question && question.correctCategory === categoryId) {
          correct++;
        } else {
          wrong++;
        }
      });
    });

    return {
      correct,
      wrong,
      total: correct + wrong
    };
  };

  const handleSubmit = async () => {
    const results = calculateResults();
    setGameResults(results);
    setGameState('results');
  };

  const handleContinue = async () => {
    if (gameResults) {
      const finalScore = gameResults.correct * 10;
      setScore(finalScore);
      setGameState('gameOver');

      if (finalScore > 0) {
        const entry: LeaderboardEntry = {
          name: playerName,
          score: finalScore,
          date: new Date().toISOString(),
        };
        await saveToLeaderboard(entry);
        const updatedLeaderboard = await getLeaderboard();
        setLeaderboard(updatedLeaderboard);
      }
    }
  };

  const handleNumberClick = (number: string) => {
    setSelectedNumber(number);
  };

  const handleCategoryClick = (categoryId: string) => {
    if (selectedNumber === null) return;

    // First remove the number from available numbers
    setAvailableNumbers(prev => prev.filter(n => n !== selectedNumber));

    // Then add it to the category
    setCategorySelections((prev) => {
      const newSelections = { ...prev };
      // Remove number from any existing category
      Object.keys(newSelections).forEach((catId) => {
        newSelections[catId] = newSelections[catId].filter((n) => n !== selectedNumber);
      });
      // Add number to selected category
      newSelections[categoryId] = [...(newSelections[categoryId] || []), selectedNumber];
      return newSelections;
    });

    setSelectedNumber(null);
  };

  const handleCategoryNumberClick = (number: string, categoryId: string) => {
    // First remove number from category
    setCategorySelections(prev => ({
      ...prev,
      [categoryId]: prev[categoryId].filter(n => n !== number)
    }));
    
    // Then add it back to available numbers
    setAvailableNumbers(prev => [...prev, number]);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTotalClassifiedNumbers = () => {
    return Object.values(categorySelections).reduce((total, numbers) => total + numbers.length, 0);
  };

  if (showLeaderboard) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-center mb-6">Leaderboard</h2>
            {leaderboard.length > 0 ? (
              <div className="space-y-2">
                {leaderboard.map((entry, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="font-medium">{entry.name}</span>
                    <span className="text-blue-600">{entry.score}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No scores yet. Be the first to play!</p>
            )}
            <button
              onClick={handleBackFromLeaderboard}
              className="w-full mt-6 bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700"
            >
              Back
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (gameState === 'start') {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <h1 className="text-3xl font-bold text-center mb-8">Number Classification</h1>
            <div className="space-y-4">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full p-3 border rounded-lg"
              />
              <button
                onClick={startGame}
                disabled={!playerName.trim()}
                className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Start Game
              </button>
              <button
                onClick={handleLeaderboardClick}
                className="w-full bg-gray-200 text-gray-800 p-3 rounded-lg hover:bg-gray-300"
              >
                Leaderboard
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (gameState === 'results') {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-center mb-6">Game Results</h2>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-lg mb-2">Correct Answers: <span className="text-green-600 font-bold">{gameResults?.correct}</span></p>
                <p className="text-lg mb-2">Wrong Answers: <span className="text-red-600 font-bold">{gameResults?.wrong}</span></p>
                <p className="text-lg mb-4">Total Classified: <span className="text-blue-600 font-bold">{gameResults?.total}</span></p>
                <p className="text-lg">Time: <span className="font-bold">{formatTime(timeElapsed)}</span></p>
              </div>
              <button
                onClick={handleContinue}
                className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (gameState === 'gameOver') {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-center mb-6">Game Over!</h2>
            <p className="text-center text-xl mb-4">Score: {score}</p>
            <p className="text-center text-lg mb-4">Time: {formatTime(timeElapsed)}</p>
            <div className="space-y-4">
              <button
                onClick={() => setGameState('start')}
                className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700"
              >
                Back to Main Menu
              </button>
              <button
                onClick={handleLeaderboardClick}
                className="w-full bg-gray-200 text-gray-800 p-3 rounded-lg hover:bg-gray-300"
              >
                Leaderboard
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex-1 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <div className="text-xl font-bold">{playerName}</div>
              <div className="flex items-center space-x-4">
                <div className="text-xl font-bold">Time: {formatTime(timeElapsed)}</div>
                <div className="text-xl font-bold">Score: {score}</div>
                <div className="text-xl font-bold">Classified: {getTotalClassifiedNumbers()}/20</div>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                Submit
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-center">Numbers</h2>
              <div className="grid grid-cols-4 gap-4">
                {availableNumbers.map((number) => (
                  <div
                    key={number}
                    onClick={() => handleNumberClick(number)}
                    className={`number-card p-4 text-center text-xl font-bold cursor-pointer ${
                      selectedNumber === number ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    {number}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-center">Categories</h2>
              <div className="space-y-4">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    onClick={() => handleCategoryClick(category.id)}
                    className="category-dropzone p-4"
                  >
                    <h3 className="font-bold mb-2">{category.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {categorySelections[category.id]?.map((number) => (
                        <div
                          key={number}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCategoryNumberClick(number, category.id);
                          }}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full cursor-pointer hover:bg-blue-200"
                        >
                          {number}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default App; 