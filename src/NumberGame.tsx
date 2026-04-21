import { useState, useEffect } from 'react';
import { RotateCcw, Share2 } from 'lucide-react';
import './number-game.css';
import './NumberGame-Spacing-Fix.css';
import LandingPage from './LandingPage';
import SecretNumberLogo from './SecretNumberLogo';

interface Guess {
  guess: number[];
  feedback: string;
  isLottery?: boolean;
  isWin?: boolean;
  informationValue?: number;
  wasConsecutiveZero?: boolean;
}

interface RoundData {
  secretNumber: number[];
  guesses: Guess[];
  pointsEarned: number;
  timeElapsed?: number | null;
}

interface GameResults {
  roundsPlayed: number;
  rounds: RoundData[];
}

type GameState = 'menu' | 'setup' | 'playing' | 'arrangement' | 'roundEnd' | 'gameOver';

const NumberGame = () => {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [showRules, setShowRules] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showMenu, setShowMenu] = useState<boolean>(false);

  const [secretNumber, setSecretNumber] = useState<number[]>([]);
  const [roundsPlayed, setRoundsPlayed] = useState<number>(0);
  const [allRounds, setAllRounds] = useState<RoundData[]>([]);

  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string[]>(['', '', '']);
  const [guessesRemaining, setGuessesRemaining] = useState<number>(6);
  const [arrangementsRemaining, setArrangementsRemaining] = useState<number>(2);
  const [foundDigits, setFoundDigits] = useState<number[]>([]);
  const [roundScore, setRoundScore] = useState<number>(0);
  const [bestGuessCount, setBestGuessCount] = useState<number>(0);
  const [bestClueType, setBestClueType] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const [showTimer, setShowTimer] = useState<boolean>(true);
  const [roundStartTime, setRoundStartTime] = useState<number | null>(null);
  const [roundEndTime, setRoundEndTime] = useState<number | null>(null);

  const [gameResults, setGameResults] = useState<GameResults | null>(null);
  const [lastGameResults, setLastGameResults] = useState<GameResults | null>(null);
  const [showLastGame, setShowLastGame] = useState<boolean>(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [challengeSuccess, setChallengeSuccess] = useState(false);

  const [showLanding, setShowLanding] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('easy');

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

  const encodeChallenge = (digits: number[]): string => {
    return btoa("SNG" + digits.join("")).replace(/=/g, "");
  };

  const decodeChallenge = (encoded: string): number[] | null => {
    try {
      const padded = encoded + "==".slice(0, (4 - encoded.length % 4) % 4);
      const decoded = atob(padded);
      if (!decoded.startsWith("SNG")) return null;
      const digits = decoded.slice(3).split("").map(Number);
      if (digits.length !== 3 || digits.some(d => isNaN(d) || d < 1 || d > 9)) return null;
      if (new Set(digits).size !== 3) return null;
      return digits;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get("c");
    const d = params.get("d");
    if (c && decodeChallenge(c)) {
      setShowLanding(false);
      if (d === 'easy' || d === 'normal' || d === 'hard') {
        setDifficulty(d);
      }
    }
  }, []);

  const startRound = () => {
    setRoundsPlayed(prev => prev + 1);
    const params = new URLSearchParams(window.location.search);
    const c = params.get("c");
    const challengeFromUrl = c ? decodeChallenge(c) : null;
    const secret = challengeFromUrl || generateSecretNumber();
    if (challengeFromUrl) {
      window.history.replaceState({}, '', window.location.pathname);
    }
    setSecretNumber(secret);
    // DEV ONLY: alert(`Secret Number (for DM testing): ${secret.join('')}`);
    initializeRound();
  };

  const initializeRound = () => {
    setGuesses([]);
    setBestClueType('');
    setCurrentGuess(['', '', '']);
    setGuessesRemaining(6);
    setArrangementsRemaining(2);
    setFoundDigits([]);
    setRoundScore(0);
    setBestGuessCount(0);
    setMessage('');
    setRoundStartTime(Date.now());
    setRoundEndTime(null);
    setGameState('playing');
    setTimeout(() => {
      document.getElementById('digit-0')?.focus();
    }, 100);
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `${seconds}s`;
  };

  const checkGuess = () => {
    setMessage('');
    const guess = currentGuess.map(d => parseInt(d));

    if (guess.some(d => isNaN(d) || d < 1 || d > 9)) {
      setMessage('Please enter digits 1-9');
      return;
    }

    if (new Set(guess).size !== 3) {
      setMessage('All three digits must be unique!');
      return;
    }

    let showedSpecialMessage = false;

    // Exact match in playing phase
    if (gameState === 'playing' &&
        guess[0] === secretNumber[0] &&
        guess[1] === secretNumber[1] &&
        guess[2] === secretNumber[2]) {

      const isLottery = guesses.length === 0;
      const isEarlyWin = guesses.length === 1;

      const newGuess = { guess, feedback: 'CORRECT!', isWin: true, isLottery };
      const newGuesses = [...guesses, newGuess];
      setGuesses(newGuesses);
      setRoundStartTime(null);
      setRoundEndTime(null);

      if (isLottery) {
        const endTime = Date.now();
        setRoundEndTime(endTime);
        saveRoundData(100, newGuesses, endTime);
        setGameState('roundEnd');
        setMessage(`LOTTERY WIN`);
        return;
      }

      if (isEarlyWin) {
        const endTime = Date.now();
        setRoundEndTime(endTime);
        saveRoundData(80, newGuesses, endTime);
        setGameState('roundEnd');
        setMessage(`EARLY_WIN:80`);
        return;
      }

      const guessNumber = guesses.length + 1;
      const basePoints = [50, 40, 30, 20, 10, 5][Math.min(guessNumber - 1, 5)];
      const endTime = Date.now();
      setRoundEndTime(endTime);
      saveRoundData(basePoints, newGuesses, endTime);
      setGameState('roundEnd');
      setMessage(`WIN:${basePoints}`);
      return;
    }

    let matches = 0;
    guess.forEach(digit => {
      if (secretNumber.includes(digit)) matches++;
    });

    // Deduction bonus message (solo: no points, just feedback)
    if (matches === 0) {
      const previouslyGuessedDigits = new Set(guesses.flatMap(g => g.guess));
      const newDigits = guess.filter(digit => !previouslyGuessedDigits.has(digit));
      if (newDigits.length > 0) {
        const eliminated = guess.length;
        setMessage(`🧠 Smart move! You eliminated ${eliminated} digit${eliminated > 1 ? 's' : ''}!`);
        showedSpecialMessage = true;
      }
    }

    // Two zeros in a row achievement
    if (matches === 0 && guesses.length > 0) {
      const previousGuess = guesses[guesses.length - 1];
      if (previousGuess.feedback.includes('0 right')) {
        const allDigits = [...previousGuess.guess, ...guess];
        if (new Set(allDigits).size === 6) {
          setMessage(`🧠 Digit Elimination!\nTwo zero guesses in a row\n(Very Rare!) 🎯`);
          showedSpecialMessage = true;
        }
      }
    }

    let informationValue = 0;
    if (matches === 0) informationValue = showedSpecialMessage ? 7 : 4;
    else if (matches === 1) informationValue = 2;
    else if (matches === 2) informationValue = 3;
    else if (matches === 3) informationValue = 5;

    // Track best clue type
    let isSixDigitElimination = false;
    if (matches === 0 && guesses.length > 0) {
      const prev = guesses[guesses.length - 1];
      if (prev.feedback.includes('0 right')) {
        if (new Set([...prev.guess, ...guess]).size === 6) isSixDigitElimination = true;
      }
    }
    if (isSixDigitElimination) {
      setBestClueType('six-elimination');
    } else if (matches === 3) {
      if (bestClueType !== 'six-elimination') setBestClueType('three-right');
    } else if (matches === 0) {
      if (!['six-elimination', 'three-right'].includes(bestClueType)) setBestClueType('zero-right');
    } else if (matches === 2) {
      if (!['six-elimination', 'three-right', 'zero-right'].includes(bestClueType)) setBestClueType('two-right');
    } else if (matches === 1) {
      if (bestClueType === '') setBestClueType('one-right');
    }

    const newGuesses = [...guesses, {
      guess,
      feedback: `${matches} right`,
      informationValue,
      wasConsecutiveZero: showedSpecialMessage && matches === 0,
    }];
    setGuesses(newGuesses);

    if (matches < 3 && !showedSpecialMessage) {
      setMessage(`${matches} digit${matches !== 1 ? 's' : ''} correct`);
    }

    if (matches > bestGuessCount) setBestGuessCount(matches);

    if (matches === 3) {
      setFoundDigits(guess);
      setGameState('arrangement');
      setBestClueType('three-right');
      setMessage(`${guess.join(' ')} are the correct digits!\n🔐 Crack the code - Guess the exact number!`);
      const findingPoints = [50, 40, 30, 20, 10, 5][Math.min(guesses.length, 5)];
      setRoundScore(findingPoints);
    } else {
      setGuessesRemaining(guessesRemaining - 1);
      if (guessesRemaining === 1) {
        const consolationPoints = bestGuessCount === 2 ? 10 : bestGuessCount === 1 ? 8 : 5;
        setMessage(`ROUND_OVER:${consolationPoints}`);
        saveRoundData(consolationPoints, newGuesses);
        setGameState('roundEnd');
        return;
      }
    }

    setCurrentGuess(['', '', '']);
    setTimeout(() => {
      document.getElementById('digit-0')?.focus();
    }, 50);
  };

  const checkArrangement = (overrideGuess?: number[]) => {
    const guess = overrideGuess || currentGuess.map(d => parseInt(d));

    if (guess.some(d => isNaN(d))) {
      setMessage('Please enter all three digits');
      return;
    }

    if (guess[0] === secretNumber[0] &&
        guess[1] === secretNumber[1] &&
        guess[2] === secretNumber[2]) {
      const arrangementBonus = arrangementsRemaining === 2 ? 10 : 5;
      const totalPoints = roundScore + arrangementBonus;
      const finalGuesses = [...guesses, { guess, feedback: 'CORRECT!', isWin: true }];
      setGuesses(finalGuesses);
      const endTime = Date.now();
      setRoundEndTime(endTime);
      saveRoundData(totalPoints, finalGuesses, endTime);
      setGameState('roundEnd');
      setMessage(`WIN:${totalPoints}`);
      return;
    }

    setArrangementsRemaining(arrangementsRemaining - 1);
    setGuesses([...guesses, { guess, feedback: 'Wrong order' }]);

    if (arrangementsRemaining === 1) {
      const finalPoints = roundScore + 10;
      setMessage(`PARTIAL:${finalPoints}`);
      saveRoundData(finalPoints, [...guesses, { guess, feedback: 'Wrong order' }]);
      setGameState('roundEnd');
    } else {
      setMessage(`❌ Not the exact number! One more try!`);
    }

    setCurrentGuess(['', '', '']);
    setTimeout(() => {
      document.getElementById('digit-0')?.focus();
    }, 50);
  };

  const handleContinue = () => {
    setMessage('');
    setGameResults({
      roundsPlayed,
      rounds: allRounds,
    });
    setGameState('gameOver');
  };

  const saveRoundData = (pointsEarned: number, guessesToSave = guesses, endTime?: number) => {
    const timeElapsed = roundStartTime && endTime
      ? endTime - roundStartTime
      : null;
    const roundData: RoundData = {
      secretNumber: [...secretNumber],
      guesses: [...guessesToSave],
      pointsEarned,
      timeElapsed
    };
    setAllRounds(prevRounds => [...prevRounds, roundData]);
  };

  const resetGame = () => {
    if (gameResults) setLastGameResults(gameResults);
    setRoundsPlayed(0);
    setAllRounds([]);
    setGameState('menu');
    setShowLastGame(false);
  };

  const handleInputChange = (index: number, value: string) => {
    if (value === '' || (value >= '1' && value <= '9')) {
      const newGuess = [...currentGuess];
      newGuess[index] = value;
      setCurrentGuess(newGuess);
      if (value !== '' && index < 2) {
        document.getElementById(`digit-${index + 1}`)?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && currentGuess[index] === '' && index > 0) {
      document.getElementById(`digit-${index - 1}`)?.focus();
    }
    if (e.key === 'Enter' && currentGuess.every(d => d !== '')) {
      if (gameState === 'playing') checkGuess();
      else if (gameState === 'arrangement') checkArrangement();
    }
  };

  if (showLanding) {
    return <LandingPage onStartGame={() => setShowLanding(false)} />;
  }

  const eliminatedDigits = new Set<number>(
    guesses.flatMap(g => parseInt(g.feedback) === 0 ? g.guess : [])
  );

  const handleShare = async () => {
    const round = allRounds[0];
    if (!round) return;

    const grid = round.guesses.map(g => {
      if (g.isLottery) return '🎰🎰🎰';
      if (g.isWin) return '✅✅✅';
      if (difficulty === 'easy') {
        return g.guess.map((digit, i) => {
          if (digit === round.secretNumber[i]) return '🟩';
          if (round.secretNumber.includes(digit)) return '🟨';
          return '⬜';
        }).join('');
      }
      if (difficulty === 'normal') {
        return g.guess.map(digit =>
          round.secretNumber.includes(digit) ? '🟦' : '⬜'
        ).join('');
      }
      if (g.feedback === 'Wrong order') return '🟨🟨🟨';
      const n = parseInt(g.feedback);
      if (n === 3) return '🟩🟩🟩';
      if (n === 2) return '🟩🟩⬜';
      if (n === 1) return '🟩⬜⬜';
      return '⬜⬜⬜';
    }).join('\n');

    const totalGuessCount = round.guesses.length;
    const didWin = round.guesses.some(g => g.isWin || g.isLottery);
    const isLottery = round.guesses[0]?.isLottery;
    const time = round.timeElapsed ? formatTime(round.timeElapsed) : '';

    let text = '🎯 Secret Number\n\n';
    text += `${grid}\n\n`;

    if (isLottery) {
      text += `🎰 LOTTERY WIN! Guessed it on the first try — 1 in 504 odds!\n`;
    } else if (didWin) {
      const t = time ? ` · ${time}` : '';
      const crackMsg =
        totalGuessCount === 1 ? `👑 1 guess. Absolutely unreal${t}` :
        totalGuessCount === 2 ? `🎯 Nearly a lottery win — cracked it in just 2 guesses!${t}` :
        totalGuessCount === 3 ? `🎯 Cracked it in 3 guesses${t}` :
        totalGuessCount === 4 ? `🎯 Solved in 4 — well played${t}` :
        totalGuessCount === 5 ? `😅 Down to the wire — 5 guesses${t}` :
                                `😤 Squeezed it out in ${totalGuessCount} guesses${t}`;
      text += `${crackMsg}\n`;
    } else if (round.guesses.some(g => g.feedback === 'Wrong order')) {
      text += `Found the digits but couldn't crack the order 😢\n`;
    } else {
      text += `Couldn't crack it today 😅\n`;
    }

    const shareData = { text };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
        return;
      } catch (_err) {
        // fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(text);
    } catch (_err) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br flex flex-col items-center justify-center" style={{ padding: '76px 16px 32px' }}>

      {/* Fixed Header Bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '60px',
        background: '#0F2847',
        borderBottom: '1px solid #F59E0B',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(8px)'
      }}>
        <span style={{ color: 'white', fontSize: '20px', fontWeight: '800', letterSpacing: '3px' }}>
          🔐 SECRET NUMBER
        </span>
        <button
          onClick={() => setShowMenu(true)}
          style={{
            position: 'absolute', right: '16px',
            width: '40px', height: '40px',
            background: 'transparent',
            border: '1px solid rgba(245,158,11,0.5)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <span style={{ color: '#F59E0B', fontSize: '20px' }}>☰</span>
        </button>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6"></div>

{showRules && (
  <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-6 text-white" style={{ position: 'relative' }}>
    <button
      onClick={() => setShowRules(false)}
      style={{
        position: 'absolute', top: '12px', right: '12px',
        background: 'transparent', border: 'none', color: '#FBBF24',
        fontSize: '24px', cursor: 'pointer', padding: '4px', lineHeight: '1'
      }}
    >
      ✕
    </button>
    <h2 className="text-xl font-bold mb-4">How to Play</h2>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>

      <p className="text-indigo-200">Guess a secret 3-digit number — digits 1–9, all unique. You have <strong className="text-white">6 guesses</strong> to find all 3 correct digits, then <strong className="text-white">2 attempts</strong> to crack the exact arrangement.</p>

      <div style={{ background: 'rgba(252,211,77,0.1)', border: '1px solid rgba(252,211,77,0.4)', borderRadius: '8px', padding: '10px 14px', textAlign: 'center' }}>
        <p style={{ color: '#FCD34D', fontWeight: '700', margin: 0 }}>🎰 Lottery Win — Guess the exact number on your very first try: 1 in 504 odds!</p>
      </div>

      {/* 3-column difficulty grid */}
      <p style={{ color: '#F59E0B', fontWeight: '700', fontSize: '13px', textAlign: 'center', margin: 0, letterSpacing: '1px', textTransform: 'uppercase' }}>Choose Your Challenge</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

        {/* Easy */}
        <div style={{ background: 'rgba(106,170,100,0.1)', border: '1px solid rgba(106,170,100,0.4)', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ color: '#6aaa64', fontWeight: '800', fontSize: '14px', textAlign: 'center', margin: 0 }}>Easy</p>
          <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr', rowGap: '6px', columnGap: '8px', alignItems: 'center' }}>
            {[
              { bg: '#6aaa64', label: 'Right digit & position' },
              { bg: '#c9b458', label: 'Right digit, wrong spot' },
              { bg: '#787c7e', label: 'Not in the number' },
            ].map(({ bg, label }) => (
              <>
                <div key={bg} style={{ width: '26px', height: '26px', borderRadius: '4px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '14px', fontFamily: 'monospace' }}>5</div>
                <span key={label} style={{ color: '#C7D2FE', fontSize: '11px', lineHeight: '1.3' }}>{label}</span>
              </>
            ))}
          </div>
          <p style={{ color: '#C7D2FE', fontSize: '11px', margin: 0, lineHeight: '1.4' }}>Wrong arrangement attempts reveal green/yellow clues.</p>
        </div>

        {/* Normal */}
        <div style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.4)', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ color: '#06b6d4', fontWeight: '800', fontSize: '14px', textAlign: 'center', margin: 0 }}>Normal</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '4px', background: '#06b6d4', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '14px', fontFamily: 'monospace' }}>5</div>
            <span style={{ color: '#C7D2FE', fontSize: '11px' }}>Digit is in the number — position unknown</span>
          </div>
          <p style={{ color: '#C7D2FE', fontSize: '11px', margin: 0 }}>Arrangement tiles start aqua. Wrong attempts reveal green/yellow position clues.</p>
        </div>

        {/* Hard */}
        <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ color: '#F59E0B', fontWeight: '800', fontSize: '14px', textAlign: 'center', margin: 0 }}>Hard</p>
          <p style={{ color: '#C7D2FE', fontSize: '11px', margin: 0 }}>Only the count of correct digits is shown — e.g. "2 digits correct." No color hints. Wrong arrangement attempts are crossed out, no position feedback.</p>
        </div>

      </div>
    </div>
  </div>
)}

        {/* Slide-Out Menu */}
{showMenu && (
  <>
    <div
      onClick={() => setShowMenu(false)}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)', zIndex: 1100, backdropFilter: 'blur(4px)'
      }}
    />
    <div
      style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: '280px', maxWidth: '80vw',
        background: 'linear-gradient(to bottom, #0A1628, #0F2847)',
        boxShadow: '-4px 0 20px rgba(0,0,0,0.5)',
        zIndex: 1200, padding: '20px', overflowY: 'auto'
      }}
    >
      <button
        onClick={() => setShowMenu(false)}
        style={{
          position: 'absolute', top: '16px', right: '16px',
          background: 'transparent', border: 'none', color: '#FBBF24',
          fontSize: '28px', cursor: 'pointer', padding: '0',
          width: '32px', height: '32px',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        ✕
      </button>
      <h2 style={{ color: '#FBBF24', fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', marginTop: '8px' }}>
        Menu
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {gameState !== 'menu' && gameState !== 'gameOver' && (
          <button
            onClick={() => { setShowMenu(false); resetGame(); }}
            style={{
              background: 'rgba(239, 68, 68, 0.9)', color: 'white',
              padding: '14px 20px', borderRadius: '12px',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              fontSize: '16px', fontWeight: '700', cursor: 'pointer',
              textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px'
            }}
          >
            <span style={{ fontSize: '20px' }}>🔄</span>
            End Current Game
          </button>
        )}
        <button
          onClick={() => { setShowMenu(false); setShowRules(true); }}
          style={{
            background: 'rgba(255, 255, 255, 0.1)', color: 'white',
            padding: '14px 20px', borderRadius: '12px',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            fontSize: '16px', fontWeight: '700', cursor: 'pointer',
            textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px'
          }}
        >
          <span style={{ fontSize: '20px' }}>📋</span>
          Rules
        </button>
        {gameState === 'menu' && (
          <button
            onClick={() => { setShowMenu(false); setShowSettings(!showSettings); }}
            style={{
              background: 'rgba(255, 255, 255, 0.1)', color: 'white',
              padding: '14px 20px', borderRadius: '12px',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              fontSize: '16px', fontWeight: '700', cursor: 'pointer',
              textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px'
            }}
          >
            <span style={{ fontSize: '20px' }}>⚙️</span>
            Settings
          </button>
        )}
        {(gameResults || lastGameResults || allRounds.length > 0) && (
          <button
            onClick={() => { setShowMenu(false); setShowLastGame(true); }}
            style={{
              background: 'rgba(255, 255, 255, 0.1)', color: 'white',
              padding: '14px 20px', borderRadius: '12px',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              fontSize: '16px', fontWeight: '700', cursor: 'pointer',
              textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px'
            }}
          >
            <span style={{ fontSize: '20px' }}>📊</span>
            Last Game (See All Rounds)
          </button>
        )}
      </div>
    </div>
  </>
)}

{showSettings && gameState === 'menu' && (
  <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-6 text-white" style={{ position: 'relative' }}>
    <button
      onClick={() => setShowSettings(false)}
      style={{
        position: 'absolute', top: '12px', right: '12px',
        background: 'transparent', border: 'none', color: '#FBBF24',
        fontSize: '24px', cursor: 'pointer', padding: '4px', lineHeight: '1'
      }}
    >
      ✕
    </button>
    <h2 className="text-xl font-bold mb-4">Game Settings</h2>
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-bold mb-2">Difficulty</label>
        <div className="flex gap-3">
          <button
            onClick={() => setDifficulty('easy')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold transition ${
              difficulty === 'easy' ? 'bg-gradient-to-r from-green-500 to-green-700' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            Easy
          </button>
          <button
            onClick={() => setDifficulty('normal')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold transition ${
              difficulty === 'normal' ? 'bg-gradient-to-r from-cyan-400 to-cyan-600' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            Normal
          </button>
          <button
            onClick={() => setDifficulty('hard')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold transition ${
              difficulty === 'hard' ? 'bg-gradient-to-r from-amber-400 to-amber-600' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            Hard
          </button>
        </div>
        <p className="text-xs text-indigo-200 mt-2">
          {difficulty === 'easy'
            ? 'Green & yellow show exact digit positions (Wordle-style)'
            : difficulty === 'normal'
            ? 'Aqua shows digits in the number — you figure out the order'
            : 'Only the count of correct digits is shown'}
        </p>
      </div>
      <div style={{ marginTop: '8px' }}>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showTimer}
            onChange={(e) => setShowTimer(e.target.checked)}
          />
          <span>Show Timer During Play</span>
        </label>
      </div>
    </div>
  </div>
)}

        <div className="backdrop-blur-lg rounded-lg p-6 md:p-8" style={{ background: '#0F2847', border: '1px solid rgba(245,158,11,0.3)', minHeight: '420px', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

          {gameState === 'menu' && (
            <div className="text-center">
              <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'white', marginBottom: '8px' }}>Ready to Play?</h2>
              <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '28px' }}>
                {difficulty === 'easy' ? 'Easy Mode — colors show you position hints' :
                 difficulty === 'normal' ? 'Normal Mode — colors show digits in the number' :
                 'Hard Mode — no position hints, just the number of correct digits'}
              </p>
              <button
                onClick={startRound}
                style={{
                  background: 'linear-gradient(to right, #F59E0B, #D97706)',
                  color: 'white', padding: '14px 48px', borderRadius: '12px',
                  fontWeight: '700', fontSize: '18px', border: 'none', cursor: 'pointer'
                }}
              >
                Start Game
              </button>
            </div>
          )}

          {gameState === 'roundEnd' && (() => {
            const isLotteryWin = guesses.some(g => g.isLottery);
            return (
              <div className="text-center" style={{ padding: '16px 0' }}>
                {isLotteryWin ? (
                  <>
                    <div style={{ fontSize: '64px', marginBottom: '8px' }}>🎰</div>
                    <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#FCD34D', marginBottom: '4px', textShadow: '0 0 20px rgba(252,211,77,0.8)' }}>
                      LOTTERY WIN!
                    </h2>
                    <p style={{ fontSize: '16px', color: '#FDE68A', marginBottom: '16px', fontWeight: '600' }}>
                      504 to 1 odds — Perfect first guess!
                    </p>
                    <div style={{ fontSize: '48px', fontWeight: '900', fontFamily: 'monospace', color: '#FCD34D', letterSpacing: '12px', marginBottom: '8px', textShadow: '0 0 30px rgba(252,211,77,0.6)' }}>
                      {secretNumber.join(' ')}
                    </div>
                  </>
                ) : message.startsWith('EARLY_WIN:') ? (
                  <>
                    <div style={{ fontSize: '56px', marginBottom: '8px' }}>💥</div>
                    <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#FCD34D', marginBottom: '4px', textShadow: '0 0 20px rgba(252,211,77,0.8)' }}>
                      Incredible!
                    </h2>
                    <p style={{ fontSize: '15px', color: '#FDE68A', marginBottom: '16px', fontWeight: '600' }}>
                      Exact number in only 2 guesses!
                    </p>
                    <div style={{ fontSize: '48px', fontWeight: '900', fontFamily: 'monospace', color: '#FCD34D', letterSpacing: '12px', marginBottom: '8px', textShadow: '0 0 30px rgba(252,211,77,0.6)' }}>
                      {secretNumber.join(' ')}
                    </div>
                  </>
                ) : message.startsWith('WIN:') ? (
                  <>
                    <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
                      <SecretNumberLogo size={110} unlocked={true} />
                    </div>
                    <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#4ADE80', marginBottom: '4px' }}>
                      Code Cracked!
                    </h2>
                    <p style={{ fontSize: guesses.length <= 2 ? '18px' : '14px', color: guesses.length <= 2 ? '#FCD34D' : '#A7F3D0', marginBottom: '16px', fontWeight: '700' }}>
                      {guesses.length === 2
                        ? '🔥 Found them AND cracked the order — just 2 guesses!'
                        : guesses.length === 3
                        ? '⚡ Cracked it in just 3 guesses!'
                        : `You solved it in ${guesses.length} guesses`}
                    </p>
                    <div style={{ fontSize: '48px', fontWeight: '900', fontFamily: 'monospace', color: '#FCD34D', letterSpacing: '12px', marginBottom: '8px' }}>
                      {secretNumber.join(' ')}
                    </div>
                  </>
                ) : message.startsWith('ROUND_OVER:') ? (
                  <>
                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>😅</div>
                    <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#FCD34D', marginBottom: '4px' }}>
                      Round Over
                    </h2>
                    <p style={{ fontSize: '14px', color: '#FDE68A', marginBottom: '16px' }}>
                      The number was
                    </p>
                    <div style={{ fontSize: '48px', fontWeight: '900', fontFamily: 'monospace', color: '#FCD34D', letterSpacing: '12px', marginBottom: '8px' }}>
                      {secretNumber.join(' ')}
                    </div>
                  </>
                ) : message.startsWith('PARTIAL:') ? (
                  <>
                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>🧩</div>
                    <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#FCD34D', marginBottom: '4px' }}>
                      So Close!
                    </h2>
                    <p style={{ fontSize: '14px', color: '#FDE68A', marginBottom: '16px' }}>
                      You found all 3 digits but couldn't crack the order. The answer was
                    </p>
                    <div style={{ fontSize: '48px', fontWeight: '900', fontFamily: 'monospace', color: '#FCD34D', letterSpacing: '12px', marginBottom: '8px' }}>
                      {secretNumber.join(' ')}
                    </div>
                  </>
                ) : (
                  <p className="text-xl font-bold text-yellow-300 mb-6 whitespace-pre-line">{message}</p>
                )}
                <button
                  onClick={handleContinue}
                  style={{
                    background: 'linear-gradient(to right, #F59E0B, #D97706)',
                    color: 'white', padding: '12px 32px', borderRadius: '12px',
                    fontWeight: '700', fontSize: '16px', border: 'none', cursor: 'pointer',
                    marginTop: '16px'
                  }}
                >
                  See Results
                </button>
              </div>
            );
          })()}

          {gameState === 'gameOver' && (
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-2">Puzzle Complete!</h2>
              <p className="text-xl text-yellow-300 mb-6">
                {guesses.some(g => g.isWin || g.isLottery)
                  ? `Solved in ${guesses.length} guess${guesses.length !== 1 ? 'es' : ''} 🎉`
                  : `Better luck next time! 😅`}
              </p>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <button
                  onClick={resetGame}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    background: 'linear-gradient(to right, #0EA5E9, #1D4ED8)',
                    color: 'white', padding: '12px', borderRadius: '12px', fontWeight: '700',
                    fontSize: '15px', border: 'none', cursor: 'pointer'
                  }}
                >
                  <RotateCcw size={18} />
                  New Game
                </button>
                <button
                  onClick={() => setShowLastGame(true)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    background: 'rgba(255,255,255,0.2)',
                    color: 'white', padding: '12px', borderRadius: '12px', fontWeight: '700',
                    fontSize: '15px', border: 'none', cursor: 'pointer'
                  }}
                >
                  📊 Last Game
                </button>
              </div>
              <button
                onClick={handleShare}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  background: 'linear-gradient(to right, #F59E0B, #D97706)',
                  color: 'white', padding: '16px', borderRadius: '12px', fontWeight: '700',
                  fontSize: '18px', border: 'none', cursor: 'pointer', marginBottom: '12px'
                }}
              >
                {shareSuccess ? <>✓ Copied to Clipboard!</> : <><Share2 size={22} /> Share Results</>}
              </button>
              <button
                onClick={async () => {
                  const encoded = encodeChallenge(secretNumber);
                  const base = `${window.location.origin}${window.location.pathname}`;
                  const url = `${base}?c=${encoded}&d=${difficulty}`;
                  try {
                    if (navigator.share) {
                      await navigator.share({ url });
                    } else {
                      const modeLabel = difficulty === 'easy' ? 'Easy Mode' : difficulty === 'normal' ? 'Normal Mode' : 'Hard Mode';
                      const text = `🔐 Secret Number Challenge — ${modeLabel}!\n${url}`;
                      try {
                        await navigator.clipboard.writeText(text);
                      } catch (_err) {
                        const ta = document.createElement('textarea');
                        ta.value = text;
                        document.body.appendChild(ta);
                        ta.select();
                        document.execCommand('copy');
                        document.body.removeChild(ta);
                      }
                      setChallengeSuccess(true);
                      setTimeout(() => setChallengeSuccess(false), 2000);
                    }
                  } catch (_err) {
                    // user cancelled
                  }
                }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  background: challengeSuccess ? 'linear-gradient(to right, #22C55E, #16A34A)' : 'rgba(255,255,255,0.15)',
                  color: 'white', padding: '14px', borderRadius: '12px', fontWeight: '700',
                  fontSize: '16px', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer'
                }}
              >
                {challengeSuccess ? <>✓ Challenge Link Copied!</> : <>🔗 Challenge a Friend</>}
              </button>
            </div>
          )}

          {(gameState === 'playing' || gameState === 'arrangement') && (
            <div>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Your Turn</h2>
                <div className="message-container">
                  {message && (
                    <p className="text-xl font-bold text-yellow-300 whitespace-pre-line">{message}</p>
                  )}
                </div>
                {gameState === 'playing' && (
                  <p className="text-indigo-200">Guesses remaining: {guessesRemaining}</p>
                )}
                {gameState === 'arrangement' && (
                  <p className="text-indigo-200">Arrangement attempts: {arrangementsRemaining}</p>
                )}
              </div>

              <div className="flex justify-center gap-4 mb-6">
                {[0, 1, 2].map(i => (
                  <input
                    key={i}
                    id={`digit-${i}`}
                    type="text"
                    maxLength={1}
                    readOnly
                    autoFocus={i === 0}
                    value={currentGuess[i]}
                    onChange={(e) => handleInputChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="w-14 h-14 md:w-16 md:h-16 text-center text-2xl md:text-3xl font-bold bg-white/20 text-white rounded-lg focus:outline-none focus:ring-4 focus:ring-yellow-400"
                  />
                ))}
              </div>

{/* Guess History */}
{guesses.length > 0 && gameState !== 'arrangement' && (
  <div style={{ margin: '8px 0', display: 'flex', flexDirection: 'column', gap: '3px' }}>
    {[...guesses].reverse().map((g, idx) => (
      <div
        key={idx}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '3px 10px',
          borderRadius: '6px',
          background: g.isLottery ? 'rgba(234,179,8,0.2)' : g.isWin ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.07)',
          border: g.isLottery ? '1px solid rgba(234,179,8,0.4)' : g.isWin ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {difficulty !== 'hard' ? (
          <div style={{ display: 'flex', gap: '5px' }}>
            {g.guess.map((digit, i) => {
              const inNumber = secretNumber.includes(digit);
              const isGreen = difficulty === 'easy' && digit === secretNumber[i];
              const isYellow = difficulty === 'easy' && !isGreen && inNumber;
              const isAqua = difficulty === 'normal' && inNumber;
              return (
                <div key={i} style={{
                  width: '30px', height: '30px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '4px',
                  fontFamily: 'monospace', fontWeight: '700', fontSize: '15px',
                  background: isGreen ? '#6aaa64' : isYellow ? '#c9b458' : isAqua ? '#06b6d4' : '#787c7e',
                  color: 'white',
                }}>
                  {digit}
                </div>
              );
            })}
          </div>
        ) : (
          <span style={{ color: '#FDE047', fontFamily: 'monospace', fontSize: '14px', fontWeight: '700', letterSpacing: '3px', paddingRight: '12px' }}>
            {g.guess.join(' ')}
          </span>
        )}
        {difficulty === 'hard' && (
          <span style={{
            fontWeight: '700', fontSize: '11px',
            color: g.isLottery ? '#FCD34D' : g.isWin ? '#4ADE80' : '#C4B5FD',
          }}>
            {g.feedback}
          </span>
        )}
      </div>
    ))}
  </div>
)}

{/* Arrangement Phase */}
{gameState === 'arrangement' && foundDigits.length === 3 && (
  <div style={{ margin: '12px auto 20px', width: '240px' }}>
    <p style={{ color: '#FCD34D', fontSize: '13px', fontWeight: '800', textAlign: 'center', marginBottom: '4px', letterSpacing: '0.5px' }}>
      👆 Tap a number to guess!
    </p>
    <p style={{ color: '#A78BFA', fontSize: '11px', fontWeight: '700', textAlign: 'center', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
      Possible Arrangements
    </p>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px' }}>
      {(() => {
        const [a, b, c] = foundDigits;
        const perms = [[a,b,c],[a,c,b],[b,a,c],[b,c,a],[c,a,b],[c,b,a]];

        const greenPositions: (number | null)[] = [null, null, null];
        if (difficulty === 'easy') {
          for (const g of guesses) {
            if (g.feedback === 'Wrong order' || g.isWin || g.isLottery) continue;
            for (let i = 0; i < g.guess.length; i++) {
              if (g.guess[i] === secretNumber[i]) greenPositions[i] = g.guess[i];
            }
          }
        }

        const triedArrangements = new Set(
          guesses.filter(g => g.feedback === 'Wrong order' || g.isWin || parseInt(g.feedback) === 3).map(g => g.guess.join(''))
        );
        return perms.map((perm, idx) => {
          const wasTried = triedArrangements.has(perm.join(''));
          return (
            <div key={idx} onClick={() => { if (!wasTried) checkArrangement(perm); }} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '6px 8px', borderRadius: '6px',
              background: wasTried ? 'rgba(127,29,29,0.4)' : 'rgba(255,255,255,0.15)',
              border: wasTried ? '1px solid rgba(239,68,68,0.3)' : '2px solid rgba(139,92,246,0.9)',
              boxShadow: wasTried ? 'none' : '0 0 8px rgba(139,92,246,0.4)',
              cursor: wasTried ? 'default' : 'pointer',
            }}>
              {difficulty !== 'hard' && !wasTried ? (
                <div style={{ display: 'flex', gap: '3px' }}>
                  {perm.map((digit, i) => (
                    <div key={i} style={{
                      width: '22px', height: '22px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '3px',
                      fontFamily: 'monospace', fontWeight: '700', fontSize: '13px',
                      background: difficulty === 'easy'
                        ? (greenPositions[i] === digit ? '#6aaa64' : '#c9b458')
                        : '#06b6d4',
                      color: 'white',
                    }}>
                      {digit}
                    </div>
                  ))}
                </div>
              ) : difficulty !== 'hard' && wasTried ? (
                <div style={{ display: 'flex', gap: '3px' }}>
                  {perm.map((digit, i) => (
                    <div key={i} style={{
                      width: '22px', height: '22px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '3px',
                      fontFamily: 'monospace', fontWeight: '700', fontSize: '13px',
                      background: digit === secretNumber[i] ? '#6aaa64' : '#c9b458',
                      color: 'white',
                      opacity: 0.65,
                    }}>
                      {digit}
                    </div>
                  ))}
                </div>
              ) : (
                <span style={{
                  color: wasTried ? '#6B7280' : '#E2E8F0',
                  textDecoration: wasTried ? 'line-through' : 'none',
                  fontFamily: 'monospace', fontWeight: 'bold',
                  fontSize: '15px', letterSpacing: '2px',
                }}>
                  {perm.join(' ')}
                </span>
              )}
            </div>
          );
        });
      })()}
    </div>
  </div>
)}

{/* Number Pad */}
{gameState === 'playing' && (
  <div style={{
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px', width: '200px', margin: '0 auto 24px',
  }}>
    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
      const digit = String(num);
      const isUsed = currentGuess.includes(digit);
      const isEliminated = eliminatedDigits.has(num);
      const isNotFound = foundDigits.length === 3 && !foundDigits.includes(num);
      const nextEmptyIndex = currentGuess.findIndex((d) => d === "");

      let digitStatus: 'green' | 'yellow' | 'aqua' | 'gray' | null = null;
      if (difficulty !== 'hard') {
        for (const g of guesses) {
          if (g.feedback === 'Wrong order' || g.isWin || g.isLottery) continue;
          for (let i = 0; i < g.guess.length; i++) {
            if (g.guess[i] === num) {
              if (difficulty === 'easy') {
                if (num === secretNumber[i]) {
                  digitStatus = 'green';
                } else if (secretNumber.includes(num) && digitStatus !== 'green') {
                  digitStatus = 'yellow';
                } else if (!secretNumber.includes(num) && digitStatus === null) {
                  digitStatus = 'gray';
                }
              } else {
                if (secretNumber.includes(num)) {
                  digitStatus = 'aqua';
                } else if (digitStatus === null) {
                  digitStatus = 'gray';
                }
              }
            }
          }
        }
      }

      const isGrayedOut = difficulty !== 'hard' && digitStatus === 'gray';
      const bgStyle: React.CSSProperties = difficulty !== 'hard' && digitStatus && !isUsed
        ? { background: digitStatus === 'green' ? '#6aaa64' : digitStatus === 'yellow' ? '#c9b458' : digitStatus === 'aqua' ? '#06b6d4' : '#787c7e' }
        : {};

      return (
        <button
          key={num}
          disabled={isUsed || isEliminated || isNotFound || isGrayedOut || nextEmptyIndex === -1}
          onClick={() => {
            if (nextEmptyIndex !== -1) {
              handleInputChange(nextEmptyIndex, digit);
            }
          }}
          style={bgStyle}
          className={`w-full h-14 text-xl rounded-lg font-bold transition ${
            isUsed
              ? "bg-gray-500/40 cursor-not-allowed text-gray-400"
              : difficulty !== 'hard' && (digitStatus === 'green' || digitStatus === 'yellow' || digitStatus === 'aqua')
              ? "text-white cursor-pointer"
              : isGrayedOut || isEliminated || isNotFound
              ? "cursor-not-allowed text-gray-400"
              : "bg-white/20 hover:bg-white/30 text-white"
          }`}
        >
          {num}
        </button>
      );
    })}
  </div>
)}

{/* Backspace and Submit */}
<div style={{ display: 'flex', gap: '12px', width: '200px', margin: '0 auto 24px', alignItems: 'stretch' }}>
  {gameState === 'playing' && (
    <button
      onClick={() => {
        const lastFilledIndex = currentGuess.reduce((lastIdx, digit, idx) =>
          digit !== "" ? idx : lastIdx, -1
        );
        if (lastFilledIndex !== -1) {
          handleInputChange(lastFilledIndex, "");
          setTimeout(() => {
            document.getElementById(`digit-${lastFilledIndex}`)?.focus();
          }, 50);
        }
      }}
      disabled={currentGuess.every(d => d === "")}
      style={{ flex: '0 0 60px' }}
      className="h-14 text-xl rounded-lg font-bold transition bg-white/20 hover:bg-white/30 text-white disabled:bg-gray-500/40 disabled:cursor-not-allowed disabled:text-gray-400"
    >
      ⌫
    </button>
  )}
  <button
    onClick={gameState === 'playing' ? checkGuess : () => checkArrangement()}
    disabled={currentGuess.some(d => d === '')}
    style={{ flex: '1' }}
    className="bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:from-amber-500 hover:to-amber-700 transition-all text-base"
  >
    {gameState === 'playing' ? 'Submit' : 'Crack the Code!'}
  </button>
</div>

{/* Timer */}
<div className="flex flex-col items-center mb-6">
  {showTimer && roundStartTime && !roundEndTime && (
    <div className="text-lg text-white">
      {'\u23F1'} Time: {formatTime(Date.now() - roundStartTime)}
    </div>
  )}
</div>

            </div>
          )}
        </div>

{showLastGame && (gameResults || lastGameResults || allRounds.length > 0) && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-8 max-w-2xl w-full border border-white/20 my-8" style={{ position: 'relative' }}>
      <button
        onClick={() => setShowLastGame(false)}
        style={{
          position: 'absolute', top: '16px', right: '16px',
          background: 'transparent', border: 'none', color: '#FBBF24',
          fontSize: '28px', cursor: 'pointer', padding: '0',
          width: '32px', height: '32px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10
        }}
      >
        ✕
      </button>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Last Game Results</h2>
        <div className="bg-white/10 rounded-lg p-6 mb-6">
          <p className="text-xl text-yellow-300 mb-4">🧩 Puzzle Complete!</p>
          {(gameResults || lastGameResults) && (gameResults || lastGameResults)!.roundsPlayed > 0 && (
            <p className="text-indigo-200 mb-4">
              Completed in {(gameResults || lastGameResults)!.roundsPlayed} {(gameResults || lastGameResults)!.roundsPlayed === 1 ? 'round' : 'rounds'}
            </p>
          )}
        </div>
        <div className="space-y-4 max-h-96 overflow-y-auto mb-6">
          {((gameResults || lastGameResults)?.rounds || allRounds).map((round, idx) => (
            <div key={idx} className="bg-white/5 rounded-lg p-4 text-left">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-white">Round {idx + 1}</h3>
              </div>
              <p className="text-indigo-200 mb-2">
                Secret Number: <span className="font-mono font-bold text-yellow-300">{round.secretNumber.join(' ')}</span>
              </p>
              {round.timeElapsed != null && (
                <p className="text-indigo-200 mb-2">
                  {'\u23F1'} Time: <span className="font-bold text-green-300">{formatTime(round.timeElapsed)}</span>
                </p>
              )}
              <div className="space-y-1">
                <p className="text-sm text-indigo-300 mb-3">Guesses: <span className="font-bold text-white">{round.guesses.length}</span></p>
                <div className="flex flex-col space-y-1">
                  {round.guesses.map((g, gIdx) => (
                    <div key={gIdx} className="flex flex-col text-sm bg-white/5 rounded px-3 py-2">
                      <span style={{ color: '#A78BFA', fontSize: '13px', fontWeight: '700', marginBottom: '12px', display: 'block' }}>
                        {gIdx + 1}.
                      </span>
                      {difficulty !== 'hard' ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {g.guess.map((digit, i) => {
                            const inNumber = round.secretNumber.includes(digit);
                            const isGreen = difficulty === 'easy' && digit === round.secretNumber[i];
                            const isYellow = difficulty === 'easy' && !isGreen && inNumber;
                            const isAqua = difficulty === 'normal' && inNumber;
                            return (
                              <div key={i} style={{
                                width: '26px', height: '26px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                borderRadius: '4px',
                                fontFamily: 'monospace', fontWeight: '700', fontSize: '13px',
                                background: isGreen ? '#6aaa64' : isYellow ? '#c9b458' : isAqua ? '#06b6d4' : '#787c7e',
                                color: 'white',
                              }}>
                                {digit}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <>
                          <span className="font-mono text-white mr-2">{g.guess.join(' ')} -</span>
                          <span className={`font-bold ${g.isLottery ? 'text-yellow-300' : g.isWin ? 'text-green-300' : 'text-indigo-300'}`}>
                            {g.feedback}
                          </span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)}

      </div>
    </div>
  );
};

export default NumberGame;
