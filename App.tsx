
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

  const playSystemSound = async (type: 'success' | 'error') => {
    const ctx = await initAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(type === 'success' ? 600 : 150, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.start(); osc.stop(ctx.currentTime + 0.2);
  };

  const missions = [
    { id: 1, title: "Beach Party", icon: "🏖️" },
    { id: 2, title: "Nature Camp", icon: "🏕️" },
    { id: 3, title: "Fly High", icon: "✈️" },
    { id: 4, title: "Magic Park", icon: "🎡" },
    { id: 5, title: "City Finale", icon: "🏙️" }
  ];

  const prepareScramble = (index: number) => {
    const q = SCRAMBLE_QUESTIONS[index];
    if (!q) return;
    const words = q.sentence.split(' ').sort(() => Math.random() - 0.5);
    setState(s => ({ ...s, scrambleWords: words, selectedWords: [], showExplanation: false }));
    // Bloquear interacción hasta que Felipe termine de leer la frase correcta
    playTTS(q.sentence);
  };

  const handleWordClick = (word: string, index: number) => {
    if (isAudioLoading) return;
    playTTS(word); // Pronunciar palabra al elegirla
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
      playTTS("Perfect! Well done.");
      setState(s => ({ ...s, score: s.score + 20, showExplanation: true }));
    } else {
      playSystemSound('error');
      playTTS("Try again!");
      prepareScramble(state.currentQuestionIndex);
    }
  };

  const generateAIPostcard = async (missionId: number, missionTitle: string) => {
    setState(s => ({ ...s, isGeneratingPostcard: true }));
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const imgPromise = ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `A 3D voxel art postcard of a dinosaur named Felipe in a ${missionTitle} vacation. Bright colors.` }] },
        config: { imageConfig: { aspectRatio: "1:1" } }
      });
      const textPromise = ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a 1-sentence diary entry in English for a child about a trip to ${missionTitle}. Use simple A1 English.`,
      });
      const [imgRes, textRes] = await Promise.all([imgPromise, textPromise]);
      let imageUrl = "";
      const candidates = imgRes.candidates;
      if (candidates && candidates[0] && candidates[0].content && candidates[0].content.parts) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData) { imageUrl = `data:image/png;base64,${part.inlineData.data}`; break; }
        }
      }
      const diaryEntry = textRes.text || "I had a great trip!";
      const accs: Accessory[] = ['sunglasses', 'safari_hat', 'pilot_headset', 'party_ears', 'camera'];
      setState(s => ({ 
        ...s, postcards: { ...s.postcards, [missionId]: imageUrl },
        diaries: { ...s.diaries, [missionId]: diaryEntry },
        unlockedAccessories: Array.from(new Set([...s.unlockedAccessories, accs[missionId-1]])),
        isGeneratingPostcard: false 
      }));
    } catch (e) {
      setState(s => ({ ...s, isGeneratingPostcard: false }));
    }
  };

  // Lectura automática de diálogos
  useEffect(() => {
    if (state.screen === 'playing' && state.activeMission < 5) {
      const currentMissionQs = QUESTIONS.filter(q => q.mission === state.activeMission);
      const q = currentMissionQs[state.currentQuestionIndex];
      if (q) playTTS(q.text.replace('________', '...'));
    }
  }, [state.currentQuestionIndex, state.activeMission, state.screen]);

  if (state.screen === 'intro') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="voxel-card p-12 max-w-md w-full text-center border-sky-400 border-4">
          <div className="flex justify-center mb-6"><VoxelFelipe isActive={true} accessory={state.equippedAccessory} /></div>
          <h1 className="text-6xl font-black text-sky-600 uppercase mb-12 animate-text-wave">FELIPE QUEST</h1>
          <div className="flex flex-col gap-4">
            <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="w-full roblox-btn py-6 text-2xl">START JOURNEY</button>
            <button onClick={() => setState(s => ({ ...s, screen: 'passport' }))} className="bg-white border-4 border-sky-900 text-sky-900 font-black py-4 uppercase text-sm">Album & Wardrobe</button>
          </div>
        </div>
      </div>
    );
  }

  if (state.screen === 'mission_select') {
    return (
      <div className="min-h-screen p-6 max-w-4xl mx-auto flex flex-col items-center">
        <h1 className="text-6xl font-black text-sky-900 italic mb-12 uppercase">FELIPE QUEST</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-12">
          {missions.map(m => (
            <button key={m.id} onClick={() => {
              if (m.id === 5) {
                setState(s => ({ ...s, screen: 'playing', activeMission: 5, currentQuestionIndex: 0, score: 0 }));
                prepareScramble(0);
              } else {
                setState(s => ({ ...s, screen: 'playing', activeMission: m.id, currentQuestionIndex: 0, score: 0, userAnswer: '', showExplanation: false }));
              }
            }} className="voxel-card p-8 text-center hover:scale-105 transition-all bg-white relative group">
              {state.stamps.includes(m.id) && <div className="absolute top-2 right-2 text-xl">✅</div>}
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">{m.icon}</div>
              <h3 className="text-xl font-black text-sky-700 uppercase">{m.title}</h3>
            </button>
          ))}
        </div>
        <button onClick={() => setState(s => ({ ...s, screen: 'intro' }))} className="text-sky-900 font-black uppercase text-xs">« BACK</button>
      </div>
    );
  }

  if (state.screen === 'playing') {
    if (state.activeMission === 5) {
      const q = SCRAMBLE_QUESTIONS[state.currentQuestionIndex];
      return (
        <div className="min-h-screen flex flex-col items-center p-6 bg-yellow-50">
          <header className="w-full max-w-2xl flex justify-between items-center mb-8">
            <h1 className="text-4xl font-black text-sky-900 italic">FELIPE QUEST</h1>
            <div className="voxel-card px-4 py-2 bg-white font-black text-sky-900">XP: {state.score}</div>
          </header>
          <main className="w-full max-w-2xl voxel-card p-8 bg-white/95 relative">
            {isAudioLoading && (
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-sky-900 border-t-transparent animate-spin rounded-full"></div>
                <span className="mono text-[8px] font-black uppercase text-sky-900">Listening...</span>
              </div>
            )}
            <div className="flex justify-center mb-6"><VoxelFelipe isActive={state.showExplanation} mood={state.showExplanation ? "happy" : "thinking"} accessory={state.equippedAccessory} /></div>
            <div className="bg-sky-50 p-6 border-2 border-dashed border-sky-200 mb-8 text-center">
              <p className="text-2xl font-black italic text-sky-700">"{q.translation}"</p>
            </div>
            {/* ESPACIO DE CONSTRUCCIÓN - MEJORADA VISIBILIDAD */}
            <div className="min-h-[140px] bg-sky-100 border-4 border-sky-900 p-6 flex flex-wrap gap-3 mb-8 items-center justify-center rounded-2xl shadow-inner">
              {state.selectedWords.length === 0 && <p className="text-sky-900/40 font-black uppercase">Felipe says the sentence... Listen!</p>}
              {state.selectedWords.map((w, i) => (
                <button key={i} onClick={() => handleRemoveWord(w, i)} className="bg-summer-orange text-sky-900 px-5 py-3 font-black uppercase text-lg border-4 border-sky-900 shadow-[4px_4px_0_#0c4a6e] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                  {w}
                </button>
              ))}
            </div>
            {/* BOTONES DE OPCIONES - DESHABILITADOS DURANTE AUDIO */}
            <div className="flex flex-wrap gap-3 justify-center mb-8">
              {state.scrambleWords.map((w, i) => (
                <button key={i} disabled={isAudioLoading} onClick={() => handleWordClick(w, i)} 
                  className={`bg-white text-sky-900 px-5 py-3 font-black uppercase border-4 border-sky-900 shadow-[4px_4px_0_#0c4a6e] transition-all
                    ${isAudioLoading ? 'opacity-40 grayscale cursor-not-allowed' : 'hover:shadow-none hover:translate-x-1 hover:translate-y-1'}
                  `}>
                  {w}
                </button>
              ))}
            </div>
            {state.showExplanation ? (
              <div className="bg-tropical-green p-6 border-4 border-sky-900 text-sky-900 animate-in zoom-in">
                <p className="text-2xl font-black uppercase mb-4 text-center">Excellent! ✨</p>
                <button onClick={() => {
                  if (state.currentQuestionIndex + 1 < SCRAMBLE_QUESTIONS.length) {
                    const next = state.currentQuestionIndex + 1;
                    setState(s => ({ ...s, currentQuestionIndex: next, showExplanation: false }));
                    prepareScramble(next);
                  } else {
                    setState(s => ({ ...s, screen: 'game_over', stamps: Array.from(new Set([...s.stamps, 5])) }));
                    generateAIPostcard(5, "City Finale");
                  }
                }} className="w-full bg-sky-900 text-white py-4 font-black uppercase">Next Challenge »</button>
              </div>
            ) : (
              <button disabled={state.scrambleWords.length > 0 || isAudioLoading} onClick={checkScramble} 
                className={`w-full py-6 text-2xl roblox-btn ${state.scrambleWords.length > 0 || isAudioLoading ? 'opacity-50 grayscale' : ''}`}>
                CHECK
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
        <header className="w-full max-w-2xl flex justify-between items-center mb-8">
          <h1 className="text-4xl font-black text-sky-900 italic">FELIPE QUEST</h1>
          <div className="voxel-card px-4 py-2 bg-white font-black text-sky-900">XP: {state.score}</div>
        </header>
        <main className="w-full max-w-2xl voxel-card p-8 bg-white relative">
          <div className="flex justify-center mb-8"><VoxelFelipe isActive={state.showExplanation} accessory={state.equippedAccessory} /></div>
          <div className="bg-sky-50 p-8 border-4 border-sky-900 rounded-3xl mb-10 relative shadow-inner">
            <h3 className="text-2xl font-bold text-sky-900 text-center leading-relaxed">
               {currentQ.text.split('________').map((part, i, arr) => (
                  <React.Fragment key={i}>
                    {part}{i < arr.length - 1 && <span className="text-summer-orange border-b-4 border-summer-orange px-2 font-black">{state.userAnswer || "...."}</span>}
                  </React.Fragment>
                ))}
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {currentQ.options.map((opt, i) => (
              <button key={i} onClick={() => {
                const isCorrect = opt === currentQ.correctAnswer;
                if (isCorrect) {
                  playSystemSound('success');
                  playTTS("Correct!");
                  setState(s => ({ ...s, userAnswer: opt, score: s.score + 10, showExplanation: true }));
                } else {
                  playSystemSound('error');
                  playTTS("Oops!");
                }
              }} disabled={state.showExplanation} className={`p-5 border-4 font-black text-center uppercase text-xl transition-all ${
                  state.userAnswer === opt 
                    ? (opt === currentQ.correctAnswer ? 'bg-tropical-green border-sky-900 scale-105' : 'bg-red-400 border-sky-900 scale-95') 
                    : 'bg-white border-sky-900 hover:border-summer-orange hover:-translate-y-1'
                }`}>
                {opt}
              </button>
            ))}
          </div>
          {state.showExplanation && (
            <div className="p-6 bg-sunny-yellow border-4 border-sky-900 text-sky-900 animate-in slide-in-from-bottom">
              <p className="text-xl font-black italic text-center mb-4">"{currentQ.translation}"</p>
              <button onClick={() => {
                  if (state.currentQuestionIndex + 1 < currentMissionQs.length) {
                    setState(s => ({ ...s, currentQuestionIndex: s.currentQuestionIndex + 1, userAnswer: '', showExplanation: false }));
                  } else {
                    setState(s => ({ ...s, screen: 'game_over', stamps: Array.from(new Set([...s.stamps, s.activeMission])) }));
                    generateAIPostcard(state.activeMission, missions.find(m => m.id === state.activeMission)?.title || "");
                  }
                }} className="w-full bg-sky-900 text-white py-4 font-black uppercase">Continue »</button>
            </div>
          )}
        </main>
      </div>
    );
  }

  if (state.screen === 'passport') {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center bg-[#fefce8]">
        <h1 className="text-6xl font-black text-sky-900 italic mb-12 uppercase">FELIPE QUEST</h1>
        <div className="voxel-card p-10 w-full max-w-3xl bg-white mb-10">
          <div className="mb-12">
            <h3 className="text-sm font-black text-sky-400 mb-6 uppercase tracking-widest">My Wardrobe</h3>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {state.unlockedAccessories.map(acc => (
                <button key={acc} onClick={() => setState(s => ({ ...s, equippedAccessory: acc }))}
                  className={`w-20 h-20 border-4 flex items-center justify-center text-4xl transition-all ${state.equippedAccessory === acc ? 'border-sky-900 bg-sunny-yellow scale-110 shadow-lg' : 'border-gray-100 opacity-60'}`}>
                  {{ none: "🦖", sunglasses: "🕶️", safari_hat: "🤠", pilot_headset: "🎧", party_ears: "🐭", camera: "📷" }[acc]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {missions.map(m => (
              <div key={m.id} className={`voxel-card p-6 ${state.stamps.includes(m.id) ? 'border-sky-900' : 'opacity-20'}`}>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-4xl">{m.icon}</span>
                  <h4 className="font-black text-sky-900 uppercase">{m.title}</h4>
                </div>
                {state.postcards[m.id] && (
                  <div>
                    <img src={state.postcards[m.id]} className="w-full border-4 border-white shadow-lg mb-4" />
                    <p className="text-xs italic font-bold text-sky-700 leading-relaxed">"{state.diaries[m.id]}"</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <button onClick={() => setState(s => ({ ...s, screen: 'intro' }))} className="roblox-btn w-full py-5 text-2xl">BACK HOME</button>
        </div>
      </div>
    );
  }

  if (state.screen === 'game_over') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-sky-100">
        <div className="voxel-card p-12 text-center max-w-md w-full border-tropical-green border-4 bg-white">
           <h1 className="text-6xl font-black text-sky-900 italic mb-12 uppercase">FELIPE QUEST</h1>
           <h3 className="text-2xl font-black text-tropical-green mb-8 uppercase tracking-widest">MISSION COMPLETE!</h3>
           <div className="mb-8 min-h-[250px] flex items-center justify-center">
             {state.isGeneratingPostcard ? (
               <div className="flex flex-col items-center">
                 <div className="w-12 h-12 border-4 border-sky-900 border-t-transparent animate-spin rounded-full mb-4"></div>
                 <p className="font-black text-gray-400 text-xs">COLLECTING STAMP...</p>
               </div>
             ) : (
               <div className="animate-in zoom-in">
                 {state.postcards[state.activeMission] && <img src={state.postcards[state.activeMission]} className="w-full border-4 border-white shadow-xl mb-4" />}
                 <p className="text-sm font-bold text-sky-700 italic">"{state.diaries[state.activeMission]}"</p>
               </div>
             )}
           </div>
           <button onClick={() => setState(s => ({ ...s, screen: 'passport' }))} className="roblox-btn w-full py-6 text-2xl mb-4">MY ALBUM</button>
           <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="text-sky-900 font-black uppercase text-xs tracking-widest">CONTINUE EXPLORING</button>
        </div>
      </div>
    );
  }

  return null;
}

