
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { QUESTIONS } from './constants';
import { GameState, Accessory } from './types';

// --- HELPERS ---
function decode(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const ParticleSystem = ({ type }: { type: string }) => {
  const [particles, setParticles] = useState<any[]>([]);
  
  useEffect(() => {
    const symbols = {
      beach: ["🫧", "🐚", "☀️"],
      nature: ["🍃", "🌲", "🍄"],
      fly: ["☁️", "✨", "✈️"],
      park: ["🎈", "✨", "🍭"],
      city: ["🚗", "🍦", "🏢"]
    }[type] || ["✨"];

    const newParticles = [...Array(15)].map((_, i) => ({
      id: i,
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      left: Math.random() * 100 + "%",
      duration: 3 + Math.random() * 5 + "s",
      delay: Math.random() * 5 + "s",
      size: 10 + Math.random() * 20 + "px"
    }));
    setParticles(newParticles);
  }, [type]);

  return (
    <>
      {particles.map(p => (
        <div key={p.id} className="particle" style={{
          left: p.left,
          animationDuration: p.duration,
          animationDelay: p.delay,
          fontSize: p.size
        }}>{p.symbol}</div>
      ))}
    </>
  );
};

const AccessoryLayer = ({ item }: { item: Accessory }) => {
  if (item === 'none') return null;
  return (
    <g transform="translate(0, -5)">
      {item === 'sunglasses' && (
        <g>
          <rect x="40" y="28" width="12" height="8" fill="#000" rx="1" />
          <rect x="58" y="28" width="12" height="8" fill="#000" rx="1" />
          <rect x="52" y="31" width="6" height="2" fill="#000" />
        </g>
      )}
      {item === 'safari_hat' && (
        <g>
          <rect x="25" y="10" width="60" height="10" fill="#a16207" rx="2" stroke="#0c4a6e" strokeWidth="2" />
          <rect x="35" y="0" width="40" height="12" fill="#a16207" rx="2" stroke="#0c4a6e" strokeWidth="2" />
        </g>
      )}
      {item === 'pilot_headset' && (
        <g>
          <rect x="30" y="20" width="50" height="4" fill="#1e293b" rx="2" />
          <rect x="28" y="25" width="8" height="15" fill="#1e293b" rx="2" />
          <rect x="74" y="25" width="8" height="15" fill="#1e293b" rx="2" />
        </g>
      )}
      {item === 'party_ears' && (
        <g>
          <circle cx="35" cy="15" r="10" fill="#000" stroke="#0c4a6e" strokeWidth="2" />
          <circle cx="75" cy="15" r="10" fill="#000" stroke="#0c4a6e" strokeWidth="2" />
        </g>
      )}
      {item === 'camera' && (
        <g transform="translate(10, 45)">
          <rect x="0" y="0" width="20" height="15" fill="#475569" stroke="#0c4a6e" strokeWidth="2" />
          <circle cx="10" cy="7.5" r="4" fill="#94a3b8" stroke="#0c4a6e" strokeWidth="1" />
          <line x1="10" y1="-45" x2="10" y2="0" stroke="#0c4a6e" strokeWidth="1" strokeDasharray="2" />
        </g>
      )}
    </g>
  );
};

const VoxelFelipe = ({ isActive, size = "w-48 h-48", mood = "normal", accessory = "none" }: { isActive: boolean, size?: string, mood?: "normal" | "happy" | "thinking", accessory?: Accessory }) => (
  <div className={`relative ${size} flex items-center justify-center transition-all duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}>
    <div className="absolute inset-0 felipe-bg blur-[60px] rounded-full"></div>
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(12,74,110,0.3)]">
      <rect x="35" y="15" width="40" height="30" fill={mood === "happy" ? "#84cc16" : "#a3e635"} stroke="#0c4a6e" strokeWidth="2" />
      <rect x="30" y="25" width="50" height="15" fill={mood === "happy" ? "#84cc16" : "#a3e635"} stroke="#0c4a6e" strokeWidth="2" />
      {mood === "happy" ? (
        <g>
          <path d="M40 30 Q45 25 50 30" stroke="#000" fill="none" strokeWidth="2" />
          <path d="M60 30 Q65 25 70 30" stroke="#000" fill="none" strokeWidth="2" />
        </g>
      ) : (
        <rect x="65" y="25" width="8" height="8" fill="#000" />
      )}
      <AccessoryLayer item={accessory} />
      <rect x="25" y="45" width="35" height="40" fill={mood === "happy" ? "#84cc16" : "#a3e635"} stroke="#0c4a6e" strokeWidth="2" />
      <rect x="32" y="10" width="8" height="35" fill="#fb923c" stroke="#0c4a6e" strokeWidth="2" />
      <rect x="32" y="10" width="25" height="6" fill="#fb923c" stroke="#0c4a6e" strokeWidth="2" />
      <rect x="34" y="30" width="4" height="6" fill="#f472b6" className={isActive ? "animate-pulse" : ""} />
    </svg>
  </div>
);

export default function App() {
  const [state, setState] = useState<GameState>({
    screen: 'intro',
    activeMission: 1,
    currentQuestionIndex: 0,
    userAnswer: '',
    attempts: 0,
    score: 0,
    feedbackType: 'none',
    feedbackMessage: '',
    showExplanation: false,
    syncProgress: 0,
    stamps: [],
    postcards: {},
    diaries: {},
    isGeneratingPostcard: false,
    equippedAccessory: 'none',
    unlockedAccessories: ['none']
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioCache = useRef<Map<number, AudioBuffer>>(new Map());

  const initAudio = async () => {
    if (!audioContextRef.current) {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
    }
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  const playSystemSound = async (type: 'success' | 'error') => {
    const ctx = await initAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    if (type === 'success') {
      osc.frequency.setValueAtTime(500, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    } else {
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    }
    osc.start(); osc.stop(ctx.currentTime + 0.3);
  };

  const generateAIPostcard = async (missionId: number, missionTitle: string) => {
    setState(s => ({ ...s, isGeneratingPostcard: true }));
    try {
      // Create a new instance right before making an API call to ensure it always uses the most up-to-date API key
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // 1. Generar Post Card (Imagen) using gemini-2.5-flash-image
      // Fixed contents structure to match recommended format { parts: [...] }
      const imgPromise = ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `A 3D voxel art postcard of a dinosaur named Felipe having fun at a ${missionTitle} vacation. Bright colors, summer vibes, roblox style.` }] },
        config: { imageConfig: { aspectRatio: "1:1" } }
      });

      // 2. Generar Diary Entry (Texto) using gemini-3-flash-preview
      const textPromise = ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a 1-sentence diary entry in English for a child about a trip to ${missionTitle}. Use simple A1 English. Start with "Today I..."`,
        config: { temperature: 0.7 }
      });

      const [imgRes, textRes] = await Promise.all([imgPromise, textPromise]);
      
      let imageUrl = "";
      // Iterating through candidates and parts to find the image data
      const candidate = imgRes.candidates?.[0];
      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      // Using .text property to extract text output from GenerateContentResponse
      const diaryEntry = textRes.text || "Today I had a great time!";
      const accessoryMapping: Record<number, Accessory> = {
        1: 'sunglasses', 2: 'safari_hat', 3: 'pilot_headset', 4: 'party_ears', 5: 'camera'
      };

      setState(s => ({ 
        ...s, 
        postcards: { ...s.postcards, [missionId]: imageUrl },
        diaries: { ...s.diaries, [missionId]: diaryEntry },
        unlockedAccessories: Array.from(new Set([...s.unlockedAccessories, accessoryMapping[missionId]])),
        isGeneratingPostcard: false 
      }));

    } catch (e) {
      console.error("AI Generation failed", e);
      setState(s => ({ ...s, isGeneratingPostcard: false }));
    }
  };

  const missions = [
    { id: 1, title: "Beach Party", icon: "🏖️", type: "beach", color: "bg-sky-400" },
    { id: 2, title: "Nature Cam", icon: "🏕️", type: "nature", color: "bg-green-500" },
    { id: 3, title: "Fly High", icon: "✈️", type: "fly", color: "bg-blue-600" },
    { id: 4, title: "Magic Park", icon: "🎡", type: "park", color: "bg-orange-500" },
    { id: 5, title: "City Tour", icon: "🍦", type: "city", color: "bg-yellow-500" }
  ];

  const getCurrentTheme = () => {
    const m = missions.find(m => m.id === state.activeMission);
    return m ? m.type : "beach";
  };

  if (state.screen === 'intro') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="voxel-card p-12 max-w-md w-full text-center border-sky-400 border-4 relative overflow-hidden">
          <div className="flex justify-center mb-4"><VoxelFelipe isActive={true} accessory={state.equippedAccessory} /></div>
          <h1 className="text-5xl font-black italic mb-2 text-sky-600 uppercase tracking-tighter animate-text-wave">FELIPE QUEST</h1>
          <p className="mono text-[10px] text-sky-800 uppercase tracking-widest mb-12 font-bold">World_Traveler_Edition_v7.0</p>
          <div className="flex flex-col gap-4">
            <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="w-full roblox-btn py-6 text-2xl">BOOK FLIGHT</button>
            <button onClick={() => setState(s => ({ ...s, screen: 'passport' }))} className="bg-white border-4 border-sky-900 text-sky-900 font-black py-4 uppercase text-sm">Passport & Closet 🎒</button>
          </div>
        </div>
      </div>
    );
  }

  if (state.screen === 'passport') {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center bg-[#fefce8] overflow-y-auto">
        <div className="voxel-card p-8 w-full max-w-2xl border-sky-900 bg-white mb-8">
          <h2 className="text-3xl font-black text-sky-900 italic mb-6 uppercase">My_Travel_Hub</h2>
          
          <div className="mb-10">
            <h3 className="mono text-xs font-black text-sky-400 mb-4 uppercase tracking-widest">Felipe's_Wardrobe</h3>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {state.unlockedAccessories.map(acc => (
                <button 
                  key={acc}
                  onClick={() => setState(s => ({ ...s, equippedAccessory: acc }))}
                  className={`flex-shrink-0 w-16 h-16 border-4 flex items-center justify-center text-2xl transition-all ${state.equippedAccessory === acc ? 'border-sky-900 bg-sunny-yellow scale-110 shadow-lg' : 'border-gray-200 opacity-60'}`}>
                  {{ none: "🦖", sunglasses: "🕶️", safari_hat: "🤠", pilot_headset: "🎧", party_ears: "🐭", camera: "📷" }[acc]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {missions.map(m => (
              <div key={m.id} className={`voxel-card p-4 transition-all ${state.stamps.includes(m.id) ? 'border-sky-900' : 'opacity-30'}`}>
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-3xl">{m.icon}</span>
                  <div>
                    <h4 className="font-black text-sky-900 text-sm uppercase">{m.title}</h4>
                    <p className="text-[10px] mono text-sky-400 font-bold">STAMPED: {state.stamps.includes(m.id) ? "YES" : "NO"}</p>
                  </div>
                </div>
                {state.postcards[m.id] && (
                  <div className="mt-2 animate-in fade-in duration-500">
                    <img src={state.postcards[m.id]} className="w-full aspect-square object-cover border-4 border-white shadow-md mb-2" />
                    <p className="text-[10px] italic font-bold text-sky-700 bg-sky-50 p-2 border border-sky-200">"{state.diaries[m.id]}"</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <button onClick={() => setState(s => ({ ...s, screen: 'intro' }))} className="roblox-btn w-full py-4 text-xl">BACK TO HOME</button>
        </div>
      </div>
    );
  }

  if (state.screen === 'playing') {
    const currentMissionQs = QUESTIONS.filter(q => q.mission === state.activeMission);
    const currentQ = currentMissionQs[state.currentQuestionIndex];
    if (!currentQ) return null;

    return (
      <div className="min-h-screen flex flex-col items-center p-4 relative overflow-hidden">
        <ParticleSystem type={getCurrentTheme()} />
        <header className="w-full max-w-xl flex justify-between items-center mb-8 relative z-10">
          <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="mono text-[10px] text-sky-900/50 hover:text-sky-900 font-black tracking-widest">[ ABORT_TRAVEL ]</button>
          <div className="voxel-card px-4 py-2 bg-white/60 font-black text-sky-900">XP: {state.score}</div>
        </header>
        <main className="w-full max-w-xl voxel-card p-8 relative z-10 bg-white/90">
          <div className="flex justify-between items-center mb-6">
            <span className="bg-sky-900 text-white px-3 py-1 mono text-[10px] font-black uppercase tracking-tighter">{missions.find(m => m.id === state.activeMission)?.title}</span>
            <span className="mono text-[10px] font-black">{state.currentQuestionIndex + 1}/{currentMissionQs.length}</span>
          </div>
          <div className="flex justify-center mb-6"><VoxelFelipe isActive={state.showExplanation} mood={state.showExplanation ? "happy" : "normal"} accessory={state.equippedAccessory} /></div>
          <h3 className="text-2xl font-bold text-sky-900 mb-8 text-center leading-relaxed">
             {currentQ.text.split('________').map((part, i, arr) => (
                <React.Fragment key={i}>
                  {part}{i < arr.length - 1 && <span className="text-summer-orange border-b-4 border-summer-orange/40 px-2 font-black">{state.userAnswer || "____"}</span>}
                </React.Fragment>
              ))}
          </h3>
          <div className="grid grid-cols-1 gap-3 mb-8">
            {currentQ.options.map((opt, i) => (
              <button key={i} onClick={() => {
                const isCorrect = opt === currentQ.correctAnswer;
                if (isCorrect) {
                  playSystemSound('success');
                  setState(s => ({ ...s, userAnswer: opt, score: s.score + 10, showExplanation: true }));
                } else {
                  playSystemSound('error');
                  setState(s => ({ ...s, userAnswer: opt, attempts: s.attempts + 1 }));
                }
              }} disabled={state.showExplanation} className={`p-4 border-4 font-black text-left transition-all uppercase text-lg ${
                  state.userAnswer === opt 
                    ? (opt === currentQ.correctAnswer ? 'bg-tropical-green border-sky-900 text-sky-900' : 'bg-red-500 border-sky-900 text-white') 
                    : 'bg-white border-sky-900 text-sky-900 hover:border-summer-orange hover:translate-x-1'
                }`}>
                {opt}
              </button>
            ))}
          </div>
          {state.showExplanation && (
            <div className="p-6 bg-sunny-yellow border-4 border-sky-900 text-sky-900 animate-in zoom-in duration-300">
              <p className="text-2xl font-black mb-1">{currentQ.translation}</p>
              <button onClick={() => {
                  if (state.currentQuestionIndex + 1 < currentMissionQs.length) {
                    setState(s => ({ ...s, currentQuestionIndex: s.currentQuestionIndex + 1, userAnswer: '', showExplanation: false }));
                  } else {
                    const m = missions.find(m => m.id === state.activeMission);
                    setState(s => ({ ...s, screen: 'game_over', stamps: Array.from(new Set([...s.stamps, s.activeMission])) }));
                    if (m) generateAIPostcard(m.id, m.title);
                  }
                }} className="w-full bg-sky-900 text-white py-4 font-black uppercase text-sm border-2 border-sky-900 mt-4">NEXT_STOP &raquo;</button>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Las otras pantallas (mission_select, syncing, game_over) se mantienen con el estilo visual mejorado
  if (state.screen === 'mission_select') {
    return (
      <div className="min-h-screen p-6 max-w-4xl mx-auto flex flex-col items-center">
        <h2 className="text-4xl font-black text-sky-900 italic mb-10 text-center uppercase tracking-tighter">Where_To_Today?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-12">
          {missions.map(m => (
            <button key={m.id} onClick={() => setState(s => ({ ...s, screen: 'playing', activeMission: m.id, currentQuestionIndex: 0, score: 0, userAnswer: '', showExplanation: false }))} className="voxel-card p-6 text-left hover:scale-105 transition-all group hover:border-summer-orange bg-white relative">
              {state.stamps.includes(m.id) && <div className="absolute top-2 right-2 text-xl">✅</div>}
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{m.icon}</div>
              <h3 className="text-xl font-black text-sky-700 group-hover:text-summer-orange uppercase">{m.title}</h3>
              <p className="mono text-[10px] text-sky-400 font-bold uppercase">{m.type}_Adventure</p>
            </button>
          ))}
        </div>
        <button onClick={() => setState(s => ({ ...s, screen: 'intro' }))} className="text-sky-900 font-black uppercase text-xs">« BACK_TO_MENU</button>
      </div>
    );
  }

  if (state.screen === 'game_over') {
    const m = missions.find(m => m.id === state.activeMission);
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-sky-100">
        <div className="voxel-card p-12 text-center max-w-md w-full border-tropical-green border-4 bg-white relative overflow-hidden">
           <h2 className="text-4xl font-black text-tropical-green italic mb-4 uppercase">TRIP_FINISH!</h2>
           <div className="mb-8 min-h-[250px] flex flex-col items-center justify-center">
             {state.isGeneratingPostcard ? (
               <div className="animate-pulse flex flex-col items-center">
                 <div className="w-12 h-12 border-4 border-sky-900 border-t-transparent animate-spin rounded-full mb-4"></div>
                 <p className="mono text-[10px] font-black text-gray-400 uppercase">Saving_Memories...</p>
               </div>
             ) : (
               <div className="animate-in zoom-in duration-500">
                 {state.postcards[state.activeMission] && <img src={state.postcards[state.activeMission]} className="w-full border-4 border-white shadow-xl mb-4" />}
                 <p className="text-xs font-bold text-sky-700 italic">"{state.diaries[state.activeMission]}"</p>
               </div>
             )}
           </div>
           <button onClick={() => setState(s => ({ ...s, screen: 'passport' }))} className="roblox-btn w-full py-6 text-xl mb-4">VIEW PASSPORT</button>
           <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="text-sky-900 font-black uppercase text-xs tracking-widest">CONTINUE_EXPLORING</button>
        </div>
      </div>
    );
  }

  return null;
}
