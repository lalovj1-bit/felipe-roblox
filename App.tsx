
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { QUESTIONS, SCRAMBLE_QUESTIONS } from './constants';
import { GameState, Accessory, ChatMessage } from './types';

// --- CONSTANTS ---
const missions = [
  { id: 1, title: 'My Day', icon: '⏰', reward: 'Junior Explorer', medal: '🥉' },
  { id: 2, title: 'Play Time', icon: '🎮', reward: 'Silver Traveler', medal: '🥈' },
  { id: 3, title: 'Delicious!', icon: '🍎', reward: 'Gold Adventurer', medal: '🥇' },
  { id: 4, title: 'My Look', icon: '👕', reward: 'Diamond Master', medal: '💎' },
  { id: 5, title: 'Super Order', icon: '🧩', reward: 'Legendary Hero', medal: '🏆' },
];

// --- MOTOR DE AUDIO 8-BIT ---
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
  // Fanfarria ascendente larga estilo Mario
  const notes = [392, 523, 659, 783, 1046, 1318];
  notes.forEach((f, i) => {
    setTimeout(() => play8BitNote(ctx, f, 0.4, 'square', 0.1), i * 120);
  });
};

const playTetrisTheme = (ctx: AudioContext) => {
  const melody = [
    659, 494, 523, 587, 523, 494, 440, 440, 523, 659, 587, 523, 494, 523, 587, 659, 523, 440, 440,
    0, 587, 698, 880, 783, 698, 659, 523, 659, 587, 523, 494, 494, 523, 587, 659, 523, 440, 440
  ];
  let time = 0;
  melody.forEach((f) => {
    setTimeout(() => play8BitNote(ctx, f, 0.25, 'square', 0.08), time);
    time += 250;
  });
};

const playErrorSound = (ctx: AudioContext) => {
  play8BitNote(ctx, 110, 0.5, 'sawtooth', 0.12);
};

const playIntroTheme = (ctx: AudioContext) => {
  const intro = [330, 330, 0, 330, 0, 262, 330, 0, 392, 0, 196];
  intro.forEach((f, i) => {
    setTimeout(() => play8BitNote(ctx, f, 0.15, 'square', 0.08), i * 150);
  });
};

// --- COMPONENTES VISUALES ---
const ParticleEffect = () => {
  const particles = Array.from({ length: 20 }).map((_, i) => {
    const angle = (i / 20) * Math.PI * 2;
    const x = Math.cos(angle) * 180;
    const y = Math.sin(angle) * 180;
    return <div key={i} className="xp-orb" style={{ '--tw-translate-x': `${x}px`, '--tw-translate-y': `${y}px` } as any} />;
  });
  return <div className="absolute inset-0 flex items-center justify-center pointer-events-none">{particles}</div>;
};

const VoxelFelipe = ({ isActive, isDancing, isNight, size = "w-32 h-32", mood = "normal" }: { isActive: boolean, isDancing?: boolean, isNight: boolean, size?: string, mood?: string }) => (
  <div className={`relative ${size} flex items-center justify-center transition-all duration-500 ${isActive ? 'scale-110' : 'scale-100'} ${isDancing ? 'mc-dance animate-bounce' : ''}`}>
    <svg viewBox="0 0 100 100" className={`w-full h-full drop-shadow-2xl ${isNight ? 'brightness-75' : ''}`}>
      <rect x="30" y="45" width="45" height="40" fill={isNight ? "#64748b" : "#fbcfe8"} stroke="#000" strokeWidth="2" />
      <rect x="35" y="15" width="35" height="35" fill={isNight ? "#94a3b8" : "#fdf2f8"} stroke="#000" strokeWidth="2" />
      <rect x="42" y="30" width="6" height="8" fill={mood === 'sad' ? "#334155" : "#0c4a6e"} />
      <rect x="58" y="30" width="6" height="8" fill={mood === 'sad' ? "#334155" : "#0c4a6e"} />
      <rect x="38" y="42" width="6" height="4" fill="#f472b6" opacity="0.6" />
      <rect x="62" y="42" width="6" height="4" fill="#f472b6" opacity="0.6" />
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
    equippedAccessory: 'none', unlockedAccessories: ['none'], scrambleWords: [], selectedWords: [], chatHistory: [], dailyChallenge: 'Checking the map...'
  });

  const [isAudioLoading, setIsAudioLoading] = useState(false);
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
      if (audioContextRef.current) playCorrectSound(audioContextRef.current);
      setState(s => ({ ...s, score: s.score + 10, attempts: 0, showExplanation: true, userAnswer: opt }));
      playTTS(`Great! The word is ${opt}!`);
    } else {
      if (audioContextRef.current) playErrorSound(audioContextRef.current);
      setState(s => ({ ...s, attempts: s.attempts + 1 }));
      playTTS("Not quite, try another one!");
    }
  };

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
      const final = newSelected.join(' ');
      const correct = SCRAMBLE_QUESTIONS[state.currentQuestionIndex].sentence;
      if (final.toLowerCase() === correct.toLowerCase()) {
        if (audioContextRef.current) playCorrectSound(audioContextRef.current);
        setState(s => ({ ...s, score: s.score + 20, showExplanation: true, attempts: 0 }));
        playTTS("Amazing! You built the sentence perfectly!");
      } else {
        if (audioContextRef.current) playErrorSound(audioContextRef.current);
        const reset = correct.split(' ').sort(() => Math.random() - 0.5);
        setState(s => ({ ...s, attempts: s.attempts + 1, selectedWords: [], scrambleWords: reset }));
        playTTS("Oops! Try building it again.");
      }
    }
  };

  useEffect(() => {
    if (state.screen === 'game_over') {
      const loop = () => {
        if (audioContextRef.current) playTetrisTheme(audioContextRef.current);
      };
      loop();
      tetrisLoopRef.current = setInterval(loop, 9500);
    } else {
      if (tetrisLoopRef.current) clearInterval(tetrisLoopRef.current);
    }
    return () => clearInterval(tetrisLoopRef.current);
  }, [state.screen]);

  if (state.screen === 'intro') return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-cyan-500" onClick={initAudio}>
      <div className="mc-panel p-12 max-w-lg w-full text-center shadow-[12px_12px_0px_#000] bg-white">
        <h1 className="mc-logo mb-10 text-4xl text-black animate-pulse">FELIPE QUEST</h1>
        <VoxelFelipe isActive={true} isDancing={true} isNight={state.isNight} size="w-64 h-64 mx-auto mb-12" />
        <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="mc-button w-full text-xl py-6 bg-green-500 text-white">PLAY ADVENTURE</button>
      </div>
    </div>
  );

  if (state.screen === 'mission_select') return (
    <div className="min-h-screen p-10 flex flex-col items-center bg-cyan-200">
      <h2 className="mc-logo mb-12 text-black text-3xl">THE WORLDS</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-5xl">
        {missions.map(m => {
          const isDone = state.stamps.includes(m.id);
          return (
            <button key={m.id} onClick={() => {
              if(m.id === 5) {
                setState(s => ({ ...s, screen: 'playing', activeMission: 5, currentQuestionIndex: 0 }));
                startScramble(0);
              } else {
                setState(s => ({ ...s, screen: 'playing', activeMission: m.id, currentQuestionIndex: 0, showExplanation: false, attempts: 0 }));
              }
              playTTS(`Entering ${m.title}`);
            }} className={`mc-panel p-10 relative hover:translate-y-[-8px] transition-all flex flex-col items-center gap-6 group ${isDone ? 'bg-green-50 border-green-600' : 'bg-white'}`}>
              {isDone && (
                <div className="absolute top-4 right-4 text-3xl animate-bounce">✅</div>
              )}
              <span className="text-8xl group-hover:scale-110 transition-transform">{m.icon}</span>
              <div className="text-center">
                <span className="font-bold text-xl text-black uppercase tracking-wider block">{m.title}</span>
                {isDone ? (
                  <span className="text-sm font-bold text-green-600 uppercase mt-2 block">{m.medal} {m.reward}</span>
                ) : (
                  <span className="text-[10px] text-gray-500 uppercase mt-2 block">Reward: {m.reward}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <button onClick={() => setState(s => ({ ...s, screen: 'intro' }))} className="mt-16 mc-button bg-gray-400">EXIT</button>
    </div>
  );

  if (state.screen === 'playing') {
    if (state.activeMission === 5) {
      const q = SCRAMBLE_QUESTIONS[state.currentQuestionIndex];
      return (
        <div className="min-h-screen p-6 flex flex-col items-center bg-indigo-600">
           <header className="w-full max-w-3xl flex justify-between bg-black/30 p-4 border-4 border-black mb-10">
             <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="mc-button bg-red-500 text-white">QUIT</button>
             <div className="text-white font-bold text-2xl px-4">XP: {state.score}</div>
           </header>
           <main className="mc-panel w-full max-w-3xl p-10 bg-white shadow-[10px_10px_0px_#000]">
              <p className="text-center text-blue-600 font-bold mb-2 uppercase tracking-tighter">Mission 5: Master Scramble</p>
              <div className="bg-yellow-100 p-8 border-4 border-black text-center text-3xl mb-12 shadow-inner font-bold italic">
                "{q.translation}"
              </div>
              <div className="min-h-[100px] border-b-4 border-dashed border-gray-300 flex flex-wrap gap-4 p-6 mb-12 justify-center bg-gray-50/50">
                {state.selectedWords.map((w, i) => (
                  <span key={i} className="bg-blue-600 text-white p-4 border-4 border-black font-bold text-2xl animate-in zoom-in">{w}</span>
                ))}
              </div>
              <div className="flex flex-wrap gap-4 justify-center">
                {state.scrambleWords.map((w, i) => (
                  <button key={i} onClick={() => handleWordTap(w, i)} className="mc-button bg-white text-black text-2xl hover:bg-yellow-200 py-4 px-6">{w}</button>
                ))}
              </div>
              {state.attempts >= 3 && !state.showExplanation && (
                <div className="mt-12 p-6 bg-orange-100 border-4 border-orange-500 text-black text-center animate-bounce">
                  <p className="text-xl font-bold">FELIPE HELP: The first word is "{q.sentence.split(' ')[0]}"</p>
                </div>
              )}
              {state.showExplanation && (
                <div className="mt-12 p-10 bg-green-100 border-4 border-black text-center animate-in slide-in-from-bottom">
                  <p className="text-3xl font-bold text-green-700 mb-6">MAGNIFICENT! "{q.sentence}"</p>
                  <button onClick={() => {
                    if (state.currentQuestionIndex + 1 < SCRAMBLE_QUESTIONS.length) {
                      const next = state.currentQuestionIndex + 1;
                      setState(s => ({ ...s, currentQuestionIndex: next }));
                      startScramble(next);
                    } else {
                      setState(s => ({ ...s, screen: 'game_over', stamps: [...new Set([...s.stamps, 5])] }));
                    }
                  }} className="mc-button w-full bg-blue-500 text-white text-xl py-5">NEXT CHALLENGE »</button>
                </div>
              )}
           </main>
        </div>
      );
    }

    const missionQs = QUESTIONS.filter(q => q.mission === state.activeMission);
    const currentQ = missionQs[state.currentQuestionIndex];
    // LOGICA DE RELLENAR ESPACIO CON ESTILO
    const displaySentence = state.showExplanation 
      ? currentQ.text.replace('________', `<span class="text-green-600 underline font-black bg-green-100 px-2 animate-pulse">${currentQ.correctAnswer}</span>`)
      : currentQ.text;

    return (
      <div className="min-h-screen flex flex-col items-center p-6 bg-emerald-500">
        <header className="w-full max-w-4xl flex justify-between p-4 mb-10 bg-black/20 border-4 border-black">
          <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="mc-button bg-red-600 text-white">LEAVE WORLD</button>
          <div className="text-white text-2xl font-bold flex items-center gap-4">
             <span className="text-sm opacity-50 uppercase tracking-widest">XP points</span> {state.score}
          </div>
        </header>

        <main className="mc-panel w-full max-w-3xl p-12 bg-white relative shadow-[15px_15px_0px_rgba(0,0,0,0.3)]">
          <div className="flex flex-col md:flex-row gap-10 items-center mb-12">
            <VoxelFelipe isActive={state.showExplanation} isDancing={state.showExplanation} mood={state.attempts >= 3 ? 'sad' : 'normal'} isNight={state.isNight} size="w-56 h-56" />
            <div className="bg-blue-50 border-4 border-black p-8 flex-1 text-black font-bold text-3xl leading-snug shadow-inner text-center md:text-left">
              <div dangerouslySetInnerHTML={{ __html: displaySentence }} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentQ.options.map((o, i) => (
              <button key={i} disabled={state.showExplanation} onClick={() => checkAnswer(o, currentQ)} 
                className={`mc-button text-2xl py-8 transition-colors ${state.showExplanation && o === currentQ.correctAnswer ? 'bg-green-400 border-green-900' : 'bg-gray-100 hover:bg-yellow-100'}`}>
                {o}
              </button>
            ))}
          </div>

          {state.attempts >= 3 && !state.showExplanation && (
            <div className="mt-10 p-6 bg-orange-100 border-4 border-orange-400 text-center animate-pulse">
              <p className="font-bold text-orange-800 text-xl tracking-tight">FELIPE HINT: {currentQ.hint}</p>
            </div>
          )}

          {state.showExplanation && (
            <div className="mt-12 p-10 bg-yellow-200 border-4 border-black text-center shadow-[8px_8px_0px_#000] animate-in slide-in-from-bottom">
              <p className="text-3xl font-bold mb-6 italic">"{currentQ.translation}"</p>
              <button onClick={() => {
                if (state.currentQuestionIndex + 1 < missionQs.length) {
                  setState(s => ({ ...s, currentQuestionIndex: s.currentQuestionIndex + 1, showExplanation: false, attempts: 0 }));
                } else {
                  setState(s => ({ ...s, screen: 'game_over', stamps: [...new Set([...s.stamps, state.activeMission])] }));
                }
              }} className="mc-button w-full bg-blue-600 text-white text-2xl py-6 hover:bg-blue-500">GO TO NEXT »</button>
            </div>
          )}
        </main>
      </div>
    );
  }

  if (state.screen === 'game_over') {
    const currentMissionData = missions.find(m => m.id === state.activeMission);
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-black">
        <div className="mc-panel p-16 text-center max-w-2xl w-full bg-white shadow-[25px_25px_0px_#222] border-8 border-black">
          <h2 className="mc-logo text-blue-600 mb-4 text-5xl animate-bounce">WORLD CLEAR!</h2>
          <p className="text-2xl font-bold text-orange-600 mb-8 uppercase tracking-widest animate-pulse">
            New Rank: {currentMissionData?.medal} {currentMissionData?.reward}
          </p>
          <div className="mb-12 relative">
             <div className="absolute inset-0 bg-yellow-400/20 blur-3xl rounded-full"></div>
             <VoxelFelipe isActive={true} isDancing={true} isNight={state.isNight} size="w-72 h-72 mx-auto" />
          </div>
          <p className="font-bold text-4xl mb-12 text-black font-mono tracking-widest">TOTAL XP: {state.score}</p>
          <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="mc-button w-full py-8 text-3xl bg-orange-500 text-white hover:scale-105 transition-transform">BACK TO MAP</button>
        </div>
      </div>
    );
  }

  return null;
}

