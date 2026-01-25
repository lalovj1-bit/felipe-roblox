
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { QUESTIONS, SCRAMBLE_QUESTIONS } from './constants';
import { GameState, Accessory, ChatMessage } from './types';

// --- CONSTANTS ---
// Moved missions constant to top level to avoid hoisting errors
const missions = [
  { id: 1, title: "Space", icon: "🚀" }, 
  { id: 2, title: "Ocean", icon: "🌊" }, 
  { id: 3, title: "Winter", icon: "❄️" }, 
  { id: 4, title: "Forest", icon: "🍄" }, 
  { id: 5, title: "Dinos", icon: "🦖" }
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
  const particles = Array.from({ length: 8 }).map((_, i) => {
    const angle = (i / 8) * Math.PI * 2;
    const x = Math.cos(angle) * 100;
    const y = Math.sin(angle) * 100;
    return <div key={i} className="xp-orb" style={{ '--tw-translate-x': `${x}px`, '--tw-translate-y': `${y}px` } as any} />;
  });
  return <div className="absolute inset-0 flex items-center justify-center pointer-events-none">{particles}</div>;
};

const AccessoryLayer = ({ item, isNight }: { item: Accessory, isNight: boolean }) => {
  if (item === 'none') return isNight ? <rect x="75" y="45" width="4" height="20" fill="#a16207" /> : null;
  return (
    <g transform="translate(0, -5)">
      {item === 'sunglasses' && (
        <g><rect x="40" y="28" width="12" height="8" fill="#000" /><rect x="58" y="28" width="12" height="8" fill="#000" /><rect x="52" y="31" width="6" height="2" fill="#000" /></g>
      )}
      {item === 'safari_hat' && (
        <g><rect x="25" y="5" width="60" height="10" fill="#a16207" stroke="#000" strokeWidth="2" /><rect x="35" y="-5" width="40" height="12" fill="#a16207" stroke="#000" strokeWidth="2" /></g>
      )}
      {isNight && <rect x="75" y="45" width="4" height="20" fill="#a16207" />}
    </g>
  );
};

const VoxelFelipe = ({ isActive, isDancing, isNight, size = "w-32 h-32", mood = "normal", accessory = "none" }: { isActive: boolean, isDancing?: boolean, isNight: boolean, size?: string, mood?: string, accessory?: Accessory }) => (
  <div className={`relative ${size} flex items-center justify-center transition-all duration-300 ${isActive ? 'scale-110' : 'scale-100'} ${isDancing ? 'mc-dance' : ''}`}>
    <svg viewBox="0 0 100 100" className={`w-full h-full drop-shadow-xl ${isNight ? 'brightness-75' : ''}`}>
      <rect x="30" y="45" width="40" height="35" fill={isNight ? "#ddd" : "#fff"} stroke="#000" strokeWidth="2" />
      <rect x="35" y="15" width="30" height="30" fill="#fbcfe8" stroke="#000" strokeWidth="2" />
      <rect x="40" y="30" width="4" height="6" fill="#0c4a6e" />
      <rect x="56" y="30" width="4" height="6" fill="#0c4a6e" />
      <AccessoryLayer item={accessory} isNight={isNight} />
      {isNight && <rect x="72" y="40" width="10" height="10" fill="#ffaa00" className="animate-pulse" />}
    </svg>
    {isDancing && <ParticleEffect />}
  </div>
);

export default function App() {
  const [state, setState] = useState<GameState>({
    screen: 'intro', activeMission: 1, currentQuestionIndex: 0, userAnswer: '', attempts: 0, score: 0, hunger: 80, isNight: new Date().getHours() > 19 || new Date().getHours() < 7,
    feedbackType: 'none', showExplanation: false, stamps: [], postcards: {}, diaries: {}, isGeneratingPostcard: false,
    equippedAccessory: 'none', unlockedAccessories: ['none'], scrambleWords: [], selectedWords: [], chatHistory: [], dailyChallenge: 'Loading...'
  });

  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    document.getElementById('game-body')?.classList.toggle('is-night', state.isNight);
  }, [state.isNight]);

  useEffect(() => {
    const fetchDaily = async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: 'Tell a 10-year-old one fun fact about dinosaurs in very simple English (10 words max).'
      });
      setState(s => ({ ...s, dailyChallenge: res.text || 'Dinos are cool!' }));
    };
    fetchDaily();
  }, []);

  const playTTS = async (text: string) => {
    try {
      setIsAudioLoading(true);
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } },
      });
      const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64) {
        const buffer = await decodeAudioData(decode(base64), audioContextRef.current, 24000, 1);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer; source.connect(audioContextRef.current.destination);
        source.onended = () => setIsAudioLoading(false);
        source.start();
      } else setIsAudioLoading(false);
    } catch { setIsAudioLoading(false); }
  };

  const handleChat = async (input: string) => {
    if (!input || isChatLoading) return;
    const newHistory: ChatMessage[] = [...state.chatHistory, { role: 'user', text: input }];
    setState(s => ({ ...s, chatHistory: newHistory, hunger: Math.max(0, s.hunger - 5) }));
    setIsChatLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: input,
        config: { systemInstruction: "You are Felipe, a voxel dinosaur traveler. Talk to a kid in very simple A1 English. Be short and happy." }
      });
      const felipeText = res.text || "Cool!";
      setState(s => ({ ...s, chatHistory: [...newHistory, { role: 'felipe', text: felipeText }] }));
      playTTS(felipeText);
    } finally { setIsChatLoading(false); }
  };

  const checkAnswer = (opt: string, currentQ: any) => {
    if (opt === currentQ.correctAnswer) {
      setState(s => ({ ...s, userAnswer: opt, score: s.score + 10, hunger: Math.min(100, s.hunger + 15), showExplanation: true }));
      playTTS("Yes! Correct!");
    } else {
      setState(s => ({ ...s, hunger: Math.max(0, s.hunger - 10) }));
      playTTS("No, try again!");
    }
  };

  if (state.screen === 'intro') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="mc-panel p-10 max-w-lg w-full text-center">
          <h1 className="mc-logo mb-4">FELIPE QUEST</h1>
          <p className="text-black font-bold mb-8 uppercase text-xs tracking-widest bg-yellow-400 p-2 border-2 border-black animate-pulse">
             Today's Hint: {state.dailyChallenge}
          </p>
          <div className="flex justify-center mb-8"><VoxelFelipe isActive={true} isDancing={state.hunger > 50} isNight={state.isNight} size="w-48 h-48" accessory={state.equippedAccessory} /></div>
          <div className="flex flex-col gap-4">
            <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="mc-button w-full text-lg py-4">START ADVENTURE</button>
            <button onClick={() => setState(s => ({ ...s, screen: 'chat' }))} className="mc-button w-full bg-cyan-400">TALK TO FELIPE</button>
            <button onClick={() => setState(s => ({ ...s, screen: 'passport' }))} className="mc-button w-full bg-orange-400">MY PASSPORT</button>
          </div>
        </div>
      </div>
    );
  }

  if (state.screen === 'chat') {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center">
        <div className="mc-panel w-full max-w-2xl p-6 bg-[#333]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="mc-logo text-sm">FELIPE CHAT</h2>
            <div className="flex gap-2 items-center">
              <span className="text-xs text-white">HUNGER:</span>
              <div className="w-24 hunger-bar"><div className="hunger-fill" style={{ width: `${state.hunger}%` }} /></div>
            </div>
          </div>
          <div className="chat-container mb-4">
            {state.chatHistory.map((m, i) => (
              <div key={i} className={m.role === 'felipe' ? 'msg-felipe' : 'msg-user'}>
                {m.role === 'felipe' ? '> FELIPE: ' : '> ME: '}{m.text}
              </div>
            ))}
            {isChatLoading && <div className="msg-felipe animate-pulse">FELIPE IS THINKING...</div>}
          </div>
          <div className="flex gap-2">
            <input id="chat-in" type="text" className="flex-1 bg-black text-white border-4 border-white p-2 font-mono outline-none" placeholder="Say hello in English..." onKeyDown={(e) => { if(e.key === 'Enter') { handleChat(e.currentTarget.value); e.currentTarget.value = ''; } }} />
            <button onClick={() => setState(s => ({ ...s, screen: 'intro' }))} className="mc-button">EXIT</button>
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
        <header className="w-full max-w-3xl flex justify-between items-center mb-8">
           <div className="flex gap-4">
             <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="mc-button bg-red-500 text-white text-[10px]">EXIT</button>
             <div className="mc-panel px-2 text-[10px] flex items-center">XP: {state.score}</div>
           </div>
           <div className="flex flex-col items-end">
             <span className="text-[10px] text-white">FELIPE ENERGY</span>
             <div className="w-32 hunger-bar"><div className="hunger-fill" style={{ width: `${state.hunger}%` }} /></div>
           </div>
        </header>
        <main className="mc-panel w-full max-w-2xl p-8 relative">
          <div className="flex gap-6 mb-8">
             <VoxelFelipe isActive={state.showExplanation} mood={state.hunger < 20 ? 'sad' : 'happy'} isNight={state.isNight} isDancing={state.showExplanation} accessory={state.equippedAccessory} />
             <div className="bg-white border-4 border-black p-4 flex-1 text-black font-bold text-xl italic relative">
               "{currentQ.text.replace('________', '____')}"
               <div className="absolute -left-4 top-4 w-4 h-4 bg-white border-l-4 border-b-4 border-black rotate-45"></div>
             </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {currentQ.options.map((o, i) => (
              <button key={i} disabled={state.showExplanation || isAudioLoading} onClick={() => checkAnswer(o, currentQ)} className="mc-button text-xs py-4">
                {o.toUpperCase()}
              </button>
            ))}
          </div>
          {state.showExplanation && (
            <div className="mt-8 p-4 bg-yellow-200 border-4 border-black text-black animate-bounce text-center">
              <p className="font-bold mb-4">"{currentQ.translation}"</p>
              <button onClick={() => {
                if (state.currentQuestionIndex + 1 < missionQs.length) setState(s => ({ ...s, currentQuestionIndex: s.currentQuestionIndex + 1, showExplanation: false, userAnswer: '' }));
                else setState(s => ({ ...s, screen: 'game_over', stamps: [...new Set([...s.stamps, s.activeMission])] }));
              }} className="mc-button w-full bg-white">CONTINUE QUEST »</button>
            </div>
          )}
        </main>
      </div>
    );
  }

  if (state.screen === 'mission_select') return (
    <div className="min-h-screen p-8 flex flex-col items-center">
      <h1 className="mc-logo mb-8">SELECT WORLD</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {missions.map(m => (
          <button key={m.id} onClick={() => setState(s => ({ ...s, screen: 'playing', activeMission: m.id, currentQuestionIndex: 0, showExplanation: false, userAnswer: '' }))} className="mc-panel p-6 hover:scale-105 transition-all flex flex-col items-center gap-4">
            <span className="text-6xl">{m.icon}</span>
            <span className="font-bold text-sm text-black">{m.title}</span>
            {state.stamps.includes(m.id) && <span className="text-green-600 font-bold">COMPLETED</span>}
          </button>
        ))}
      </div>
      <button onClick={() => setState(s => ({ ...s, screen: 'intro' }))} className="mt-8 mc-button">BACK</button>
    </div>
  );

  if (state.screen === 'passport') return (
    <div className="min-h-screen p-8 flex flex-col items-center bg-[#555]">
      <div className="mc-panel p-10 w-full max-w-2xl bg-white">
        <h1 className="mc-logo text-black mb-8 text-center">MY PASSPORT</h1>
        <div className="mb-8 flex gap-4 overflow-x-auto pb-4">
          {['none', 'sunglasses', 'safari_hat', 'pilot_headset'].map(acc => (
            <button key={acc} onClick={() => setState(s => ({ ...s, equippedAccessory: acc as any }))} className={`mc-panel p-4 min-w-[80px] flex items-center justify-center ${state.equippedAccessory === acc ? 'bg-green-400' : 'bg-gray-200'}`}>
              {acc === 'none' ? '👤' : acc === 'sunglasses' ? '🕶️' : acc === 'safari_hat' ? '🤠' : '🎧'}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {missions.map(m => (
            <div key={m.id} className={`p-4 border-2 border-dashed border-black ${state.stamps.includes(m.id) ? 'bg-white' : 'bg-gray-300 opacity-30'}`}>
               <span className="text-4xl">{m.icon}</span>
               <p className="text-xs font-bold text-black">{m.title}</p>
            </div>
          ))}
        </div>
        <button onClick={() => setState(s => ({ ...s, screen: 'intro' }))} className="mc-button w-full mt-8">RETURN HOME</button>
      </div>
    </div>
  );

  if (state.screen === 'game_over') return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black/80">
      <div className="mc-panel p-10 text-center max-w-sm w-full bg-white">
        <h2 className="mc-logo text-green-600 mb-6">MISSION WIN!</h2>
        <VoxelFelipe isActive={true} isDancing={true} isNight={state.isNight} size="w-40 h-40" accessory={state.equippedAccessory} />
        <p className="text-black font-bold my-6">YOU ARE AN ENGLISH MASTER!</p>
        <button onClick={() => setState(s => ({ ...s, screen: 'passport' }))} className="mc-button w-full">SEE REWARDS</button>
      </div>
    </div>
  );

  return null;
}
