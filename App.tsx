
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { QUESTIONS, SCRAMBLE_QUESTIONS } from './constants';
import { GameState } from './types';

// --- CONSTANTS ---
const missions = [
  { id: 1, title: 'Dino Land', icon: '🦖' },
  { id: 2, title: 'Cyber City', icon: '🤖' },
  { id: 3, title: 'Sweet Kingdom', icon: '🍭' },
  { id: 4, title: 'Pirate Cove', icon: '🏴‍☠️' },
  { id: 5, title: 'Star Galaxy', icon: '🌌' },
];

// --- AUDIO ENGINE (ULTRA SPEED) ---
const play8BitNote = (ctx: AudioContext, freq: number, duration: number, type: OscillatorType = 'square', volume = 0.06) => {
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
  [523, 659, 783, 1046].forEach((f, i) => setTimeout(() => play8BitNote(ctx, f, 0.12, 'square', 0.12), i * 45));
};

const playIntroTheme = (ctx: AudioContext) => {
  const intro = [330, 330, 0, 330, 0, 262, 330, 0, 392, 0, 196];
  intro.forEach((f, i) => setTimeout(() => play8BitNote(ctx, f, 0.1, 'square', 0.08), i * 85));
};

// --- HELPERS ---
const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

const VoxelFelipe = ({ isDancing }: { isDancing?: boolean }) => (
  <div className={`relative w-32 h-32 flex items-center justify-center transition-all ${isDancing ? 'animate-bounce' : ''}`}>
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
      <rect x="30" y="45" width="45" height="40" fill="#00a800" stroke="#000" strokeWidth="4" />
      <rect x="35" y="15" width="35" height="35" fill="#00ff00" stroke="#000" strokeWidth="4" />
      <rect x="42" y="30" width="8" height="10" fill="#000" />
      <rect x="58" y="30" width="8" height="10" fill="#000" />
      <rect x="40" y="60" width="25" height="5" fill="#000" opacity="0.3" />
    </svg>
  </div>
);

export default function App() {
  const [state, setState] = useState<GameState>({
    screen: 'intro', activeMission: 1, currentQuestionIndex: 0, userAnswer: '', attempts: 0, score: 0, hunger: 100,
    isNight: false, feedbackType: 'none', showExplanation: false, stamps: [], postcards: {}, diaries: {},
    isGeneratingPostcard: false, equippedAccessory: 'none', unlockedAccessories: ['none'],
    scrambleWords: [], selectedWords: [], chatHistory: [], dailyChallenge: ''
  });

  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
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

  const checkMultipleChoice = (opt: string, currentQ: any) => {
    initAudio();
    if (opt === currentQ.correctAnswer) {
      if (audioContextRef.current) playCorrectSound(audioContextRef.current);
      setState(s => ({ ...s, score: s.score + 10, attempts: 0, showExplanation: true, userAnswer: opt }));
      playTTS(`Great! ${opt}`);
    } else {
      if (audioContextRef.current) play8BitNote(audioContextRef.current, 110, 0.2, 'sawtooth');
      setState(s => ({ ...s, attempts: s.attempts + 1 }));
      playTTS("Try again!");
    }
  };

  const missionQs = useMemo(() => 
    QUESTIONS.filter(q => q.mission === state.activeMission), 
  [state.activeMission]);

  useEffect(() => {
    if (state.screen === 'playing') {
      const isScramble = state.currentQuestionIndex === 9; 
      if (isScramble) {
        const boss = SCRAMBLE_QUESTIONS[state.activeMission - 1] || SCRAMBLE_QUESTIONS[0];
        setState(s => ({ ...s, scrambleWords: shuffle(boss.sentence.split(' ')), selectedWords: [] }));
      } else {
        const currentQ = missionQs[state.currentQuestionIndex];
        if (currentQ) {
          setShuffledOptions(shuffle(currentQ.options));
        }
      }
    }
  }, [state.screen, state.currentQuestionIndex, state.activeMission, missionQs]);

  // --- RENDERS ---
  if (state.screen === 'intro') return (
    <div className="h-screen flex flex-col items-center justify-center p-6 bg-[#5c94fc]" onClick={() => { initAudio(); playIntroTheme(audioContextRef.current!); }}>
      <div className="mario-panel p-10 max-w-[400px] w-full text-center">
        <h1 className="mc-logo text-3xl text-black mb-2">SUPER FELIPE Y GUILLE</h1>
        <div className="bg-yellow-400 border-4 border-black inline-block px-6 py-2 mb-10">
          <h2 className="text-[14px] font-bold text-black uppercase">La Gran Aventura</h2>
        </div>
        <div className="flex justify-center mb-10">
          <VoxelFelipe isDancing={true} />
        </div>
        <div className="space-y-6">
          <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="mario-button w-full text-[16px] py-8 bg-green-500 text-white uppercase font-black">START GAME</button>
          <button onClick={() => setState(s => ({ ...s, screen: 'passport' }))} className="mario-button w-full text-[14px] py-5 bg-yellow-400 text-black uppercase font-black">PROGRESS</button>
        </div>
      </div>
    </div>
  );

  if (state.screen === 'mission_select') return (
    <div className="h-screen p-8 bg-sky-400 flex flex-col items-center">
      <h2 className="mc-logo text-xl mb-8 text-black">SELECT WORLD</h2>
      <div className="grid grid-cols-2 gap-5 w-full max-w-[440px]">
        {missions.map(m => {
          const done = state.stamps.includes(m.id);
          return (
            <button key={m.id} onClick={() => {
              initAudio();
              setState(s => ({ ...s, screen: 'playing', activeMission: m.id, currentQuestionIndex: 0, showExplanation: false }));
              playTTS(`World ${m.id}`);
            }} className={`mario-panel p-6 flex flex-col items-center gap-3 transition-transform active:scale-95 ${done ? 'bg-green-100' : 'bg-white'}`}>
              <span className="text-5xl">{m.icon}</span>
              <span className="text-[12px] font-bold uppercase">{m.title}</span>
              {done && <span className="text-green-600 text-[12px] font-black">CLEAR!</span>}
            </button>
          );
        })}
      </div>
      <button onClick={() => setState(s => ({ ...s, screen: 'intro' }))} className="mario-button mt-auto mb-10 bg-red-600 text-white text-[14px] px-12">EXIT</button>
    </div>
  );

  if (state.screen === 'playing') {
    const isBoss = state.currentQuestionIndex === 9;
    const currentQ = missionQs[state.currentQuestionIndex];
    const bossQ = SCRAMBLE_QUESTIONS[state.activeMission - 1] || SCRAMBLE_QUESTIONS[0];

    // Evitar pantalla azul si la pregunta aún no carga
    if (!isBoss && !currentQ) return <div className="h-screen bg-black flex items-center justify-center text-white">Loading Level...</div>;

    return (
      <div className="h-screen flex flex-col items-center p-4 bg-emerald-600">
        <header className="w-full max-w-[440px] flex justify-between items-center p-4 mb-5 bg-black/40 border-4 border-black">
          <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="mario-button text-[10px] bg-red-600 text-white p-2">QUIT</button>
          <div className="flex gap-8 text-[14px] font-bold text-white">
             <span>W {state.activeMission}-{state.currentQuestionIndex + 1}</span>
             <span className="text-yellow-400">XP {state.score}</span>
          </div>
        </header>

        <main className="mario-panel w-full max-w-[440px] p-8 bg-white flex flex-col h-full max-h-[82vh]">
          {isBoss ? (
            <div className="flex-1 flex flex-col">
              <div className="bg-orange-500 text-white text-[14px] p-4 text-center font-bold mb-6 border-4 border-black shadow-[4px_4px_0px_#000]">SUPER PUZZLE: ORDENA!</div>
              <p className="text-center font-bold text-[14px] text-gray-500 uppercase mb-2">English Goal:</p>
              <p className="text-center font-bold text-2xl mb-8 text-blue-800 leading-tight italic">"{bossQ.sentence}"</p>
              
              <div className="bg-yellow-50 p-6 min-h-[120px] border-4 border-black border-dashed mb-8 flex flex-wrap gap-3 justify-center content-start">
                {state.selectedWords.map((w, i) => (
                  <span key={i} className="bg-white border-2 border-black px-4 py-3 text-xl font-bold shadow-[3px_3px_0px_#000]">{w}</span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-auto">
                {state.scrambleWords.map((w, i) => (
                  <button key={i} onClick={() => {
                    initAudio();
                    const newSelected = [...state.selectedWords, w];
                    const newPool = state.scrambleWords.filter((_, idx) => idx !== i);
                    setState(s => ({ ...s, selectedWords: newSelected, scrambleWords: newPool }));
                    
                    if (newSelected.join(' ') === bossQ.sentence) {
                      if (audioContextRef.current) playCorrectSound(audioContextRef.current);
                      setState(s => ({ ...s, score: s.score + 50 }));
                      playTTS("Excellent! World Cleared!");
                      setTimeout(() => setState(s => ({ ...s, screen: 'game_over', stamps: [...new Set([...s.stamps, s.activeMission])] })), 2000);
                    } else if (newPool.length === 0) {
                      if (audioContextRef.current) play8BitNote(audioContextRef.current, 110, 0.2, 'sawtooth');
                      setState(s => ({ ...s, selectedWords: [], scrambleWords: shuffle(bossQ.sentence.split(' ')) }));
                    }
                  }} className="mario-button text-[14px] py-6 hover:bg-yellow-100">{w}</button>
                ))}
              </div>
              <button onClick={() => setState(s => ({ ...s, selectedWords: [], scrambleWords: shuffle(bossQ.sentence.split(' ')) }))} 
                className="mt-8 text-[12px] font-bold text-red-600 uppercase border-2 border-red-600 p-3 mx-auto">RESET PUZZLE</button>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center gap-8 mb-10">
                <VoxelFelipe isDancing={state.showExplanation} />
                <div className="bg-sky-50 border-4 border-black p-6 w-full text-black font-bold text-2xl leading-snug text-center rounded-2xl shadow-inner">
                  {state.showExplanation ? currentQ.text.replace('________', currentQ.correctAnswer) : currentQ.text}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {shuffledOptions.map((o, i) => (
                  <button key={i} disabled={state.showExplanation} onClick={() => checkMultipleChoice(o, currentQ)} 
                    className={`mario-button text-[18px] py-8 ${state.showExplanation && o === currentQ.correctAnswer ? 'bg-green-400 border-green-800 text-white' : 'bg-white'}`}>
                    {o}
                  </button>
                ))}
              </div>

              {state.showExplanation && (
                <div className="mt-8 p-6 bg-yellow-400 border-4 border-black text-center rounded-2xl animate-bounce shadow-[6px_6px_0px_#000]">
                  <p className="text-[14px] font-bold mb-4 uppercase italic">"{currentQ.translation}"</p>
                  <button onClick={() => setState(s => ({ ...s, currentQuestionIndex: s.currentQuestionIndex + 1, showExplanation: false }))} 
                    className="mario-button w-full text-[16px] py-5 bg-blue-600 text-white uppercase font-black">NEXT »</button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    );
  }

  if (state.screen === 'game_over') return (
    <div className="h-screen flex items-center justify-center p-8 bg-black">
      <div className="mario-panel p-12 text-center max-w-[400px] w-full bg-white border-8 border-black shadow-[15px_15px_0px_#333]">
        <h2 className="mc-logo text-emerald-600 mb-8 text-2xl animate-bounce">WORLD CLEAR!</h2>
        <div className="flex justify-center mb-8">
          <VoxelFelipe isDancing={true} />
        </div>
        <div className="bg-yellow-400 p-8 border-4 border-black my-10 shadow-[8px_8px_0px_#000]">
           <p className="text-[14px] uppercase text-black mb-3 font-bold">HERO XP</p>
           <p className="font-bold text-6xl text-black font-mono">{state.score}</p>
        </div>
        <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="mario-button w-full py-8 text-[20px] bg-orange-600 text-white font-black">CONTINUE</button>
      </div>
    </div>
  );

  if (state.screen === 'passport') return (
    <div className="h-screen p-8 bg-orange-100 flex flex-col items-center">
      <h2 className="mc-logo text-xl mb-10 text-black">MY MEDALS</h2>
      <div className="mario-panel w-full max-w-[420px] p-8 bg-white shadow-[12px_12px_0px_#8b4513]">
        <div className="flex items-center gap-8 mb-10 border-b-8 border-black pb-8">
          <VoxelFelipe isDancing={false} />
          <div>
             <p className="text-[12px] text-gray-400 font-bold uppercase">HERO</p>
             <p className="text-2xl font-bold uppercase">FELIPE_&_GUILLE</p>
             <p className="text-xl font-bold text-red-600 mt-1">XP: {state.score}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-5">
          {missions.map(m => (
            <div key={m.id} className={`p-5 border-4 border-black flex flex-col items-center transition-all ${state.stamps.includes(m.id) ? 'bg-yellow-200 scale-105' : 'bg-gray-100 opacity-20 grayscale'}`}>
              <span className="text-5xl">{m.icon}</span>
              <span className="text-[10px] font-black uppercase mt-3">W-{m.id}</span>
            </div>
          ))}
        </div>
        <button onClick={() => setState(s => ({ ...s, screen: 'intro' }))} className="mario-button w-full mt-12 bg-blue-600 text-white py-6 text-[16px] font-black">BACK</button>
      </div>
    </div>
  );

  return null;
}
