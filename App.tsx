
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { QUESTIONS, SCRAMBLE_QUESTIONS } from './constants';
import { GameState } from './types';

// --- CONSTANTS ---
const missions = [
  { id: 1, title: 'Dino Land', icon: '🦖', color: 'bg-green-500' },
  { id: 2, title: 'Cyber City', icon: '🤖', color: 'bg-blue-400' },
  { id: 3, title: 'Sweet Kingdom', icon: '🍭', color: 'bg-pink-400' },
  { id: 4, title: 'Pirate Cove', icon: '🏴‍☠️', color: 'bg-orange-400' },
  { id: 5, title: 'Star Galaxy', icon: '🌌', color: 'bg-purple-600' },
];

// --- AUDIO ENGINE (SUPER MARIO SPEED) ---
const play8BitNote = (ctx: AudioContext, freq: number, duration: number, type: OscillatorType = 'square', volume = 0.05) => {
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
  [523, 659, 783, 1046].forEach((f, i) => setTimeout(() => play8BitNote(ctx, f, 0.1, 'square', 0.1), i * 40));
};

const playIntroTheme = (ctx: AudioContext) => {
  const intro = [330, 330, 0, 330, 0, 262, 330, 0, 392, 0, 196];
  intro.forEach((f, i) => setTimeout(() => play8BitNote(ctx, f, 0.08, 'square', 0.05), i * 70));
};

// --- HELPERS ---
const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

const VoxelFelipe = ({ isDancing, mood = "normal" }: { isDancing?: boolean, mood?: string }) => (
  <div className={`relative w-20 h-20 flex items-center justify-center transition-all ${isDancing ? 'animate-bounce' : ''}`}>
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
      <rect x="30" y="45" width="45" height="40" fill="#00a800" stroke="#000" strokeWidth="3" />
      <rect x="35" y="15" width="35" height="35" fill="#00ff00" stroke="#000" strokeWidth="3" />
      <rect x="42" y="30" width="6" height="8" fill="#000" />
      <rect x="58" y="30" width="6" height="8" fill="#000" />
      <rect x="40" y="60" width="25" height="4" fill="#000" opacity="0.3" />
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

  const checkMultipleChoice = (opt: string, currentQ: any) => {
    initAudio();
    if (opt === currentQ.correctAnswer) {
      if (audioContextRef.current) playCorrectSound(audioContextRef.current);
      setState(s => ({ ...s, score: s.score + 10, attempts: 0, showExplanation: true, userAnswer: opt }));
      playTTS(`Yes! ${opt}`);
    } else {
      if (audioContextRef.current) play8BitNote(audioContextRef.current, 110, 0.2, 'sawtooth');
      setState(s => ({ ...s, attempts: s.attempts + 1 }));
      playTTS("No, try again");
    }
  };

  useEffect(() => {
    if (state.screen === 'playing') {
      const missionQs = QUESTIONS.filter(q => q.mission === state.activeMission);
      const isScramble = state.currentQuestionIndex === 10; // 10mo nivel es el Boss de oraciones
      if (isScramble) {
        const boss = SCRAMBLE_QUESTIONS[state.activeMission - 1] || SCRAMBLE_QUESTIONS[0];
        setState(s => ({ ...s, scrambleWords: shuffle(boss.sentence.split(' ')), selectedWords: [] }));
      } else if (missionQs[state.currentQuestionIndex]) {
        setShuffledOptions(shuffle(missionQs[state.currentQuestionIndex].options));
      }
    }
  }, [state.screen, state.currentQuestionIndex, state.activeMission]);

  // --- RENDERS ---
  if (state.screen === 'intro') return (
    <div className="h-screen flex flex-col items-center justify-center p-4 bg-[#5c94fc]" onClick={initAudio}>
      <div className="mario-panel p-6 max-w-[280px] w-full text-center">
        <h1 className="mc-logo text-xl text-black mb-1">SUPER FELIPE Y GUILLE</h1>
        <div className="bg-yellow-400 border-2 border-black inline-block px-2 py-0.5 mb-6">
          <h2 className="text-[10px] font-bold text-black uppercase">La Gran Aventura</h2>
        </div>
        <VoxelFelipe isDancing={true} />
        <div className="mt-8 space-y-4">
          <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="mario-button w-full text-[12px] bg-green-500 text-white">PRESS START</button>
          <button onClick={() => setState(s => ({ ...s, screen: 'passport' }))} className="mario-button w-full text-[10px] bg-yellow-400 text-black">PASSPORT</button>
        </div>
      </div>
      <p className="mt-4 text-[10px] text-white opacity-80 uppercase font-bold">© 2025 FELIPE BROS</p>
    </div>
  );

  if (state.screen === 'mission_select') return (
    <div className="h-screen p-4 bg-sky-400 flex flex-col items-center overflow-hidden">
      <h2 className="mc-logo text-sm mb-4 text-black">WORLD MAP</h2>
      <div className="grid grid-cols-2 gap-3 w-full max-w-[320px]">
        {missions.map(m => {
          const done = state.stamps.includes(m.id);
          return (
            <button key={m.id} onClick={() => setState(s => ({ ...s, screen: 'playing', activeMission: m.id, currentQuestionIndex: 0, showExplanation: false }))} 
              className={`mario-panel p-4 flex flex-col items-center gap-1 transition-transform active:scale-95 ${done ? 'bg-green-100' : 'bg-white'}`}>
              <span className="text-3xl">{m.icon}</span>
              <span className="text-[8px] font-bold uppercase">{m.title}</span>
              {done && <span className="text-green-600 text-[10px] font-bold">CLEAR!</span>}
            </button>
          );
        })}
      </div>
      <button onClick={() => setState(s => ({ ...s, screen: 'intro' }))} className="mario-button mt-auto mb-6 bg-red-600 text-white text-[10px]">BACK</button>
    </div>
  );

  if (state.screen === 'playing') {
    const isBoss = state.currentQuestionIndex === 10;
    const missionQs = QUESTIONS.filter(q => q.mission === state.activeMission);
    const currentQ = missionQs[state.currentQuestionIndex];
    const bossQ = SCRAMBLE_QUESTIONS[state.activeMission - 1] || SCRAMBLE_QUESTIONS[0];

    return (
      <div className="h-screen flex flex-col items-center p-2 bg-emerald-600 overflow-hidden">
        <header className="w-full max-w-sm flex justify-between items-center p-2 mb-2 bg-black/30 border-2 border-black">
          <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="mario-button text-[8px] bg-red-600 text-white p-1">EXIT</button>
          <div className="flex gap-4 text-[10px] font-bold text-white">
             <span>WORLD {state.activeMission}-{state.currentQuestionIndex + 1}</span>
             <span className="text-yellow-400">XP {state.score}</span>
          </div>
        </header>

        <main className="mario-panel w-full max-w-[340px] p-4 bg-white flex flex-col h-full max-h-[85vh]">
          {isBoss ? (
            <div className="flex-1 flex flex-col">
              <div className="bg-red-600 text-white text-[10px] p-2 text-center font-bold mb-4 uppercase">SUPER CHALLENGE: TRANSLATE!</div>
              <p className="text-center font-bold text-lg mb-6 text-blue-800">"{bossQ.translation}"</p>
              
              <div className="bg-gray-100 p-3 min-h-[60px] border-2 border-black border-dashed mb-6 flex flex-wrap gap-2 justify-center content-start">
                {state.selectedWords.map((w, i) => (
                  <span key={i} className="bg-white border-2 border-black px-2 py-1 text-sm font-bold shadow-sm">{w}</span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-auto">
                {state.scrambleWords.map((w, i) => (
                  <button key={i} onClick={() => {
                    const newSelected = [...state.selectedWords, w];
                    const newPool = state.scrambleWords.filter((_, idx) => idx !== i);
                    setState(s => ({ ...s, selectedWords: newSelected, scrambleWords: newPool }));
                    if (newSelected.join(' ') === bossQ.sentence) {
                      if (audioContextRef.current) playCorrectSound(audioContextRef.current);
                      setTimeout(() => setState(s => ({ ...s, screen: 'game_over', stamps: [...new Set([...s.stamps, s.activeMission])] })), 800);
                    } else if (newPool.length === 0) {
                       setState(s => ({ ...s, selectedWords: [], scrambleWords: shuffle(bossQ.sentence.split(' ')) }));
                    }
                  }} className="mario-button text-xs py-3">{w}</button>
                ))}
              </div>
              <button onClick={() => setState(s => ({ ...s, selectedWords: [], scrambleWords: shuffle(bossQ.sentence.split(' ')) }))} 
                className="mt-4 text-[8px] font-bold text-gray-400 uppercase">RESET ORACIÓN</button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4">
                <VoxelFelipe isDancing={state.showExplanation} />
                <div className="bg-sky-50 border-2 border-black p-2 flex-1 text-black font-bold text-sm leading-tight text-center rounded-lg">
                  {state.showExplanation ? currentQ.text.replace('________', currentQ.correctAnswer) : currentQ.text}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {shuffledOptions.map((o, i) => (
                  <button key={i} disabled={state.showExplanation} onClick={() => checkMultipleChoice(o, currentQ)} 
                    className={`mario-button text-[11px] py-4 ${state.showExplanation && o === currentQ.correctAnswer ? 'bg-green-400 border-green-800 text-white shadow-none' : 'bg-white'}`}>
                    {o}
                  </button>
                ))}
              </div>

              {state.showExplanation && (
                <div className="mt-4 p-3 bg-yellow-400 border-2 border-black text-center rounded-lg animate-bounce">
                  <p className="text-[10px] font-bold mb-2 uppercase">"{currentQ.translation}"</p>
                  <button onClick={() => setState(s => ({ ...s, currentQuestionIndex: s.currentQuestionIndex + 1, showExplanation: false }))} 
                    className="mario-button w-full text-[10px] bg-blue-600 text-white">NEXT LEVEL »</button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    );
  }

  if (state.screen === 'game_over') return (
    <div className="h-screen flex items-center justify-center p-4 bg-black">
      <div className="mario-panel p-8 text-center max-w-[280px] w-full bg-white">
        <h2 className="mc-logo text-emerald-600 mb-4 text-sm animate-bounce">WORLD CLEAR!</h2>
        <VoxelFelipe isDancing={true} />
        <div className="bg-gray-100 p-4 border-2 border-black my-6">
           <p className="text-[10px] uppercase text-gray-400 mb-1 font-bold">TOTAL SCORE</p>
           <p className="font-bold text-3xl text-black">{state.score}</p>
        </div>
        <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="mario-button w-full py-4 text-[12px] bg-orange-600 text-white">CONTINUE</button>
      </div>
    </div>
  );

  return null;
}
