import React, { useState, useRef } from 'react';
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

const VoxelFelipe = ({ isActive, size = "w-48 h-48" }: { isActive: boolean, size?: string }) => (
  <div className={`relative ${size} flex items-center justify-center transition-all duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}>
    <div className="absolute inset-0 felipe-bg blur-[60px] rounded-full"></div>
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(12,74,110,0.3)]">
      <rect x="35" y="15" width="40" height="30" fill="#a3e635" stroke="#0c4a6e" strokeWidth="2" />
      <rect x="30" y="25" width="50" height="15" fill="#a3e635" stroke="#0c4a6e" strokeWidth="2" />
      <rect x="65" y="25" width="8" height="8" fill="#000" />
      <rect x="25" y="45" width="35" height="40" fill="#a3e635" stroke="#0c4a6e" strokeWidth="2" />
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

  const setupScrambleQuestion = (index: number) => {
    const q = SCRAMBLE_QUESTIONS[index];
    if (!q) return;
    const words = q.sentence.split(' ');
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setState(s => ({ 
      ...s, 
      currentQuestionIndex: index,
      scrambleWords: shuffled, 
      selectedWords: [], 
      showExplanation: false 
    }));
  };

  const startScrambleMode = () => {
    setState(s => ({ ...s, screen: 'scramble', score: 0 }));
    setupScrambleQuestion(0);
  };

  const handleWordClick = (word: string, index: number) => {
    const newSelected = [...state.selectedWords, word];
    const newScramble = state.scrambleWords.filter((_, i) => i !== index);
    const currentQ = SCRAMBLE_QUESTIONS[state.currentQuestionIndex];
    if (!currentQ) return;

    setState(s => ({ ...s, selectedWords: newSelected, scrambleWords: newScramble }));

    if (newSelected.join(' ') === currentQ.sentence) {
      setState(s => ({ ...s, score: s.score + 20, showExplanation: true }));
      playTTS(currentQ.sentence, currentQ.id);
    } else if (newScramble.length === 0 && newSelected.join(' ') !== currentQ.sentence) {
      setTimeout(() => setupScrambleQuestion(state.currentQuestionIndex), 1000);
    }
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

  if (state.screen === 'intro') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="voxel-card p-12 max-w-md w-full text-center border-sky-400 border-4">
          <VoxelFelipe isActive={false} />
          <h1 className="text-5xl font-black italic mb-2 text-sky-600 leading-none mt-8 text-center uppercase">SUMMER<br/><span className="text-summer-orange">QUEST</span></h1>
          <p className="mono text-[10px] text-sky-800 uppercase tracking-widest mb-12 font-bold">A1_Vacation_Exp_v4.0</p>
          <button onClick={() => { initAudio(); setState(s => ({ ...s, screen: 'mission_select' })); }} className="w-full roblox-btn py-6 text-2xl shadow-[0_6px_0_#ca8a04]">START VACATION</button>
        </div>
      </div>
    );
  }

  if (state.screen === 'mission_select') {
    return (
      <div className="min-h-screen p-6 max-w-4xl mx-auto flex flex-col items-center">
        <h2 className="text-4xl font-black text-sky-900 italic mb-10 text-center uppercase tracking-tighter">Choose_Your_Trip</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-12">
          {missions.map(m => (
            <button key={m.id} onClick={() => startMissionSync(m.id)} className="voxel-card p-6 text-left hover:scale-105 transition-all group hover:border-summer-orange bg-white/80">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{m.icon}</div>
              <h3 className="text-xl font-black text-sky-700 group-hover:text-summer-orange uppercase">{m.title}</h3>
              <p className="mono text-[10px] text-sky-400 uppercase tracking-widest font-bold">{m.desc}</p>
            </button>
          ))}
        </div>
        <div className="w-full max-w-md">
           <button onClick={startScrambleMode} className="w-full bg-summer-orange border-4 border-sky-900 p-6 rounded-none flex items-center justify-between hover:bg-orange-400 transition-colors shadow-[8px_8px_0_#0c4a6e]">
             <div className="text-left">
               <span className="mono text-[8px] text-white bg-sky-900 px-2 py-0.5 uppercase font-bold">Fun_Challenge</span>
               <h3 className="text-2xl font-black text-white uppercase italic">Summer_Builder</h3>
               <p className="text-[10px] text-orange-900 font-bold uppercase mono">Order the travel blocks</p>
             </div>
             <span className="text-4xl">🧩</span>
           </button>
        </div>
      </div>
    );
  }

  if (state.screen === 'syncing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-8 animate-bounce"><VoxelFelipe isActive={true} size="w-32 h-32" /></div>
          <h2 className="mono text-sky-900 text-xs uppercase tracking-[0.5em] mb-4 text-center font-black">Loading_Trip_Data...</h2>
          <div className="w-full h-4 bg-sky-200 border-2 border-sky-900 rounded-full overflow-hidden mb-4">
             <div className="h-full bg-summer-orange transition-all duration-300 shadow-[0_0_10px_#fb923c]" style={{ width: `${state.syncProgress}%` }}></div>
          </div>
          <p className="text-center font-black text-sky-900 text-3xl italic">{state.syncProgress}%</p>
        </div>
      </div>
    );
  }

  if (state.screen === 'scramble') {
    const currentQ = SCRAMBLE_QUESTIONS[state.currentQuestionIndex];
    if (!currentQ) return null;
    return (
      <div className="min-h-screen flex flex-col items-center p-4">
        <header className="w-full max-w-xl flex justify-between items-center mb-8">
          <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="mono text-[10px] text-sky-900/50 hover:text-sky-900 font-bold">{"[ CANCEL_TRIP ]"}</button>
          <div className="voxel-card px-4 py-2 bg-white/60 border-summer-orange"><span className="text-xl font-black text-summer-orange">XP: {state.score}</span></div>
        </header>
        <main className="w-full max-w-xl voxel-card p-8 border-summer-orange shadow-[8px_8px_0_rgba(251,146,60,0.2)]">
          <div className="text-center mb-6">
            <h2 className="text-xs mono text-summer-orange uppercase tracking-widest mb-2 font-black">Building_Sentence_{state.currentQuestionIndex + 1}/10</h2>
            <div className="flex justify-center mb-4"><VoxelFelipe isActive={state.showExplanation} size="w-24 h-24" /></div>
          </div>
          <div className="min-h-[140px] bg-sky-50 border-2 border-dashed border-summer-orange/30 p-4 mb-8 flex flex-wrap gap-2 items-center justify-center content-center rounded">
            {state.selectedWords.map((word, i) => (
              <span key={i} className="bg-summer-orange text-white font-black px-4 py-2 border-2 border-sky-900 uppercase text-sm animate-in zoom-in shadow-[2px_2px_0_#0c4a6e]">{word}</span>
            ))}
            {state.selectedWords.length === 0 && <span className="mono text-[10px] text-sky-900/30 uppercase italic font-bold">Pick blocks to build...</span>}
          </div>
          <div className="flex flex-wrap gap-3 justify-center mb-12">
            {state.scrambleWords.map((word, i) => (
              <button key={i} onClick={() => handleWordClick(word, i)} className="bg-white text-sky-900 font-black px-5 py-3 border-4 border-sky-900 shadow-[4px_4px_0_#0c4a6e] active:translate-x-1 active:translate-y-1 transition-all uppercase hover:bg-sunny-yellow text-sm md:text-base">
                {word}
              </button>
            ))}
          </div>
          {state.showExplanation && (
            <div className="p-6 bg-tropical-green border-4 border-sky-900 text-sky-900 animate-in slide-in-from-bottom duration-500">
              <h4 className="font-black text-xl italic uppercase mb-2">Build_Success!</h4>
              <p className="text-2xl font-black mb-1 leading-tight">{currentQ.translation}</p>
              <button onClick={() => {
                  if (state.currentQuestionIndex + 1 < SCRAMBLE_QUESTIONS.length) {
                    setupScrambleQuestion(state.currentQuestionIndex + 1);
                  } else {
                    setState(s => ({ ...s, screen: 'game_over' }));
                  }
                }} className="w-full mt-6 bg-sky-900 text-white py-4 font-black uppercase text-sm border-2 border-sky-900">NEXT_LEVEL &raquo;</button>
            </div>
          )}
          {!state.showExplanation && state.selectedWords.length > 0 && (
            <button onClick={() => setupScrambleQuestion(state.currentQuestionIndex)} className="w-full py-2 mono text-[10px] text-sky-900/50 uppercase hover:text-sky-900 font-bold">[ RESET_BLOCKS ]</button>
          )}
        </main>
      </div>
    );
  }

  if (state.screen === 'game_over') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="voxel-card p-12 text-center max-w-md w-full border-tropical-green border-4 bg-white">
          <h2 className="text-5xl font-black text-tropical-green italic mb-4 uppercase">Trip_Complete!</h2>
          <p className="text-3xl font-bold mb-8 text-sky-900 mono">XP_EARNED: {state.score}</p>
          <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="roblox-btn w-full py-6 text-xl">LOBBY_MENU</button>
        </div>
      </div>
    );
  }

  const currentMissionQs = QUESTIONS.filter(q => q.mission === state.activeMission);
  const currentQ = currentMissionQs[state.currentQuestionIndex];
  if (!currentQ) return null;

  return (
    <div className="min-h-screen flex flex-col items-center p-4">
      <header className="w-full max-w-xl flex justify-between items-center mb-8">
        <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="mono text-[10px] text-sky-900/50 hover:text-sky-900 font-bold">{"[ EXIT_TRIP ]"}</button>
        <div className="voxel-card px-4 py-2 bg-white/60"><span className="text-xl font-black text-sky-900">SCORE: {state.score}</span></div>
      </header>
      <main className="w-full max-w-xl voxel-card p-8 relative">
        <div className="flex justify-between items-center mb-6">
          <span className="bg-sky-900 text-white px-3 py-1 rounded mono text-[10px] font-black uppercase">Mission_{state.currentQuestionIndex + 1}</span>
          <div className="w-32 h-2 bg-sky-100 border border-sky-900/20">
            <div className="h-full bg-summer-orange" style={{ width: `${((state.currentQuestionIndex + 1) / currentMissionQs.length) * 100}%` }}></div>
          </div>
        </div>
        <div className="flex justify-center mb-6"><VoxelFelipe isActive={state.showExplanation} size="w-32 h-32" /></div>
        <h3 className="text-2xl font-bold text-sky-900 mb-8 text-center leading-relaxed">
          {currentQ.text.split('________').map((part, i, arr) => (
            <React.Fragment key={i}>
              {part}{i < arr.length - 1 && <span className="text-summer-orange border-b-4 border-summer-orange/40 px-2 mx-1 font-black">{state.userAnswer || "____"}</span>}
            </React.Fragment>
          ))}
        </h3>
        <div className="flex justify-center mb-8">
           <button onClick={() => playTTS(currentQ.text, currentQ.id)} className="bg-white border-2 border-sky-900 text-sky-900 px-6 py-2 rounded-full font-black uppercase text-xs hover:bg-sky-900 hover:text-white transition-colors flex items-center gap-2">🔊 Play_Audio</button>
        </div>
        <div className="grid grid-cols-1 gap-3 mb-8">
          {currentQ.options.map((opt, i) => (
            <button key={i} onClick={() => handleOptionClick(opt)} disabled={state.showExplanation} className={`p-4 border-4 font-black text-left transition-all uppercase text-lg ${
                state.userAnswer === opt 
                  ? (opt === currentQ.correctAnswer ? 'bg-tropical-green border-sky-900 text-sky-900' : 'bg-red-500 border-sky-900 text-white scale-95') 
                  : 'bg-white border-sky-900 text-sky-900 hover:border-summer-orange hover:translate-x-1'
              }`}>
              <span className="mono opacity-20 mr-4">0{i+1}</span> {opt}
            </button>
          ))}
        </div>
        {state.showExplanation && (
          <div className="p-6 bg-sunny-yellow border-4 border-sky-900 text-sky-900 animate-in fade-in zoom-in duration-300">
            <h4 className="font-black text-xl italic uppercase mb-2">Correct!</h4>
            <p className="text-2xl font-black mb-1">{currentQ.translation}</p>
            <p className="mono text-[10px] font-bold opacity-70 mb-6 uppercase">"{currentQ.explanation}"</p>
            <button onClick={() => {
                if (state.currentQuestionIndex + 1 < currentMissionQs.length) {
                  setState(s => ({ ...s, currentQuestionIndex: s.currentQuestionIndex + 1, userAnswer: '', showExplanation: false }));
                } else {
                  setState(s => ({ ...s, screen: 'game_over' }));
                }
              }} className="w-full bg-sky-900 text-white py-4 font-black uppercase text-sm border-2 border-sky-900 active:scale-95 transition-transform">CONTINUE_TRIP &raquo;</button>
          </div>
        )}
      </main>
      <footer className="mt-8 mono text-[8px] text-sky-900/20 uppercase tracking-[0.5em] font-black">Summer_Edition_Roblox_v4</footer>
    </div>
  );
}
