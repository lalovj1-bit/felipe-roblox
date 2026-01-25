

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { QUESTIONS, SCRAMBLE_QUESTIONS } from './constants';
import { GameState, Accessory, ChatMessage } from './types';

// --- CONSTANTS ---
const missions = [
  { id: 1, title: 'Dino Land', icon: '🦖', reward: 'Junior Hero', medal: '🥉' },
  { id: 2, title: 'Cyber City', icon: '🤖', reward: 'Super Hero', medal: '🥈' },
  { id: 3, title: 'Sweet Kingdom', icon: '🍭', reward: 'Mega Hero', medal: '🥇' },
  { id: 4, title: 'Pirate Cove', icon: '🏴‍☠️', reward: 'Ultra Hero', medal: '💎' },
  { id: 5, title: 'Star Galaxy', icon: '🌌', reward: 'Legendary Duo', medal: '🏆' },
];

// --- UTILS ---
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// --- AUDIO ENGINE (SUPER FAST MODE) ---
const play8BitNote = (ctx: AudioContext, freq: number, duration: number, type: OscillatorType = 'square', volume = 0.1) => {
  if (freq === 0) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
};

const playCorrectSound = (ctx: AudioContext) => {
  const notes = [523, 659, 783, 1046, 1318, 1568]; // Más rápido y agudo
  notes.forEach((f, i) => {
    setTimeout(() => play8BitNote(ctx, f, 0.2, 'square', 0.1), i * 50);
  });
};

const playTetrisTheme = (ctx: AudioContext) => {
  const melody = [
    659, 494, 523, 587, 523, 494, 440, 440, 523, 659, 587, 523, 494, 523, 587, 659, 523, 440, 440,
    0, 587, 698, 880, 783, 698, 659, 523, 659, 587, 523, 494, 494, 523, 587, 659, 523, 440, 440
  ];
  let time = 0;
  melody.forEach((f) => {
    setTimeout(() => play8BitNote(ctx, f, 0.15, 'square', 0.08), time);
    time += 130; // VELOCIDAD EXTREMA: 130ms (Antes 180ms)
  });
};

const playErrorSound = (ctx: AudioContext) => {
  play8BitNote(ctx, 80, 0.3, 'sawtooth', 0.15);
};

const playIntroTheme = (ctx: AudioContext) => {
  const intro = [330, 330, 0, 330, 0, 262, 330, 0, 392, 0, 196];
  intro.forEach((f, i) => {
    setTimeout(() => play8BitNote(ctx, f, 0.1, 'square', 0.08), i * 90);
  });
};

// --- COMPONENTS ---
const ParticleEffect = () => {
  const particles = Array.from({ length: 30 }).map((_, i) => {
    const angle = (i / 30) * Math.PI * 2;
    const x = Math.cos(angle) * 250;
    const y = Math.sin(angle) * 250;
    return <div key={i} className="xp-orb" style={{ '--tw-translate-x': `${x}px`, '--tw-translate-y': `${y}px` } as any} />;
  });
  return <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">{particles}</div>;
};

const VoxelFelipe = ({ isActive, isDancing, isNight, size = "w-32 h-32", mood = "normal" }: { isActive: boolean, isDancing?: boolean, isNight: boolean, size?: string, mood?: string }) => (
  <div className={`relative ${size} flex items-center justify-center transition-all duration-500 ${isActive ? 'scale-110' : 'scale-100'} ${isDancing ? 'mc-dance animate-bounce' : ''}`}>
    <svg viewBox="0 0 100 100" className={`w-full h-full drop-shadow-2xl ${isNight ? 'brightness-75' : ''}`}>
      <rect x="30" y="45" width="45" height="40" fill={isNight ? "#64748b" : "#55aa55"} stroke="#000" strokeWidth="2" />
      <rect x="35" y="15" width="35" height="35" fill={isNight ? "#94a3b8" : "#88cc88"} stroke="#000" strokeWidth="2" />
      <rect x="42" y="30" width="6" height="8" fill={mood === 'sad' ? "#334155" : "#000"} />
      <rect x="58" y="30" width="6" height="8" fill={mood === 'sad' ? "#334155" : "#000"} />
      <rect x="38" y="42" width="6" height="4" fill="#ff5555" opacity="0.6" />
      <rect x="62" y="42" width="6" height="4" fill="#ff5555" opacity="0.6" />
      <rect x="40" y="60" width="25" height="5" fill="#000" opacity={mood === 'sad' ? 0.3 : 0.1} />
    </svg>
    {isDancing && <ParticleEffect />}
  </div>
);

export default function App() {
  const [state, setState] = useState<GameState>({
    screen: 'intro', activeMission: 1, currentQuestionIndex: 0, userAnswer: '', attempts: 0, score: 0, hunger: 80, 
    isNight: new Date().getHours() > 19 || new Date().getHours() < 7,
    feedbackType: 'none', showExplanation: false, stamps: [], postcards: {}, diaries: {}, isGeneratingPostcard: false,
    equippedAccessory: 'none', unlockedAccessories: ['none'], scrambleWords: [], selectedWords: [], chatHistory: [], dailyChallenge: 'Ready for the Big Adventure!'
  });

  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const tetrisLoopRef = useRef<any>(null);

  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      if (state.screen === 'intro') playIntroTheme(audioContextRef.current);
    }
    if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();
  };

  const playTTS = async (text: string) => {
    try {
      initAudio();
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
        const binaryString = window.atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        const dataInt16 = new Int16Array(bytes.buffer);
        const buffer = audioContextRef.current.createBuffer(1, dataInt16.length, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer; 
        source.connect(audioContextRef.current.destination);
        source.start();
      }
    } catch { }
  };

  const checkAnswer = (opt: string, currentQ: any) => {
    initAudio();
    if (opt === currentQ.correctAnswer) {
      if (audioContextRef.current) playCorrectSound(audioContextRef.current);
      setState(s => ({ ...s, score: s.score + 10, attempts: 0, showExplanation: true, userAnswer: opt }));
      playTTS(`Great job! ${opt} is correct!`);
    } else {
      if (audioContextRef.current) playErrorSound(audioContextRef.current);
      setState(s => ({ ...s, attempts: s.attempts + 1 }));
      playTTS("Oops! Try again!");
    }
  };

  useEffect(() => {
    if (state.screen === 'playing') {
      const missionQs = QUESTIONS.filter(q => q.mission === state.activeMission);
      if (missionQs[state.currentQuestionIndex]) {
        setShuffledOptions(shuffleArray(missionQs[state.currentQuestionIndex].options));
      }
    }
  }, [state.screen, state.currentQuestionIndex, state.activeMission]);

  useEffect(() => {
    if (state.screen === 'game_over') {
      const loop = () => { if (audioContextRef.current) playTetrisTheme(audioContextRef.current); };
      loop();
      tetrisLoopRef.current = setInterval(loop, 4800); // Bucle rápido de Tetris
    } else {
      if (tetrisLoopRef.current) clearInterval(tetrisLoopRef.current);
    }
    return () => clearInterval(tetrisLoopRef.current);
  }, [state.screen]);

  if (state.screen === 'intro') return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-blue-600" onClick={initAudio}>
      <div className="mc-panel p-12 max-w-xl w-full text-center shadow-[20px_20px_0px_rgba(0,0,0,0.5)] bg-white border-8 border-black">
        <h1 className="mc-logo mb-2 text-4xl text-black">SUPER FELIPE Y GUILLE</h1>
        <h2 className="mc-logo mb-10 text-xl text-orange-600 animate-pulse">La Gran Aventura</h2>
        <VoxelFelipe isActive={true} isDancing={true} isNight={state.isNight} size="w-64 h-64 mx-auto mb-12" />
        <div className="space-y-6">
          <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="mc-button w-full text-2xl py-8 bg-green-500 text-white hover:bg-green-400">PRESS START</button>
          <button onClick={() => setState(s => ({ ...s, screen: 'passport' }))} className="mc-button w-full text-xl py-6 bg-yellow-400 text-black">VIEW PASSPORT</button>
        </div>
      </div>
    </div>
  );

  if (state.screen === 'passport') return (
    <div className="min-h-screen p-10 flex flex-col items-center bg-orange-100">
      <h2 className="mc-logo mb-12 text-black text-4xl">WORLD PASSPORT</h2>
      <div className="mc-panel w-full max-w-4xl p-12 bg-white shadow-[25px_25px_0px_#8b4513] border-8 border-black">
        <div className="flex items-center gap-10 mb-12 border-b-8 border-double border-black pb-10">
          <VoxelFelipe isActive={false} isNight={state.isNight} size="w-48 h-48" />
          <div className="flex-1">
            <p className="text-4xl font-black uppercase text-gray-400 mb-2">HERO ID</p>
            <p className="text-6xl font-black text-black font-mono tracking-tighter">FELIPE_&_GUILLE</p>
            <p className="text-3xl mt-6 font-bold text-red-600 px-4 py-2 bg-red-50 border-4 border-red-600 inline-block">TOTAL XP: {state.score}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {missions.map(m => {
            const isDone = state.stamps.includes(m.id);
            return (
              <div key={m.id} className={`p-8 border-8 border-black flex flex-col items-center gap-6 transform ${isDone ? 'rotate-2 bg-yellow-50' : 'bg-gray-200 grayscale opacity-40'}`}>
                <span className="text-7xl">{m.icon}</span>
                <div className="text-center">
                   <p className="font-black text-2xl text-black uppercase">{m.title}</p>
                   {isDone && <p className="text-lg font-black text-green-700 mt-2 px-2 bg-green-200">DONE ✅</p>}
                </div>
              </div>
            );
          })}
        </div>
        <button onClick={() => setState(s => ({ ...s, screen: 'intro' }))} className="mt-16 mc-button w-full bg-blue-700 text-white text-3xl py-8">EXIT TO MENU</button>
      </div>
    </div>
  );

  if (state.screen === 'mission_select') return (
    <div className="min-h-screen p-10 flex flex-col items-center bg-sky-400">
      <h2 className="mc-logo mb-12 text-black text-4xl">WORLD SELECT</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 w-full max-w-6xl">
        {missions.map(m => {
          const isCompleted = state.stamps.includes(m.id);
          return (
            <button key={m.id} onClick={() => {
              setState(s => ({ ...s, screen: 'playing', activeMission: m.id, currentQuestionIndex: 0, showExplanation: false, attempts: 0 }));
              playTTS(`Entering ${m.title}`);
            }} className={`mc-panel p-12 relative hover:translate-y-[-15px] transition-all flex flex-col items-center gap-8 group border-8 border-black ${isCompleted ? 'bg-green-100' : 'bg-white'}`}>
              {isCompleted && (
                <div className="absolute top-4 right-4 text-6xl animate-bounce">✅</div>
              )}
              <span className="text-[120px] group-hover:scale-110 transition-transform">{m.icon}</span>
              <div className="text-center">
                <span className="font-black text-3xl text-black uppercase tracking-tighter block">{m.title}</span>
                {isCompleted ? (
                  <span className="text-md font-black text-green-700 uppercase mt-4 block px-4 py-2 bg-green-200 border-4 border-green-700">{m.medal} {m.reward}</span>
                ) : (
                  <span className="text-sm text-gray-400 uppercase mt-4 block">Reward: {m.reward}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <button onClick={() => setState(s => ({ ...s, screen: 'intro' }))} className="mt-20 mc-button bg-black text-white px-16 py-8 text-2xl">BACK</button>
    </div>
  );

  if (state.screen === 'playing') {
    const missionQs = QUESTIONS.filter(q => q.mission === state.activeMission);
    const currentQ = missionQs[state.currentQuestionIndex];
    const displaySentence = state.showExplanation 
      ? currentQ.text.replace('________', `<span class="text-green-700 underline font-black bg-green-200 px-6 py-2 rounded-lg animate-pulse border-4 border-green-800">${currentQ.correctAnswer}</span>`)
      : currentQ.text;

    return (
      <div className="min-h-screen flex flex-col items-center p-6 bg-emerald-700">
        <header className="w-full max-w-6xl flex justify-between p-8 mb-12 bg-black/40 border-8 border-black shadow-2xl">
          <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="mc-button bg-red-600 text-white px-10 text-xl">QUIT</button>
          <div className="text-white text-5xl font-black flex items-center gap-10">
             <div className="text-right">
               <span className="text-xs opacity-60 tracking-[0.5em] block">LEVEL</span>
               <span className="text-3xl">{state.currentQuestionIndex + 1} / 10</span>
             </div>
             <div className="text-right">
               <span className="text-xs opacity-60 tracking-[0.5em] block">SCORE</span>
               <span className="text-yellow-400 text-4xl">{state.score}</span>
             </div>
          </div>
        </header>

        <main className="mc-panel w-full max-w-5xl p-20 bg-white relative shadow-[30px_30px_0px_rgba(0,0,0,0.5)] border-[12px] border-black">
          <div className="flex flex-col lg:flex-row gap-16 items-center mb-20">
            <VoxelFelipe isActive={state.showExplanation} isDancing={state.showExplanation} mood={state.attempts >= 3 ? 'sad' : 'normal'} isNight={state.isNight} size="w-80 h-80" />
            <div className="bg-blue-50 border-8 border-black p-14 flex-1 text-black font-black text-6xl leading-tight shadow-inner text-center md:text-left rounded-3xl">
              <div dangerouslySetInnerHTML={{ __html: displaySentence }} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {shuffledOptions.map((o, i) => (
              <button key={i} disabled={state.showExplanation} onClick={() => checkAnswer(o, currentQ)} 
                className={`mc-button text-4xl py-14 transition-all transform hover:scale-105 active:scale-90 border-8 ${state.showExplanation && o === currentQ.correctAnswer ? 'bg-green-500 border-green-900 text-white shadow-none' : 'bg-gray-100 hover:bg-yellow-300'}`}>
                {o}
              </button>
            ))}
          </div>

          {state.attempts >= 3 && !state.showExplanation && (
            <div className="mt-16 p-12 bg-orange-100 border-8 border-orange-500 text-center animate-bounce rounded-3xl shadow-xl">
              <p className="font-black text-orange-900 text-4xl uppercase tracking-tighter">HINT: {currentQ.hint}</p>
            </div>
          )}

          {state.showExplanation && (
            <div className="mt-20 p-16 bg-yellow-400 border-8 border-black text-center shadow-[20px_20px_0px_#000] animate-in slide-in-from-bottom rounded-3xl">
              <p className="text-6xl font-black mb-12 italic text-black leading-tight">" {currentQ.translation} "</p>
              <button onClick={() => {
                if (state.currentQuestionIndex + 1 < missionQs.length) {
                  setState(s => ({ ...s, currentQuestionIndex: s.currentQuestionIndex + 1, showExplanation: false, attempts: 0 }));
                } else {
                  setState(s => ({ ...s, screen: 'game_over', stamps: [...new Set([...s.stamps, state.activeMission])] }));
                }
              }} className="mc-button w-full bg-emerald-800 text-white text-5xl py-12 hover:bg-emerald-700">NEXT STAGE »</button>
            </div>
          )}
        </main>
      </div>
    );
  }

  if (state.screen === 'game_over') {
    const currentMissionData = missions.find(m => m.id === state.activeMission);
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-black overflow-hidden relative" onClick={initAudio}>
        <div className="mc-panel p-24 text-center max-w-5xl w-full bg-white shadow-[40px_40px_0px_#333] border-[14px] border-black relative z-10">
          <h2 className="mc-logo text-emerald-600 mb-10 text-8xl animate-bounce">WORLD CLEAR!</h2>
          <div className="inline-block px-16 py-8 bg-yellow-400 border-8 border-black transform -rotate-2 mb-16 shadow-2xl">
             <p className="text-5xl font-black text-black uppercase">
               Rank: {currentMissionData?.medal} {currentMissionData?.reward}
             </p>
          </div>
          
          <div className="mb-20 relative group">
             <div className="absolute inset-0 bg-yellow-400/40 blur-[120px] rounded-full group-hover:bg-emerald-400/50 transition-colors duration-1000"></div>
             <VoxelFelipe isActive={true} isDancing={true} isNight={state.isNight} size="w-[500px] h-[500px] mx-auto" />
          </div>

          <div className="bg-gray-100 p-16 border-8 border-black mb-20 rounded-3xl">
             <p className="text-2xl uppercase text-gray-400 mb-6 font-black tracking-[0.5em]">TOTAL HERO XP</p>
             <p className="font-black text-9xl text-black font-mono tracking-widest">{state.score}</p>
          </div>

          <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="mc-button w-full py-14 text-6xl bg-orange-600 text-white hover:bg-orange-500 hover:scale-110 transition-transform shadow-2xl">MAP SELECT</button>
        </div>
      </div>
    );
  }

  return null;
}
