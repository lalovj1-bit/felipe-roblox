
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { QUESTIONS, SCRAMBLE_QUESTIONS } from './constants';
import { GameState, Accessory, ChatMessage } from './types';

// --- CONSTANTS ---
const missions = [
  { id: 1, title: 'Daily Routine', icon: '⏰' },
  { id: 2, title: 'My Hobbies', icon: '🎮' },
  { id: 3, title: 'Food Market', icon: '🍎' },
  { id: 4, title: 'My Clothes', icon: '👕' },
  { id: 5, title: 'Master Order', icon: '🧩' },
];

// --- MOTOR DE AUDIO 8-BIT ---
const play8BitNote = (ctx: AudioContext, freq: number, duration: number, type: OscillatorType = 'square', volume = 0.1) => {
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

const playIntroTheme = (ctx: AudioContext) => {
  const melody = [330, 330, 0, 330, 0, 262, 330, 0, 392, 0, 196];
  melody.forEach((f, i) => { if(f > 0) setTimeout(() => play8BitNote(ctx, f, 0.15), i * 150); });
};

const playVictoryFanfare = (ctx: AudioContext) => {
  // Fanfarria larga estilo Mario
  [523, 659, 783, 1046, 1318, 1568].forEach((f, i) => {
    setTimeout(() => play8BitNote(ctx, f, 0.5, 'square', 0.1), i * 120);
  });
};

const playTetrisTheme = (ctx: AudioContext) => {
  const melody = [
    659, 494, 523, 587, 523, 494, 440, 440, 523, 659, 587, 523, 494, 523, 587, 659, 523, 440, 440
  ];
  let time = 0;
  melody.forEach((f, i) => {
    setTimeout(() => play8BitNote(ctx, f, 0.3, 'square', 0.08), time);
    time += 250;
  });
};

const playErrorSound = (ctx: AudioContext) => {
  play8BitNote(ctx, 110, 0.4, 'sawtooth', 0.1);
};

// --- COMPONENTES VISUALES ---
const ParticleEffect = () => {
  const particles = Array.from({ length: 15 }).map((_, i) => {
    const angle = (i / 15) * Math.PI * 2;
    const x = Math.cos(angle) * 150;
    const y = Math.sin(angle) * 150;
    return <div key={i} className="xp-orb" style={{ '--tw-translate-x': `${x}px`, '--tw-translate-y': `${y}px` } as any} />;
  });
  return <div className="absolute inset-0 flex items-center justify-center pointer-events-none">{particles}</div>;
};

const VoxelFelipe = ({ isActive, isDancing, isNight, size = "w-32 h-32", mood = "normal", accessory = "none" }: { isActive: boolean, isDancing?: boolean, isNight: boolean, size?: string, mood?: string, accessory?: Accessory }) => (
  <div className={`relative ${size} flex items-center justify-center transition-all duration-500 ${isActive ? 'scale-110' : 'scale-100'} ${isDancing ? 'mc-dance animate-bounce' : ''}`}>
    <svg viewBox="0 0 100 100" className={`w-full h-full drop-shadow-xl ${isNight ? 'brightness-75' : ''}`}>
      <rect x="30" y="45" width="45" height="40" fill={isNight ? "#94a3b8" : "#fbcfe8"} stroke="#000" strokeWidth="2" />
      <rect x="35" y="15" width="35" height="35" fill={isNight ? "#cbd5e1" : "#fdf2f8"} stroke="#000" strokeWidth="2" />
      <rect x="42" y="30" width="6" height="8" fill={mood === 'sad' ? "#334155" : "#0c4a6e"} />
      <rect x="58" y="30" width="6" height="8" fill={mood === 'sad' ? "#334155" : "#0c4a6e"} />
      <rect x="38" y="42" width="6" height="4" fill="#f472b6" opacity="0.6" />
      <rect x="62" y="42" width="6" height="4" fill="#f472b6" opacity="0.6" />
      {isNight && <rect x="75" y="45" width="4" height="20" fill="#a16207" />}
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
  const tetrisIntervalRef = useRef<any>(null);

  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      if (state.screen === 'intro') playIntroTheme(audioContextRef.current);
    }
  };

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
        source.onended = () => setIsAudioLoading(false);
        source.start();
      }
    } catch { setIsAudioLoading(false); }
  };

  const checkAnswer = (opt: string, currentQ: any) => {
    initAudio();
    if (opt === currentQ.correctAnswer) {
      if (audioContextRef.current) playVictoryFanfare(audioContextRef.current);
      setState(s => ({ ...s, score: s.score + 10, attempts: 0, showExplanation: true, hunger: Math.min(100, s.hunger + 15) }));
      playTTS("Correct! You are amazing!");
    } else {
      if (audioContextRef.current) playErrorSound(audioContextRef.current);
      setState(s => ({ ...s, attempts: s.attempts + 1, hunger: Math.max(0, s.hunger - 10) }));
      playTTS("Not quite! Try again.");
    }
  };

  // Lógica específica Misión 5
  const startScramble = (index: number) => {
    const q = SCRAMBLE_QUESTIONS[index];
    const words = q.sentence.split(' ').sort(() => Math.random() - 0.5);
    setState(s => ({ ...s, scrambleWords: words, selectedWords: [], showExplanation: false, attempts: 0 }));
  };

  const handleWordTap = (word: string, index: number) => {
    initAudio();
    const newSelected = [...state.selectedWords, word];
    const newScramble = [...state.scrambleWords];
    newScramble.splice(index, 1);
    
    setState(s => ({ ...s, selectedWords: newSelected, scrambleWords: newScramble }));

    if (newScramble.length === 0) {
      const finalSentence = newSelected.join(' ');
      const correct = SCRAMBLE_QUESTIONS[state.currentQuestionIndex].sentence;
      if (finalSentence.toLowerCase() === correct.toLowerCase()) {
        if (audioContextRef.current) playVictoryFanfare(audioContextRef.current);
        setState(s => ({ ...s, score: s.score + 20, showExplanation: true, attempts: 0 }));
        playTTS("Perfect! You ordered the sentence correctly!");
      } else {
        if (audioContextRef.current) playErrorSound(audioContextRef.current);
        const resetWords = correct.split(' ').sort(() => Math.random() - 0.5);
        setState(s => ({ ...s, attempts: s.attempts + 1, selectedWords: [], scrambleWords: resetWords }));
        playTTS("Oops! That's not the order. Try again!");
      }
    }
  };

  useEffect(() => {
    if (state.screen === 'game_over') {
      if (audioContextRef.current) {
        playTetrisTheme(audioContextRef.current);
        tetrisIntervalRef.current = setInterval(() => playTetrisTheme(audioContextRef.current!), 5000);
      }
    } else {
      if (tetrisIntervalRef.current) clearInterval(tetrisIntervalRef.current);
    }
    return () => clearInterval(tetrisIntervalRef.current);
  }, [state.screen]);

  if (state.screen === 'intro') return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-sky-400" onClick={initAudio}>
      <div className="mc-panel p-12 max-w-lg w-full text-center shadow-[10px_10px_0px_#000] bg-white">
        <h1 className="mc-logo mb-10 text-4xl text-black">FELIPE QUEST</h1>
        <VoxelFelipe isActive={true} isDancing={true} isNight={state.isNight} size="w-64 h-64 mx-auto mb-10" />
        <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="mc-button w-full text-xl py-6 bg-green-500 text-white">START ADVENTURE</button>
      </div>
    </div>
  );

  if (state.screen === 'mission_select') return (
    <div className="min-h-screen p-10 flex flex-col items-center bg-sky-200">
      <h1 className="mc-logo mb-12 text-black text-3xl">SELECT WORLD</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full max-w-5xl">
        {missions.map(m => (
          <button 
            key={m.id} 
            onClick={() => { 
              if(m.id === 5) {
                setState(s => ({ ...s, screen: 'playing', activeMission: 5, currentQuestionIndex: 0 }));
                startScramble(0);
              } else {
                setState(s => ({ ...s, screen: 'playing', activeMission: m.id, currentQuestionIndex: 0, showExplanation: false, attempts: 0 }));
              }
              playTTS(`Entering ${m.title}`);
            }} 
            className="mc-panel p-8 hover:scale-105 transition-all flex flex-col items-center gap-6 bg-white"
          >
            <span className="text-8xl">{m.icon}</span>
            <span className="font-bold text-xl text-black uppercase">{m.title}</span>
          </button>
        ))}
      </div>
      <button onClick={() => setState(s => ({ ...s, screen: 'intro' }))} className="mt-16 mc-button bg-gray-400">BACK</button>
    </div>
  );

  if (state.screen === 'playing') {
    if (state.activeMission === 5) {
      const q = SCRAMBLE_QUESTIONS[state.currentQuestionIndex];
      return (
        <div className="min-h-screen p-6 flex flex-col items-center bg-indigo-500">
           <header className="w-full max-w-2xl flex justify-between bg-black/20 p-4 border-4 border-black mb-8">
             <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="mc-button bg-red-500 text-white">QUIT</button>
             <div className="text-white font-bold text-2xl">XP: {state.score}</div>
           </header>
           <main className="mc-panel w-full max-w-2xl p-10 bg-white">
              <h2 className="text-center text-xl font-bold mb-4 uppercase text-blue-600">MISSION 5: TRANSLATE!</h2>
              <div className="bg-yellow-100 p-6 border-4 border-black text-center text-3xl mb-10">
                "{q.translation}"
              </div>
              
              <div className="min-h-[80px] border-b-4 border-dashed border-gray-400 flex flex-wrap gap-3 p-4 mb-10 justify-center">
                {state.selectedWords.map((w, i) => (
                  <span key={i} className="bg-blue-600 text-white p-3 border-2 border-black font-bold text-xl animate-in zoom-in">{w}</span>
                ))}
              </div>

              <div className="flex flex-wrap gap-4 justify-center">
                {state.scrambleWords.map((w, i) => (
                  <button key={i} onClick={() => handleWordTap(w, i)} className="mc-button bg-white text-black text-xl hover:bg-yellow-200">{w}</button>
                ))}
              </div>

              {state.attempts >= 3 && !state.showExplanation && (
                <div className="mt-10 p-4 bg-orange-100 border-4 border-orange-500 text-black text-center animate-pulse">
                  <p className="font-bold">FELIPE SAYS: The first word is "{q.sentence.split(' ')[0]}"!</p>
                </div>
              )}

              {state.showExplanation && (
                <div className="mt-10 p-6 bg-green-100 border-4 border-black text-center">
                  <p className="text-2xl font-bold text-green-700 mb-4">AWESOME! "{q.sentence}"</p>
                  <button onClick={() => {
                    if (state.currentQuestionIndex + 1 < SCRAMBLE_QUESTIONS.length) {
                      const next = state.currentQuestionIndex + 1;
                      setState(s => ({ ...s, currentQuestionIndex: next }));
                      startScramble(next);
                    } else {
                      setState(s => ({ ...s, screen: 'game_over' }));
                    }
                  }} className="mc-button w-full bg-blue-500 text-white">NEXT LEVEL »</button>
                </div>
              )}
           </main>
        </div>
      );
    }

    const missionQs = QUESTIONS.filter(q => q.mission === state.activeMission);
    const currentQ = missionQs[state.currentQuestionIndex];
    return (
      <div className="min-h-screen flex flex-col items-center p-6 bg-emerald-400">
        <header className="w-full max-w-3xl flex justify-between p-4 mb-8 bg-black/20 border-4 border-black">
          <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="mc-button bg-red-600 text-white">LEAVE</button>
          <div className="text-white text-2xl font-bold">XP: {state.score}</div>
        </header>

        <main className="mc-panel w-full max-w-2xl p-10 bg-white relative">
          <div className="flex flex-col md:flex-row gap-8 items-center mb-10">
            <VoxelFelipe isActive={state.showExplanation} isDancing={state.showExplanation} mood={state.attempts >= 3 ? 'sad' : 'normal'} isNight={state.isNight} size="w-48 h-48" />
            <div className="bg-blue-50 border-4 border-black p-6 flex-1 text-black font-bold text-2xl leading-relaxed">
              "{currentQ.text}"
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentQ.options.map((o, i) => (
              <button key={i} disabled={state.showExplanation} onClick={() => checkAnswer(o, currentQ)} className="mc-button text-xl py-6 bg-gray-100 hover:bg-yellow-100">
                {o}
              </button>
            ))}
          </div>

          {state.attempts >= 3 && !state.showExplanation && (
            <div className="mt-8 p-4 bg-orange-100 border-4 border-orange-400 text-center animate-bounce">
              <p className="font-bold text-orange-800">PISTA: {currentQ.hint}</p>
            </div>
          )}

          {state.showExplanation && (
            <div className="mt-10 p-8 bg-yellow-200 border-4 border-black text-center animate-in slide-in-from-bottom">
              <p className="text-2xl font-bold mb-4">"{currentQ.translation}"</p>
              <button onClick={() => {
                if (state.currentQuestionIndex + 1 < missionQs.length) {
                  setState(s => ({ ...s, currentQuestionIndex: s.currentQuestionIndex + 1, showExplanation: false, attempts: 0 }));
                } else {
                  setState(s => ({ ...s, screen: 'game_over', stamps: [...new Set([...s.stamps, s.activeMission])] }));
                }
              }} className="mc-button w-full bg-blue-600 text-white text-xl">NEXT MISSION »</button>
            </div>
          )}
        </main>
      </div>
    );
  }

  if (state.screen === 'game_over') return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black">
      <div className="mc-panel p-12 text-center max-w-lg w-full bg-white shadow-[20px_20px_0px_#444]">
        <h2 className="mc-logo text-blue-600 mb-10 text-4xl animate-pulse">MISSION CLEAR!</h2>
        <div className="mb-10 scale-150 transform transition-transform duration-1000 rotate-12">
          <VoxelFelipe isActive={true} isDancing={true} isNight={state.isNight} size="w-64 h-64 mx-auto" />
        </div>
        <p className="font-bold text-3xl mb-10 text-black font-mono">TOTAL XP: {state.score}</p>
        <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="mc-button w-full py-6 text-2xl bg-orange-500 text-white">PLAY AGAIN</button>
      </div>
    </div>
  );

  return null;
}
