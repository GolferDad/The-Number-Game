import { useState } from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
  content: string;
}

const Tooltip = ({ content }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      style={{ 
        position: 'relative', 
        display: 'inline-flex',
        alignItems: 'center',
        flexShrink: 0
      }}
    >
      <button
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        style={{
          background: 'rgba(255, 255, 255, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '50%',
          width: '18px',
          height: '18px',
          minWidth: '18px',
          minHeight: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 0,
          flexShrink: 0
        }}
        type="button"
      >
        <Info size={12} color="#FCD34D" />
      </button>

      {isVisible && (
        <div
          style={{
            position: 'absolute',
            bottom: '130%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(31, 41, 55, 0.98)',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            lineHeight: '1.5',
            whiteSpace: 'pre-line',
            minWidth: '200px',
            maxWidth: '280px',
            border: '2px solid #FBBF24',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            zIndex: 9999,
            pointerEvents: 'none'
          }}
        >
          {content}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '8px solid #FBBF24'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Tooltip;