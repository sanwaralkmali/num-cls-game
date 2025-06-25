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

  if (gameState === 'instructions') {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full relative">
            <button
              onClick={() => setGameState('start')}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
              aria-label="Close instructions"
            >
              ×
            </button>
            <h1 className="text-3xl font-bold text-center mb-6">How to Play</h1>
            <ul className="list-disc list-inside text-gray-700 space-y-3 mb-6 text-base">
              <li>Enter your name and start the game.</li>
              <li>You will see 20 numbers. Your task is to classify each number into the correct category (e.g., Rational, Irrational, Integer, etc.).</li>
              <li>Click a number to select it, then click the category where it belongs.</li>
              <li>If you make a mistake, you can move numbers between categories.</li>
              <li>When you finish, click the Submit button to see your results and score.</li>
              <li>Try to get as many correct as possible and see your name on the leaderboard!</li>
            </ul>
            <p className="text-center text-gray-500 mb-6">Good luck and have fun learning!</p>
            <button
              onClick={() => {
                setGameState('playing');
                setTimeElapsed(0);
                setScore(0);
                setCategorySelections({});
                setSelectedNumber(null);
                setGameResults(null);
                const selectedQuestions = getRandomQuestions(20);
                setAvailableNumbers(selectedQuestions.map(q => q.number));
              }}
              className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 mt-4"
            >
              Start Game
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
                onClick={() => setGameState('instructions')}
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
    <div className="min-h-screen max-h-screen h-screen bg-gray-100 flex flex-col">
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
      <div className="flex-1 flex flex-col lg:flex-row gap-4 max-w-7xl mx-auto w-full p-4 overflow-hidden" style={{maxHeight: 'calc(100vh - 64px)'}}>
        {/* Numbers Board */}
        <div className="lg:w-1/3 bg-white rounded-lg shadow-lg p-4 overflow-y-auto" style={{maxHeight: '100%'}}>
          <h2 className="text-xl font-bold mb-4 text-center">Numbers</h2>
          <div className="grid grid-cols-4 gap-3">
            {availableNumbers.map((number) => (
              <div
                key={number}
                onClick={() => handleNumberClick(number)}
                className={`number-card p-3 text-lg font-bold cursor-pointer select-none transition ring-2 ${selectedNumber === number ? 'ring-blue-500 bg-blue-50 scale-105' : 'ring-transparent bg-white'} hover:ring-blue-400 active:scale-95`}
                aria-label={`Select number ${number}`}
                tabIndex={0}
                role="button"
              >
                {number}
              </div>
            ))}
          </div>
        </div>
        {/* Categories */}
        <div className="lg:w-2/3 bg-white rounded-lg shadow-lg p-4 overflow-y-auto" style={{maxHeight: '100%'}}>
          <h2 className="text-xl font-bold mb-4 text-center">Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`category-dropzone p-3 transition border-2 border-dashed ${selectedNumber !== null ? 'hover:border-blue-500' : ''} ${selectedNumber !== null ? 'cursor-pointer' : 'cursor-default'} bg-gray-50 active:scale-98`}
                aria-label={`Drop numbers here for ${category.name}`}
                tabIndex={0}
                role="button"
                style={{minHeight: '70px', maxHeight: '120px'}}
              >
                <h3 className="font-bold text-base mb-1">{category.name}</h3>
                <p className="text-xs text-gray-600 mb-1">{category.description}</p>
                <div className="flex flex-wrap gap-2 min-h-[24px]">
                  {categorySelections[category.id]?.map((number) => (
                    <div
                      key={number}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCategoryNumberClick(number, category.id);
                      }}
                      className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full cursor-pointer hover:bg-blue-200 text-xs"
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