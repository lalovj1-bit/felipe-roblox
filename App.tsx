
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { QUESTIONS, SCRAMBLE_QUESTIONS } from './constants';
import { GameState } from './types';

const missions = [
  { id: 1, title: 'Dino Land', icon: '🦖' },
  { id: 2, title: 'Cyber City', icon: '🤖' },
  { id: 3, title: 'Sweet Kingdom', icon: '🍭' },
  { id: 4, title: 'Pirate Cove', icon: '🏴‍☠️' },
  { id: 5, title: 'Star Galaxy', icon: '🌌' },
];

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
  [523, 659, 783, 1046].forEach((f, i) => setTimeout(() => play8BitNote(ctx, f, 0.2, 'square', 0.15), i * 60));
};

const playIntroTheme = (ctx: AudioContext) => {
  const intro = [330, 330, 0, 330, 0, 262, 330, 0, 392, 0, 196];
  intro.forEach((f, i) => setTimeout(() => play8BitNote(ctx, f, 0.15, 'square', 0.1), i * 100));
};

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

const VoxelFelipe = ({ isDancing }: { isDancing?: boolean }) => (
  <div className={`relative w-40 h-40 flex items-center justify-center transition-all ${isDancing ? 'animate-bounce' : 'animate-felipe'}`}>
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

  const missionQs = useMemo(() => 
    QUESTIONS.filter(q => q.mission === state.activeMission), 
  [state.activeMission]);

  // Lógica de Puzzle: Nivel 5 (index 4) y Nivel 10 (index 9)
  const isPuzzleLevel = (state.currentQuestionIndex + 1) % 5 === 0;

  useEffect(() => {
    if (state.screen === 'playing') {
      if (isPuzzleLevel) {
        const puzzleIdx = (state.activeMission - 1) * 2 + (state.currentQuestionIndex === 4 ? 0 : 1);
        const puzzleData = SCRAMBLE_QUESTIONS[puzzleIdx] || SCRAMBLE_QUESTIONS[0];
        setState(s => ({ ...s, scrambleWords: shuffle(puzzleData.sentence.split(' ')), selectedWords: [] }));
      } else {
        // Ajustar el índice para ignorar los puzzles en la lista de preguntas normales
        let qIdx = state.currentQuestionIndex;
        if (qIdx > 4) qIdx -= 1; // Si pasó el primer puzzle, retrocede 1 en la lista QUESTIONS
        
        const currentQ = missionQs[qIdx];
        if (currentQ) {
          setShuffledOptions(shuffle(currentQ.options));
        }
      }
    }
  }, [state.screen, state.currentQuestionIndex, state.activeMission, missionQs, isPuzzleLevel]);

  if (state.screen === 'intro') return (
    <div className="game-container justify-center bg-[#5c94fc]" onClick={() => { initAudio(); playIntroTheme(audioContextRef.current!); }}>
      <div className="mario-panel p-10 max-w-[480px] w-full text-center">
        <h1 className="mc-logo text-2xl text-black mb-4">SUPER FELIPE Y GUILLE</h1>
        <div className="bg-yellow-400 border-4 border-black inline-block px-8 py-3 mb-8">
          <h2 className="text-[16px] font-bold text-black uppercase">Adventure XL Edition</h2>
        </div>
        <div className="flex justify-center mb-8">
          <VoxelFelipe />
        </div>
        <div className="space-y-6">
          <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="mario-button w-full text-[18px] py-8 bg-green-500 text-white uppercase font-black">START GAME</button>
          <button onClick={() => setState(s => ({ ...s, screen: 'passport' }))} className="mario-button w-full text-[14px] py-5 bg-yellow-400 text-black uppercase font-black">PASSPORT</button>
        </div>
      </div>
    </div>
  );

  if (state.screen === 'mission_select') return (
    <div className="game-container p-8 bg-sky-400">
      <h2 className="mc-logo text-2xl mb-10 text-black text-center">SELECT WORLD</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-[500px]">
        {missions.map(m => {
          const done = state.stamps.includes(m.id);
          return (
            <button key={m.id} onClick={() => {
              initAudio();
              setState(s => ({ ...s, screen: 'playing', activeMission: m.id, currentQuestionIndex: 0, showExplanation: false }));
              playTTS(`World ${m.id}`);
            }} className={`mario-panel p-8 flex flex-col items-center gap-4 transition-transform active:scale-95 ${done ? 'bg-green-100' : 'bg-white'}`}>
              <span className="text-6xl">{m.icon}</span>
              <span className="text-[14px] font-bold uppercase">{m.title}</span>
              {done && <span className="text-green-600 text-[14px] font-black">CLEARED!</span>}
            </button>
          );
        })}
      </div>
      <button onClick={() => setState(s => ({ ...s, screen: 'intro' }))} className="mario-button mt-12 bg-red-600 text-white text-[16px] px-16">EXIT</button>
    </div>
  );

  if (state.screen === 'playing') {
    let qIdxForNormal = state.currentQuestionIndex;
    if (qIdxForNormal > 4) qIdxForNormal -= 1;
    
    const currentQ = missionQs[qIdxForNormal];
    const puzzleIdx = (state.activeMission - 1) * 2 + (state.currentQuestionIndex === 4 ? 0 : 1);
    const puzzleData = SCRAMBLE_QUESTIONS[puzzleIdx] || SCRAMBLE_QUESTIONS[0];

    return (
      <div className="game-container p-4 bg-emerald-600">
        <header className="w-full max-w-[500px] flex justify-between items-center p-5 mb-8 bg-black/50 border-4 border-black">
          <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="mario-button text-[12px] bg-red-600 text-white p-3">QUIT</button>
          <div className="flex gap-10 text-[16px] font-bold text-white">
             <span>W {state.activeMission}-{state.currentQuestionIndex + 1}</span>
             <span className="text-yellow-400">XP {state.score}</span>
          </div>
        </header>

        <main className="mario-panel w-full max-w-[500px] p-10 bg-white flex flex-col shadow-2xl">
          {isPuzzleLevel ? (
            <div className="flex flex-col">
              <div className="bg-orange-500 text-white text-[16px] p-5 text-center font-bold mb-8 border-4 border-black shadow-[6px_6px_0px_#000]">PUZZLE TIME!</div>
              <p className="text-center font-bold text-[14px] text-gray-400 uppercase mb-3">Goal Sentence:</p>
              <div className="bg-blue-100 p-6 border-4 border-black mb-8 text-center">
                 <p className="font-bold text-2xl text-blue-900 leading-tight">"{puzzleData.sentence}"</p>
                 <p className="text-[12px] text-blue-600 mt-2">({puzzleData.translation})</p>
              </div>
              
              <div className="bg-yellow-50 p-6 min-h-[120px] border-4 border-black border-dashed mb-10 flex flex-wrap gap-3 justify-center content-start">
                {state.selectedWords.map((w, i) => (
                  <span key={i} className="bg-white border-2 border-black px-4 py-3 text-2xl font-bold shadow-[3px_3px_0px_#000] animate-bounce">{w}</span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {state.scrambleWords.map((w, i) => (
                  <button key={i} onClick={() => {
                    initAudio();
                    const nextWordIndex = state.selectedWords.length;
                    const correctWords = puzzleData.sentence.split(' ');
                    
                    if (w === correctWords[nextWordIndex]) {
                      const newSelected = [...state.selectedWords, w];
                      const newPool = state.scrambleWords.filter((_, idx) => idx !== i);
                      setState(s => ({ ...s, selectedWords: newSelected, scrambleWords: newPool }));
                      
                      if (newSelected.length === correctWords.length) {
                        if (audioContextRef.current) playCorrectSound(audioContextRef.current);
                        setState(s => ({ ...s, score: s.score + 50 }));
                        playTTS("Excellent!");
                        
                        setTimeout(() => {
                           if (state.currentQuestionIndex === 9) {
                             setState(s => ({ ...s, screen: 'game_over', stamps: [...new Set([...s.stamps, s.activeMission])] }));
                           } else {
                             setState(s => ({ ...s, currentQuestionIndex: s.currentQuestionIndex + 1 }));
                           }
                        }, 1800);
                      }
                    } else {
                      if (audioContextRef.current) play8BitNote(audioContextRef.current, 110, 0.4, 'sawtooth');
                      setState(s => ({ ...s, selectedWords: [], scrambleWords: shuffle(puzzleData.sentence.split(' ')) }));
                      playTTS("Try again!");
                    }
                  }} className="mario-button text-[18px] py-6 hover:bg-yellow-100">{w}</button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center gap-10 mb-12">
                <VoxelFelipe isDancing={state.showExplanation} />
                <div className="bg-sky-50 border-4 border-black p-8 w-full text-black font-bold text-3xl leading-tight text-center rounded-2xl shadow-inner">
                  {state.showExplanation ? currentQ.text.replace('________', currentQ.correctAnswer) : currentQ.text}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {shuffledOptions.map((o, i) => (
                  <button key={i} disabled={state.showExplanation} onClick={() => {
                    if (o === currentQ.correctAnswer) {
                       if (audioContextRef.current) playCorrectSound(audioContextRef.current);
                       setState(s => ({ ...s, score: s.score + 10, showExplanation: true, userAnswer: o }));
                       playTTS(`Good! ${o}`);
                    } else {
                       if (audioContextRef.current) play8BitNote(audioContextRef.current, 110, 0.2, 'sawtooth');
                       playTTS("Try another!");
                    }
                  }} 
                    className={`mario-button text-[20px] py-10 ${state.showExplanation && o === currentQ.correctAnswer ? 'bg-green-400 border-green-800 text-white' : 'bg-white'}`}>
                    {o}
                  </button>
                ))}
              </div>

              {state.showExplanation && (
                <div className="mt-10 p-8 bg-yellow-400 border-4 border-black text-center rounded-2xl animate-bounce shadow-[8px_8px_0px_#000]">
                  <p className="text-[16px] font-bold mb-6 uppercase italic">"{currentQ.translation}"</p>
                  <button onClick={() => setState(s => ({ ...s, currentQuestionIndex: s.currentQuestionIndex + 1, showExplanation: false }))} 
                    className="mario-button w-full text-[18px] py-6 bg-blue-600 text-white uppercase font-black">CONTINUE »</button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    );
  }

  if (state.screen === 'game_over') return (
    <div className="game-container justify-center bg-black p-10">
      <div className="mario-panel p-16 text-center max-w-[480px] w-full bg-white border-8 border-black">
        <h2 className="mc-logo text-emerald-600 mb-8 text-3xl animate-bounce">WORLD CLEAR!</h2>
        <VoxelFelipe isDancing={true} />
        <div className="bg-yellow-400 p-10 border-4 border-black my-12 shadow-[10px_10px_0px_#000]">
           <p className="text-[16px] uppercase text-black mb-4 font-bold">TOTAL XP</p>
           <p className="font-bold text-7xl text-black font-mono">{state.score}</p>
        </div>
        <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="mario-button w-full py-10 text-[24px] bg-orange-600 text-white font-black">MAP SELECT</button>
      </div>
    </div>
  );

  if (state.screen === 'passport') return (
    <div className="game-container p-10 bg-orange-100">
      <h2 className="mc-logo text-2xl mb-12 text-black">PASSPORT</h2>
      <div className="mario-panel w-full max-w-[500px] p-10 bg-white shadow-[15px_15px_0px_#8b4513]">
        <div className="flex items-center gap-10 mb-12 border-b-8 border-black pb-10">
          <VoxelFelipe />
          <div>
             <p className="text-[14px] text-gray-400 font-bold uppercase">HERO</p>
             <p className="text-3xl font-bold uppercase">FELIPE & GUILLE</p>
             <p className="text-2xl font-bold text-red-600 mt-2">XP: {state.score}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {missions.map(m => (
            <div key={m.id} className={`p-6 border-4 border-black flex flex-col items-center transition-all ${state.stamps.includes(m.id) ? 'bg-yellow-200 scale-110' : 'bg-gray-100 opacity-20 grayscale'}`}>
              <span className="text-6xl">{m.icon}</span>
              <span className="text-[12px] font-black uppercase mt-4">W-{m.id}</span>
            </div>
          ))}
        </div>
        <button onClick={() => setState(s => ({ ...s, screen: 'intro' }))} className="mario-button w-full mt-16 bg-blue-600 text-white py-8 text-[18px] font-black">BACK</button>
      </div>
    </div>
  );

  return null;
}
