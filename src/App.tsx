import { useState, useEffect } from 'react';
import { GameState, LeaderboardEntry } from './types';
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
      {/* Sticky top controls */}
      <div className="sticky top-0 z-20 bg-white shadow-md px-2 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-6 border-b">
        <div className="text-lg font-bold">{playerName}</div>
        <div className="flex flex-wrap items-center gap-3 justify-center">
          <div className="text-base font-semibold">⏱ <span aria-label='Elapsed Time'>{formatTime(timeElapsed)}</span></div>
          <div className="text-base font-semibold">⭐ <span aria-label='Score'>{score}</span></div>
          <div className="text-base font-semibold">✅ <span aria-label='Classified Numbers'>{getTotalClassifiedNumbers()}/20</span></div>
        </div>
        <button
          onClick={handleSubmit}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 active:scale-95 transition text-base font-bold w-full sm:w-auto"
          aria-label="Submit Answers"
        >
          Submit
        </button>
      </div>

      <div className="flex-1 p-2 sm:p-4 max-w-3xl mx-auto w-full flex flex-col gap-4">
        {/* Numbers Board */}
        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6 mb-2">
          <h2 className="text-lg sm:text-xl font-bold mb-2 text-center">Numbers</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {availableNumbers.map((number) => (
              <div
                key={number}
                onClick={() => handleNumberClick(number)}
                className={`number-card p-4 text-center text-lg sm:text-xl font-bold cursor-pointer select-none transition ring-2 ${selectedNumber === number ? 'ring-blue-500 bg-blue-50 scale-105' : 'ring-transparent bg-white'} hover:ring-blue-400 active:scale-95`}
                aria-label={`Select number ${number}`}
                tabIndex={0}
                role="button"
              >
                {number}
              </div>
            ))}
          </div>
        </div>

        {/* Categories - horizontal scroll on mobile */}
        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold mb-2 text-center">Categories</h2>
          <div className="flex flex-row gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:gap-6">
            {categories.map((category) => (
              <div
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`category-dropzone min-w-[220px] sm:min-w-0 flex-shrink-0 p-3 sm:p-4 transition border-2 border-dashed ${selectedNumber !== null ? 'hover:border-blue-500' : ''} ${selectedNumber !== null ? 'cursor-pointer' : 'cursor-default'} bg-gray-50 active:scale-98`}
                aria-label={`Drop numbers here for ${category.name}`}
                tabIndex={0}
                role="button"
              >
                <h3 className="font-bold mb-1 text-base sm:text-lg">{category.name}</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-2">{category.description}</p>
                <div className="flex flex-wrap gap-2 min-h-[32px]">
                  {categorySelections[category.id]?.map((number) => (
                    <div
                      key={number}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCategoryNumberClick(number, category.id);
                      }}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full cursor-pointer hover:bg-blue-200 text-sm sm:text-base"
                      aria-label={`Remove number ${number} from ${category.name}`}
                      tabIndex={0}
                      role="button"
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
      <Footer />
    </div>
  );
}

export default App; 