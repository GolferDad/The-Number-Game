import { useState } from 'react';
import { Trophy, Share2, X, Clock, Zap, TrendingUp, Brain, Target, Gem, DollarSign, Heart, Award, TrendingUp as Growth } from 'lucide-react';
import { formatTime, type WinnerStats } from './winnerStatsUtils';

interface WinnerReportProps {
  stats: WinnerStats;
  winnerName: string;
  onClose: () => void;
}

const WinnerReport = ({ stats, winnerName, onClose }: WinnerReportProps) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [showExplanations, setShowExplanations] = useState(false);
  
  // Generate share text with visual deduction pattern
    
const generateShareText = (): string => {
  const { totalRounds, totalTime, bestRoundTime, exactGuesses, deductionBreakdown, lotteryWins } = stats;
  
  let text = '';
  
  // Special header for lottery wins
  if (lotteryWins > 0) {
    text += `🎰 LOTTERY WIN! 🎰\n`;
    text += `Secret Number Victory! 🏆\n\n`;
    text += `🎰 Guessed exact number first try! (1 in 504!)\n`;
    text += `⏱️ Time: ${formatTime(totalTime)}\n\n`;
  } else {
    text += `🎯 Secret Number Victory! 🏆\n\n`;
    text += `⚡ ${totalRounds} rounds in ${formatTime(totalTime)}\n`;
    if (bestRoundTime) {
      text += `🔥 Best: ${formatTime(bestRoundTime)}\n`;
    }
    if (exactGuesses > 0) {
      text += `💎 ${exactGuesses} exact guess${exactGuesses > 1 ? 'es' : ''}\n`;
    }
    text += `\n`;
  }
  
  // Add deduction breakdown
  text += `My Strategy:\n`;
  const zero = deductionBreakdown.zero;
  const one = deductionBreakdown.one;
  const two = deductionBreakdown.two;
  const three = deductionBreakdown.three;
  
  text += `Strategic Eliminations (0 right):  ${'█'.repeat(Math.floor(zero.percentage / 10))}${'░'.repeat(10 - Math.floor(zero.percentage / 10))} ${zero.percentage}%\n`;
  text += `Building Intel (1 right):          ${'█'.repeat(Math.floor(one.percentage / 10))}${'░'.repeat(10 - Math.floor(one.percentage / 10))} ${one.percentage}%\n`;
  text += `Closing In (2 right):              ${'█'.repeat(Math.floor(two.percentage / 10))}${'░'.repeat(10 - Math.floor(two.percentage / 10))} ${two.percentage}%\n`;
  text += `Found All 3 (3 right):             ${'█'.repeat(Math.floor(three.percentage / 10))}${'░'.repeat(10 - Math.floor(three.percentage / 10))} ${three.percentage}%\n`;
  
  text += `\nCan you beat it? 🎲`;
  
  return text;
};
  
  const handleShare = async () => {
    const shareText = generateShareText();
    
    try {
      await navigator.clipboard.writeText(shareText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 rounded-2xl p-6 max-w-xl w-full border-4 border-yellow-400 my-8 relative shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-yellow-400 hover:text-yellow-300 transition-colors"
        >
          <X size={28} />
        </button>
        
        {/* Header */}
        <div className="text-center mb-8">
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-bounce" />
          <h1 className="text-4xl font-bold text-white mb-2">Winner's Report</h1>
          <p className="text-2xl text-yellow-300 font-bold">{winnerName} Wins! 🎉</p>
        </div>
        
        {/* Victory Summary */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border-2 border-white/20">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="text-blue-400" size={24} />
            Victory Summary
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">{formatTime(stats.totalTime)}</div>
              <div className="text-sm text-indigo-200">Total Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">{stats.totalRounds}</div>
              <div className="text-sm text-indigo-200">Rounds</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-400">{stats.totalGuesses}</div>
              <div className="text-sm text-indigo-200">Total Guesses</div>
            </div>
          </div>
        </div>
        
        {/* Highlight Moments */}
        {(stats.lotteryWins > 0 || stats.earlyWins > 0 || stats.exactGuesses > 0 || stats.bestRoundTime) && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border-2 border-white/20">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="text-yellow-400" size={24} />
              Highlight Moments
            </h2>
            
            {/* Lottery Win Celebration */}
            {stats.lotteryWins > 0 && (
              <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 rounded-xl p-6 border-4 border-yellow-300 shadow-2xl mb-4">
                <div className="text-center">
                  <div className="text-5xl mb-3">🎰 🎰 🎰</div>
                  <div className="text-3xl font-bold text-white mb-2">LOTTERY WIN!</div>
                  <div className="text-xl text-white mb-2">You guessed the EXACT number on your FIRST try!</div>
                  <div className="bg-white/30 backdrop-blur-lg rounded-lg p-3 inline-block">
                    <div className="text-lg font-bold text-yellow-900">1 in 504 chance!</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Other Highlights */}
            <div className="space-y-3">
              {stats.earlyWins > 0 && (
                <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg p-3 border border-green-400/30">
                  <div className="text-white font-semibold">⚡ Early Wins: {stats.earlyWins}</div>
                  <div className="text-xs text-indigo-200 mt-1">Won on 2nd guess - lightning fast!</div>
                </div>
              )}
              
              {stats.exactGuesses > 0 && (
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-3 border border-purple-400/30">
                  <div className="text-white font-semibold">🎯 Exact Number Guesses: {stats.exactGuesses}</div>
                  <div className="text-xs text-indigo-200 mt-1">Nailed the arrangement - sharp instincts!</div>
                </div>
              )}
              
              {stats.bestRoundTime && (
                <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg p-3 border border-blue-400/30">
                  <div className="text-white font-semibold">⏱️ Best Round Time: {formatTime(stats.bestRoundTime)}</div>
                  <div className="text-xs text-indigo-200 mt-1">Blistering speed - you saw it and closed it!</div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Deduction Breakdown with Colors */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border-2 border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">📊 Deduction Breakdown</h2>
          <p className="text-sm text-indigo-200 mb-4">Here's how your guessing patterns played out:</p>
          <div className="space-y-3">
            <DeductionBar
              label="Strategic Eliminations (0 right)"
              count={stats.deductionBreakdown.zero.count}
              percentage={stats.deductionBreakdown.zero.percentage}
              color="from-red-500 to-red-600"
            />
            <DeductionBar
              label="Building Intel (1 right)"
              count={stats.deductionBreakdown.one.count}
              percentage={stats.deductionBreakdown.one.percentage}
              color="from-yellow-500 to-yellow-600"
            />
            <DeductionBar
              label="Closing In (2 right)"
              count={stats.deductionBreakdown.two.count}
              percentage={stats.deductionBreakdown.two.percentage}
              color="from-green-500 to-green-600"
            />
            <DeductionBar
              label="Found All 3 (3 right)"
              count={stats.deductionBreakdown.three.count}
              percentage={stats.deductionBreakdown.three.percentage}
              color="from-blue-500 to-purple-600"
            />
          </div>
        </div>
        
        {/* Play Style */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border-2 border-white/20">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="text-yellow-400" size={24} />
            Your Play Style
          </h2>
          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-yellow-300 mb-2">{stats.playStyle}</div>
            <p className="text-indigo-200 leading-relaxed">{stats.playStyleDescription}</p>
          </div>
        </div>
        
        {/* Key Strengths */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border-2 border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">🎯 Your Key Strengths</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.keyStrengths.map((strength, idx) => {
              // Map icon string to Lucide component
              const IconComponent = 
                strength.title.includes('Lightning') ? Zap :
                strength.title.includes('Quick') ? TrendingUp :
                strength.title.includes('Strategic') ? Brain :
                strength.title.includes('Pattern') ? Target :
                strength.title.includes('Exact') ? Gem :
                strength.title.includes('Strike') ? DollarSign :
                strength.title.includes('Clutch') ? Heart :
                strength.title.includes('Efficiency') ? Award :
                strength.title.includes('Growth') ? Growth :
                Zap; // default
              
              return (
                <div
                  key={idx}
                  className="bg-gradient-to-r from-white/10 to-white/5 rounded-lg p-4 border border-white/20"
                >
                  <div className="flex items-start gap-3">
                    <IconComponent className="text-yellow-400 flex-shrink-0" size={28} />
                    <div>
                      <div className="text-white font-bold mb-1">{strength.title}</div>
                      <div className="text-xs text-indigo-200 leading-relaxed">{strength.description}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Special Achievements */}
        {stats.achievements.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border-2 border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">🎖️ Special Achievements</h2>
            <div className="grid grid-cols-1 gap-3">
              {stats.achievements.map((achievement, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg p-3 border border-yellow-400/30"
                >
                  <span className="text-white font-semibold text-sm">{achievement}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Share Button */}
        <button
          onClick={handleShare}
          className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 rounded-xl font-bold text-lg hover:from-green-600 hover:to-blue-600 transition-all transform hover:scale-105 flex items-center justify-center gap-2 border-2 border-white/20"
        >
          {copySuccess ? (
            <>✓ Copied to Clipboard!</>
          ) : (
            <>
              <Share2 size={24} />
              Share My Victory
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// Helper component for deduction bars
const DeductionBar = ({ 
  label, 
  count, 
  percentage, 
  color 
}: { 
  label: string; 
  count: number; 
  percentage: number; 
  color: string;
}) => {
  const filledBlocks = Math.floor(percentage / 10);
  const emptyBlocks = 10 - filledBlocks;
  
  const getColor = (colorName: string) => {
    if (colorName.includes('red')) return '#ef4444';
    if (colorName.includes('yellow')) return '#eab308';
    if (colorName.includes('green')) return '#22c55e';
    if (colorName.includes('blue') || colorName.includes('purple')) return '#8b5cf6';
    return '#3b82f6';
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '12px',
      color: 'white',
      fontSize: '14px',
      marginBottom: '8px'
    }}>
      <div style={{ width: '220px', textAlign: 'left' }}>{label}</div>
      <div style={{ 
        fontFamily: 'monospace', 
        fontSize: '24px',
        letterSpacing: '-3px',
        display: 'flex'
      }}>
        <span style={{ color: getColor(color) }}>{'█'.repeat(filledBlocks)}</span>
        <span style={{ color: 'rgba(255,255,255,0.2)' }}>{'░'.repeat(emptyBlocks)}</span>
      </div>
      <div style={{ width: '90px', textAlign: 'right', fontWeight: 'bold' }}>
        {count} ({percentage}%)
      </div>
    </div>
  );
};

export default WinnerReport;