// Winner's Report Statistics Calculator
// Analyzes game data and generates comprehensive stats

export interface WinnerStats {
  totalTime: number;
  totalRounds: number;
  totalGuesses: number;
  lotteryWins: number;
  earlyWins: number;
  exactGuesses: number;
  bestRoundTime: number | null;
  deductionBreakdown: {
    zero: { count: number; percentage: number };
    one: { count: number; percentage: number };
    two: { count: number; percentage: number };
    three: { count: number; percentage: number };
  };
  playStyle: string;
  playStyleDescription: string;
  keyStrengths: Array<{ icon: string; title: string; description: string }>;
  achievements: string[];
  avgGuessesPerRound: number;
}
 
interface Guess {
  guess: number[];
  feedback: string;
  isLottery?: boolean;
  isWin?: boolean;
  informationValue?: number;
  wasConsecutiveZero?: boolean;
  hadRevealPowerUp?: boolean;
}

interface RoundData {
  player: string;
  secretNumber: number[];
  guesses: Guess[];
  pointsEarned: number;
  timeElapsed?: number | null;
}

export const calculateWinnerStats = (
  allRounds: RoundData[],
  totalGameTime: number
): WinnerStats => {
  
  // Initialize counters
  let totalGuesses = 0;
  let lotteryWins = 0;
  let earlyWins = 0;
  let exactGuesses = 0;
  let bestRoundTime: number | null = null;
  
  let zeroCorrect = 0;
  let oneCorrect = 0;
  let twoCorrect = 0;
  let threeCorrect = 0;
  
  let totalDigitsFound = 0;
  let totalPoints = 0;
  
  const achievements: string[] = [];
  let speedDemonRounds = 0;
  let clutchWins = 0;
  let perfectDeductionRounds = 0;
  
  // Analyze each round
  allRounds.forEach(round => {
    const roundGuesses = round.guesses.length;
    totalGuesses += roundGuesses;
    totalPoints += round.pointsEarned;
    
    // Check for highlight moments
    const firstGuess = round.guesses[0];
    if (firstGuess?.isLottery) {
      lotteryWins++;
    }
    
    // Early win = won on 2nd guess
    if (roundGuesses === 2 && round.guesses[1]?.isWin) {
      earlyWins++;
    }
    
    // Exact guess = won without arrangement phase (3+ correct on a playing guess)
    const wonBeforeArrangement = round.guesses.some((g) => {
      // Check if this was a winning guess during "playing" phase
      // (not just finding all 3 digits, but getting exact match)
      return g.isWin && !g.isLottery && roundGuesses <= 6; // Assuming max 5 guesses + 1 exact = 6
    });
    
    if (wonBeforeArrangement && !firstGuess?.isLottery) {
      exactGuesses++;
    }
    
    // Track best round time
    if (round.timeElapsed != null) {
      if (bestRoundTime === null || round.timeElapsed < bestRoundTime) {
        bestRoundTime = round.timeElapsed;
      }
      
      // Speed demon: under 2 minutes (120000 ms)
      if (round.timeElapsed < 120000) {
        speedDemonRounds++;
      }
    }
    
    // Analyze deduction breakdown
    round.guesses.forEach(guess => {
      // Parse feedback to count correct digits
      const feedback = guess.feedback.toLowerCase();
      
      if (guess.isWin || guess.isLottery) {
        threeCorrect++; // Winning guess = all 3 correct
        totalDigitsFound += 3;
      } else if (feedback.includes('3 right')) {
        threeCorrect++;
        totalDigitsFound += 3;
      } else if (feedback.includes('2 right')) {
        twoCorrect++;
        totalDigitsFound += 2;
      } else if (feedback.includes('1 right')) {
        oneCorrect++;
        totalDigitsFound += 1;
      } else if (feedback.includes('0 right')) {
        zeroCorrect++;
      } else if (feedback === 'wrong order') {
        // This is an arrangement attempt - all 3 digits were correct
        threeCorrect++;
        totalDigitsFound += 3;
      }
    });
    
    // Check for clutch win (won on last guess or last arrangement)
    const lastGuess = round.guesses[round.guesses.length - 1];
    if (lastGuess?.isWin && roundGuesses >= 5) {
      clutchWins++;
    }
    
    // Check for perfect deduction (high % of 2-3 correct)
    const twoOrThreeCount = round.guesses.filter(g => {
      const fb = g.feedback.toLowerCase();
      return fb.includes('2 right') || fb.includes('3 right') || g.isWin;
    }).length;
    
    if (twoOrThreeCount / roundGuesses >= 0.6) {
      perfectDeductionRounds++;
    }
  });
  
  // Calculate percentages
  const totalDeductionGuesses = zeroCorrect + oneCorrect + twoCorrect + threeCorrect;
  
  const deductionBreakdown = {
    zero: {
      count: zeroCorrect,
      percentage: totalDeductionGuesses > 0 ? Math.round((zeroCorrect / totalDeductionGuesses) * 100) : 0
    },
    one: {
      count: oneCorrect,
      percentage: totalDeductionGuesses > 0 ? Math.round((oneCorrect / totalDeductionGuesses) * 100) : 0
    },
    two: {
      count: twoCorrect,
      percentage: totalDeductionGuesses > 0 ? Math.round((twoCorrect / totalDeductionGuesses) * 100) : 0
    },
    three: {
      count: threeCorrect,
      percentage: totalDeductionGuesses > 0 ? Math.round((threeCorrect / totalDeductionGuesses) * 100) : 0
    }
  };
  
  // Calculate average guesses per round
  const avgGuessesPerRound = allRounds.length > 0 ? totalGuesses / allRounds.length : 0;

  // Calculate average round time
  const avgRoundTime = bestRoundTime !== null && allRounds.length > 0
    ? allRounds.reduce((sum, r) => sum + (r.timeElapsed || 0), 0) / allRounds.length
    : 0;

  // Calculate two-or-three percentage for pattern detection
  const twoOrThreeCount = twoCorrect + threeCorrect;
  const twoOrThreePercentage = totalDeductionGuesses > 0 
    ? (twoOrThreeCount / totalDeductionGuesses) * 100 
    : 0;

  // Detect play style
  const playStyleResult = detectPlayStyle(
    allRounds,
    totalGuesses,
    avgRoundTime,
    zeroCorrect,
    twoOrThreePercentage,
    exactGuesses,
    lotteryWins
  );

  // Calculate key strengths
  const keyStrengths = calculateKeyStrengths(
    allRounds,
    totalGuesses,
    avgRoundTime,
    bestRoundTime,
    zeroCorrect,
    twoOrThreePercentage,
    exactGuesses,
    lotteryWins,
    clutchWins,
    avgGuessesPerRound
  );
 
  // Calculate Speed Rank
  let speedRank = 'Methodical';
  if (avgRoundTime > 0) {
    if (avgRoundTime < 120000) speedRank = 'Lightning'; // < 2 min
    else if (avgRoundTime < 240000) speedRank = 'Swift'; // < 4 min
    else if (avgRoundTime < 360000) speedRank = 'Steady'; // < 6 min
  }
  
  // Determine Achievements
  if (lotteryWins > 0) {
    achievements.push('🎰 Perfect Game - Lottery Win!');
  }

  if (speedDemonRounds > 0) {
    achievements.push(`⚡ Speed Demon - ${speedDemonRounds} round${speedDemonRounds > 1 ? 's' : ''} under 2 min`);
  }

  if (clutchWins > 0) {
    achievements.push('❤️ Never Give Up - Won on final attempt');
  }

  if (perfectDeductionRounds >= Math.floor(allRounds.length / 2)) {
    achievements.push('🎯 Sharpshooter - Consistently strong guesses');
  }

  if (earlyWins >= 2) {
    achievements.push('🔥 Hot Streak - Multiple 2-guess wins');
  }

  return {
    totalTime: totalGameTime,
    totalRounds: allRounds.length,
    totalGuesses,
    lotteryWins,
    earlyWins,
    exactGuesses,
    bestRoundTime,
    deductionBreakdown,
    playStyle: playStyleResult.style,
    playStyleDescription: playStyleResult.description,
    keyStrengths,
    achievements: achievements.slice(0, 4), // Max 4 achievements
    avgGuessesPerRound
  };
}; 

// Utility function to format time
export const formatTime = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  return minutes > 0 
    ? `${minutes}:${seconds.toString().padStart(2, '0')}` 
    : `${seconds}s`;
};

// Detect player's primary play style
function detectPlayStyle(
  allRounds: RoundData[],
  totalGuesses: number,
  avgRoundTime: number,
  zeroCount: number,
  twoOrThreePercentage: number,
  exactGuesses: number,
  lotteryWins: number
): { style: string; description: string } {
  
  // Speed Demon: Fast average time
  if (avgRoundTime > 0 && avgRoundTime < 120000) {
    return {
      style: "⚡ Speed Demon",
      description: "You thrive under pressure! Your quick finish shows you make fast, confident decisions. You'd rather trust your instincts and move fast than overthink every guess."
    };
  }
  
  // Strategic Eliminator: High zero percentage
  const zeroPercentage = totalGuesses > 0 ? (zeroCount / totalGuesses) * 100 : 0;
  if (zeroPercentage >= 20) {
    return {
      style: "🧠 Strategic Eliminator",
      description: "You're a methodical thinker who values information over speed. Eliminating possibilities systematically is your strategy - that's smart play!"
    };
  }
  
  // Pattern Hunter: High percentage of 2-3 right
  if (twoOrThreePercentage >= 60) {
    return {
      style: "🎯 Pattern Hunter",
      description: "You narrow it down efficiently! Once you catch a pattern, you close in fast - steady and accurate execution."
    };
  }
  
  // Instinct Player: Exact guesses or lottery wins
  if (exactGuesses >= 2 || lotteryWins > 0) {
    return {
      style: "💎 Instinct Player",
      description: "You trust your gut and it delivers! Sometimes the best move is the bold one - and your instincts pay off."
    };
  }
  
  // Persistent Grinder: Long games
  if (allRounds.length >= 6) {
    return {
      style: "💪 Persistent Grinder",
      description: "You never give up! Even when it's tough, you push through to the end. That determination is a real strength."
    };
  }
  
  // Default: Balanced Solver
  return {
    style: "⚖️ Balanced Solver",
    description: "You adapt your strategy round-by-round - mixing speed, logic, and instinct as needed. Versatility wins games!"
  };
}

// Calculate key strengths based on performance
function calculateKeyStrengths(
  allRounds: RoundData[],
  totalGuesses: number,
  avgRoundTime: number,
  bestRoundTime: number | null,
  zeroCount: number,
  twoOrThreePercentage: number,
  exactGuesses: number,
  lotteryWins: number,
  clutchWins: number,
  avgGuessesPerRound: number
): Array<{ icon: string; title: string; description: string }> {
  
  const strengths: Array<{ icon: string; title: string; description: string }> = [];
  
  // Speed Strengths
  if (avgRoundTime > 0 && avgRoundTime < 120000) {
    strengths.push({
      icon: "⚡",
      title: "Lightning Reflexes",
      description: "You solve rounds under intense time pressure - speed is your competitive edge!"
    });
  }
  
  if (bestRoundTime && bestRoundTime < 30000) {
    strengths.push({
      icon: "🏃",
      title: "Quick Closer",
      description: "When you see the answer, you pounce instantly - that's elite execution!"
    });
  }
  
  // Strategy Strengths
  const zeroPercentage = totalGuesses > 0 ? (zeroCount / totalGuesses) * 100 : 0;
  if (zeroCount >= 3 || zeroPercentage >= 20) {
    strengths.push({
      icon: "🧠",
      title: "Strategic Eliminator",
      description: "You use logic to narrow possibilities methodically - that's advanced play!"
    });
  }
  
  if (twoOrThreePercentage >= 50) {
    strengths.push({
      icon: "🎯",
      title: "Pattern Recognition",
      description: "You spot patterns quickly and exploit them - sharp analytical thinking!"
    });
  }
  
  // Execution Strengths
  if (exactGuesses >= 2) {
    strengths.push({
      icon: "💎",
      title: "Exact Instincts",
      description: "When it's time to arrange digits, you nail it - no hesitation!"
    });
  }
  
  if (lotteryWins > 0) {
    strengths.push({
      icon: "🎰",
      title: "Lightning Strike",
      description: "You hit a lottery win - the rarest achievement! Your bold moves pay off!"
    });
  }
  
  if (clutchWins > 0) {
    strengths.push({
      icon: "❤️",
      title: "Clutch Performer",
      description: "You deliver when it matters most - winning on final attempts!"
    });
  }
  
  // Consistency Strengths
  if (avgGuessesPerRound <= 4.5) {
    strengths.push({
      icon: "🏆",
      title: "Efficiency Expert",
      description: "You don't waste guesses - every move counts toward victory!"
    });
  }
  
  if (allRounds.length >= 6) {
    strengths.push({
      icon: "📈",
      title: "Growth Mindset",
      description: "You played a full game and learned from each round - that's improvement!"
    });
  }
  
  // Return top 4 strengths
  return strengths.slice(0, 4);
}