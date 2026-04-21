import React from 'react';

interface SecretNumberLogoProps {
  size?: number;
  className?: string;
  unlocked?: boolean;
}

const SecretNumberLogo: React.FC<SecretNumberLogoProps> = ({
  size = 120,
  className = '',
  unlocked = false
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background circle - white */}
      <circle
        cx="100"
        cy="100"
        r="95"
        fill="white"
        stroke="#F59E0B"
        strokeWidth="3"
      />

      {/* Inner glow */}
      <circle
        cx="100"
        cy="100"
        r="85"
        fill="#FEF3C7"
        opacity="0.3"
      />

      {/* Lock shackle - swings open when unlocked */}
      {unlocked ? (
        /* Unlocked: shackle swung to the right, lifted */
        <path
          d="M 120 40 Q 145 40 145 55 Q 145 68 132 70 L 120 70"
          fill="none"
          stroke="#F59E0B"
          strokeWidth="4"
          strokeLinecap="round"
        />
      ) : (
        /* Locked: normal centered shackle */
        <path
          d="M 100 50 Q 100 40 110 40 Q 120 40 120 50 L 120 70 L 80 70 L 80 50 Q 80 40 90 40 Q 100 40 100 50"
          fill="none"
          stroke="#F59E0B"
          strokeWidth="4"
        />
      )}

      {/* Lock body */}
      <rect x="75" y="70" width="50" height="35" rx="5" fill="#F59E0B"/>

      {/* Lock highlight */}
      <rect x="75" y="70" width="50" height="8" rx="5" fill="#FCD34D" opacity="0.6"/>

      {/* Keyhole - open padlock icon when unlocked */}
      {unlocked ? (
        <>
          <circle cx="100" cy="84" r="5" fill="#fff" opacity="0.9"/>
          <rect x="97.5" y="84" width="5" height="8" fill="#fff" opacity="0.9"/>
        </>
      ) : (
        <>
          <circle cx="100" cy="85" r="5" fill="#1F2937"/>
          <rect x="97.5" y="85" width="5" height="10" fill="#1F2937"/>
        </>
      )}

      {/* Mystery numbers floating */}
      <text x="60" y="65" fontSize="14" fontWeight="bold" fill="#2c105c" opacity="0.25" fontFamily="system-ui">1</text>
      <text x="135" y="65" fontSize="14" fontWeight="bold" fill="#2c105c" opacity="0.25" fontFamily="system-ui">9</text>
      <text x="55" y="95" fontSize="14" fontWeight="bold" fill="#2c105c" opacity="0.25" fontFamily="system-ui">5</text>
      <text x="140" y="95" fontSize="14" fontWeight="bold" fill="#2c105c" opacity="0.25" fontFamily="system-ui">3</text>

      {/* "Secret" text */}
      <text
        x="100"
        y="135"
        fontSize="24"
        fontWeight="800"
        fill="#2c105c"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        Secret
      </text>

      {/* "Number" text */}
      <text
        x="100"
        y="157"
        fontSize="24"
        fontWeight="800"
        fill="#F59E0B"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        Number
      </text>

      {/* Tagline - smaller */}
      <text
        x="100"
        y="175"
        fontSize="12"
        fontWeight="600"
        fill="#6B7280"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        {unlocked ? 'Code Cracked!' : 'Crack the Code'}
      </text>
    </svg>
  );
};

export default SecretNumberLogo;
