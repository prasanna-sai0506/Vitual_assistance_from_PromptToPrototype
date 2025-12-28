import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GeminiLiveService } from './services/geminiLiveService';
import AssistantOrb from './components/AssistantOrb';
import SettingsPanel from './components/SettingsPanel';
import { AppState, AssistantConfig, SystemState, LogEntry, MockFile, Timer } from './types';

// --- MOCK DATA FOR SIMULATION ---
const MOCK_FILES: MockFile[] = [
  { name: 'Resume_2024.pdf', type: 'pdf', path: 'C:/Users/User/Documents/', date: '2024-05-12' },
  { name: 'Invoice_001.pdf', type: 'pdf', path: 'C:/Users/User/Documents/Financial/', date: '2024-05-12' },
  { name: 'Project_Nova_Specs.docx', type: 'docx', path: 'C:/Users/User/Work/', date: '2024-10-01' },
  { name: 'Company_Logo.png', type: 'png', path: 'C:/Users/User/Work/Assets/', date: '2024-10-01' },
  { name: 'Hawaii_Trip.jpg', type: 'jpg', path: 'C:/Users/User/Pictures/', date: '2023-08-15' },
  { name: 'Budget_Q3.xlsx', type: 'docx', path: 'C:/Users/User/Documents/Finance/', date: '2024-09-30' },
  { name: 'setup.exe', type: 'exe', path: 'C:/Downloads/', date: '2024-10-20' },
  { name: 'notes.txt', type: 'txt', path: 'C:/Users/User/Desktop/', date: '2024-10-22' },
];

export default function App() {
  // System State
  const [systemState, setSystemState] = useState<SystemState>({
    wifi: true,
    bluetooth: true,
    airplaneMode: false,
    brightness: 80,
    volume: 60,
    powerSaver: false,
    theme: 'dark'
  });

  const [config, setConfig] = useState<AssistantConfig>({
    name: 'Nova',
    voiceName: 'Kore'
  });

  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [timers, setTimers] = useState<Timer[]>([]);
  const [recentFiles, setRecentFiles] = useState<MockFile[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'settings'>('home');
  const [lastAction, setLastAction] = useState<string>('');

  const geminiRef = useRef<GeminiLiveService | null>(null);

  // Timer Tick Logic
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prev => prev.map(t => ({
        ...t,
        remainingSeconds: t.remainingSeconds > 0 ? t.remainingSeconds - 1 : 0,
        active: t.remainingSeconds > 0
      })).filter(t => t.remainingSeconds > 0 || t.active)); // Keep finished timers briefly or handle logic
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const addLog = useCallback((message: string, type: 'info' | 'error' | 'action') => {
    setLogs(prev => [...prev.slice(-10), {
        id: Math.random().toString(36),
        timestamp: new Date(),
        source: 'system',
        message,
        type
    }]);
    if (type === 'action') setLastAction(message);
  }, []);

  // --- COMMAND EXECUTION ---
  const executeAction = useCallback(async (name: string, args: any): Promise<any> => {
    await new Promise(r => setTimeout(r, 500)); // Simulate processing latency

    switch (name) {
      case 'controlSystem': {
        const { setting, toggleState, numericValue } = args;
        setSystemState(prev => {
          const newState = { ...prev };
          switch (setting) {
            case 'wifi': newState.wifi = toggleState; break;
            case 'bluetooth': newState.bluetooth = toggleState; break;
            case 'brightness': newState.brightness = numericValue ?? prev.brightness; break;
            case 'volume': newState.volume = numericValue ?? prev.volume; break;
            case 'airplane_mode': newState.airplaneMode = toggleState; break;
            case 'power_saver': newState.powerSaver = toggleState; break;
          }
          return newState;
        });
        return { result: "ok" };
      }

      case 'launchApplication': {
        const { appName } = args;
        addLog(`Launching ${appName}...`, 'action');
        // In a real app, this would use electron shell.openExternal
        return { result: `Opened ${appName}` };
      }

      case 'searchFiles': {
        const { query, fileType, date } = args;
        let results = MOCK_FILES;
        let logParts = [];

        if (query) {
            results = results.filter(f => f.name.toLowerCase().includes(query.toLowerCase()));
            logParts.push(`name: "${query}"`);
        }
        if (fileType) {
            results = results.filter(f => f.type.toLowerCase() === fileType.toLowerCase());
            logParts.push(`type: .${fileType}`);
        }
        if (date) {
            results = results.filter(f => f.date === date);
            logParts.push(`date: ${date}`);
        }

        const logMsg = logParts.length > 0 ? `Searching files [${logParts.join(', ')}]` : "Listing all files";
        
        setRecentFiles(results);
        addLog(logMsg, 'action');
        return { 
          found: results.length > 0, 
          count: results.length,
          files: results.map(f => f.name) 
        };
      }

      case 'setTimer': {
        const { duration, label } = args;
        const newTimer: Timer = {
          id: Math.random().toString(),
          label: label || 'Timer',
          durationSeconds: duration,
          remainingSeconds: duration,
          active: true
        };
        setTimers(prev => [...prev, newTimer]);
        return { result: `Timer set for ${duration} seconds` };
      }
      
      case 'getWeather': {
        const { location } = args;
        addLog(`Checking weather for ${location}`, 'action');
        return { result: `The weather in ${location} is Sunny, 72 degrees Fahrenheit.` };
      }

      default:
        return { result: "error", message: "unknown tool" };
    }
  }, [addLog]);

  // Handle Connect
  const toggleAssistant = async () => {
    // Fix: Use process.env.API_KEY directly as per guidelines. Do not use state.
    const apiKey = process.env.API_KEY;
    if (!apiKey) return alert("API Key Missing in Environment");

    if (appState === AppState.IDLE) {
      try {
        setAppState(AppState.LISTENING);
        geminiRef.current = new GeminiLiveService(apiKey);
        await geminiRef.current.connect(
          config,
          (isPlaying) => setAppState(isPlaying ? AppState.SPEAKING : AppState.LISTENING),
          executeAction,
          addLog
        );
      } catch (e) {
        addLog(`Connection Error: ${e}`, 'error');
        setAppState(AppState.IDLE);
      }
    } else {
      geminiRef.current?.disconnect();
      setAppState(AppState.IDLE);
    }
  };

  return (
    <div className="w-screen h-screen bg-[#111111] text-white font-sans flex overflow-hidden">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-[#1c1c1c] flex flex-col border-r border-white/5 p-4">
        <div className="flex items-center gap-3 px-2 mb-8">
           <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center font-bold text-black">N</div>
           <h1 className="font-semibold text-lg tracking-tight">Nova Assistant</h1>
        </div>
        
        <nav className="space-y-1 flex-1">
          <button 
            onClick={() => setActiveTab('home')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'home' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            Settings
          </button>
        </nav>

        {/* System Hardware Status Mini-View */}
        <div className="p-4 bg-black/20 rounded-xl space-y-3">
          <div className="text-xs font-semibold text-gray-500 uppercase">System Status</div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Wi-Fi</span>
            <span className={systemState.wifi ? 'text-green-400' : 'text-red-400'}>{systemState.wifi ? 'On' : 'Off'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Bluetooth</span>
            <span className={systemState.bluetooth ? 'text-green-400' : 'text-red-400'}>{systemState.bluetooth ? 'On' : 'Off'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
             <span className="text-gray-400">Volume</span>
             <div className="w-16 h-1 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${systemState.volume}%`}} />
             </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-[#111111] flex flex-col relative">
        {/* Top Bar */}
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-8">
            <h2 className="text-xl font-semibold text-white">{activeTab === 'home' ? 'Dashboard' : 'Settings'}</h2>
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-xs text-green-500 font-medium tracking-wide">SYSTEM ACTIVE</span>
            </div>
        </div>

        {activeTab === 'home' ? (
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="grid grid-cols-12 gap-6">
            
            {/* Main Interaction Card */}
            <div className="col-span-8 bg-[#1c1c1c] rounded-2xl p-8 border border-white/5 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
                <div className="absolute top-4 left-4 text-xs font-mono text-gray-500">VOICE_INTERFACE_V2</div>
                
                <div className="mb-8 scale-150">
                    <AssistantOrb appState={appState} onClick={toggleAssistant} />
                </div>
                
                <div className="text-center space-y-2 z-10">
                    <h3 className="text-2xl font-light text-white">
                        {appState === AppState.IDLE ? `Hello, User.` : 
                         appState === AppState.LISTENING ? "Listening..." : "Processing..."}
                    </h3>
                    <p className="text-gray-400 max-w-md mx-auto">
                        {lastAction ? `Last action: ${lastAction}` : "Tap the orb to start command entry."}
                    </p>
                </div>

                {/* Live Transcript / Logs Overlay */}
                <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-black via-black/80 to-transparent p-6 flex flex-col justify-end">
                    <div className="space-y-1 font-mono text-xs opacity-60">
                        {logs.slice(-3).map(log => (
                            <div key={log.id} className="flex gap-2">
                                <span className="text-blue-400">[{log.timestamp.toLocaleTimeString()}]</span>
                                <span className={log.type === 'action' ? 'text-green-400' : 'text-gray-300'}>
                                    {log.type === 'action' ? '>>' : '>'} {log.message}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Side Widgets */}
            <div className="col-span-4 space-y-6">
                
                {/* Timers Widget */}
                <div className="bg-[#1c1c1c] rounded-2xl p-6 border border-white/5">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-200">Timers</h4>
                        <span className="text-xs bg-white/10 px-2 py-1 rounded text-gray-400">{timers.length} Active</span>
                    </div>
                    {timers.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 text-sm">No active timers</div>
                    ) : (
                        <div className="space-y-3">
                            {timers.map(timer => (
                                <div key={timer.id} className="flex items-center justify-between bg-black/20 p-3 rounded-lg">
                                    <div className="text-sm">
                                        <div className="text-white">{timer.label}</div>
                                        <div className="text-xs text-gray-500">Countdown</div>
                                    </div>
                                    <div className="font-mono text-xl text-blue-400">
                                        {Math.floor(timer.remainingSeconds / 60)}:{String(timer.remainingSeconds % 60).padStart(2, '0')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Files Widget */}
                <div className="bg-[#1c1c1c] rounded-2xl p-6 border border-white/5">
                    <h4 className="font-semibold text-gray-200 mb-4">Mock File Explorer</h4>
                    {recentFiles.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 text-sm">Say "Search for [filename]"</div>
                    ) : (
                        <div className="space-y-2">
                            {recentFiles.map((file, i) => (
                                <div key={i} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded cursor-pointer group">
                                    <div className="w-8 h-8 bg-blue-500/20 rounded flex items-center justify-center text-blue-400 text-xs font-bold uppercase">
                                        {file.type}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="text-sm text-gray-200 truncate group-hover:text-blue-400 transition-colors">{file.name}</div>
                                        <div className="text-xs text-gray-500 truncate">{file.path}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
          </div>
        </div>
        ) : (
          <SettingsPanel 
            systemState={systemState}
            setSystemState={setSystemState}
            config={config}
            setConfig={setConfig}
            // Fix: Removed apiKey props
          />
        )}
      </div>
    </div>
  );
}