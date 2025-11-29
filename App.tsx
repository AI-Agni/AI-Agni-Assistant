import React, { useState, useCallback, useEffect } from 'react';
import { Mic, MicOff, Power, Activity, MessageSquare } from 'lucide-react';
import { Scene } from './components/Scene';
import { geminiLive } from './services/geminiLiveService';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Initial welcome message (simulated)
  useEffect(() => {
    // Just a flag to check if we can play audio contexts later
    const handleInteraction = () => setHasInteracted(true);
    window.addEventListener('click', handleInteraction);
    return () => window.removeEventListener('click', handleInteraction);
  }, []);

  const handleConnect = useCallback(async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    setError(null);

    try {
      await geminiLive.connect({
        onOpen: () => {
          setIsConnected(true);
          setIsConnecting(false);
        },
        onClose: () => {
          setIsConnected(false);
          setIsConnecting(false);
          setAnalyser(null);
        },
        onError: (err) => {
          setError(err.message);
          setIsConnected(false);
          setIsConnecting(false);
        },
        onAudioData: (node) => {
          setAnalyser(node);
        }
      });
    } catch (e: any) {
      setError(e.message || "Failed to connect");
      setIsConnecting(false);
    }
  }, [isConnecting]);

  const handleDisconnect = useCallback(() => {
    geminiLive.disconnect();
    setIsConnected(false);
    setAnalyser(null);
  }, []);

  const toggleConnection = () => {
    if (isConnected) {
      handleDisconnect();
    } else {
      handleConnect();
    }
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-[#050000] overflow-hidden font-sans">
      
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Scene analyser={analyser} isActive={isConnected} />
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6 md:p-12">
        
        {/* Header */}
        <div className="flex justify-between items-start pointer-events-auto">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-600 tracking-tighter">
              AI AGNI
            </h1>
            <p className="text-orange-100/60 text-sm mt-1 uppercase tracking-widest">
              Agni Intelligence Interface
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-orange-500 animate-pulse' : 'bg-red-900'}`} />
            <span className="text-xs text-white/50 uppercase">
              {isConnected ? 'Agni Online' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-6 pointer-events-auto mb-10">
          
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-2 rounded-lg text-sm backdrop-blur-md mb-4 max-w-md text-center">
              {error}
            </div>
          )}

          {!hasInteracted && !isConnected && (
            <p className="text-white/40 text-sm mb-2 animate-bounce">
              Click anywhere to initialize audio engine
            </p>
          )}

          <div className="flex items-center gap-6">
            <button
              onClick={toggleConnection}
              disabled={isConnecting}
              className={`
                relative group flex items-center justify-center w-20 h-20 rounded-full border-2 
                transition-all duration-300 backdrop-blur-md
                ${isConnected 
                  ? 'border-red-500/50 hover:bg-red-500/10 hover:border-red-500' 
                  : 'border-orange-500/50 hover:bg-orange-500/10 hover:border-orange-500 shadow-[0_0_30px_rgba(255,100,0,0.3)]'}
              `}
            >
              {isConnecting ? (
                <div className="w-8 h-8 border-2 border-t-transparent border-white rounded-full animate-spin" />
              ) : isConnected ? (
                <Power className="w-8 h-8 text-red-400 group-hover:scale-110 transition-transform" />
              ) : (
                <Mic className="w-8 h-8 text-orange-400 group-hover:scale-110 transition-transform" />
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-white/60 text-sm font-light">
              {isConnected 
                ? "Agni is listening..." 
                : "Tap microphone to ignite Agni."}
            </p>
          </div>
        </div>

        {/* Footer Data Visualization */}
        <div className="hidden md:flex justify-between items-end text-white/20 text-xs font-mono pointer-events-none">
           <div className="flex flex-col gap-1">
             <div className="flex items-center gap-2">
               <Activity className="w-3 h-3" />
               <span>CORE: AGNI-PRIME-V1</span>
             </div>
             <div>LATENCY: {isConnected ? '45ms' : '--'}</div>
           </div>
           
           <div className="flex items-center gap-2">
             <MessageSquare className="w-3 h-3" />
             <span>MODEL: AGNI-NATIVE-AUDIO</span>
           </div>
        </div>

      </div>
      
      {/* Vignette Overlay for cinematic look */}
      <div className="absolute inset-0 z-5 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(20,0,0,0.6)_100%)]" />
      
    </div>
  );
}

export default App;