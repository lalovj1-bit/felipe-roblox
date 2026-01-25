
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { QUESTIONS, SCRAMBLE_QUESTIONS } from './constants';
import { GameState, Accessory } from './types';

// --- HELPERS PARA AUDIO ---
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

const AccessoryLayer = ({ item }: { item: Accessory }) => {
  if (item === 'none') return null;
  return (
    <g transform="translate(0, -5)">
      {item === 'sunglasses' && (
        <g>
          <rect x="40" y="28" width="12" height="8" fill="#000" />
          <rect x="58" y="28" width="12" height="8" fill="#000" />
          <rect x="52" y="31" width="6" height="2" fill="#000" />
        </g>
      )}
      {item === 'safari_hat' && (
        <g>
          <rect x="25" y="5" width="60" height="10" fill="#a16207" stroke="#000" strokeWidth="2" />
          <rect x="35" y="-5" width="40" height="12" fill="#a16207" stroke="#000" strokeWidth="2" />
        </g>
      )}
      {item === 'pilot_headset' && (
        <g>
          <rect x="30" y="20" width="50" height="4" fill="#1e293b" />
          <rect x="28" y="25" width="8" height="15" fill="#1e293b" />
          <rect x="74" y="25" width="8" height="15" fill="#1e293b" />
        </g>
      )}
      {item === 'camera' && (
        <g transform="translate(10, 45)">
          <rect x="0" y="0" width="20" height="15" fill="#475569" stroke="#000" strokeWidth="2" />
          <circle cx="10" cy="7.5" r="4" fill="#94a3b8" />
        </g>
      )}
    </g>
  );
};

const VoxelFelipe = ({ isActive, isDancing, size = "w-32 h-32", mood = "normal", accessory = "none" }: { isActive: boolean, isDancing?: boolean, size?: string, mood?: "normal" | "happy" | "thinking", accessory?: Accessory }) => (
  <div className={`relative ${size} flex items-center justify-center transition-all duration-300 ${isActive ? 'scale-110' : 'scale-100'} ${isDancing ? 'mc-dance' : ''}`}>
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_12px_rgba(0,0,0,0.6)]">
      {/* PIERNAS */}
      <rect x="32" y="80" width="16" height="18" fill="#1a1a1a" stroke="#000" strokeWidth="2" />
      <rect x="52" y="80" width="16" height="18" fill="#1a1a1a" stroke="#000" strokeWidth="2" />
      <rect x="32" y="94" width="16" height="6" fill="#0c4a6e" />
      <rect x="52" y="94" width="16" height="6" fill="#0c4a6e" />

      {/* CUERPO */}
      <rect x="30" y="45" width="40" height="35" fill="#FFFFFF" stroke="#000" strokeWidth="2" />
      <rect x="40" y="52" width="20" height="18" fill="#0c4a6e" />
      <rect x="44" y="56" width="12" height="10" fill="#FFFFFF" />
      
      {/* BRAZOS */}
      <rect x="20" y="45" width="10" height="28" fill="#fbcfe8" stroke="#000" strokeWidth="2" />
      <rect x="20" y="45" width="10" height="6" fill="#0c4a6e" />
      <rect x="70" y="45" width="10" height="28" fill="#fbcfe8" stroke="#000" strokeWidth="2" />
      <rect x="70" y="45" width="10" height="6" fill="#0c4a6e" />

      {/* CABEZA */}
      <rect x="35" y="15" width="30" height="30" fill="#fbcfe8" stroke="#000" strokeWidth="2" />
      <rect x="33" y="10" width="34" height="12" fill="#111" />
      <rect x="33" y="22" width="6" height="10" fill="#111" />
      <rect x="61" y="22" width="6" height="10" fill="#111" />
      <rect x="39" y="18" width="8" height="4" fill="#111" />
      <rect x="53" y="18" width="8" height="4" fill="#111" />

      <rect x="40" y="30" width="4" height="6" fill="#0c4a6e" />
      <rect x="56" y="30" width="4" height="6" fill="#0c4a6e" />
      <rect x="40" y="32" width="1" height="2" fill="#fff" />
      <rect x="56" y="32" width="1" height="2" fill="#fff" />
      
      {mood === "happy" || isDancing ? (
        <rect x="44" y="40" width="12" height="2" fill="#000" />
      ) : (
        <rect x="46" y="40" width="8" height="2" fill="#000" opacity="0.4" />
      )}

      <AccessoryLayer item={accessory} />
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
    unlockedAccessories: ['none'],
    scrambleWords: [],
    selectedWords: []
  });

  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

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

  const playTTS = async (text: string, onEnd?: () => void) => {
    try {
      setIsAudioLoading(true);
      const ctx = await initAudio();
      if (!ctx) return;
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => {
          setIsAudioLoading(false);
          if (onEnd) onEnd();
        };
        source.start();
      } else {
        setIsAudioLoading(false);
      }
    } catch (e) {
      console.error("TTS Error:", e);
      setIsAudioLoading(false);
    }
  };

  const playSystemSound = async (type: 'success' | 'error' | 'missionComplete') => {
    const ctx = await initAudio();
    if (!ctx) return;
    
    const playNote = (freq: number, startTime: number, duration: number, type: OscillatorType = 'square') => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
      gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
      gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + startTime + 0.01);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + startTime + duration);
      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    };

    if (type === 'success') {
      const tempo = 0.12;
      playNote(659.25, 0 * tempo, 0.1); 
      playNote(659.25, 1 * tempo, 0.1); 
      playNote(659.25, 2 * tempo, 0.1); 
      playNote(523.25, 3 * tempo, 0.1); 
      playNote(659.25, 4 * tempo, 0.1); 
      playNote(783.99, 6 * tempo, 0.15); 
      playNote(392.00, 8 * tempo, 0.2); 
    } else if (type === 'missionComplete') {
      // Melodía festiva tipo Tetris / Melodía Rusa (Korobeiniki)
      const t = 0.15;
      playNote(659.25, 0*t, 0.1); // Mi
      playNote(493.88, 1*t, 0.1); // Si
      playNote(523.25, 2*t, 0.1); // Do
      playNote(587.33, 3*t, 0.1); // Re
      playNote(523.25, 4*t, 0.1); // Do
      playNote(493.88, 5*t, 0.1); // Si
      playNote(440.00, 6*t, 0.1); // La
      playNote(440.00, 7*t, 0.1); // La
      playNote(523.25, 8*t, 0.1); // Do
      playNote(659.25, 9*t, 0.1); // Mi
      playNote(587.33, 10*t, 0.1); // Re
      playNote(523.25, 11*t, 0.1); // Do
      playNote(493.88, 12*t, 0.15); // Si
      playNote(523.25, 14*t, 0.1); // Do
      playNote(587.33, 15*t, 0.1); // Re
      playNote(659.25, 16*t, 0.1); // Mi
      playNote(523.25, 17*t, 0.1); // Do
      playNote(440.00, 18*t, 0.1); // La
      playNote(440.00, 19*t, 0.2); // La
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(100, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    }
  };

  const missions = [
    { id: 1, title: "Space Adventure", icon: "🚀" },
    { id: 2, title: "Deep Ocean", icon: "🌊" },
    { id: 3, title: "Winter World", icon: "❄️" },
    { id: 4, title: "Magic Forest", icon: "🍄" },
    { id: 5, title: "Dino Land", icon: "🦖" }
  ];

  const prepareScramble = (index: number) => {
    const q = SCRAMBLE_QUESTIONS[index];
    if (!q) return;
    const words = q.sentence.split(' ').sort(() => Math.random() - 0.5);
    setState(s => ({ ...s, scrambleWords: words, selectedWords: [], showExplanation: false }));
    // Habilitar audio obligatorio
    playTTS(q.sentence);
  };

  const handleWordClick = (word: string, index: number) => {
    if (isAudioLoading) return;
    playTTS(word);
    setState(s => {
      const newScramble = [...s.scrambleWords];
      newScramble.splice(index, 1);
      return { ...s, selectedWords: [...s.selectedWords, word], scrambleWords: newScramble };
    });
  };

  const handleRemoveWord = (word: string, index: number) => {
    if (isAudioLoading) return;
    setState(s => {
      const newSelected = [...s.selectedWords];
      newSelected.splice(index, 1);
      return { ...s, selectedWords: newSelected, scrambleWords: [...s.scrambleWords, word] };
    });
  };

  const checkScramble = () => {
    const currentQ = SCRAMBLE_QUESTIONS[state.currentQuestionIndex];
    if (state.selectedWords.join(' ') === currentQ.sentence) {
      playSystemSound('success');
      playTTS("Amazing job! Sentence completed.");
      setState(s => ({ ...s, score: s.score + 20, showExplanation: true }));
    } else {
      playSystemSound('error');
      playTTS("That's not right. Try again.");
      prepareScramble(state.currentQuestionIndex);
    }
  };

  const generateAIPostcard = async (missionId: number, missionTitle: string) => {
    setState(s => ({ ...s, isGeneratingPostcard: true }));
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const imgRes = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `A vibrant voxel 3D Minecraft scene postcard of a kid at ${missionTitle}. Cinematic lighting, blocky art style.` }] },
        config: { imageConfig: { aspectRatio: "1:1" } }
      });
      const textRes = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Write a short 1-sentence travel diary in English for a kid about visiting ${missionTitle}. Simple A1 English.`,
      });
      let imageUrl = "";
      const candidates = imgRes.candidates;
      if (candidates && candidates[0]?.content?.parts) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData) { imageUrl = `data:image/png;base64,${part.inlineData.data}`; break; }
        }
      }
      setState(s => ({ 
        ...s, postcards: { ...s.postcards, [missionId]: imageUrl },
        diaries: { ...s.diaries, [missionId]: textRes.text || "This was amazing!" },
        unlockedAccessories: Array.from(new Set([...s.unlockedAccessories, (['sunglasses', 'safari_hat', 'pilot_headset', 'party_ears', 'camera'] as Accessory[])[missionId-1]])),
        isGeneratingPostcard: false 
      }));
    } catch (e) {
      setState(s => ({ ...s, isGeneratingPostcard: false }));
    }
  };

  useEffect(() => {
    if (state.screen === 'playing') {
      if (state.activeMission < 5) {
        const currentMissionQs = QUESTIONS.filter(q => q.mission === state.activeMission);
        const q = currentMissionQs[state.currentQuestionIndex];
        if (q) playTTS(q.text.replace('________', '...'));
      } else {
        // Para la misión 5, asegurar que el audio se dispare al cambiar de pregunta
        const q = SCRAMBLE_QUESTIONS[state.currentQuestionIndex];
        if (q) playTTS(q.sentence);
      }
    }
  }, [state.currentQuestionIndex, state.activeMission, state.screen]);

  // Disparar sonido de victoria festivo al entrar en pantalla de Game Over
  useEffect(() => {
    if (state.screen === 'game_over') {
      playSystemSound('missionComplete');
    }
  }, [state.screen]);

  if (state.screen === 'intro') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-mc-green/20">
        <div className="mc-panel p-12 max-w-lg w-full text-center">
          <h1 className="mc-logo mb-12">FELIPE<br/>QUEST</h1>
          <div className="flex justify-center mb-12"><VoxelFelipe isActive={true} size="w-56 h-56" accessory={state.equippedAccessory} /></div>
          <div className="flex flex-col gap-6">
            <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="mc-button w-full text-xl py-6">PLAY GAME</button>
            <button onClick={() => setState(s => ({ ...s, screen: 'passport' }))} className="mc-button w-full bg-[#f1c40f] text-black border-yellow-600">MY TRAVELS</button>
          </div>
        </div>
      </div>
    );
  }

  if (state.screen === 'mission_select') {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center">
        <h1 className="mc-logo mb-12 text-center text-3xl">FELIPE QUEST</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-5xl mb-12">
          {missions.map(m => (
            <button key={m.id} onClick={() => {
              if (m.id === 5) {
                setState(s => ({ ...s, screen: 'playing', activeMission: 5, currentQuestionIndex: 0, score: 0 }));
                prepareScramble(0);
              } else {
                setState(s => ({ ...s, screen: 'playing', activeMission: m.id, currentQuestionIndex: 0, score: 0, userAnswer: '', showExplanation: false }));
              }
            }} className="mc-panel p-8 hover:scale-105 transition-all text-center relative group">
              {state.stamps.includes(m.id) && <div className="absolute top-2 right-2 text-2xl">✅</div>}
              <div className="text-7xl mb-6 group-hover:scale-110 transition-transform">{m.icon}</div>
              <h3 className="font-bold text-sky-900 uppercase tracking-widest text-lg">{m.title}</h3>
            </button>
          ))}
        </div>
        <button onClick={() => setState(s => ({ ...s, screen: 'intro' }))} className="mc-button text-xs">GO BACK</button>
      </div>
    );
  }

  if (state.screen === 'playing') {
    if (state.activeMission === 5) {
      const q = SCRAMBLE_QUESTIONS[state.currentQuestionIndex];
      return (
        <div className="min-h-screen flex flex-col items-center p-6">
          <header className="w-full max-w-3xl flex justify-between items-center mb-8">
            <h1 className="mc-logo text-xl">FELIPE QUEST</h1>
            <div className="mc-panel px-4 py-2 text-sky-900 font-bold">XP: {state.score}</div>
          </header>
          
          <main className="w-full max-w-3xl mc-panel p-10 relative">
            {isAudioLoading && (
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-black border-t-transparent animate-spin rounded-full"></div>
                <span className="text-[10px] font-bold text-black uppercase">Wait for Felipe...</span>
              </div>
            )}
            
            <div className="flex items-start gap-6 mb-10">
              <VoxelFelipe isActive={false} mood="thinking" accessory={state.equippedAccessory} />
              <div className="chat-bubble flex-1 shadow-lg">
                <p className="text-xl font-bold text-sky-700 italic">"Listen carefully and translate: {q.translation}"</p>
              </div>
            </div>

            <div className="min-h-[140px] bg-black/10 border-4 border-dashed border-black/30 p-8 flex flex-wrap gap-4 mb-10 items-center justify-center rounded-lg">
              {state.selectedWords.length === 0 && <p className="text-black/30 font-bold uppercase tracking-widest">Listen to Felipe speak...</p>}
              {state.selectedWords.map((w, i) => (
                <button key={i} disabled={isAudioLoading} onClick={() => handleRemoveWord(w, i)} className="word-tag transform hover:scale-110 transition-transform">
                  {w}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 justify-center mb-12">
              {state.scrambleWords.map((w, i) => (
                <button key={i} disabled={isAudioLoading} onClick={() => handleWordClick(w, i)} 
                  className="mc-button text-xs py-4 px-6">
                  {w}
                </button>
              ))}
            </div>

            {state.showExplanation ? (
              <div className="bg-[#55aa55] p-6 border-4 border-black text-white text-center animate-in zoom-in">
                <h3 className="text-2xl font-bold mb-4 uppercase tracking-tighter">MISSION STEP SUCCESS!</h3>
                <button onClick={() => {
                  if (state.currentQuestionIndex + 1 < SCRAMBLE_QUESTIONS.length) {
                    const next = state.currentQuestionIndex + 1;
                    setState(s => ({ ...s, currentQuestionIndex: next, showExplanation: false }));
                    prepareScramble(next);
                  } else {
                    setState(s => ({ ...s, screen: 'game_over', stamps: Array.from(new Set([...s.stamps, 5])) }));
                    generateAIPostcard(5, "Dinosaur World");
                  }
                }} className="mc-button bg-[#ffffff] text-black w-full">CONTINUE »</button>
              </div>
            ) : (
              <button disabled={state.scrambleWords.length > 0 || isAudioLoading} onClick={checkScramble} 
                className="mc-button w-full py-6 text-lg bg-[#3498db] text-white">
                FINISH SENTENCE
              </button>
            )}
          </main>
        </div>
      );
    }

    const currentMissionQs = QUESTIONS.filter(q => q.mission === state.activeMission);
    const currentQ = currentMissionQs[state.currentQuestionIndex];
    if (!currentQ) return null;

    return (
      <div className="min-h-screen flex flex-col items-center p-6">
        <header className="w-full max-w-3xl flex justify-between items-center mb-8">
          <h1 className="mc-logo text-xl">FELIPE QUEST</h1>
          <div className="mc-panel px-4 py-2 text-sky-900 font-bold">XP: {state.score}</div>
        </header>
        
        <main className="w-full max-w-3xl mc-panel p-10">
          <div className="flex items-start gap-8 mb-12">
            <VoxelFelipe isActive={state.showExplanation} size="w-40 h-40" accessory={state.equippedAccessory} />
            <div className="chat-bubble flex-1 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-800 leading-relaxed">
                 {currentQ.text.split('________').map((part, i, arr) => (
                    <React.Fragment key={i}>
                      {part}{i < arr.length - 1 && <span className="text-orange-600 underline font-black decoration-4">{state.userAnswer || "..."}</span>}
                    </React.Fragment>
                  ))}
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {currentQ.options.map((opt, i) => (
              <button key={i} onClick={() => {
                const isCorrect = opt === currentQ.correctAnswer;
                if (isCorrect) {
                  playSystemSound('success');
                  playTTS("Yes! That's correct.");
                  setState(s => ({ ...s, userAnswer: opt, score: s.score + 10, showExplanation: true }));
                } else {
                  playSystemSound('error');
                  playTTS("Oops! Try another word.");
                }
              }} disabled={state.showExplanation || isAudioLoading} className={`mc-button text-sm py-6 ${
                  state.userAnswer === opt 
                    ? (opt === currentQ.correctAnswer ? 'bg-[#55aa55] text-white' : 'bg-[#aa0000] text-white') 
                    : ''
                }`}>
                {opt}
              </button>
            ))}
          </div>

          {state.showExplanation && (
            <div className="mc-panel p-6 bg-[#ffff55] border-black border-4 animate-in slide-in-from-bottom">
              <p className="text-2xl font-bold text-black italic text-center mb-6">"{currentQ.translation}"</p>
              <button onClick={() => {
                  if (state.currentQuestionIndex + 1 < currentMissionQs.length) {
                    setState(s => ({ ...s, currentQuestionIndex: s.currentQuestionIndex + 1, userAnswer: '', showExplanation: false }));
                  } else {
                    setState(s => ({ ...s, screen: 'game_over', stamps: Array.from(new Set([...s.stamps, s.activeMission])) }));
                    generateAIPostcard(state.activeMission, missions.find(m => m.id === state.activeMission)?.title || "");
                  }
                }} className="mc-button w-full bg-[#ffffff] text-black">CONTINUE QUEST »</button>
            </div>
          )}
        </main>
      </div>
    );
  }

  if (state.screen === 'passport') {
    return (
      <div className="min-h-screen p-8 flex flex-col items-center bg-[#8b8b8b]">
        <h1 className="mc-logo mb-12 text-3xl">FELIPE QUEST</h1>
        <div className="mc-panel p-12 w-full max-w-4xl bg-white mb-10">
          <div className="mb-12">
            <h3 className="font-bold text-sky-400 mb-6 uppercase tracking-widest text-lg">MY SKINS</h3>
            <div className="flex gap-6 overflow-x-auto pb-4">
              {state.unlockedAccessories.map(acc => (
                <button key={acc} onClick={() => setState(s => ({ ...s, equippedAccessory: acc }))}
                  className={`w-24 h-24 mc-panel flex items-center justify-center text-5xl transition-all ${state.equippedAccessory === acc ? 'bg-[#55ff55] scale-110' : 'bg-[#e0e0e0] opacity-50'}`}>
                  {{ none: "👤", sunglasses: "🕶️", safari_hat: "🤠", pilot_headset: "🎧", party_ears: "🐭", camera: "📷" }[acc]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
            {missions.map(m => (
              <div key={m.id} className={`mc-panel p-8 ${state.stamps.includes(m.id) ? 'bg-[#ffffff]' : 'bg-[#888888] opacity-30'}`}>
                <div className="flex items-center gap-6 mb-6">
                  <span className="text-5xl">{m.icon}</span>
                  <h4 className="font-bold text-black uppercase text-xl">{m.title}</h4>
                </div>
                {state.postcards[m.id] && (
                  <div>
                    <img src={state.postcards[m.id]} className="w-full border-4 border-black shadow-lg mb-4" />
                    <p className="text-sm italic font-bold text-black leading-relaxed">"{state.diaries[m.id]}"</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <button onClick={() => setState(s => ({ ...s, screen: 'intro' }))} className="mc-button w-full py-6 text-xl">RETURN HOME</button>
        </div>
      </div>
    );
  }

  if (state.screen === 'game_over') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#34495e]">
        <div className="mc-panel p-16 text-center max-w-lg w-full">
           <h1 className="mc-logo mb-12 text-2xl">FELIPE QUEST</h1>
           <h3 className="text-3xl font-bold text-[#55aa55] mb-10 uppercase animate-bounce">MISSION UNLOCKED!</h3>
           <div className="mb-10 min-h-[300px] flex items-center justify-center">
             {state.isGeneratingPostcard ? (
               <div className="flex flex-col items-center">
                 <div className="w-16 h-16 border-8 border-black border-t-transparent animate-spin rounded-full mb-6"></div>
                 <p className="font-bold text-black tracking-widest text-xs">COLLECTING STAMP...</p>
               </div>
             ) : (
               <div className="flex flex-col items-center animate-in zoom-in">
                 <div className="mb-12">
                   {/* EL LOGO BAILANDO CON EL PERSONAJE Y MÚSICA TIPO TETRIS */}
                   <VoxelFelipe isActive={true} isDancing={true} size="w-64 h-64" accessory={state.equippedAccessory} mood="happy" />
                 </div>
                 {state.postcards[state.activeMission] && <img src={state.postcards[state.activeMission]} className="w-full border-4 border-black shadow-2xl mb-6" />}
                 <p className="text-lg font-bold text-black italic">"{state.diaries[state.activeMission]}"</p>
               </div>
             )}
           </div>
           <button onClick={() => setState(s => ({ ...s, screen: 'passport' }))} className="mc-button w-full py-6 text-xl mb-6">ALBUM & DIARY</button>
           <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="text-black font-bold uppercase text-xs tracking-widest">CONTINUE ADVENTURE</button>
        </div>
      </div>
    );
  }

  return null;
}


