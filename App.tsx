

import { GoogleGenAI, Modality } from "@google/genai";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FELIPE_SYSTEM_PROMPT, PRIZES, QUESTIONS } from './constants';
import { Accessory, GameScreen, GameState, Question, VolumeSettings } from './types';

// Utility: decode base64
function decodeBase64(base64: string) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Utility: decode PCM audio
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
  const frameCount = dataInt16.length / numChannels;
  const audioBuffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return audioBuffer;
}

const missionIcons = ['🏫', '🐶', '🎨', '👨‍👩‍👧', '🚀', '🔎', '🍕', '⏰'];
const missionTitles = ['My School', 'Animals', 'Colors', 'Family', 'Outer Space', 'Word Hunter', 'Food Time', 'Dino Daily'];

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

const VoxelFelipe = ({ isDancing, isSpeaking, isLoadingAudio }: { isDancing?: boolean, isSpeaking?: boolean, isLoadingAudio?: boolean }) => (
  <div className={`relative w-44 h-44 flex items-center justify-center transition-all ${isDancing ? 'animate-bounce' : 'animate-felipe'}`}>
    {isSpeaking && (
      <div className="absolute -top-16 flex flex-col items-center">
        <div className="bg-white border-4 border-black px-4 py-1 rounded-full text-[10px] font-bold animate-pulse z-20 text-black mc-logo">HEAR ME!</div>
        <div className="flex gap-1 mt-1">
          <div className="w-1.5 h-4 bg-green-500 animate-pulse"></div>
          <div className="w-1.5 h-6 bg-green-500 animate-pulse delay-75"></div>
          <div className="w-1.5 h-3 bg-green-500 animate-pulse delay-150"></div>
        </div>
      </div>
    )}
    {isLoadingAudio && <div className="absolute -top-12 bg-yellow-400 border-4 border-black px-3 py-1 rounded-full text-[10px] font-bold animate-bounce z-20 text-black mc-logo">WAIT...</div>}
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
      <rect x="30" y="45" width="45" height="40" fill="#00a800" stroke="#000" strokeWidth="4" />
      <rect x="35" y="15" width="35" height="35" fill="#00ff00" stroke="#000" strokeWidth="4" />
      <rect x="42" y="30" width="8" height="10" fill="#000" />
      <rect x="58" y="30" width="8" height="10" fill="#000" />
      <rect x="40" y="60" width="25" height="5" fill="#000" opacity={isSpeaking ? "0.9" : "0.3"} />
    </svg>
  </div>
);

export default function App() {
  const [state, setState] = useState<GameState>(() => {
    const saved = localStorage.getItem('felipe_quest_state_a1');
    if (saved) return JSON.parse(saved);
    return {
      screen: 'intro', activeMission: 1, currentQuestionIndex: 0, userAnswer: '', attempts: 0, score: 0, coins: 0,
      errorsInMission: 0, missionStars: {}, isNight: false, feedbackType: 'none', showExplanation: false, stamps: [],
      unlockedAccessories: ['none'], equippedAccessory: 'none', scrambleWords: [], selectedWords: [], chatHistory: [],
      volumeSettings: { bgm: 0.15, sfx: 0.5, voice: 1.0 }
    };
  });

  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [isFelipeSpeaking, setIsFelipeSpeaking] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const bgmRef = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem('felipe_quest_state_a1', JSON.stringify(state));
  }, [state]);

  const ensureAudioContext = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  const playSynthNote = (freq: number, duration: number, volumeFactor = 1) => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    if (ctx.state !== 'running') return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(state.volumeSettings.sfx * volumeFactor, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  };

  const playCoinSound = () => {
    playSynthNote(987, 0.1, 0.4);
    setTimeout(() => playSynthNote(1318, 0.4, 0.4), 100);
  };

  const playErrorSound = () => {
    playSynthNote(110, 0.3, 0.4);
  };

  const playWebSpeech = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.volume = state.volumeSettings.voice;
    utterance.onstart = () => setIsFelipeSpeaking(true);
    utterance.onend = () => setIsFelipeSpeaking(false);
    utterance.onerror = () => setIsFelipeSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const playTTS = async (text: string) => {
    if (!text) return;
    try {
      if (currentSourceRef.current) {
        currentSourceRef.current.stop();
        currentSourceRef.current = null;
      }

      const ctx = await ensureAudioContext();
      setIsLoadingAudio(true);
      setIsFelipeSpeaking(false);

      if (!process.env.API_KEY) {
        throw new Error("No Key");
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: { 
          responseModalities: [Modality.AUDIO], 
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } } } 
        },
      });

      const audioPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (audioPart?.inlineData?.data) {
        const audioBuffer = await decodeAudioData(decodeBase64(audioPart.inlineData.data), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        gain.gain.value = state.volumeSettings.voice;
        source.buffer = audioBuffer; 
        source.connect(gain);
        gain.connect(ctx.destination);
        
        currentSourceRef.current = source;
        setIsLoadingAudio(false);
        setIsFelipeSpeaking(true);
        source.onended = () => {
          setIsFelipeSpeaking(false);
          currentSourceRef.current = null;
        };
        source.start();
      } else {
        throw new Error("TTS Failed");
      }
    } catch (error) {
      setIsLoadingAudio(false);
      setIsFelipeSpeaking(false);
      playWebSpeech(text);
    }
  };

  const startBGM = async () => {
    const ctx = await ensureAudioContext();
    if (bgmRef.current) return;

    const melody = [659, 659, 0, 659, 0, 523, 659, 0, 783, 0, 392, 0];
    let idx = 0;
    bgmRef.current = window.setInterval(() => {
      if (state.screen !== 'intro' && ctx.state === 'running') {
        const freq = melody[idx];
        if (freq > 0) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(state.volumeSettings.bgm * 0.05, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.15);
        }
        idx = (idx + 1) % melody.length;
      }
    }, 180);
  };

  const currentMissionQs = useMemo(() => 
    QUESTIONS.filter(q => q.mission === state.activeMission), 
    [state.activeMission]
  );

  useEffect(() => {
    if (state.screen === 'playing') {
      const q = currentMissionQs[state.currentQuestionIndex];
      if (q) {
        if (state.currentQuestionIndex < 5) {
          setShuffledOptions(shuffle(q.options));
        } else {
          setState(s => ({ ...s, scrambleWords: shuffle(q.correctAnswer.split(' ')), selectedWords: [] }));
        }
        playTTS(state.currentQuestionIndex < 5 ? q.text.replace('_______', 'something') : q.correctAnswer);
      }
    }
  }, [state.screen, state.currentQuestionIndex, state.activeMission]);

  const handleCorrect = () => {
    const q = currentMissionQs[state.currentQuestionIndex];
    if (!q) return;
    playCoinSound();
    setState(s => ({ ...s, score: s.score + 10, coins: s.coins + 5, showExplanation: true }));
  };

  const handleWrong = () => {
    playErrorSound();
    setState(s => ({ ...s, errorsInMission: s.errorsInMission + 1 }));
    playTTS("Oh no, try again!");
  };

  const handleNext = async () => {
    await ensureAudioContext();
    if (state.currentQuestionIndex >= 9) {
      let stars = state.errorsInMission === 0 ? 3 : state.errorsInMission <= 2 ? 2 : 1;
      setState(s => ({ 
        ...s, 
        screen: 'summary', 
        stamps: [...new Set([...s.stamps, s.activeMission])],
        missionStars: { ...s.missionStars, [s.activeMission]: stars },
        coins: s.coins + (stars === 3 ? 50 : 20)
      }));
    } else {
      setState(s => ({ ...s, currentQuestionIndex: s.currentQuestionIndex + 1, showExplanation: false }));
    }
  };

  const Header = () => (
    <header className="w-full max-w-[500px] flex justify-between items-center p-4 mb-4 bg-black/80 border-4 border-black">
      <button onClick={async () => { await ensureAudioContext(); setState(s => ({ ...s, screen: 'mission_select' })); }} className="mario-button text-[10px] bg-red-600 text-white py-2 px-3">MAP</button>
      <div className="flex items-center gap-4">
        <span className="text-yellow-400 font-bold text-[18px] drop-shadow-lg mc-logo">🪙 {state.coins}</span>
        <button onClick={() => setState(s => ({ ...s, screen: 'settings' }))} className="text-2xl hover:rotate-90 transition-transform">⚙️</button>
      </div>
    </header>
  );

  if (state.screen === 'intro') return (
    <div className="game-container justify-center bg-[#5c94fc]">
      <div className="mario-panel p-10 max-w-[480px] w-full text-center">
        <h1 className="mc-logo text-3xl mb-8 text-black leading-tight">FELIPE ADVENTURE<br/><span className="text-[14px] block mt-2 text-blue-600 tracking-tighter shadow-sm">Level A1 • Beginner</span></h1>
        <div className="flex justify-center mb-10">
          <VoxelFelipe isSpeaking={isFelipeSpeaking} isLoadingAudio={isLoadingAudio} />
        </div>
        <button onClick={async () => { 
          await ensureAudioContext(); 
          startBGM();
          setState(s => ({ ...s, screen: 'mission_select' })); 
        }} className="mario-button w-full bg-green-500 text-white mc-logo py-8 text-xl">START GAME</button>
      </div>
    </div>
  );

  if (state.screen === 'settings') return (
    <div className="game-container bg-slate-900 p-6">
      <div className="mario-panel p-8 w-full max-w-[420px]">
        <h2 className="mc-logo text-center mb-10 text-xl underline">OPTIONS</h2>
        {Object.entries(state.volumeSettings).map(([key, val]) => (
          <div key={key} className="mb-8">
            <div className="flex justify-between items-end mb-2">
              <label className="text-[14px] font-bold uppercase">{key} VOLUME</label>
              <span className="text-[10px] font-bold">{((val as number) * 100).toFixed(0)}%</span>
            </div>
            <input 
              type="range" min="0" max="1" step="0.1" 
              value={val as number} 
              onChange={(e) => setState(s => ({ ...s, volumeSettings: { ...s.volumeSettings, [key]: parseFloat(e.target.value) } }))}
              className="w-full h-4 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        ))}
        <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="mario-button w-full bg-blue-500 text-white mt-4 py-4 mc-logo">BACK</button>
      </div>
    </div>
  );

  if (state.screen === 'mission_select') return (
    <div className="game-container bg-sky-400 p-6">
      <Header />
      <h2 className="mc-logo text-black mb-10 text-center text-xl tracking-widest drop-shadow-md">CHOOSE MISSION</h2>
      <div className="grid grid-cols-2 gap-6 w-full max-w-[500px]">
        {Array.from({ length: 8 }).map((_, i) => {
          const mId = i + 1;
          const isUnlocked = mId === 1 || state.stamps.includes(mId - 1);
          const isDone = state.stamps.includes(mId);
          const stars = state.missionStars[mId] || 0;
          return (
            <button 
              key={i} 
              disabled={!isUnlocked}
              onClick={async () => {
                await ensureAudioContext();
                setState(s => ({ ...s, screen: 'playing', activeMission: mId, currentQuestionIndex: 0, showExplanation: false, errorsInMission: 0 }));
              }} 
              className={`mario-panel p-6 flex flex-col items-center gap-3 relative transition-all active:scale-95 ${isDone ? 'bg-yellow-100 border-yellow-600' : isUnlocked ? 'bg-white' : 'bg-gray-300 opacity-60 grayscale'}`}
            >
              {!isUnlocked && <span className="absolute inset-0 flex items-center justify-center text-5xl z-10 opacity-60">🔒</span>}
              <span className="text-5xl drop-shadow-md">{missionIcons[i]}</span>
              <span className="text-[11px] font-bold mc-logo text-center h-10 flex items-center leading-none">{missionTitles[i]}</span>
              <div className="flex gap-1">
                {Array.from({ length: 3 }).map((_, si) => (
                  <span key={si} className={`text-xl ${si < stars ? 'text-yellow-500 drop-shadow-[1px_1px_0px_#000]' : 'text-gray-300'}`}>★</span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  if (state.screen === 'playing') {
    const q = currentMissionQs[state.currentQuestionIndex];
    if (!q) return null;
    const isScramble = state.currentQuestionIndex >= 5;

    return (
      <div className="game-container bg-emerald-600 p-4">
        <Header />
        <div className="mario-panel w-full max-w-[500px] p-6 bg-white min-h-[620px] flex flex-col shadow-2xl relative">
          <div className="flex justify-between items-center mb-6 pb-2 border-b-4 border-black/10">
            <span className="font-bold text-[10px] uppercase bg-black text-white px-3 py-1">MISSION {state.activeMission}</span>
            <div className="flex gap-2">
              {currentMissionQs.map((_, i) => (
                <div key={i} className={`w-3 h-3 border-2 border-black ${i < state.currentQuestionIndex ? 'bg-green-500' : i === state.currentQuestionIndex ? 'bg-yellow-400 animate-pulse' : 'bg-gray-200'}`} />
              ))}
            </div>
          </div>

          <div className="flex justify-center mb-8">
            <VoxelFelipe isDancing={state.showExplanation} isSpeaking={isFelipeSpeaking} isLoadingAudio={isLoadingAudio} />
          </div>
          
          <div className="bg-sky-50 p-6 border-4 border-black rounded-xl mb-6 text-center shadow-inner min-h-[160px] flex flex-col items-center justify-center relative">
             <p className="text-gray-400 text-[10px] absolute top-2 uppercase font-bold tracking-widest">{isScramble ? 'Order the words' : 'Fill the gap'}</p>
             <h3 className="text-3xl font-black text-black leading-tight mb-2">
                {isScramble ? q.translation : q.text}
             </h3>
             <p className="text-[18px] italic text-blue-600 font-bold">({isScramble ? "Order the English sentence" : q.translation})</p>
          </div>

          <button 
            onClick={() => playTTS(isScramble ? q.correctAnswer : q.text.replace('_______', '...'))} 
            disabled={isLoadingAudio || isFelipeSpeaking}
            className={`mario-button py-3 mb-6 w-56 self-center flex items-center justify-center gap-3 ${isLoadingAudio || isFelipeSpeaking ? 'bg-gray-200 opacity-50' : 'bg-yellow-400 hover:scale-105'}`}
          >
            <span className="text-xl">{isFelipeSpeaking ? '📢' : '🔊'}</span>
            <span className="text-[11px]">{isFelipeSpeaking ? 'LISTENING...' : 'HEAR FELIPE'}</span>
          </button>

          {!isScramble ? (
            <div className="grid grid-cols-2 gap-4 flex-1">
              {shuffledOptions.map((o, i) => (
                <button key={i} disabled={state.showExplanation} onClick={async () => {
                  await ensureAudioContext();
                  if (o === q.correctAnswer) handleCorrect();
                  else handleWrong();
                }} className={`mario-button text-[18px] py-6 flex items-center justify-center font-black ${state.showExplanation && o === q.correctAnswer ? 'bg-green-400 border-green-900 scale-105' : 'bg-white hover:bg-yellow-50'}`}>
                  {o}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-6 flex-1">
              <div className="bg-gray-200 p-4 min-h-[120px] border-4 border-black border-dashed flex flex-wrap gap-2 items-center justify-center rounded-lg shadow-inner">
                {state.selectedWords.length === 0 && <span className="text-gray-400 text-sm italic mc-logo opacity-50">Tap words below...</span>}
                {state.selectedWords.map((w, i) => (
                  <button key={i} onClick={() => {
                    if (state.showExplanation) return;
                    setState(s => ({ ...s, scrambleWords: [...s.scrambleWords, w], selectedWords: s.selectedWords.filter((_, idx) => idx !== i) }));
                  }} className="bg-white px-4 py-3 border-4 border-black text-[14px] font-black hover:bg-red-100 shadow-sm">{w}</button>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                {state.scrambleWords.map((w, i) => (
                  <button key={i} disabled={state.showExplanation} onClick={() => {
                    const newSelected = [...state.selectedWords, w];
                    const newScramble = state.scrambleWords.filter((_, idx) => idx !== i);
                    setState(s => ({ ...s, selectedWords: newSelected, scrambleWords: newScramble }));
                    if (newSelected.length === q.correctAnswer.split(' ').length) {
                      if (newSelected.join(' ') === q.correctAnswer) handleCorrect();
                      else handleWrong();
                    }
                  }} className="mario-button text-[14px] py-4 px-6 bg-blue-100 border-blue-400 hover:bg-white">{w}</button>
                ))}
              </div>
            </div>
          )}

          {state.showExplanation && (
            <div className="mt-8 pt-6 border-t-8 border-black text-center animate-bounce z-30">
              <p className="text-[14px] font-black text-green-700 mb-1 uppercase">✨ AWESOME! ✨</p>
              <p className="text-2xl font-black mb-4 bg-yellow-100 inline-block px-6 py-3 border-4 border-black shadow-lg">"{q.correctAnswer}"</p>
              <button 
                disabled={isFelipeSpeaking || isLoadingAudio}
                onClick={handleNext} 
                className={`mario-button w-full py-6 mc-logo text-[14px] shadow-[6px_6px_0px_#000] ${
                  (isFelipeSpeaking || isLoadingAudio) 
                    ? 'bg-gray-300 cursor-not-allowed opacity-70' 
                    : 'bg-blue-600 text-white'
                }`}
              >
                {isFelipeSpeaking ? 'HEAR FELIPE...' : 'CONTINUE »'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (state.screen === 'summary') {
    const stars = state.missionStars[state.activeMission] || 0;
    return (
      <div className="game-container justify-center bg-black/95">
        <div className="mario-panel p-12 text-center max-w-[440px] w-full border-white/50">
          <h2 className="mc-logo text-yellow-400 mb-8 text-3xl tracking-tighter animate-pulse">CLEARED!</h2>
          <div className="text-8xl mb-12 drop-shadow-[6px_6px_0px_#fff]">{PRIZES[state.activeMission - 1]?.icon}</div>
          <div className="flex justify-center gap-6 mb-12">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={`text-6xl ${i < stars ? 'text-yellow-500 animate-bounce' : 'text-gray-800'}`}>★</span>
            ))}
          </div>
          <div className="bg-white/10 p-6 mb-10 border-4 border-black text-left text-[14px] font-bold text-white uppercase tracking-widest leading-loose">
            <p className="flex justify-between border-b-2 border-white/20 pb-2"><span>ERRORS:</span> <span className="text-red-400">{state.errorsInMission}</span></p>
            <p className="flex justify-between text-yellow-400"><span>LEVEL:</span> <span>BEGINNER (A1)</span></p>
            <p className="flex justify-between text-green-400"><span>COINS:</span> <span>+{stars === 3 ? 50 : 20}</span></p>
          </div>
          <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="mario-button w-full bg-orange-500 text-white mc-logo py-6 text-xl">MAP »</button>
        </div>
      </div>
    );
  }

  return null;
}
