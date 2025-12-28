import React, { useEffect, useState } from 'react';
import { AppState } from '../types';

interface AssistantOrbProps {
  appState: AppState;
  onClick: () => void;
}

const AssistantOrb: React.FC<AssistantOrbProps> = ({ appState, onClick }) => {
  const [visualData, setVisualData] = useState<number[]>(new Array(5).fill(10));

  // Simulate audio visualization
  useEffect(() => {
    if (appState === AppState.SPEAKING || appState === AppState.LISTENING) {
      const interval = setInterval(() => {
        setVisualData(prev => prev.map(() => Math.random() * 40 + 10));
      }, 100);
      return () => clearInterval(interval);
    } else {
      setVisualData(new Array(5).fill(10));
    }
  }, [appState]);

  const getStatusColor = () => {
    switch (appState) {
      case AppState.LISTENING: return 'bg-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.6)]';
      case AppState.PROCESSING: return 'bg-purple-500 animate-pulse';
      case AppState.SPEAKING: return 'bg-cyan-400 shadow-[0_0_40px_rgba(34,211,238,0.8)]';
      case AppState.IDLE: 
      default: return 'bg-white/20 hover:bg-white/30';
    }
  };

  return (
    <div 
      onClick={onClick}
      className={`relative w-16 h-16 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 backdrop-blur-md border border-white/10 ${getStatusColor()}`}
    >
      {/* Inner Dynamic Waves */}
      <div className="flex items-center justify-center gap-1 h-8">
        {visualData.map((h, i) => (
          <div 
            key={i} 
            className="w-1 bg-white rounded-full transition-all duration-100"
            style={{ height: `${h}%`, opacity: appState === AppState.IDLE ? 0.5 : 1 }}
          />
        ))}
      </div>
      
      {/* Icon Overlay for Idle */}
      {appState === AppState.IDLE && (
        <div className="absolute inset-0 flex items-center justify-center">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2C10 2 8 4 8 6V12C8 14 10 16 12 16C14 16 16 14 16 12V6C16 4 14 2 12 2Z" />
                <path d="M19 10V12C19 16 16 19 12 19C8 19 5 16 5 12V10" />
                <line x1="12" y1="19" x2="12" y2="22" />
             </svg>
        </div>
      )}
    </div>
  );
};

export default AssistantOrb;