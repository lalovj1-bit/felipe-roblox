
import { GoogleGenAI, Modality } from "@google/genai";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PRIZES, QUESTIONS } from './constants';
import { GameState, Question } from './types';

function decodeBase64(base64: string) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
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

const missionIcons = ['👋', '🏠', '🍎', '⚽', '🕒', '👨‍⚕️', '🦷', '☀️'];
const missionTitles = ['Greetings', 'My House', 'Food', 'Hobbies', 'Time', 'Jobs', 'The Body', 'Weather'];

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

const VoxelFelipe = ({ isDancing, isSpeaking }: { isDancing?: boolean, isSpeaking?: boolean }) => (
  <div className={`relative w-40 h-40 flex items-center justify-center transition-all ${isDancing ? 'animate-bounce' : 'animate-felipe'}`}>
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
    const saved = localStorage.getItem('felipe_v3_state');
    if (saved) return JSON.parse(saved);
    return {
      screen: 'intro', activeMission: 1, currentQuestionIndex: 0, userAnswer: '', attempts: 0, score: 0, coins: 0,
      errorsInMission: 0, missionStars: {}, isNight: false, feedbackType: 'none', showExplanation: false, stamps: [],
      scrambleWords: [], selectedWords: [], volumeSettings: { bgm: 0.15, sfx: 0.5, voice: 1.0 }
    };
  });

  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const tetrisBgmRef = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem('felipe_v3_state', JSON.stringify(state));
  }, [state]);

  const ensureCtx = async () => {
    if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
    return audioContextRef.current;
  };

  const playNote = (freq: number, duration: number, vol = 0.1) => {
    const ctx = audioContextRef.current;
    if (!ctx || ctx.state !== 'running') return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(state.volumeSettings.sfx * vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  };

  const playTetris = async () => {
    const ctx = await ensureCtx();
    if (tetrisBgmRef.current) return;
    const melody = [
      659, 493, 523, 587, 523, 493, 440, 440, 523, 659, 587, 523, 493, 523, 587, 659, 523, 440, 440
    ];
    let idx = 0;
    tetrisBgmRef.current = window.setInterval(() => {
      if (state.screen === 'shelf' && ctx.state === 'running') {
        playNote(melody[idx], 0.2, 0.05);
        idx = (idx + 1) % melody.length;
      } else if (state.screen !== 'shelf') {
        clearInterval(tetrisBgmRef.current!);
        tetrisBgmRef.current = null;
      }
    }, 250);
  };

  const playTTS = async (text: string) => {
    if (!text || !process.env.API_KEY) {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US';
        u.onstart = () => setIsSpeaking(true);
        u.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(u);
      }
      return;
    }
    try {
      const ctx = await ensureCtx();
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const res = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: { responseModalities: [Modality.AUDIO] },
      });
      const data = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      if (data) {
        const buffer = await decodeAudioData(decodeBase64(data), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        setIsSpeaking(true);
        source.onended = () => setIsSpeaking(false);
        source.start();
      }
    } catch { setIsSpeaking(false); }
  };

  const currentMissionQs = useMemo(() => QUESTIONS.filter(q => q.mission === state.activeMission), [state.activeMission]);

  useEffect(() => {
    if (state.screen === 'playing') {
      const q = currentMissionQs[state.currentQuestionIndex];
      if (q) {
        if (q.type === 'mcq') setShuffledOptions(shuffle(q.options));
        if (q.type === 'scramble') setState(s => ({ ...s, scrambleWords: shuffle(q.correctAnswer.split(' ')), selectedWords: [] }));
        playTTS(q.text.replace('_______', '...'));
      }
    }
    if (state.screen === 'shelf') playTetris();
  }, [state.screen, state.currentQuestionIndex]);

  const handleCorrect = () => {
    playNote(987, 0.1);
    setTimeout(() => playNote(1318, 0.4), 100);
    setState(s => ({ ...s, coins: s.coins + 5, showExplanation: true }));
  };

  const Header = () => (
    <header className="w-full max-w-[500px] flex justify-between items-center p-4 mb-4 bg-black/80 border-4 border-black">
      <div className="flex gap-2">
        <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="mario-button text-[10px] bg-red-600 text-white p-2 px-4">MAP</button>
        <button onClick={() => setState(s => ({ ...s, screen: 'shelf' }))} className="mario-button text-[10px] bg-blue-600 text-white p-2 px-4">SHELF</button>
      </div>
      <span className="text-yellow-400 font-bold mc-logo text-xl">🪙 {state.coins}</span>
    </header>
  );

  if (state.screen === 'intro') return (
    <div className="game-container justify-center bg-[#5c94fc]">
      <div className="mario-panel p-10 text-center max-w-[400px]">
        <h1 className="mc-logo text-2xl mb-8">FELIPE QUEST</h1>
        <VoxelFelipe isSpeaking={isSpeaking} />
        <button onClick={async () => { await ensureCtx(); setState(s => ({ ...s, screen: 'mission_select' })); }} className="mario-button w-full bg-green-500 text-white mc-logo mt-10 py-6">START</button>
      </div>
    </div>
  );

  if (state.screen === 'shelf') return (
    <div className="game-container bg-slate-900 p-6">
      <Header />
      <div className="mario-panel w-full max-w-[500px] p-6 bg-gradient-to-b from-amber-200 to-amber-50 border-amber-900 overflow-y-auto">
        <h2 className="mc-logo text-center mb-8 text-amber-900 underline underline-offset-8 decoration-4">HALL OF FAME</h2>
        <div className="grid grid-cols-2 gap-y-12 gap-x-6 py-4">
          {PRIZES.map((p, i) => {
            const isUnlocked = state.stamps.includes(p.id);
            return (
              <div key={i} className="flex flex-col items-center">
                <div className={`relative w-28 h-28 flex items-center justify-center rounded-t-full border-x-4 border-t-4 border-black/20 ${isUnlocked ? 'bg-white shadow-lg' : 'bg-black/10 grayscale opacity-40'}`}>
                  <span className={`text-6xl ${isUnlocked ? 'animate-bounce' : ''}`}>{isUnlocked ? p.icon : '❓'}</span>
                  {isUnlocked && <div className="absolute inset-0 bg-yellow-400/10 animate-pulse rounded-t-full"></div>}
                </div>
                {/* Pedestal */}
                <div className="w-32 h-8 bg-amber-800 border-4 border-black flex items-center justify-center shadow-md">
                   <span className="text-[10px] font-bold text-amber-200 mc-logo truncate px-1">{isUnlocked ? p.name : 'LOCKED'}</span>
                </div>
                <div className="w-40 h-4 bg-amber-950 border-x-4 border-black shadow-lg"></div>
                <p className={`text-[11px] font-bold text-center mt-2 h-8 ${isUnlocked ? 'text-amber-900' : 'text-gray-400 italic'}`}>
                  {isUnlocked ? p.desc : 'Finish mission ' + p.id}
                </p>
              </div>
            );
          })}
        </div>
        <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="mario-button w-full bg-amber-700 text-white mc-logo mt-8 py-4 shadow-[4px_4px_0px_rgba(0,0,0,1)]">BACK TO MAP</button>
      </div>
    </div>
  );

  if (state.screen === 'mission_select') return (
    <div className="game-container bg-sky-400 p-6">
      <Header />
      <div className="grid grid-cols-2 gap-4 w-full max-w-[500px]">
        {Array.from({ length: 8 }).map((_, i) => {
          const mId = i + 1;
          const isUnlocked = mId === 1 || state.stamps.includes(mId - 1);
          const stars = state.missionStars[mId] || 0;
          return (
            <button key={i} disabled={!isUnlocked} onClick={() => setState(s => ({ ...s, screen: 'playing', activeMission: mId, currentQuestionIndex: 0, showExplanation: false, errorsInMission: 0 }))} 
              className={`mario-panel p-4 flex flex-col items-center gap-2 ${isUnlocked ? 'bg-white border-4 border-black' : 'bg-gray-300 opacity-60'}`}>
              <span className="text-4xl">{missionIcons[i]}</span>
              <span className="text-[10px] font-bold mc-logo">{missionTitles[i]}</span>
              <div className="flex gap-1">
                {[1, 2, 3].map(st => <span key={st} className={st <= stars ? 'text-yellow-500 text-xl' : 'text-gray-200 text-xl'}>★</span>)}
              </div>
              {!isUnlocked && <span className="text-[8px] font-bold text-red-600">LOCKED</span>}
            </button>
          );
        })}
      </div>
    </div>
  );

  if (state.screen === 'playing') {
    const q = currentMissionQs[state.currentQuestionIndex];
    if (!q) return null;
    return (
      <div className="game-container bg-emerald-600 p-4">
        <Header />
        <div className="mario-panel w-full max-w-[500px] p-6 bg-white min-h-[600px] flex flex-col relative">
          <div className="flex justify-between mb-4 border-b-4 border-black/10 pb-2 items-center">
            <span className="font-bold text-[10px] bg-black text-white px-2 py-1">MISSION {state.activeMission}</span>
            <span className="font-bold text-[10px]">Q{state.currentQuestionIndex + 1}/10</span>
          </div>
          <div className="flex justify-center mb-6"><VoxelFelipe isDancing={state.showExplanation} isSpeaking={isSpeaking} /></div>
          
          <div className="bg-sky-50 p-6 border-4 border-black rounded-xl mb-6 text-center shadow-inner">
             <h3 className="text-2xl font-black mb-2 leading-tight">{q.text}</h3>
             <p className="text-blue-600 font-bold italic text-xl">({q.translation})</p>
          </div>

          {q.type === 'mcq' && (
            <div className="grid grid-cols-1 gap-3 flex-1">
              {shuffledOptions.map((o, i) => (
                <button key={i} disabled={state.showExplanation} onClick={() => o === q.correctAnswer ? handleCorrect() : playNote(110, 0.3)} 
                className={`mario-button text-xl font-black ${state.showExplanation && o === q.correctAnswer ? 'bg-green-400 border-green-800' : 'bg-white hover:bg-yellow-50'}`}>{o}</button>
              ))}
            </div>
          )}

          {q.type === 'writing' && (
            <div className="flex flex-col gap-4 flex-1 items-center">
              <input type="text" value={state.userAnswer} onChange={e => setState(s => ({ ...s, userAnswer: e.target.value.toLowerCase() }))} 
                className="w-full p-4 border-4 border-black text-center text-2xl mc-logo uppercase outline-none focus:bg-yellow-50" placeholder="WRITE HERE..." autoFocus />
              <button onClick={() => state.userAnswer === q.correctAnswer.toLowerCase() ? handleCorrect() : playNote(110, 0.3)} className="mario-button bg-yellow-400 w-full text-[14px] shadow-[4px_4px_0px_#000]">CHECK ANSWER</button>
            </div>
          )}

          {q.type === 'scramble' && (
            <div className="flex flex-col gap-4 flex-1">
              <div className="bg-gray-100 p-4 min-h-[100px] border-4 border-dashed border-black flex flex-wrap gap-2 justify-center content-center rounded-lg">
                {state.selectedWords.length === 0 && <span className="text-gray-400 text-xs italic">Tap words below to build the sentence</span>}
                {state.selectedWords.map((w, i) => <button key={i} onClick={() => setState(s => ({ ...s, scrambleWords: [...s.scrambleWords, w], selectedWords: s.selectedWords.filter((_, idx) => idx !== i) }))} className="bg-white p-2 px-3 border-2 border-black font-bold shadow-sm">{w}</button>)}
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {state.scrambleWords.map((w, i) => <button key={i} onClick={() => {
                  const nSel = [...state.selectedWords, w];
                  setState(s => ({ ...s, selectedWords: nSel, scrambleWords: s.scrambleWords.filter((_, idx) => idx !== i) }));
                  if (nSel.join(' ') === q.correctAnswer) handleCorrect();
                }} className="mario-button p-2 text-[12px] bg-blue-100 border-2 border-black font-bold">{w}</button>)}
              </div>
            </div>
          )}

          {state.showExplanation && (
            <div className="mt-6 p-4 border-t-8 border-black text-center bg-green-100 animate-pulse rounded-lg">
              <p className="text-2xl font-black mb-4">CORRECT! ✨</p>
              <button onClick={() => {
                if (state.currentQuestionIndex >= 9) {
                  const stars = state.errorsInMission === 0 ? 3 : 2;
                  setState(s => ({ ...s, screen: 'summary', stamps: [...new Set([...s.stamps, s.activeMission])], missionStars: { ...s.missionStars, [s.activeMission]: stars } }));
                } else setState(s => ({ ...s, currentQuestionIndex: s.currentQuestionIndex + 1, showExplanation: false, userAnswer: '' }));
              }} className="mario-button w-full bg-blue-600 text-white font-black text-lg py-4">NEXT MISSION STEP »</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (state.screen === 'summary') return (
    <div className="game-container justify-center bg-black/90 p-10 text-center">
      <h2 className="mc-logo text-yellow-400 text-3xl mb-8 animate-pulse tracking-tighter">MISSION CLEAR!</h2>
      <div className="relative inline-block mb-10">
        <div className="text-9xl drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">{PRIZES[state.activeMission - 1]?.icon}</div>
        <div className="absolute -top-4 -right-4 text-4xl animate-spin-slow">✨</div>
      </div>
      <p className="text-white text-2xl mb-12 mc-logo leading-relaxed">You earned the<br/><span className="text-yellow-400 text-3xl">"{PRIZES[state.activeMission - 1]?.name}"</span></p>
      <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="mario-button w-full bg-orange-500 text-white py-8 text-xl shadow-[6px_6px_0px_#000]">BACK TO WORLD MAP</button>
    </div>
  );

  return null;
}
