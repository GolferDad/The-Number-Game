import React from 'react';
import { Play } from 'lucide-react';
import SecretNumberLogo from './SecretNumberLogo';

interface LandingPageProps {
  onStartGame: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartGame }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center flex flex-col items-center justify-center" style={{ minHeight: '80vh' }}>
        {/* Main Logo */}
        <div className="mb-8 animate-fade-in">
          <SecretNumberLogo size={160} className="mx-auto mb-4 drop-shadow-2xl" />
          
          <div className="w-24 h-1.5 bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 rounded-full mx-auto mb-4"></div>
          
          <p className="text-xl text-purple-200 font-light mb-6">
            A Newman Family Classic
          </p>
        </div>

        {/* How to Play Box */}
      	<div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20 mb-6 mx-auto" style={{ width: '310px' }}>
          <h3 className="text-white font-semibold mb-3 flex items-center justify-center gap-2">
            📋 HOW TO PLAY
          </h3>
          <div className="text-purple-200 text-sm text-left space-y-1.5">
            <p>• Guess digits to crack the code</p>
            <p>• Eliminate wrong numbers with each guess</p>
            <p>• Arrange all 3 digits to win!</p>
          </div>
        </div>

        {/* Big Play Button */}
        <button
          onClick={onStartGame}
          className="group bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-gray-900 font-bold text-xl px-12 py-5 rounded-2xl shadow-2xl transform transition-all duration-200 hover:scale-105 hover:shadow-yellow-500/50 flex items-center justify-center gap-3"
        >
          <Play className="w-7 h-7 fill-current" />
          START PLAYING
        </button>

        {/* Feature list at bottom */}
        <p className="text-purple-300 text-sm mt-6">
          Solo & Multiplayer • Power-Ups • Fast & Fun
        </p>
      </div>

      {/* Add animation styles */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;