import { useState } from 'react';
import { Trophy, RotateCcw, Sparkles, Settings } from 'lucide-react';
import './number-game.css';

interface PowerUp {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface Guess {
  guess: number[];
  feedback: string;
  isLottery?: boolean;
  isWin?: boolean;
}

interface SoloStats {
  gamesWon: number;
  bestRounds: number | null;
  currentStreak: number;
  bestStreak: number;
}

interface RevealedDigit {
  position: number;
  digit: number;
}

const NumberGame = () => {
  const [gameState, setGameState] = useState<string>('menu');
  const [gameMode, setGameMode] = useState<string>('auto');
  const [partyMode, setPartyMode] = useState<boolean>(false);
  const [playerCount, setPlayerCount] = useState<number>(2);
  const [playerNames, setPlayerNames] = useState<string[]>(['', '', '', '']);
  const [soloStats, setSoloStats] = useState<SoloStats>({ gamesWon: 0, bestRounds: null, currentStreak: 0, bestStreak: 0 });
  const [roundsPlayed, setRoundsPlayed] = useState<number>(0);
  const [powerUpsEnabled, setPowerUpsEnabled] = useState<boolean>(false);
  const [currentPlayer, setCurrentPlayer] = useState<number>(0);
  const [secretNumber, setSecretNumber] = useState<number[]>([]);
  const [manualNumber, setManualNumber] = useState<string[]>(['', '', '']);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [bestGuessCount, setBestGuessCount] = useState<number>(0);
  const [currentGuess, setCurrentGuess] = useState<string[]>(['', '', '']);
  const [guessesRemaining, setGuessesRemaining] = useState<number>(5);
  const [arrangementsRemaining, setArrangementsRemaining] = useState<number>(2);
  const [foundDigits, setFoundDigits] = useState<number[]>([]);
  const [scores, setScores] = useState<number[]>([0, 0, 0, 0]);
  const [roundScore, setRoundScore] = useState<number>(0);
  const [message, setMessage] = useState<string>('');
  const [showRules, setShowRules] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [activePowerUp, setActivePowerUp] = useState<PowerUp | null>(null);
  const [hideHistory, setHideHistory] = useState<boolean>(false);
  const [spinning, setSpinning] = useState<boolean>(false);
  const [revealedDigit, setRevealedDigit] = useState<RevealedDigit | null>(null);

  const powerUps: PowerUp[] = [
    { id: 'extra-guess', name: 'Extra Guess!', icon: '??', description: '+1 guess for finding digits' },
    { id: 'extra-arrangement', name: 'Extra Arrangement!', icon: '??', description: '+1 arrangement attempt' },
    { id: 'lose-guess', name: 'Lose a Guess!', icon: '??', description: '-1 guess (min 2)' },
    { id: 'reveal', name: 'Reveal One!', icon: '??', description: 'Shows one correct digit' },
    { id: 'double-points', name: 'Double Points!', icon: '?', description: '2x score this round' },
    { id: 'wildcard', name: 'Wildcard!', icon: '??', description: 'First guess reveals a correct digit' },
    { id: 'skip-turn', name: 'Skip Turn!', icon: '??', description: 'Miss this turn entirely' },
    { id: 'hide-history', name: 'Guess History Hidden!', icon: '??', description: 'Your guess history is hidden this round' },
  ];

  const partyPowerUps: PowerUp[] = [
    { id: 'chug-2', name: '2-Second Chug!', icon: '??', description: 'Take a 2-second drink' },
    { id: 'chug-5', name: '5-Second Chug!', icon: '??', description: 'Take a 5-second drink' },
    { id: 'finish-drink', name: 'Finish Your Drink!', icon: '??', description: 'Bottom\'s up!' },
    { id: 'drink-and-guess', name: 'Drink & Guess!', icon: '??', description: 'Sip before each guess this round' },
    { id: 'double-nothing', name: 'Double or Nothing!', icon: '??', description: 'Win = assign 2 drinks, Lose = take 2' },
  ];

  const generateSecretNumber = (): number[] => {
    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const selected: number[] = [];
    for (let i = 0; i < 3; i++) {
      const idx = Math.floor(Math.random() * digits.length);
      selected.push(digits[idx]);
      digits.splice(idx, 1);
    }
    return selected;
  };

  const spinPowerUpWheel = () => {
    setSpinning(true);
    setMessage('And the card is...');
    
    setTimeout(() => {
      const allPowerUps = partyMode ? [...powerUps, ...partyPowerUps] : powerUps;
      const randomPowerUp = allPowerUps[Math.floor(Math.random() * allPowerUps.length)];
      setActivePowerUp(randomPowerUp);
      setSpinning(false);
      
      if (randomPowerUp.id === 'extra-guess') {
        setGuessesRemaining(6);
        setMessage(`${randomPowerUp.icon} ${randomPowerUp.name} You have 6 guesses!`);
      } else if (randomPowerUp.id === 'extra-arrangement') {
        setArrangementsRemaining(3);
        setMessage(`${randomPowerUp.icon} ${randomPowerUp.name} You have 3 arrangement attempts!`);
      } else if (randomPowerUp.id === 'lose-guess') {
        setGuessesRemaining(4);
        setMessage(`${randomPowerUp.icon} ${randomPowerUp.name} You only have 4 guesses!`);
      } else if (randomPowerUp.id === 'reveal') {
        const revealIdx = Math.floor(Math.random() * 3);
        setRevealedDigit({ position: revealIdx, digit: secretNumber[revealIdx] });
        setMessage(`${randomPowerUp.icon} ${randomPowerUp.name} Position ${revealIdx + 1} is ${secretNumber[revealIdx]}!`);
      } else if (randomPowerUp.id === 'skip-turn') {
        setMessage(`${randomPowerUp.icon} ${randomPowerUp.name} Oh no! Turn skipped!`);
        setTimeout(() => endRound(), 3000);
        return;
      } else if (randomPowerUp.id === 'hide-history') {
        setHideHistory(true);
        setMessage(`${randomPowerUp.icon} ${randomPowerUp.name} Your guess history is hidden this round!`);
      } else {
        setMessage(`${randomPowerUp.icon} ${randomPowerUp.name}`);
      }
      
      setTimeout(() => {
        setGameState('playing');
        setMessage('');
      }, 4000);
    }, 3500);
  };

  const startRound = () => {
    if (playerCount === 1) {
      setRoundsPlayed(roundsPlayed + 1);
    }
    if (gameMode === 'manual' && playerCount > 1) {
      setGameState('manualEntry');
      setMessage('');
    } else {
      const secret = generateSecretNumber();
      setSecretNumber(secret);
      initializeRound();
    }
  };

  const submitManualNumber = () => {
    const number = manualNumber.map(d => parseInt(d));
    
    if (number.some(d => isNaN(d) || d < 1 || d > 9)) {
      setMessage('Please enter digits 1-9');
      return;
    }
    
    if (new Set(number).size !== 3) {
      setMessage('All three digits must be unique!');
      return;
    }
    
    setSecretNumber(number);
    setManualNumber(['', '', '']);
    initializeRound();
  };

  const initializeRound = () => {
    setGuesses([]);
    setCurrentGuess(['', '', '']);
    setGuessesRemaining(5);
    setArrangementsRemaining(2);
    setFoundDigits([]);
    setRoundScore(0);
    setMessage('');
    setActivePowerUp(null);
    setRevealedDigit(null);
    setBestGuessCount(0);
    setHideHistory(false);
    
    if (powerUpsEnabled) {
      setGameState('powerup');
    } else {
      setGameState('playing');
    }
    
    setTimeout(() => {
      document.getElementById('digit-0')?.focus();
    }, 100);
  };

  const checkGuess = () => {
    const guess = currentGuess.map(d => parseInt(d));
    
    if (guess.some(d => isNaN(d) || d < 1 || d > 9)) {
      setMessage('Please enter digits 1-9');
      return;
    }
    
    if (new Set(guess).size !== 3) {
      setMessage('All three digits must be unique!');
      return;
    }

    if (gameState === 'playing' && 
        guess[0] === secretNumber[0] && 
        guess[1] === secretNumber[1] && 
        guess[2] === secretNumber[2]) {
      setMessage('?? LOTTERY WIN! Exact number guessed! GAME OVER!');
      const newScores = [...scores];
      newScores[currentPlayer] = 100;
      setScores(newScores);
      setGuesses([...guesses, { guess, feedback: 'LOTTERY WIN! ??', isLottery: true }]);
      setTimeout(() => setGameState('gameOver'), 8000);
      return;
    }

    let matches = 0;
    guess.forEach(digit => {
      if (secretNumber.includes(digit)) matches++;
    });
    
    let wildcardMessage = '';
    if (activePowerUp?.id === 'wildcard' && guesses.length === 0) {
      if (matches === 0) {
        const randomDigit = secretNumber[Math.floor(Math.random() * 3)];
        wildcardMessage = ` (${randomDigit} is one of the numbers)`;
        setActivePowerUp(null);
      } else if (matches === 1) {
        const correctDigit = guess.find(d => secretNumber.includes(d));
        wildcardMessage = ` (${correctDigit})`;
        setActivePowerUp(null);
      } else if (matches === 2) {
        const correctDigits = guess.filter(d => secretNumber.includes(d));
        const randomCorrect = correctDigits[Math.floor(Math.random() * correctDigits.length)];
        wildcardMessage = ` (${randomCorrect})`;
        setActivePowerUp(null);
      }
      if (matches === 3) {
        setActivePowerUp(null);
      }
    }

    setGuesses([...guesses, { guess, feedback: `${matches} right${wildcardMessage}` }]);
    
    if (matches < 3) {
      const feedbackMsg = hideHistory 
        ? `${matches} right${wildcardMessage} (history hidden - remember this!)`
        : `${matches} right${wildcardMessage}`;
      setMessage(feedbackMsg);
      setTimeout(() => {
        if (gameState === 'playing') setMessage('');
      }, 8000);
    }
    
    if (matches > bestGuessCount) {
      setBestGuessCount(matches);
    }
    
    if (matches === 3 && gameState === 'playing') {
      setFoundDigits(guess);
      setGameState('arrangement');
      setMessage('All 3 digits found! Now arrange them correctly.');
      
      const findingPoints = [50, 40, 30, 20, 10][Math.min(guesses.length, 4)];
      const multiplier = activePowerUp?.id === 'double-points' ? 2 : 1;
      setRoundScore(findingPoints * multiplier);
    } else {
      setGuessesRemaining(guessesRemaining - 1);
      
      if (guessesRemaining === 1 && gameState === 'playing') {
        const basePoints = bestGuessCount === 2 ? 5 : bestGuessCount === 1 ? 4 : 3;
        const multiplier = activePowerUp?.id === 'double-points' ? 2 : 1;
        const consolationPoints = basePoints * multiplier;
        const reasonText = bestGuessCount === 2 ? 'getting 2 right' : bestGuessCount === 1 ? 'getting 1 right' : 'trying';
        const doubleText = multiplier === 2 ? ' (doubled!)' : '';
        setMessage(`Round over. The number was ${secretNumber.join('')}. You get ${consolationPoints} points for ${reasonText}${doubleText}!`);
        const newScores = [...scores];
        newScores[currentPlayer] += consolationPoints;
        setScores(newScores);
        setTimeout(() => endRound(), 8000);
      }
    }
    
    setCurrentGuess(['', '', '']);
    
    setTimeout(() => {
      document.getElementById('digit-0')?.focus();
    }, 50);
  };

  const checkArrangement = () => {
    const guess = currentGuess.map(d => parseInt(d));
    
    if (guess.some(d => isNaN(d))) {
      setMessage('Please enter all three digits');
      return;
    }

    if (guess[0] === secretNumber[0] && 
        guess[1] === secretNumber[1] && 
        guess[2] === secretNumber[2]) {
      const arrangementBonus = arrangementsRemaining === 3 ? 10 : 
                               arrangementsRemaining === 2 ? 10 : 5;
      const totalPoints = roundScore + arrangementBonus;
      
      setMessage(`?? Correct! +${totalPoints} points!`);
      setGuesses([...guesses, { guess, feedback: '? CORRECT!', isWin: true }]);
      
      const newScores = [...scores];
      newScores[currentPlayer] += totalPoints;
      setScores(newScores);
      
      setTimeout(() => {
        if (newScores[currentPlayer] >= 100) {
          if (playerCount === 1) {
            const newStats = { ...soloStats };
            newStats.gamesWon += 1;
            newStats.currentStreak += 1;
            if (newStats.currentStreak > newStats.bestStreak) {
              newStats.bestStreak = newStats.currentStreak;
            }
            if (!newStats.bestRounds || roundsPlayed < newStats.bestRounds) {
              newStats.bestRounds = roundsPlayed;
            }
            setSoloStats(newStats);
          }
          setGameState('gameOver');
        } else {
          endRound();
        }
      }, 5000);
    } else {
      setArrangementsRemaining(arrangementsRemaining - 1);
      setGuesses([...guesses, { guess, feedback: '? Wrong order' }]);
      
      if (arrangementsRemaining === 1) {
        setMessage(`Round over. The number was ${secretNumber.join('')}! You get ${roundScore} points for finding the all 3 numbers!`);
        const newScores = [...scores];
        newScores[currentPlayer] += roundScore;
        setScores(newScores);
        setTimeout(() => endRound(), 8000);
      } else {
        setMessage('Wrong order. One more try!');
      }
    }
    
    setCurrentGuess(['', '', '']);
    
    setTimeout(() => {
      document.getElementById('digit-0')?.focus();
    }, 50);
  };

  const endRound = () => {
    setCurrentPlayer((currentPlayer + 1) % playerCount);
    setGameState('setup');
  };

  const resetGame = () => {
    setScores([0, 0, 0, 0]);
    setCurrentPlayer(0);
    setRoundsPlayed(0);
    setPlayerNames(['', '', '', '']);
    setGameState('menu');
  };

  const handleInputChange = (index: number, value: string, isManual = false) => {
    if (value === '' || (value >= '1' && value <= '9')) {
      if (isManual) {
        const newNum = [...manualNumber];
        newNum[index] = value;
        setManualNumber(newNum);
      } else {
        const newGuess = [...currentGuess];
        newGuess[index] = value;
        setCurrentGuess(newGuess);
      }
      
      if (value !== '' && index < 2) {
        document.getElementById(`${isManual ? 'manual' : 'digit'}-${index + 1}`)?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent, isManual = false) => {
    const currentArray = isManual ? manualNumber : currentGuess;
    
    if (e.key === 'Backspace' && currentArray[index] === '' && index > 0) {
      document.getElementById(`${isManual ? 'manual' : 'digit'}-${index - 1}`)?.focus();
    }
    if (e.key === 'Enter' && currentArray.every(d => d !== '')) {
      if (isManual) submitManualNumber();
      else if (gameState === 'playing') checkGuess();
      else if (gameState === 'arrangement') checkArrangement();
    }
  };

  const getPlayerName = (index: number): string => {
    if (playerCount === 1) {
      return playerNames[0]?.trim() || 'You';
    }
    return playerNames[index]?.trim() || `Player ${index + 1}`;
  };

  const playerColors = ['yellow', 'blue', 'green', 'pink'];

  return (
    
<div className="page-wrapper bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4 md:p-8">
  <div className="max-w-6xl mx-auto">
    {/* Header */}
    <div className="relative text-center mb-6">
      <div className="flex justify-center items-start mb-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">The Number Game</h1>
          <p className="text-indigo-200 mb-1">A family classic</p>
          <p className="text-indigo-300 text-sm">Created by Newman Games</p>
        </div>
      </div>

      {/* Red End Game button */}
      {gameState !== 'menu' && (
        <button
          onClick={resetGame}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          End Game
        </button>
      )}

      {/* Rules / Settings buttons */}
      <div className="flex justify-center gap-4 mt-2">
        <button
          onClick={() => setShowRules(!showRules)}
          className="text-indigo-300 hover:text-white text-sm underline"
        >
          {showRules ? 'Hide' : 'Show'} Rules
        </button>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-indigo-300 hover:text-white text-sm underline flex items-center gap-1"
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>
    </div>

    {/* Rules */}

        {showRules && (
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-6 text-white">
            <h2 className="text-xl font-bold mb-3">How to Play</h2>
			<div className="mt-4 pt-4 border-t border-white/20">
                <p>Players take turns guessing secret 3-digit numbers</p>
				<p>You have 5 guesses to identify the 3 digits (1-9, all unique</p>
				<p>After each guess, you'll be told how many digits are correct</p>
				<p>Once you find all 3 digits, you get 2 attempts to arrange them in the exact order</p>
				<p><strong>LOTTERY WIN:</strong> Guess all three numbers before identifying the three unique digits  = Instant win!</p>
				<p> First player to 100 points wins!</p>
				<p> <strong>POWER-UPS:</strong> Choose a card before each turn for bonuses or penalties!</p>
            </div>
                       
            <div className="mt-4 pt-4 border-t border-white/20">
              <h3 className="font-bold mb-2">Scoring:</h3>
              <div className="text-sm space-y-1">
                <p>Identify all three numbers: 50 Pts (1 guess), 40 (2), 30 (3), 20 (4), 10 (5)</p>
                <p>Exact Order Bonus: +10 (1st try), +5 (2nd try)</p>
                <p>Trying: 3pts</p>
				 <p>1 Digit right +1 Point; 2 Digits correct +2 Points</p>
              </div>
            </div>
          </div>
        )}

        {/* Settings */}
        {showSettings && gameState === 'menu' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-6 text-white">
            <h2 className="text-xl font-bold mb-4">Game Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">Game Mode</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setGameMode('auto')}
                    className={`flex-1 py-3 px-4 rounded-lg font-bold ${
                      gameMode === 'auto' 
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500' 
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    Auto Mode
                  </button>
                  <button
                    onClick={() => setGameMode('manual')}
                    disabled={playerCount === 1}
                    className={`flex-1 py-3 px-4 rounded-lg font-bold ${
                      gameMode === 'manual' 
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500' 
                        : playerCount === 1
                        ? 'bg-white/5 cursor-not-allowed opacity-50'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    Manual Mode
                  </button>
                </div>
                <p className="text-xs text-indigo-200 mt-2">
                  {playerCount === 1 
                    ? 'Solo mode uses auto-generated numbers' 
                    : gameMode === 'auto' 
                    ? 'Computer generates numbers' 
                    : 'Players enter numbers for each other'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Number of Players</label>
                <div className="grid grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map(num => (
                    <button
                      key={num}
                      onClick={() => setPlayerCount(num)}
                      className={`py-3 px-4 rounded-lg font-bold ${
                        playerCount === num 
                          ? 'bg-gradient-to-r from-blue-400 to-purple-500' 
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-indigo-200 mt-2">
                  {playerCount === 1 ? 'Solo mode - Race to 100!' : `${playerCount} players compete`}
                </p>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={powerUpsEnabled}
                    onChange={(e) => setPowerUpsEnabled(e.target.checked)}
                    className="w-5 h-5"
                  />
                  <div>
                    <span className="font-bold">Enable Power-Ups</span>
                    <p className="text-xs text-indigo-200">Select a card before each turn for bonuses/penalties</p>
                  </div>
                </label>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={partyMode}
                    onChange={(e) => setPartyMode(e.target.checked)}
                    disabled={!powerUpsEnabled}
                    className="w-5 h-5 disabled:opacity-50"
                  />
                  <div>
                    <span className={`font-bold ${!powerUpsEnabled ? 'opacity-50' : ''}`}>Party Mode ??</span>
                    <p className={`text-xs text-indigo-200 ${!powerUpsEnabled ? 'opacity-50' : ''}`}>
                      Adds drinking challenges to the power-up cards
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Menu */}
        {gameState === 'menu' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Ready to Play?</h2>
            <p className="text-indigo-200 mb-6">
              {playerCount === 1 ? 'Solo Mode' : `${playerCount} Players`} • {gameMode === 'auto' ? 'Auto Mode' : 'Manual Mode'}
              {powerUpsEnabled && ' • Power-Ups ON'}
              {partyMode && ' • ?? Party Mode'}
            </p>
            
            {/* Player Name Inputs */}
            <div className="mb-6 max-w-md mx-auto">
              <h3 className="text-white font-bold mb-3">Player Names (optional)</h3>
              <div className="space-y-3">
                {Array.from({ length: playerCount }).map((_, idx) => (
                  <input
                    key={idx}
                    type="text"
                    placeholder={playerCount === 1 ? 'Your name' : `Player ${idx + 1} name`}
                    value={playerNames[idx]}
                    onChange={(e) => {
                      const newNames = [...playerNames];
                      newNames[idx] = e.target.value;
                      setPlayerNames(newNames);
                    }}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    maxLength={15}
                  />
                ))}
              </div>
            </div>
            
            {playerCount === 1 && soloStats.gamesWon > 0 && (
              <div className="bg-white/10 rounded-lg p-4 mb-6 max-w-md mx-auto">
                <h3 className="text-lg font-bold text-white mb-3">Your Stats</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-indigo-200">Games Won</p>
                    <p className="text-2xl font-bold text-yellow-400">{soloStats.gamesWon}</p>
                  </div>

                  <div>
                    <p className="text-indigo-200">Best Rounds</p>
                    <p className="text-2xl font-bold text-yellow-400">{soloStats.bestRounds || '-'}</p>
                  </div>
                  <div>
                    <p className="text-indigo-200">Current Streak</p>
                    <p className="text-2xl font-bold text-green-400">{soloStats.currentStreak}</p>
                  </div>
                  <div>
                    <p className="text-indigo-200">Best Streak</p>
                    <p className="text-2xl font-bold text-green-400">{soloStats.bestStreak}</p>
                  </div>
                </div>
              </div>
            )}
            
            <button
              onClick={() => setGameState('setup')}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-12 py-5 rounded-lg font-bold text-xl hover:from-yellow-500 hover:to-orange-600 transition-all transform hover:scale-105"
            >
              Start Game
            </button>
          </div>
        )}
		
		 {/* Score Board */}
        {/* Score Board */}
        {gameState !== 'menu' && (
          <div key={playerNames.join('-')} className={`grid ${playerCount === 1 ? 'grid-cols-1 max-w-md mx-auto' : `grid-cols-${playerCount}`} gap-3 mb-6`}>
            {Array.from({ length: playerCount }).map((_, idx) => (
              <div
                key={`${idx}-${playerNames[idx]}`}
                className={`bg-white/10 backdrop-blur-lg rounded-lg p-4 ${
                  currentPlayer === idx ? `ring-4 ring-${playerColors[idx]}-400` : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      {playerCount === 1 ? 'You' : `Player ${idx + 1}`}
                    </h2>
                    <p className={`text-3xl font-bold text-${playerColors[idx]}-400`}>
                      {scores[idx]}
                    </p>
                    {playerCount === 1 && roundsPlayed > 0 && (
                      <p className="text-xs text-indigo-200 mt-1">Round {roundsPlayed}</p>
                    )}
                  </div>
                  {currentPlayer === idx && gameState !== 'setup' && gameState !== 'gameOver' && (
                    <Sparkles className={`w-6 h-6 text-${playerColors[idx]}-400`} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Game Area */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 md:p-8">
          {gameState === 'setup' && (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">
                {getPlayerName(currentPlayer)}'s Turn
              </h2>
              {gameMode === 'manual' && playerCount > 1 && (
                <p className="text-indigo-200 mb-6">
                  {getPlayerName((currentPlayer - 1 + playerCount) % playerCount)}, enter a secret number!
                </p>
              )}
              <button
                onClick={startRound}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-8 py-4 rounded-lg font-bold text-lg hover:from-yellow-500 hover:to-orange-600 transition-all transform hover:scale-105"
              >
                Start Round
              </button>
            </div>
          )}

          {gameState === 'manualEntry' && (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">
                Enter Secret Number
              </h2>
              <p className="text-indigo-200 mb-6">
                {getPlayerName(currentPlayer)}, look away!
              </p>
              
              <div className="flex justify-center gap-4 mb-6">
                {[0, 1, 2].map(i => (
                  <input
                    key={i}
                    id={`manual-${i}`}
                    type="text"
                    maxLength={1}
                    value={manualNumber[i]}
                    onChange={(e) => handleInputChange(i, e.target.value, true)}
                    onKeyDown={(e) => handleKeyDown(i, e, true)}
                    className="w-20 h-20 text-center text-4xl font-bold bg-white/20 text-white rounded-lg focus:outline-none focus:ring-4 focus:ring-yellow-400"
                  />
                ))}
              </div>

              {message && (
                <p className="text-red-300 mb-4">{message}</p>
              )}

              <button
                onClick={submitManualNumber}
                disabled={manualNumber.some(d => d === '')}
                className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-8 py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:from-green-500 hover:to-blue-600"
              >
                Set Number
              </button>
            </div>
          )}

          {gameState === 'powerup' && (
  <div className="text-center">
    <h2 className="text-2xl font-bold text-white mb-4">
      Power-Up Time!
    </h2>
    <p className="text-indigo-200 mb-6">Pick a card to reveal your power-up!</p>
    
    {!activePowerUp && (
      <div className="power-up-cards">
        {[1, 2, 3, 4, 5].map((cardNum) => (
          <div
            key={cardNum}
            className="power-up-card"
            onClick={() => spinPowerUpWheel()}
          >
            <div className="power-up-card-inner">
              <div className="power-up-card-front"></div>
              <div className="power-up-card-back"></div>
            </div>
          </div>
        ))}
      </div>
    )}

    {activePowerUp && (
      <div className="bg-white/20 rounded-lg p-8 max-w-md mx-auto mt-6">
        <div className="text-6xl mb-4">{activePowerUp.icon}</div>
        <h3 className="text-2xl font-bold text-white mb-2">{activePowerUp.name}</h3>
        <p className="text-indigo-200">{activePowerUp.description}</p>
      </div>
    )}

    {message && (
      <p className="text-xl font-bold text-yellow-300 mt-6">{message}</p>
    )}
  </div>
)}
          {gameState === 'gameOver' && (
            <div className="text-center">
              <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-4">
                {playerCount === 1 ? `${getPlayerName(0)} Win${getPlayerName(0) === 'You' ? '' : 's'}!` : `${getPlayerName(scores.findIndex(s => s >= 100))} Wins!`}
              </h2>
              {playerCount === 1 ? (
                <div className="bg-white/10 rounded-lg p-6 mb-6 max-w-md mx-auto">
                  <p className="text-xl text-yellow-300 mb-4">Completed in {roundsPlayed} rounds!</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-indigo-200">Total Wins</p>
                      <p className="text-2xl font-bold text-yellow-400">{soloStats.gamesWon}</p>
                    </div>
                    <div>
                      <p className="text-indigo-200">Personal Best</p>
                      <p className="text-2xl font-bold text-yellow-400">{soloStats.bestRounds} rounds</p>
                    </div>
                    <div>
                      <p className="text-indigo-200">Win Streak</p>
                      <p className="text-2xl font-bold text-green-400">{soloStats.currentStreak}</p>
                    </div>
                    <div>
                      <p className="text-indigo-200">Best Streak</p>
                      <p className="text-2xl font-bold text-green-400">{soloStats.bestStreak}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xl text-indigo-200 mb-6">
                  Final Scores: {scores.slice(0, playerCount).join(' - ')}
                </div>
              )}
              <button
                onClick={resetGame}
                className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-8 py-4 rounded-lg font-bold text-lg hover:from-green-500 hover:to-blue-600 transition-all transform hover:scale-105"
              >
                <RotateCcw className="inline mr-2" />
                New Game
              </button>
            </div>
          )}

          {(gameState === 'playing' || gameState === 'arrangement') && (
            <div>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {getPlayerName(currentPlayer)}'s Turn
                </h2>
				{message && (
  <div className="text-center mb-6">
    <p className="text-xl font-bold text-yellow-300">{message}</p>
  </div>
)}

                {gameState === 'playing' && (
                  <div>
                    <p className="text-indigo-200">
                      Guesses remaining: {guessesRemaining}
                    </p>
                    {revealedDigit && (
                      <p className="text-yellow-300 font-bold mt-2">
                        ?? Position {revealedDigit.position + 1} = {revealedDigit.digit}
                      </p>
                    )}
                  </div>
                )}
                {gameState === 'arrangement' && (
                  <p className="text-indigo-200">
                    Arrangement attempts: {arrangementsRemaining}
                  </p>
                )}
              </div>

              {/* Input */}
              <div className="flex justify-center gap-4 mb-6">
                {[0, 1, 2].map(i => (
  <input
    key={i}
    id={`digit-${i}`}
    type="text"
    maxLength={1}
    autoFocus={i === 0}
    value={currentGuess[i]}
    onChange={(e) => handleInputChange(i, e.target.value)}
    onKeyDown={(e) => handleKeyDown(i, e)}
    className="w-16 h-16 md:w-20 md:h-20 text-center text-3xl md:text-4xl font-bold bg-white/20 text-white rounded-lg focus:outline-none focus:ring-4 focus:ring-yellow-400"
  />
))}
              </div>

          {/* Submit Button */}
<div className="flex justify-center mb-6">
  <button
    onClick={gameState === 'playing' ? checkGuess : checkArrangement}
    disabled={currentGuess.some(d => d === '')}
    className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-12 py-4 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:from-yellow-500 hover:to-orange-600 transition-all"
  >
    {gameState === 'playing' ? 'Submit Guess' : 'Submit Arrangement'}
  </button>
</div>



              {/* Guess History */}
              {guesses.length > 0 && !hideHistory && (
                <div className="mt-8">
                  <h3 className="text-lg font-bold text-white mb-4">Guess History</h3>
                  <div className="space-y-2">
                    {guesses.map((g, idx) => (
                      <div
                        key={idx}
                        className={`flex justify-between items-center p-3 rounded-lg ${
                          g.isLottery ? 'bg-yellow-500/30' :
                          g.isWin ? 'bg-green-500/30' :
                          'bg-white/5'
                        }`}
                      >
                        <span className="text-white font-mono text-lg">
                          {g.guess.join(' ')}
                        </span>
                        <span className={`font-bold ${
                          g.isLottery ? 'text-yellow-300' :
                          g.isWin ? 'text-green-300' :
                          'text-indigo-300'
                        }`}>
                          {g.feedback}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {hideHistory && guesses.length > 0 && (
                <div className="mt-8 text-center">
                  <div className="bg-red-500/20 rounded-lg p-6 border-2 border-red-500/50">
                    <p className="text-2xl mb-2">??</p>
                    <p className="text-white font-bold">Guess History Hidden!</p>
                    <p className="text-red-200 text-sm mt-2">Better remember what you've tried...</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NumberGame;