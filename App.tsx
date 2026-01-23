import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { QUESTIONS, SCRAMBLE_QUESTIONS } from './constants';
import { GameState, GameScreen } from './types';

// --- HELPERS DE AUDIO ---
function decode(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
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

const VacationFelipeLogo = () => (
  <div className="relative w-64 h-64 flex items-center justify-center mb-4">
    <div className="absolute inset-0 animate-sun opacity-60">
      <svg viewBox="0 0 100 100" className="w-full h-full text-sunny-yellow fill-current">
        <circle cx="50" cy="50" r="20" />
        {[...Array(12)].map((_, i) => (
          <rect key={i} x="48" y="10" width="4" height="15" transform={`rotate(${i * 30} 50 50)`} rx="2" />
        ))}
      </svg>
    </div>
    <div className="relative animate-float">
      <svg viewBox="0 0 100 100" className="w-48 h-48 drop-shadow-xl">
        <ellipse cx="50" cy="75" rx="40" ry="15" fill="#f472b6" stroke="#0c4a6e" strokeWidth="3" />
        <ellipse cx="50" cy="75" rx="15" ry="6" fill="#bae6fd" stroke="#0c4a6e" strokeWidth="2" />
        <g transform="translate(10, -5)">
          <rect x="35" y="15" width="40" height="30" fill="#a3e635" stroke="#0c4a6e" strokeWidth="2" />
          <rect x="30" y="25" width="50" height="15" fill="#a3e635" stroke="#0c4a6e" strokeWidth="2" />
          <rect x="40" y="28" width="12" height="8" fill="#000" rx="1" />
          <rect x="58" y="28" width="12" height="8" fill="#000" rx="1" />
          <rect x="52" y="31" width="6" height="2" fill="#000" />
          <rect x="25" y="45" width="35" height="40" fill="#a3e635" stroke="#0c4a6e" strokeWidth="2" />
          <rect x="20" y="45" width="8" height="12" fill="#fb923c" stroke="#0c4a6e" strokeWidth="1" />
          <line x1="24" y1="45" x2="24" y2="38" stroke="#0c4a6e" strokeWidth="1" />
        </g>
      </svg>
    </div>
  </div>
);

const VoxelFelipe = ({ isActive, size = "w-48 h-48", mood = "normal" }: { isActive: boolean, size?: string, mood?: "normal" | "happy" | "thinking" }) => (
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
    scrambleWords: [],
    selectedWords: [],
    stamps: [],
    isGeneratingPostcard: false
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

  const fetchAudioBuffer = async (text: string, id: number): Promise<AudioBuffer | null> => {
    const ctx = await initAudio();
    if (!ctx) return null;
    if (audioCache.current.has(id)) return audioCache.current.get(id)!;
    
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) return null;
      
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } },
        },
      });
      
      const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64) {
        const buffer = await decodeAudioData(decode(base64), ctx, 24000, 1);
        audioCache.current.set(id, buffer);
        return buffer;
      }
    } catch (e) {
      console.error("Audio generation failed:", e);
    }
    return null;
  };

  const generateAIPostcard = async (missionTitle: string) => {
    setState(s => ({ ...s, isGeneratingPostcard: true, lastPostcardUrl: undefined }));
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `A cute voxel-style dinosaur (Felipe) having fun in a ${missionTitle} vacation setting. Bright 3D voxel art, high resolution, colorful, happy vibes, summer style, Nintendo aesthetics.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ parts: [{ text: prompt }] }],
        config: { imageConfig: { aspectRatio: "1:1" } }
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          setState(s => ({ ...s, lastPostcardUrl: imageUrl, isGeneratingPostcard: false }));
          return;
        }
      }
    } catch (e) {
      console.error("Postcard generation failed", e);
      setState(s => ({ ...s, isGeneratingPostcard: false }));
    }
  };

  const playTTS = async (text: string, id: number) => {
    const ctx = await initAudio();
    if (!ctx) return;
    const buffer = await fetchAudioBuffer(text, id);
    if (buffer) {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    }
  };

  const startMissionSync = async (missionId: number) => {
    setState(s => ({ ...s, screen: 'syncing', activeMission: missionId, syncProgress: 0 }));
    const missionQuestions = QUESTIONS.filter(q => q.mission === missionId);
    let loaded = 0;
    for (const q of missionQuestions) {
      await fetchAudioBuffer(q.text, q.id);
      loaded++;
      setState(s => ({ ...s, syncProgress: Math.round((loaded / missionQuestions.length) * 100) }));
    }
    setState(s => ({ ...s, screen: 'playing', currentQuestionIndex: 0, score: 0, userAnswer: '', showExplanation: false }));
  };

  const handleOptionClick = (option: string) => {
    if (state.showExplanation) return;
    const currentMissionQs = QUESTIONS.filter(q => q.mission === state.activeMission);
    const currentQ = currentMissionQs[state.currentQuestionIndex];
    if (!currentQ) return;

    const isCorrect = option === currentQ.correctAnswer;
    if (isCorrect) {
      setState(s => ({ ...s, userAnswer: option, score: s.score + 10, feedbackType: 'success', showExplanation: true }));
    } else {
      setState(s => ({ ...s, userAnswer: option, feedbackType: 'error', attempts: s.attempts + 1 }));
    }
  };

  const missions = [
    { id: 1, title: "Beach Party", icon: "🏖️", desc: "Sun, Sand & Waves" },
    { id: 2, title: "Nature Cam", icon: "🏕️", desc: "Forest & Stars" },
    { id: 3, title: "Fly High", icon: "✈️", desc: "Airport & Travel" },
    { id: 4, title: "Magic Park", icon: "🎡", desc: "Rollercoasters" },
    { id: 5, title: "City Tour", icon: "🍦", desc: "Museums & Fun" }
  ];

  // Pantalla de Pasaporte
  if (state.screen === 'passport') {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center bg-[#fefce8]">
        <div className="voxel-card p-8 w-full max-w-xl border-sky-900 bg-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12">
            <svg viewBox="0 0 100 100" className="w-24 h-24 fill-sky-900"><path d="M20,20 L80,20 L80,80 L20,80 Z" /></svg>
          </div>
          <h2 className="text-4xl font-black text-sky-900 italic mb-2 uppercase">My_Passport</h2>
          <p className="mono text-[10px] text-sky-400 font-bold mb-8 uppercase">TRAVEL_LOG_ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
          
          <div className="grid grid-cols-3 gap-4 mb-12">
            {missions.map(m => (
              <div key={m.id} className={`aspect-square border-4 flex flex-col items-center justify-center p-2 transition-all ${state.stamps.includes(m.id) ? 'border-sky-900 bg-sky-50 rotate-3 scale-105 shadow-md' : 'border-dashed border-gray-300 opacity-40 grayscale'}`}>
                <span className="text-4xl mb-1">{m.icon}</span>
                <span className="text-[8px] font-black uppercase text-center">{m.title}</span>
                {state.stamps.includes(m.id) && (
                  <div className="mt-1 bg-sky-900 text-white text-[6px] px-1 font-bold">STAMPED</div>
                )}
              </div>
            ))}
          </div>

          <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="roblox-btn w-full py-4 text-xl">BACK TO TRAVELS</button>
        </div>
      </div>
    );
  }

  if (state.screen === 'intro') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="voxel-card p-12 max-w-md w-full text-center border-sky-400 border-4 overflow-hidden relative">
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-sunny-yellow rounded-full blur-3xl opacity-20"></div>
          <VacationFelipeLogo />
          <h1 className="text-6xl font-black italic mb-2 text-sky-600 leading-none text-center uppercase tracking-tighter animate-text-wave">
            FELIPE<br/>
            <span className="text-summer-orange">QUEST</span>
          </h1>
          <p className="mono text-[10px] text-sky-800 uppercase tracking-widest mb-12 font-bold">Premium_Vacation_Exp_v6.0</p>
          <div className="flex flex-col gap-4">
            <button onClick={() => { initAudio(); setState(s => ({ ...s, screen: 'mission_select' })); }} className="w-full roblox-btn py-6 text-2xl shadow-[0_6px_0_#ca8a04]">START TRIP</button>
            <button onClick={() => setState(s => ({ ...s, screen: 'passport' }))} className="bg-white border-4 border-sky-900 text-sky-900 font-black py-4 uppercase text-sm hover:bg-sky-50">View_Passport 📖</button>
          </div>
        </div>
      </div>
    );
  }

  if (state.screen === 'mission_select') {
    return (
      <div className="min-h-screen p-6 max-w-4xl mx-auto flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-10">
          <button onClick={() => setState(s => ({ ...s, screen: 'intro' }))} className="text-sky-900 font-black uppercase text-xs">« Menu</button>
          <h2 className="text-3xl font-black text-sky-900 italic uppercase tracking-tighter">Choose_Your_Trip</h2>
          <button onClick={() => setState(s => ({ ...s, screen: 'passport' }))} className="bg-sky-900 text-white px-4 py-2 text-xs font-black uppercase rounded shadow-md">Passport 📖</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-12">
          {missions.map(m => (
            <button key={m.id} onClick={() => startMissionSync(m.id)} className="voxel-card p-6 text-left hover:scale-105 transition-all group hover:border-summer-orange bg-white/80 relative">
              {state.stamps.includes(m.id) && <div className="absolute top-2 right-2 text-xl">✅</div>}
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{m.icon}</div>
              <h3 className="text-xl font-black text-sky-700 group-hover:text-summer-orange uppercase">{m.title}</h3>
              <p className="mono text-[10px] text-sky-400 uppercase tracking-widest font-bold">{m.desc}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (state.screen === 'playing') {
    const currentMissionQs = QUESTIONS.filter(q => q.mission === state.activeMission);
    const currentQ = currentMissionQs[state.currentQuestionIndex];
    if (!currentQ) return null;

    return (
      <div className="min-h-screen flex flex-col items-center p-4">
        <header className="w-full max-w-xl flex justify-between items-center mb-8">
          <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="mono text-[10px] text-sky-900/50 hover:text-sky-900 font-bold">{"[ EXIT_TRIP ]"}</button>
          <div className="voxel-card px-4 py-2 bg-white/60"><span className="text-xl font-black text-sky-900">XP: {state.score}</span></div>
        </header>
        <main className="w-full max-w-xl voxel-card p-8 relative">
          <div className="flex justify-between items-center mb-6">
            <span className="bg-sky-900 text-white px-3 py-1 rounded mono text-[10px] font-black uppercase">Mission_{state.currentQuestionIndex + 1}/{currentMissionQs.length}</span>
            <div className="w-32 h-2 bg-sky-100 border border-sky-900/20">
              <div className="h-full bg-summer-orange transition-all duration-500" style={{ width: `${((state.currentQuestionIndex + 1) / currentMissionQs.length) * 100}%` }}></div>
            </div>
          </div>
          <div className="flex justify-center mb-6">
            <VoxelFelipe isActive={state.showExplanation} mood={state.showExplanation ? "happy" : "normal"} size="w-32 h-32" />
          </div>
          <h3 className="text-2xl font-bold text-sky-900 mb-8 text-center leading-relaxed">
            {currentQ.text.split('________').map((part, i, arr) => (
              <React.Fragment key={i}>
                {part}{i < arr.length - 1 && <span className="text-summer-orange border-b-4 border-summer-orange/40 px-2 mx-1 font-black underline decoration-wavy decoration-summer-orange/30">{state.userAnswer || "____"}</span>}
              </React.Fragment>
            ))}
          </h3>
          <div className="flex justify-center mb-8">
             <button onClick={() => playTTS(currentQ.text, currentQ.id)} className="bg-white border-2 border-sky-900 text-sky-900 px-6 py-2 rounded-full font-black uppercase text-xs hover:bg-sky-900 hover:text-white transition-colors flex items-center gap-2 group">
               <span className="group-hover:animate-pulse">🔊</span> Play_Audio
             </button>
          </div>
          <div className="grid grid-cols-1 gap-3 mb-8">
            {currentQ.options.map((opt, i) => (
              <button key={i} onClick={() => handleOptionClick(opt)} disabled={state.showExplanation} className={`p-4 border-4 font-black text-left transition-all uppercase text-lg ${
                  state.userAnswer === opt 
                    ? (opt === currentQ.correctAnswer ? 'bg-tropical-green border-sky-900 text-sky-900 translate-y-1' : 'bg-red-500 border-sky-900 text-white scale-95') 
                    : 'bg-white border-sky-900 text-sky-900 hover:border-summer-orange hover:translate-x-1 hover:-translate-y-1 hover:shadow-[4px_4px_0_#fb923c]'
                }`}>
                <span className="mono opacity-20 mr-4">0{i+1}</span> {opt}
              </button>
            ))}
          </div>
          {state.showExplanation && (
            <div className="p-6 bg-sunny-yellow border-4 border-sky-900 text-sky-900 animate-in fade-in zoom-in duration-300">
              <h4 className="font-black text-xl italic uppercase mb-2">Excellent!</h4>
              <p className="text-2xl font-black mb-1">{currentQ.translation}</p>
              <p className="mono text-[10px] font-bold opacity-70 mb-6 uppercase">"{currentQ.explanation}"</p>
              <button onClick={() => {
                  if (state.currentQuestionIndex + 1 < currentMissionQs.length) {
                    setState(s => ({ ...s, currentQuestionIndex: s.currentQuestionIndex + 1, userAnswer: '', showExplanation: false }));
                  } else {
                    const currentMission = missions.find(m => m.id === state.activeMission);
                    setState(s => ({ 
                      ...s, 
                      screen: 'game_over', 
                      stamps: Array.from(new Set([...s.stamps, s.activeMission]))
                    }));
                    if (currentMission) generateAIPostcard(currentMission.title);
                  }
                }} className="w-full bg-sky-900 text-white py-4 font-black uppercase text-sm border-2 border-sky-900 active:scale-95 transition-transform">CONTINUE_TRIP &raquo;</button>
            </div>
          )}
        </main>
      </div>
    );
  }

  if (state.screen === 'game_over') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-sky-100">
        <div className="voxel-card p-12 text-center max-w-md w-full border-tropical-green border-4 bg-white relative">
          <h2 className="text-5xl font-black text-tropical-green italic mb-4 uppercase">Trip_Complete!</h2>
          <p className="text-3xl font-bold mb-8 text-sky-900 mono">TOTAL_XP: {state.score}</p>
          
          <div className="mb-8 p-4 bg-gray-50 border-2 border-dashed border-gray-300 min-h-[250px] flex flex-col items-center justify-center">
            {state.isGeneratingPostcard ? (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-sky-900 border-t-transparent animate-spin rounded-full mb-4"></div>
                <p className="mono text-[10px] font-bold text-gray-400">DEVELOPING_A1_MEMORIES...</p>
              </div>
            ) : state.lastPostcardUrl ? (
              <div className="animate-in fade-in zoom-in duration-700">
                <img src={state.lastPostcardUrl} alt="AI Postcard" className="w-full h-auto shadow-lg border-4 border-white mb-2" />
                <p className="text-[8px] mono text-gray-400 uppercase italic">Your_Exclusive_A1_Souvenir_Postcard</p>
              </div>
            ) : (
              <button onClick={() => {
                const currentMission = missions.find(m => m.id === state.activeMission);
                if (currentMission) generateAIPostcard(currentMission.title);
              }} className="text-xs text-sky-600 font-bold underline">Retry_Memories_Fetch</button>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="roblox-btn w-full py-6 text-xl">LOBBY_MENU</button>
            <button onClick={() => setState(s => ({ ...s, screen: 'passport' }))} className="text-sky-900 font-black uppercase text-xs hover:underline italic">Check_My_New_Stamp 📖</button>
          </div>
        </div>
      </div>
    );
  }

  // Pantallas default (syncing, etc)
  if (state.screen === 'syncing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-8 animate-bounce"><VoxelFelipe isActive={true} mood="thinking" size="w-32 h-32" /></div>
          <h2 className="mono text-sky-900 text-xs uppercase tracking-[0.5em] mb-4 text-center font-black">Loading_Trip_Data...</h2>
          <div className="w-full h-4 bg-sky-200 border-2 border-sky-900 rounded-full overflow-hidden mb-4">
             <div className="h-full bg-summer-orange transition-all duration-300 shadow-[0_0_10px_#fb923c]" style={{ width: `${state.syncProgress}%` }}></div>
          </div>
          <p className="text-center font-black text-sky-900 text-3xl italic">{state.syncProgress}%</p>
        </div>
      </div>
    );
  }

  return null;
}
