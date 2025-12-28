import React from 'react';
import { SystemState, AssistantConfig } from '../types';

interface SettingsPanelProps {
  systemState: SystemState;
  setSystemState: React.Dispatch<React.SetStateAction<SystemState>>;
  config: AssistantConfig;
  setConfig: React.Dispatch<React.SetStateAction<AssistantConfig>>;
  // Fix: Removed apiKey props
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  systemState,
  setSystemState,
  config,
  setConfig
  // Fix: Removed apiKey props
}) => {
  
  const toggleSystem = (key: keyof SystemState) => {
    setSystemState(prev => ({ ...prev, [key]: !prev[key as keyof SystemState] }));
  };

  const updateLevel = (key: 'brightness' | 'volume', value: number) => {
    setSystemState(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto h-full">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Header */}
        <div>
          <h2 className="text-3xl font-light text-white mb-2">Settings</h2>
          <p className="text-gray-400">Manage device controls and assistant preferences.</p>
        </div>

        {/* Section 1: System Control Center */}
        <section>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">System Control Center</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Wi-Fi Toggle */}
            <div className={`p-4 rounded-xl border transition-colors flex items-center justify-between ${systemState.wifi ? 'bg-blue-500/10 border-blue-500/30' : 'bg-[#1c1c1c] border-white/5'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${systemState.wifi ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-500'}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>
                </div>
                <div>
                  <div className="font-medium text-white">Wi-Fi</div>
                  <div className="text-xs text-gray-400">{systemState.wifi ? 'Connected' : 'Disabled'}</div>
                </div>
              </div>
              <button 
                onClick={() => toggleSystem('wifi')}
                className={`w-12 h-6 rounded-full relative transition-colors ${systemState.wifi ? 'bg-blue-500' : 'bg-gray-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${systemState.wifi ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            {/* Bluetooth Toggle */}
            <div className={`p-4 rounded-xl border transition-colors flex items-center justify-between ${systemState.bluetooth ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-[#1c1c1c] border-white/5'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${systemState.bluetooth ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-500'}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6.5 6.5l11 11L12 23V1l5.5 5.5-11 11" /></svg>
                </div>
                <div>
                  <div className="font-medium text-white">Bluetooth</div>
                  <div className="text-xs text-gray-400">{systemState.bluetooth ? 'On' : 'Off'}</div>
                </div>
              </div>
              <button 
                onClick={() => toggleSystem('bluetooth')}
                className={`w-12 h-6 rounded-full relative transition-colors ${systemState.bluetooth ? 'bg-indigo-500' : 'bg-gray-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${systemState.bluetooth ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            {/* Airplane Mode Toggle */}
            <div className={`p-4 rounded-xl border transition-colors flex items-center justify-between ${systemState.airplaneMode ? 'bg-orange-500/10 border-orange-500/30' : 'bg-[#1c1c1c] border-white/5'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${systemState.airplaneMode ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-500'}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12h20"/><path d="M13 19l4-7-4-7"/><path d="M6 16l4-4-4-4"/></svg> {/* Generic icon for flight */}
                  <svg className="absolute" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" transform="rotate(45 12 12)"/></svg>
                </div>
                <div>
                  <div className="font-medium text-white">Airplane Mode</div>
                  <div className="text-xs text-gray-400">{systemState.airplaneMode ? 'Enabled' : 'Disabled'}</div>
                </div>
              </div>
              <button 
                onClick={() => toggleSystem('airplaneMode')}
                className={`w-12 h-6 rounded-full relative transition-colors ${systemState.airplaneMode ? 'bg-orange-500' : 'bg-gray-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${systemState.airplaneMode ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            {/* Power Saver Toggle */}
            <div className={`p-4 rounded-xl border transition-colors flex items-center justify-between ${systemState.powerSaver ? 'bg-green-500/10 border-green-500/30' : 'bg-[#1c1c1c] border-white/5'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${systemState.powerSaver ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-500'}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="6" width="18" height="12" rx="2" ry="2"></rect><line x1="23" y1="13" x2="23" y2="11"></line></svg>
                </div>
                <div>
                  <div className="font-medium text-white">Power Saver</div>
                  <div className="text-xs text-gray-400">{systemState.powerSaver ? 'Active' : 'Off'}</div>
                </div>
              </div>
              <button 
                onClick={() => toggleSystem('powerSaver')}
                className={`w-12 h-6 rounded-full relative transition-colors ${systemState.powerSaver ? 'bg-green-500' : 'bg-gray-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${systemState.powerSaver ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>

          {/* Sliders */}
          <div className="bg-[#1c1c1c] p-6 rounded-xl border border-white/5 space-y-8">
             {/* Brightness */}
             <div>
                <div className="flex justify-between mb-3 text-sm">
                   <div className="flex items-center gap-2 text-gray-300">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                      <span>Brightness</span>
                   </div>
                   <span className="font-mono text-gray-400">{systemState.brightness}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={systemState.brightness} 
                  onChange={(e) => updateLevel('brightness', parseInt(e.target.value))} 
                  className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white" 
                />
             </div>

             {/* Volume */}
             <div>
                <div className="flex justify-between mb-3 text-sm">
                   <div className="flex items-center gap-2 text-gray-300">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                      <span>Volume</span>
                   </div>
                   <span className="font-mono text-gray-400">{systemState.volume}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={systemState.volume} 
                  onChange={(e) => updateLevel('volume', parseInt(e.target.value))} 
                  className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white" 
                />
             </div>
          </div>
        </section>

        <hr className="border-white/5" />

        {/* Section 2: Identity & Config */}
        <section>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Assistant Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Identity */}
            <div className="space-y-4">
               <div>
                  <label className="block text-xs text-gray-400 mb-2">Assistant Name</label>
                  <input 
                      type="text" 
                      value={config.name}
                      onChange={(e) => setConfig({...config, name: e.target.value})}
                      className="w-full bg-[#1c1c1c] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none transition-colors"
                  />
               </div>
               <div>
                  <label className="block text-xs text-gray-400 mb-2">Voice Model</label>
                  <div className="grid grid-cols-3 gap-2">
                      {['Puck', 'Kore', 'Fenrir', 'Charon', 'Zephyr'].map(voice => (
                          <button
                              key={voice}
                              onClick={() => setConfig({...config, voiceName: voice as any})}
                              className={`px-3 py-2 rounded-lg text-sm border transition-colors ${config.voiceName === voice ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-[#1c1c1c] border-white/5 text-gray-400 hover:bg-white/5'}`}
                          >
                              {voice}
                          </button>
                      ))}
                  </div>
               </div>
            </div>

            {/* Fix: Removed API Key input section as per guidelines */}
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsPanel;