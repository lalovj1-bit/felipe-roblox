
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { QUESTIONS, SCRAMBLE_QUESTIONS } from './constants';
import { GameState, Accessory, ChatMessage } from './types';

// --- CONSTANTES ---
const missions = [
  { id: 1, title: "Space", icon: "🚀", color: "bg-indigo-900" }, 
  { id: 2, title: "Ocean", icon: "🌊", color: "bg-blue-600" }, 
  { id: 3, title: "Winter", icon: "❄️", color: "bg-cyan-100" }, 
  { id: 4, title: "Forest", icon: "🍄", color: "bg-emerald-700" }, 
  { id: 5, title: "Dinos", icon: "🦖", color: "bg-orange-800" }
];

// --- AUDIO HELPERS ---
function decode(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}

const ParticleEffect = () => {
  const particles = Array.from({ length: 12 }).map((_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    const x = Math.cos(angle) * 120;
    const y = Math.sin(angle) * 120;
    return <div key={i} className="xp-orb" style={{ '--tw-translate-x': `${x}px`, '--tw-translate-y': `${y}px` } as any} />;
  });
  return <div className="absolute inset-0 flex items-center justify-center pointer-events-none">{particles}</div>;
};

const AccessoryLayer = ({ item, isNight }: { item: Accessory, isNight: boolean }) => {
  if (item === 'none') return isNight ? <rect x="75" y="45" width="4" height="20" fill="#a16207" /> : null;
  return (
    <g transform="translate(0, -5)">
      {item === 'sunglasses' && (
        <g><rect x="35" y="28" width="15" height="10" fill="#000" /><rect x="55" y="28" width="15" height="10" fill="#000" /><rect x="50" y="32" width="5" height="2" fill="#000" /></g>
      )}
      {item === 'safari_hat' && (
        <g><rect x="20" y="5" width="65" height="12" fill="#a16207" stroke="#000" strokeWidth="2" /><rect x="30" y="-8" width="45" height="15" fill="#a16207" stroke="#000" strokeWidth="2" /></g>
      )}
      {item === 'pilot_headset' && (
        <g><rect x="25" y="15" width="55" height="6" fill="#333" /><rect x="20" y="20" width="12" height="15" fill="#333" /><rect x="73" y="20" width="12" height="15" fill="#333" /></g>
      )}
      {isNight && <rect x="75" y="45" width="4" height="20" fill="#a16207" />}
    </g>
  );
};

const VoxelFelipe = ({ isActive, isDancing, isNight, size = "w-32 h-32", mood = "normal", accessory = "none" }: { isActive: boolean, isDancing?: boolean, isNight: boolean, size?: string, mood?: string, accessory?: Accessory }) => (
  <div className={`relative ${size} flex items-center justify-center transition-all duration-500 ${isActive ? 'scale-110' : 'scale-100'} ${isDancing ? 'mc-dance' : ''}`}>
    <svg viewBox="0 0 100 100" className={`w-full h-full drop-shadow-xl ${isNight ? 'brightness-75' : ''}`}>
      <rect x="30" y="45" width="45" height="40" fill={isNight ? "#94a3b8" : "#fbcfe8"} stroke="#000" strokeWidth="2" />
      <rect x="35" y="15" width="35" height="35" fill={isNight ? "#cbd5e1" : "#fdf2f8"} stroke="#000" strokeWidth="2" />
      <rect x="42" y="30" width="6" height="8" fill={mood === 'sad' ? "#334155" : "#0c4a6e"} />
      <rect x="58" y="30" width="6" height="8" fill={mood === 'sad' ? "#334155" : "#0c4a6e"} />
      <rect x="38" y="42" width="6" height="4" fill="#f472b6" opacity="0.6" />
      <rect x="62" y="42" width="6" height="4" fill="#f472b6" opacity="0.6" />
      <AccessoryLayer item={accessory} isNight={isNight} />
      {isNight && (
        <g>
          <rect x="75" y="35" width="12" height="12" fill="#f97316" className="animate-pulse" />
          <rect x="78" y="38" width="6" height="6" fill="#fbbf24" className="animate-pulse" />
        </g>
      )}
    </svg>
    {isDancing && <ParticleEffect />}
  </div>
);

export default function App() {
  const [state, setState] = useState<GameState>({
    screen: 'intro', activeMission: 1, currentQuestionIndex: 0, userAnswer: '', attempts: 0, score: 0, hunger: 80, 
    isNight: new Date().getHours() > 19 || new Date().getHours() < 7,
    feedbackType: 'none', showExplanation: false, stamps: [], postcards: {}, diaries: {}, isGeneratingPostcard: false,
    equippedAccessory: 'none', unlockedAccessories: ['none'], scrambleWords: [], selectedWords: [], chatHistory: [], dailyChallenge: 'Waiting for Felipe...'
  });

  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
  };

  useEffect(() => {
    const gameBody = document.getElementById('game-body');
    if (gameBody) {
      gameBody.classList.toggle('is-night', state.isNight);
    }
  }, [state.isNight]);

  useEffect(() => {
    const fetchDaily = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const res = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: 'Give me a very short fun dinosaur fact for a 10 year old in English. Max 8 words. No markdown.'
        });
        setState(s => ({ ...s, dailyChallenge: res.text || 'T-Rex had tiny arms!' }));
      } catch (err) {
        setState(s => ({ ...s, dailyChallenge: 'Dinos are amazing!' }));
      }
    };
    fetchDaily();
  }, []);

  const playTTS = async (text: string) => {
    try {
      initAudio();
      setIsAudioLoading(true);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: { 
          responseModalities: [Modality.AUDIO], 
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } 
        },
      });
      const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64 && audioContextRef.current) {
        const buffer = await decodeAudioData(decode(base64), audioContextRef.current, 24000, 1);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer; 
        source.connect(audioContextRef.current.destination);
        source.onended = () => setIsAudioLoading(false);
        source.start();
      } else {
        setIsAudioLoading(false);
      }
    } catch { 
      setIsAudioLoading(false); 
    }
  };

  const handleChat = async (input: string) => {
    if (!input.trim() || isChatLoading) return;
    const newHistory: ChatMessage[] = [...state.chatHistory, { role: 'user', text: input }];
    setState(s => ({ ...s, chatHistory: newHistory, hunger: Math.max(0, s.hunger - 5) }));
    setIsChatLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: input,
        config: { systemInstruction: "You are Felipe. Talk to a kid in simple English." }
      });
      const felipeText = res.text || "Cool!";
      setState(s => ({ ...s, chatHistory: [...newHistory, { role: 'felipe', text: felipeText }] }));
      playTTS(felipeText);
    } finally { 
      setIsChatLoading(false); 
    }
  };

  const checkAnswer = (opt: string, currentQ: any) => {
    if (opt === currentQ.correctAnswer) {
      setState(s => ({ 
        ...s, 
        userAnswer: opt, 
        score: s.score + 10, 
        hunger: Math.min(100, s.hunger + 15), 
        showExplanation: true 
      }));
      playTTS("Yes! That is correct.");
    } else {
      setState(s => ({ ...s, hunger: Math.max(0, s.hunger - 10) }));
      playTTS("Incorrect, try again.");
    }
  };

  if (state.screen === 'intro') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" onClick={initAudio}>
        <div className="mc-panel p-10 max-w-lg w-full text-center shadow-[8px_8px_0px_#000]">
          <h1 className="mc-logo mb-6 text-4xl leading-tight">FELIPE QUEST</h1>
          <div className="bg-yellow-400 border-4 border-black p-3 mb-8 transform -rotate-2">
            <p className="text-black font-bold uppercase text-xs tracking-widest animate-pulse">
               {state.dailyChallenge}
            </p>
          </div>
          <div className="flex justify-center mb-10">
            <VoxelFelipe isActive={true} isDancing={state.hunger > 50} isNight={state.isNight} size="w-56 h-56" accessory={state.equippedAccessory} />
          </div>
          <div className="flex flex-col gap-4">
            <button onClick={() => { setState(s => ({ ...s, screen: 'mission_select' })); playTTS("Select your mission!"); }} className="mc-button w-full text-xl py-5 bg-green-500 hover:bg-green-400">PLAY NOW</button>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => { setState(s => ({ ...s, screen: 'chat' })); playTTS("Let's talk!"); }} className="mc-button bg-cyan-400 hover:bg-cyan-300">CHAT</button>
              <button onClick={() => { setState(s => ({ ...s, screen: 'passport' })); playTTS("Welcome to your passport."); }} className="mc-button bg-orange-400 hover:bg-orange-300">REWARDS</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state.screen === 'chat') {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center">
        <div className="mc-panel w-full max-w-2xl p-6 bg-[#333] shadow-[8px_8px_0px_#000]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="mc-logo text-sm text-white">FELIPE TERMINAL</h2>
            <div className="flex gap-3 items-center bg-black/40 p-2 border-2 border-white/20">
              <span className="text-xs text-white font-bold">ENERGY:</span>
              <div className="w-24 hunger-bar"><div className="hunger-fill" style={{ width: `${state.hunger}%` }} /></div>
            </div>
          </div>
          <div className="chat-container mb-6 rounded-none border-4 border-black shadow-inner">
            {state.chatHistory.map((m, i) => (
              <div key={i} className={`p-2 ${m.role === 'felipe' ? 'msg-felipe bg-green-900/20' : 'msg-user bg-cyan-900/20'}`}>
                <span className="font-bold underline">{m.role === 'felipe' ? 'FELIPE' : 'YOU'}</span>: {m.text}
              </div>
            ))}
            {isChatLoading && <div className="msg-felipe animate-pulse">&gt; Felipe is typing...</div>}
          </div>
          <div className="flex gap-4">
            <input 
              id="chat-in" 
              type="text" 
              autoFocus
              className="flex-1 bg-black text-white border-4 border-white p-3 font-mono text-xl outline-none focus:border-cyan-400 transition-colors" 
              placeholder="Type..." 
              onKeyDown={(e) => { if(e.key === 'Enter') { handleChat(e.currentTarget.value); e.currentTarget.value = ''; } }} 
            />
            <button onClick={() => setState(s => ({ ...s, screen: 'intro' }))} className="mc-button bg-red-500 text-white">EXIT</button>
          </div>
        </div>
      </div>
    );
  }

  if (state.screen === 'playing') {
    const missionQs = QUESTIONS.filter(q => q.mission === state.activeMission);
    const currentQ = missionQs[state.currentQuestionIndex];
    return (
      <div className="min-h-screen flex flex-col items-center p-6">
        <header className="w-full max-w-3xl flex justify-between items-center mb-10 bg-black/30 p-4 rounded-none border-4 border-black">
           <div className="flex gap-4">
             <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="mc-button bg-red-600 text-white text-[10px]">LEAVE</button>
             <div className="mc-panel px-4 text-sm font-bold flex items-center bg-white">XP: {state.score}</div>
           </div>
           <div className="flex flex-col items-end">
             <div className="w-40 hunger-bar"><div className="hunger-fill" style={{ width: `${state.hunger}%` }} /></div>
           </div>
        </header>
        <main className="mc-panel w-full max-w-2xl p-10 relative shadow-[10px_10px_0px_#000]">
          <div className="flex flex-col md:flex-row gap-10 mb-10 items-center">
             <VoxelFelipe isActive={state.showExplanation} mood={state.hunger < 20 ? 'sad' : 'normal'} isNight={state.isNight} isDancing={state.showExplanation} accessory={state.equippedAccessory} />
             <div className="bg-white border-4 border-black p-6 flex-1 text-black font-bold text-2xl leading-relaxed relative">
               "{currentQ.text}"
               <div className="absolute -left-4 top-10 w-6 h-6 bg-white border-l-4 border-b-4 border-black rotate-45 hidden md:block"></div>
             </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentQ.options.map((o, i) => (
              <button key={i} disabled={state.showExplanation || isAudioLoading} onClick={() => checkAnswer(o, currentQ)} className="mc-button text-lg py-5 capitalize">
                {o}
              </button>
            ))}
          </div>
          {state.showExplanation && (
            <div className="mt-10 p-6 bg-yellow-100 border-4 border-black text-black text-center shadow-[4px_4px_0px_#000]">
              <p className="text-xl font-bold mb-2">"{currentQ.translation}"</p>
              <button onClick={() => {
                if (state.currentQuestionIndex + 1 < missionQs.length) setState(s => ({ ...s, currentQuestionIndex: s.currentQuestionIndex + 1, showExplanation: false, userAnswer: '' }));
                else { setState(s => ({ ...s, screen: 'game_over', stamps: [...new Set([...s.stamps, s.activeMission])] })); playTTS("Congratulations! Mission complete!"); }
              }} className="mc-button w-full bg-blue-500 text-white text-lg">NEXT »</button>
            </div>
          )}
        </main>
      </div>
    );
  }

  if (state.screen === 'mission_select') return (
    <div className="min-h-screen p-10 flex flex-col items-center">
      <h1 className="mc-logo mb-12 text-3xl">CHOOSE MISSION</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full max-w-5xl">
        {missions.map(m => (
          <button 
            key={m.id} 
            onClick={() => { setState(s => ({ ...s, screen: 'playing', activeMission: m.id, currentQuestionIndex: 0, showExplanation: false })); playTTS(`Starting ${m.title} mission.`); }} 
            className="mc-panel p-8 hover:scale-105 transition-all flex flex-col items-center gap-6 shadow-[8px_8px_0px_#000]"
          >
            <span className="text-7xl">{m.icon}</span>
            <span className="font-bold text-xl text-black uppercase">{m.title}</span>
          </button>
        ))}
      </div>
      <button onClick={() => setState(s => ({ ...s, screen: 'intro' }))} className="mt-16 mc-button">BACK</button>
    </div>
  );

  if (state.screen === 'passport') return (
    <div className="min-h-screen p-8 flex flex-col items-center bg-[#2d3748]">
      <div className="mc-panel p-10 w-full max-w-3xl bg-white shadow-[12px_12px_0px_#000]">
        <h1 className="mc-logo text-black mb-10 text-center">PASSPORT</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {missions.map(m => (
            <div key={m.id} className={`p-6 border-4 border-black flex items-start gap-4 ${state.stamps.includes(m.id) ? 'bg-white' : 'bg-gray-200 opacity-40'}`}>
               <div className="text-5xl">{m.icon}</div>
               <div className="flex-1">
                 <p className="text-sm font-bold text-black uppercase">{m.title}</p>
                 {state.stamps.includes(m.id) && <p className="text-[10px] text-green-600 font-bold">STAMPED!</p>}
               </div>
            </div>
          ))}
        </div>
        <button onClick={() => setState(s => ({ ...s, screen: 'intro' }))} className="mc-button w-full mt-12 bg-black text-white py-5">EXIT</button>
      </div>
    </div>
  );

  if (state.screen === 'game_over') return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black/90">
      <div className="mc-panel p-12 text-center max-w-md w-full bg-white shadow-[16px_16px_0px_#222]">
        <h2 className="mc-logo text-green-600 mb-8 text-3xl">WINNER!</h2>
        <VoxelFelipe isActive={true} isDancing={true} isNight={state.isNight} size="w-56 h-56" accessory={state.equippedAccessory} />
        <button onClick={() => setState(s => ({ ...s, screen: 'passport' }))} className="mc-button w-full py-5 text-xl bg-orange-500 text-white mt-8">PASSPORT</button>
      </div>
    </div>
  );

  return null;
}
