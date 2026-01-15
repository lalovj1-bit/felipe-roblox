import React, { useState, useRef, useMemo, useEffect } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { QUESTIONS } from './constants';
import { GameState, Question, GameScreen } from './types';

// --- HELPERS DE AUDIO ---
const decodeBase64 = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
};

const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.length / 2);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};

const VoxelFelipe = ({ isActive, size = "w-48 h-48" }: { isActive: boolean, size?: string }) => (
  <div className={`relative ${size} flex items-center justify-center transition-all duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}>
    <div className="absolute inset-0 bg-cyan-400/10 blur-[60px] rounded-full"></div>
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]">
      <rect x="35" y="15" width="40" height="30" fill="#a3e635" stroke="#000" strokeWidth="2" />
      <rect x="30" y="25" width="50" height="15" fill="#a3e635" stroke="#000" strokeWidth="2" />
      <rect x="65" y="25" width="8" height="8" fill="#000" />
      <rect x="25" y="45" width="35" height="40" fill="#a3e635" stroke="#000" strokeWidth="2" />
      <rect x="32" y="10" width="8" height="35" fill="#22d3ee" stroke="#000" strokeWidth="2" />
      <rect x="32" y="10" width="25" height="6" fill="#22d3ee" stroke="#000" strokeWidth="2" />
      <rect x="34" y="30" width="4" height="6" fill="#f472b6" className={isActive ? "animate-pulse" : ""} />
    </svg>
  </div>
);

const App: React.FC = () => {
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
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioCache = useRef<Map<number, AudioBuffer>>(new Map());

  const initAudio = async () => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
    }
    if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
    return audioContextRef.current;
  };

  // Función para obtener audio (de caché, de URL o de Gemini)
  const fetchAudioBuffer = async (question: Question): Promise<AudioBuffer | null> => {
    const ctx = await initAudio();
    
    // 1. Check Cache
    if (audioCache.current.has(question.id)) return audioCache.current.get(question.id)!;

    try {
      // 2. Check for Pre-set URL (Audios subidos con anticipación)
      if (question.audioUrl) {
        const response = await fetch(question.audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = await ctx.decodeAudioData(arrayBuffer);
        audioCache.current.set(question.id, buffer);
        return buffer;
      }

      // 3. Fallback to Gemini TTS
      const apiKey = (process.env as any).API_KEY || '';
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: question.text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } },
        },
      });
      const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64) {
        const buffer = await decodeAudioData(decodeBase64(base64), ctx, 24000, 1);
        audioCache.current.set(question.id, buffer);
        return buffer;
      }
    } catch (e) { console.error(`Error loading audio for Q${question.id}:`, e); }
    return null;
  };

  const playCachedAudio = async (questionId: number) => {
    const ctx = await initAudio();
    const buffer = audioCache.current.get(questionId);
    if (buffer) {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    } else {
      // Si no está en caché por alguna razón, intentamos cargarlo al vuelo
      const q = QUESTIONS.find(q => q.id === questionId);
      if (q) {
        const freshBuffer = await fetchAudioBuffer(q);
        if (freshBuffer) {
           const source = ctx.createBufferSource();
           source.buffer = freshBuffer;
           source.connect(ctx.destination);
           source.start(0);
        }
      }
    }
  };

  const startMissionSync = async (missionId: number) => {
    setState(s => ({ ...s, screen: 'syncing', activeMission: missionId, syncProgress: 0 }));
    const missionQuestions = QUESTIONS.filter(q => q.mission === missionId);
    
    let loaded = 0;
    for (const q of missionQuestions) {
      await fetchAudioBuffer(q);
      loaded++;
      setState(s => ({ ...s, syncProgress: Math.round((loaded / missionQuestions.length) * 100) }));
      // Pequeño delay para no saturar la API si se usa Gemini
      if (!q.audioUrl) await new Promise(r => setTimeout(r, 300));
    }

    setState(s => ({ ...s, screen: 'playing', currentQuestionIndex: 0, score: 0, userAnswer: '', showExplanation: false }));
  };

  const missions = [
    { id: 1, title: "Digital Life", icon: "🌐", desc: "Gaming & Internet" },
    { id: 2, title: "Gadgets", icon: "📱", desc: "Tech & Phones" },
    { id: 3, title: "Urban Style", icon: "🛹", desc: "Clothing & City" },
    { id: 4, title: "Space", icon: "🚀", desc: "Aliens & Rockets" },
    { id: 5, title: "School", icon: "🎒", desc: "Books & Homework" }
  ];

  const currentQuestions = useMemo(() => 
    QUESTIONS.filter((q: Question) => q.mission === state.activeMission), 
    [state.activeMission]
  );
  
  const currentQuestion = currentQuestions[state.currentQuestionIndex] || currentQuestions[0];

  const handleOptionClick = (option: string) => {
    if (state.showExplanation) return;
    const isCorrect = option === currentQuestion.correctAnswer;
    if (isCorrect) {
      setState(s => ({ ...s, userAnswer: option, score: s.score + 10, feedbackType: 'success', showExplanation: true }));
      // TTS rápido para el feedback (al vuelo)
      const feedback = new SpeechSynthesisUtterance(`Correct! ${option}`);
      feedback.lang = 'en-US';
      window.speechSynthesis.speak(feedback);
    } else {
      setState(s => ({ ...s, userAnswer: option, feedbackType: 'error', attempts: s.attempts + 1 }));
    }
  };

  // --- RENDERING ---

  if (state.screen === 'intro') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="voxel-card p-12 max-w-md w-full text-center border-cyan-400/40 border-2">
          <VoxelFelipe isActive={false} />
          <h1 className="text-6xl font-black italic mb-4 neon-text text-white leading-none mt-8 text-center">FELIPE<br/><span className="text-lime-400">QUEST</span></h1>
          <p className="mono text-[10px] text-cyan-400/60 uppercase tracking-widest mb-12">System_v2.8_Instant_Audio</p>
          <button onClick={() => { initAudio(); setState(s => ({ ...s, screen: 'mission_select' })); }} className="w-full roblox-btn py-6 text-2xl">INITIALIZE</button>
        </div>
      </div>
    );
  }

  if (state.screen === 'mission_select') {
    return (
      <div className="min-h-screen p-6 max-w-4xl mx-auto flex flex-col items-center">
        <h2 className="text-4xl font-black text-white italic mb-10 text-center neon-text uppercase tracking-tighter">Choose_Your_Story</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {missions.map(m => (
            <button key={m.id} onClick={() => startMissionSync(m.id)} className="voxel-card p-6 text-left hover:scale-105 transition-all border-cyan-400/20 group hover:border-cyan-400">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{m.icon}</div>
              <h3 className="text-xl font-black text-cyan-400 group-hover:text-white uppercase">{m.title}</h3>
              <p className="mono text-[10px] text-slate-500 uppercase tracking-widest">{m.desc}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (state.screen === 'syncing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-black">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-8 animate-pulse"><VoxelFelipe isActive={true} size="w-32 h-32" /></div>
          <h2 className="mono text-cyan-400 text-xs uppercase tracking-[0.5em] mb-4 text-center">Syncing_Voice_Data</h2>
          <div className="w-full h-4 bg-slate-900 border-2 border-cyan-400/20 rounded-full overflow-hidden mb-4">
             <div className="h-full bg-cyan-400 transition-all duration-300 shadow-[0_0_10px_#22d3ee]" style={{ width: `${state.syncProgress}%` }}></div>
          </div>
          <p className="text-center font-black text-white text-3xl italic">{state.syncProgress}%</p>
        </div>
      </div>
    );
  }

  if (state.screen === 'game_over') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="voxel-card p-12 text-center max-w-md w-full border-lime-400/40 border-2">
          <h2 className="text-5xl font-black text-lime-400 italic mb-4 uppercase">Mission_Success</h2>
          <p className="text-3xl font-bold mb-8 text-white mono">XP_REWARD: {state.score}</p>
          <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="roblox-btn w-full py-6 text-xl">GO_TO_LOBBY</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4">
      <header className="w-full max-w-xl flex justify-between items-center mb-8">
        <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="mono text-[10px] text-cyan-400/50 hover:text-cyan-400">{"[ EXIT_TERMINAL ]"}</button>
        <div className="voxel-card px-4 py-2 bg-black/60"><span className="text-xl font-black text-white">SCORE: {state.score}</span></div>
      </header>

      <main className="w-full max-w-xl voxel-card p-8 relative">
        <div className="flex justify-between items-center mb-6">
          <span className="bg-black border border-cyan-400/50 text-cyan-400 px-3 py-1 rounded mono text-[10px]">OBJECTIVE_{state.currentQuestionIndex + 1}</span>
          <div className="w-32 h-2 bg-slate-900 border border-white/10"><div className="h-full bg-cyan-400" style={{ width: `${((state.currentQuestionIndex + 1) / currentQuestions.length) * 100}%` }}></div></div>
        </div>

        <div className="flex justify-center mb-6"><VoxelFelipe isActive={state.showExplanation} size="w-32 h-32" /></div>

        <h3 className="text-2xl font-bold text-white mb-8 text-center leading-relaxed">
          {currentQuestion.text.split('________').map((part, i, arr) => (
            <React.Fragment key={i}>
              {part}{i < arr.length - 1 && <span className="text-pink-500 border-b-4 border-pink-500/40 px-2 mx-1">{state.userAnswer || "____"}</span>}
            </React.Fragment>
          ))}
        </h3>

        <div className="flex justify-center mb-8">
           <button 
             onClick={() => playCachedAudio(currentQuestion.id)}
             className="bg-black border-2 border-cyan-400 text-cyan-400 px-6 py-2 rounded-full font-black uppercase text-xs hover:bg-cyan-400 hover:text-black transition-colors flex items-center gap-2"
           >
             🔊 Listen_Task
           </button>
        </div>

        <div className="grid grid-cols-1 gap-3 mb-8">
          {currentQuestion.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleOptionClick(opt)}
              disabled={state.showExplanation}
              className={`p-4 border-4 font-black text-left transition-all uppercase tracking-tight text-lg ${
                state.userAnswer === opt 
                  ? (opt === currentQuestion.correctAnswer ? 'bg-lime-400 border-black text-black' : 'bg-red-500 border-black text-white scale-95') 
                  : 'bg-slate-900 border-black text-white hover:border-cyan-400 hover:translate-x-1'
              }`}
            >
              <span className="mono opacity-20 mr-4">CMD_0{i+1}</span> {opt}
            </button>
          ))}
        </div>

        {state.showExplanation && (
          <div className="p-6 bg-lime-400 border-4 border-black text-black animate-in fade-in zoom-in duration-300">
            <h4 className="font-black text-xl italic uppercase mb-2">Code_Verified!</h4>
            <p className="text-2xl font-black mb-1">{currentQuestion.translation}</p>
            <p className="mono text-[10px] font-bold opacity-70 mb-6 uppercase leading-tight">"{currentQuestion.explanation}"</p>
            <button 
              onClick={() => {
                if (state.currentQuestionIndex + 1 < currentQuestions.length) {
                  setState(s => ({ ...s, currentQuestionIndex: s.currentQuestionIndex + 1, userAnswer: '', showExplanation: false }));
                } else {
                  setState(s => ({ ...s, screen: 'game_over' }));
                }
              }}
              className="w-full bg-black text-white py-4 font-black uppercase text-sm border-2 border-black active:scale-95 transition-transform"
            >
              NEXT_DATA_PACK {" >>"}
            </button>
          </div>
        )}
      </main>
      <footer className="mt-8 mono text-[8px] text-white/20 uppercase tracking-[0.5em]">Roblox_Engine_A1_FelipeQuest</footer>
    </div>
  );
};

export default App;
