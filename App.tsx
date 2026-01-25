
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { QUESTIONS, SCRAMBLE_QUESTIONS, PRIZES, FELIPE_SYSTEM_PROMPT } from './constants';
import { GameState, ChatMessage } from './types';

// Funciones de decodificación manuales según guías de @google/genai
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  // El audio bytes retornado es raw PCM 16-bit
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

const missions = [
  { id: 1, title: 'Pixel Academy', icon: '💻' },
  { id: 2, title: 'Adventure Street', icon: '🛹' },
  { id: 3, title: 'Olympic Arena', icon: '🏆' },
  { id: 4, title: 'Deep Woods', icon: '🌲' },
  { id: 5, title: 'Star Voyager', icon: '🌌' },
  { id: 6, title: 'Word Hunter', icon: '🔊' },
];

// --- MOTOR DE AUDIO 8-BIT PARA EFECTOS ---
const play8BitNote = (ctx: AudioContext, freq: number, duration: number, type: OscillatorType = 'square', volume = 0.06) => {
  if (freq === 0 || !ctx) return;
  try {
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
  } catch (e) {
    console.error("Audio Effect Error:", e);
  }
};

const playMarioCoin = (ctx: AudioContext) => {
  if (!ctx) return;
  play8BitNote(ctx, 987.77, 0.1, 'square', 0.1); 
  setTimeout(() => play8BitNote(ctx, 1318.51, 0.4, 'square', 0.1), 100);
};

const playIntroTheme = (ctx: AudioContext) => {
  if (!ctx) return;
  const intro = [330, 330, 0, 330, 0, 262, 330, 0, 392, 0, 196];
  intro.forEach((f, i) => setTimeout(() => play8BitNote(ctx, f, 0.15, 'square', 0.1), i * 120));
};

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

const VoxelFelipe = ({ isDancing, isSpeaking, isLoadingAudio }: { isDancing?: boolean, isSpeaking?: boolean, isLoadingAudio?: boolean }) => (
  <div className={`relative w-40 h-40 flex items-center justify-center transition-all ${isDancing ? 'animate-bounce' : 'animate-felipe'}`}>
    {isSpeaking && (
      <div className="absolute -top-10 -right-10 bg-white border-4 border-black p-2 rounded-xl text-xs font-bold animate-pulse shadow-md z-10 text-black">
        📢 SPEAKING...
      </div>
    )}
    {isLoadingAudio && (
      <div className="absolute -top-10 -left-10 bg-yellow-400 border-4 border-black p-2 rounded-xl text-xs font-bold animate-bounce shadow-md z-10 text-black">
        ⌛ LOADING SOUND...
      </div>
    )}
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
      <rect x="30" y="45" width="45" height="40" fill="#00a800" stroke="#000" strokeWidth="4" />
      <rect x="35" y="15" width="35" height="35" fill="#00ff00" stroke="#000" strokeWidth="4" />
      <rect x="42" y="30" width="8" height="10" fill="#000" />
      <rect x="58" y="30" width="8" height="10" fill="#000" />
      <rect x="40" y="60" width="25" height="5" fill="#000" opacity={isSpeaking ? "0.6" : "0.3"} className={isSpeaking ? "animate-pulse" : ""} />
    </svg>
  </div>
);

export default function App() {
  const [state, setState] = useState<GameState>({
    screen: 'intro', activeMission: 1, currentQuestionIndex: 0, userAnswer: '', attempts: 0, score: 0, hunger: 100,
    isNight: false, feedbackType: 'none', showExplanation: false, stamps: [], postcards: {}, diaries: {},
    isGeneratingPostcard: false, equippedAccessory: 'none', unlockedAccessories: ['none'],
    scrambleWords: [], selectedWords: [], chatHistory: [{ role: 'felipe', text: "Hello! Ready for an adventure?" }], dailyChallenge: ''
  });

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isFelipeSpeaking, setIsFelipeSpeaking] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const bgmIntervalRef = useRef<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const initAudio = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      return audioContextRef.current;
    } catch (e) {
      console.error("Audio Initialization Failed:", e);
      return null;
    }
  };

  const startBGM = async () => {
    const ctx = await initAudio();
    if (!ctx || bgmIntervalRef.current) return;

    const melody = [261, 329, 392, 523, 392, 329, 261, 329, 392, 523, 392, 329, 349, 440, 523, 698, 523, 440, 293, 392, 493, 587, 493, 392];
    let noteIdx = 0;

    bgmIntervalRef.current = window.setInterval(() => {
      if (!isMuted && state.screen !== 'intro' && audioContextRef.current && audioContextRef.current.state === 'running') {
        play8BitNote(audioContextRef.current, melody[noteIdx], 0.25, 'triangle', 0.02);
      }
      noteIdx = (noteIdx + 1) % melody.length;
    }, 250);
  };

  useEffect(() => {
    return () => {
      if (bgmIntervalRef.current) clearInterval(bgmIntervalRef.current);
    };
  }, []);

  const playTTS = async (text: string) => {
    if (!text) return;
    try {
      const ctx = await initAudio();
      if (!ctx) return;
      
      setIsLoadingAudio(true);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: { 
          responseModalities: [Modality.AUDIO], 
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } 
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer; 
        source.connect(ctx.destination);
        setIsLoadingAudio(false);
        setIsFelipeSpeaking(true);
        source.onended = () => setIsFelipeSpeaking(false);
        source.start();
      } else {
        setIsLoadingAudio(false);
      }
    } catch (error) { 
      console.error("TTS System Error:", error);
      setIsLoadingAudio(false);
      setIsFelipeSpeaking(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;
    const userMsg: ChatMessage = { role: 'user', text: inputMessage };
    setState(s => ({ ...s, chatHistory: [...s.chatHistory, userMsg] }));
    setInputMessage('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: { systemInstruction: FELIPE_SYSTEM_PROMPT }
      });
      
      const response = await chat.sendMessage({ message: inputMessage });
      const felipeMsg: ChatMessage = { role: 'felipe', text: response.text || "I'm thinking..." };
      setState(s => ({ ...s, chatHistory: [...s.chatHistory, felipeMsg] }));
      playTTS(felipeMsg.text);
    } catch (e) {
      const errorMsg: ChatMessage = { role: 'felipe', text: "Oh! My memory failed. Try again!" };
      setState(s => ({ ...s, chatHistory: [...s.chatHistory, errorMsg] }));
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.chatHistory]);

  const missionQs = useMemo(() => 
    QUESTIONS.filter(q => q.mission === state.activeMission), 
  [state.activeMission]);

  const isPuzzleLevel = state.activeMission === 5 || (state.currentQuestionIndex + 1) % 5 === 0;
  const isAudioLevel = state.activeMission === 6;

  useEffect(() => {
    if (state.screen === 'playing') {
      const currentQ = missionQs[state.currentQuestionIndex];
      if (isPuzzleLevel && state.activeMission !== 6) {
        let puzzleIdx = state.activeMission === 5 ? 8 + state.currentQuestionIndex : (state.activeMission - 1) * 2 + (state.currentQuestionIndex === 4 ? 0 : 1);
        const puzzleData = SCRAMBLE_QUESTIONS[puzzleIdx] || SCRAMBLE_QUESTIONS[0];
        setState(s => ({ ...s, scrambleWords: shuffle(puzzleData.sentence.split(' ')), selectedWords: [] }));
      } else if (currentQ) {
        setShuffledOptions(shuffle(currentQ.options));
        if (isAudioLevel) {
          // Pequena espera para asegurar que el navegador permite el audio tras el cambio de pantalla
          const timer = setTimeout(() => {
            playTTS(currentQ.text);
          }, 800);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [state.screen, state.currentQuestionIndex, state.activeMission, missionQs, isPuzzleLevel, isAudioLevel]);

  const Header = () => (
    <header className="w-full max-w-[500px] flex justify-between items-center p-4 mb-4 bg-black/50 border-4 border-black">
      <button onClick={() => setState(s => ({ ...s, screen: 'intro' }))} className="mario-button text-[12px] bg-red-600 text-white p-2 px-6">EXIT</button>
      <div className="flex items-center gap-4">
        <button onClick={() => setIsMuted(!isMuted)} className="text-2xl hover:scale-110 transition-transform">
          {isMuted ? '🔇' : '🔊'}
        </button>
        <span className="text-white font-bold text-[18px]">XP {state.score}</span>
      </div>
    </header>
  );

  if (state.screen === 'intro') return (
    <div className="game-container justify-center bg-[#5c94fc]">
      <div className="mario-panel p-10 max-w-[480px] w-full text-center">
        <h1 className="mc-logo text-2xl text-black mb-4">SUPER FELIPE XL</h1>
        <div className="bg-yellow-400 border-4 border-black inline-block px-8 py-3 mb-8 text-center">
          <h2 className="text-[16px] font-bold text-black uppercase">Adventure Edition</h2>
        </div>
        <div className="flex justify-center mb-8">
          <VoxelFelipe isSpeaking={isFelipeSpeaking} isLoadingAudio={isLoadingAudio} />
        </div>
        <div className="space-y-4">
          <button onClick={async () => { 
            const ctx = await initAudio();
            if (ctx) {
              playIntroTheme(ctx);
              startBGM();
              setState(s => ({ ...s, screen: 'mission_select' })); 
            }
          }} className="mario-button w-full text-[18px] py-6 bg-green-500 text-white uppercase font-black">START GAME</button>
          <button onClick={async () => { 
            await initAudio(); 
            startBGM(); 
            setState(s => ({ ...s, screen: 'chat' })); 
          }} className="mario-button w-full text-[14px] py-4 bg-sky-500 text-white uppercase font-black">TALK TO FELIPE</button>
          <button onClick={() => setState(s => ({ ...s, screen: 'passport' }))} className="mario-button w-full text-[12px] py-3 bg-yellow-400 text-black uppercase font-black">PASSPORT</button>
        </div>
      </div>
    </div>
  );

  if (state.screen === 'chat') return (
    <div className="game-container p-4 bg-sky-300">
      <Header />
      <div className="mario-panel w-full max-w-[500px] flex-1 bg-white mb-4 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-left">
          {state.chatHistory.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
              {m.role === 'felipe' && <div className="w-10 h-10 shrink-0 bg-green-200 border-2 border-black rounded-full flex items-center justify-center text-xl shadow-sm">🦖</div>}
              <div className={`max-w-[80%] p-4 border-4 border-black font-bold text-[16px] shadow-[4px_4px_0px_rgba(0,0,0,0.2)] ${m.role === 'user' ? 'bg-blue-100' : 'bg-yellow-50'}`}>
                {m.text}
              </div>
            </div>
          ))}
          {isTyping && <div className="text-gray-400 animate-pulse font-bold text-[14px] ml-12">Thinking...</div>}
          <div ref={chatEndRef} />
        </div>
        <div className="p-4 border-t-8 border-black bg-gray-100 flex gap-4">
          <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Write in English..." className="flex-1 border-4 border-black p-4 font-bold text-[16px] outline-none" />
          <button onClick={handleSendMessage} className="mario-button bg-green-500 text-white text-[16px] px-8">SEND</button>
        </div>
      </div>
    </div>
  );

  if (state.screen === 'mission_select') return (
    <div className="game-container p-8 bg-sky-400">
      <Header />
      <h2 className="mc-logo text-2xl mb-10 text-black text-center">SELECT WORLD</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-[500px]">
        {missions.map(m => {
          const done = state.stamps.includes(m.id);
          const prize = PRIZES.find(p => p.id === m.id);
          return (
            <button key={m.id} onClick={async () => {
              const ctx = await initAudio();
              setState(s => ({ ...s, screen: 'playing', activeMission: m.id, currentQuestionIndex: 0, showExplanation: false }));
              if (ctx) playTTS(`World ${m.id}: ${m.title}`);
            }} className={`mario-panel p-8 flex flex-col items-center gap-4 transition-transform active:scale-95 ${done ? 'bg-yellow-50 border-yellow-500' : 'bg-white'}`}>
              <span className="text-6xl">{m.icon}</span>
              <span className="text-[14px] font-bold uppercase">{m.title}</span>
              {done && (
                <div className="flex flex-col items-center mt-2 animate-pulse">
                  <span className="text-4xl">{prize?.icon}</span>
                  <span className="text-xs font-black text-yellow-700 uppercase mt-1">COMPLETED!</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  if (state.screen === 'playing') {
    const currentQ = missionQs[state.currentQuestionIndex];
    if (!currentQ && !isPuzzleLevel) return null;

    return (
      <div className="game-container p-4 bg-emerald-600">
        <Header />
        <main className="mario-panel w-full max-w-[500px] p-8 bg-white flex flex-col shadow-2xl min-h-[500px]">
          {isAudioLevel ? (
            <div className="flex flex-col items-center flex-1">
              <div className="bg-purple-600 text-white text-[16px] p-4 text-center font-bold mb-6 border-4 border-black shadow-[4px_4px_0px_#000] w-full uppercase">WORD HUNTER!</div>
              
              <div className="flex flex-col items-center gap-4 mb-8">
                 <VoxelFelipe isSpeaking={isFelipeSpeaking} isDancing={state.showExplanation} isLoadingAudio={isLoadingAudio} />
                 <button 
                   onClick={async () => {
                     await initAudio();
                     playTTS(currentQ.text);
                   }} 
                   disabled={isLoadingAudio || isFelipeSpeaking}
                   className={`mario-button ${isLoadingAudio ? 'bg-gray-300' : 'bg-yellow-400'} p-4 rounded-full transition-all active:scale-90`}
                 >
                    <span className="text-3xl">🔊 REPEAT SOUND</span>
                 </button>
                 <p className="text-[14px] font-bold text-gray-400 uppercase tracking-widest mt-2">Listen carefully!</p>
              </div>

              <div className="grid grid-cols-2 gap-6 w-full flex-1">
                {shuffledOptions.map((o, i) => (
                  <button key={i} disabled={state.showExplanation} onClick={async () => {
                    const ctx = await initAudio();
                    if (ctx && o === currentQ.correctAnswer) {
                       playMarioCoin(ctx);
                       setState(s => ({ ...s, score: s.score + 15, showExplanation: true, userAnswer: o }));
                       playTTS(`Correct! This is a ${currentQ.text}`); 
                    } else if (ctx) {
                       play8BitNote(ctx, 110, 0.2, 'sawtooth', 0.1);
                    }
                  }} className={`mario-button flex items-center justify-center py-10 text-7xl transition-all ${state.showExplanation && o === currentQ.correctAnswer ? 'bg-green-300 border-green-800 scale-105' : 'bg-gray-50 hover:bg-white'}`}>
                    {o}
                  </button>
                ))}
              </div>

              {state.showExplanation && (
                <div className="mt-8 p-6 bg-yellow-400 border-4 border-black text-center w-full rounded-xl animate-bounce shadow-[4px_4px_0px_#000]">
                  <p className="text-3xl font-bold mb-2 uppercase italic text-black">"{currentQ.text}"</p>
                  <p className="text-[16px] font-bold mb-4 text-blue-900">({currentQ.translation})</p>
                  <button onClick={() => {
                    if (state.currentQuestionIndex === 9) setState(s => ({ ...s, screen: 'game_over', stamps: [...new Set([...s.stamps, s.activeMission])] }));
                    else setState(s => ({ ...s, currentQuestionIndex: s.currentQuestionIndex + 1, showExplanation: false }));
                  }} className="mario-button w-full text-[14px] py-4 bg-blue-600 text-white uppercase font-black">NEXT CHALLENGE »</button>
                </div>
              )}
            </div>
          ) : isPuzzleLevel && state.activeMission !== 6 ? (
            <div className="flex flex-col">
              <div className="bg-orange-500 text-white text-[16px] p-5 text-center font-bold mb-8 border-4 border-black shadow-[6px_6px_0px_#000] uppercase">PUZZLE!</div>
              <p className="text-center font-bold text-[14px] text-gray-400 uppercase mb-3">Translate to English:</p>
              <div className="bg-blue-100 p-6 border-4 border-black mb-8 text-center rounded-xl shadow-inner">
                 <p className="font-bold text-3xl text-blue-900 leading-tight">"{SCRAMBLE_QUESTIONS[state.activeMission === 5 ? 8 + state.currentQuestionIndex : (state.activeMission - 1) * 2 + (state.currentQuestionIndex === 4 ? 0 : 1)]?.translation}"</p>
              </div>
              <div className="bg-yellow-50 p-6 min-h-[120px] border-4 border-black border-dashed mb-10 flex flex-wrap gap-3 justify-center content-start rounded-xl">
                {state.selectedWords.map((w, i) => <span key={i} className="bg-white border-2 border-black px-4 py-2 text-xl font-bold shadow-[3px_3px_0px_#000]">{w}</span>)}
              </div>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {state.scrambleWords.map((w, i) => (
                  <button key={i} onClick={async () => {
                    const ctx = await initAudio();
                    const currentPuzzle = SCRAMBLE_QUESTIONS[state.activeMission === 5 ? 8 + state.currentQuestionIndex : (state.activeMission - 1) * 2 + (state.currentQuestionIndex === 4 ? 0 : 1)];
                    const correctWords = (currentPuzzle?.sentence || "").split(' ');
                    if (w === correctWords[state.selectedWords.length]) {
                      const newSelected = [...state.selectedWords, w];
                      setState(s => ({ ...s, selectedWords: newSelected, scrambleWords: s.scrambleWords.filter((_, idx) => idx !== i) }));
                      if (ctx && newSelected.length === correctWords.length) {
                        playMarioCoin(ctx);
                        setState(s => ({ ...s, score: s.score + 50 }));
                        playTTS(correctWords.join(' ')); 
                        setTimeout(() => {
                           if (state.currentQuestionIndex === 9) setState(s => ({ ...s, screen: 'game_over', stamps: [...new Set([...s.stamps, s.activeMission])] }));
                           else setState(s => ({ ...s, currentQuestionIndex: s.currentQuestionIndex + 1 }));
                        }, 2500);
                      }
                    } else if (ctx) {
                      play8BitNote(ctx, 110, 0.4, 'sawtooth', 0.1);
                      setState(s => ({ ...s, selectedWords: [], scrambleWords: shuffle(correctWords) }));
                    }
                  }} className="mario-button text-[16px] py-5 uppercase font-bold">{w}</button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center gap-8 mb-10">
                <VoxelFelipe isDancing={state.showExplanation} isSpeaking={isFelipeSpeaking} isLoadingAudio={isLoadingAudio} />
                <div className="bg-sky-50 border-4 border-black p-6 w-full text-black font-bold text-2xl text-center rounded-2xl min-h-[100px] flex items-center justify-center">
                  {state.showExplanation ? currentQ.text.replace('________', currentQ.correctAnswer) : currentQ.text}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {shuffledOptions.map((o, i) => (
                  <button key={i} disabled={state.showExplanation} onClick={async () => {
                    const ctx = await initAudio();
                    if (ctx && o === currentQ.correctAnswer) {
                       playMarioCoin(ctx);
                       setState(s => ({ ...s, score: s.score + 10, showExplanation: true, userAnswer: o }));
                       playTTS(currentQ.text.replace('________', currentQ.correctAnswer)); 
                    } else if (ctx) {
                       play8BitNote(ctx, 110, 0.2, 'sawtooth', 0.1);
                    }
                  }} className={`mario-button text-[16px] py-8 ${state.showExplanation && o === currentQ.correctAnswer ? 'bg-green-400 text-white' : 'bg-white'}`}>
                    {o}
                  </button>
                ))}
              </div>
              {state.showExplanation && (
                <div className="mt-10 p-6 bg-yellow-400 border-4 border-black text-center rounded-2xl animate-bounce shadow-[4px_4px_0px_#000]">
                  <p className="text-[14px] font-bold mb-6 uppercase italic">"{currentQ.translation}"</p>
                  <button onClick={() => setState(s => ({ ...s, currentQuestionIndex: s.currentQuestionIndex + 1, showExplanation: false }))} 
                    className="mario-button w-full text-[16px] py-5 bg-blue-600 text-white uppercase font-black">CONTINUE »</button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    );
  }

  if (state.screen === 'game_over') {
    const prize = PRIZES.find(p => p.id === state.activeMission);
    return (
      <div className="game-container justify-center bg-black p-10">
        <div className="mario-panel p-16 text-center max-w-[480px] w-full bg-white border-8 border-black">
          <h2 className="mc-logo text-emerald-600 mb-8 text-3xl animate-bounce">WORLD CLEAR!</h2>
          <div className="flex flex-col items-center gap-4 mb-10">
            <span className="text-8xl drop-shadow-lg">{prize?.icon}</span>
            <span className="text-xl font-black uppercase text-yellow-600">{prize?.name}</span>
          </div>
          <VoxelFelipe isDancing={true} />
          <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="mario-button w-full py-10 text-[24px] bg-orange-600 text-white font-black mt-10">MAP SELECT</button>
        </div>
      </div>
    );
  }

  if (state.screen === 'passport') return (
    <div className="game-container p-10 bg-orange-100">
      <Header />
      <h2 className="mc-logo text-2xl mb-12 text-black text-center">TRAVELLER PASSPORT</h2>
      <div className="mario-panel w-full max-w-[500px] p-10 bg-white shadow-[15px_15px_0px_#8b4513]">
        <div className="flex items-center gap-10 mb-12 border-b-8 border-black pb-10">
          <VoxelFelipe isSpeaking={isFelipeSpeaking} />
          <div className="text-left">
             <p className="text-[14px] text-gray-400 font-bold uppercase">TRAVELLER</p>
             <p className="text-3xl font-bold uppercase">FELIPE & GUILLE</p>
             <p className="text-2xl font-bold text-red-600 mt-2">TOTAL XP: {state.score}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {missions.map(m => {
            const done = state.stamps.includes(m.id);
            const prize = PRIZES.find(p => p.id === m.id);
            return (
              <div key={m.id} className={`p-6 border-4 border-black flex flex-col items-center transition-all rounded-lg ${done ? 'bg-yellow-200 scale-110 shadow-lg' : 'bg-gray-100 opacity-20 grayscale'}`}>
                <span className="text-4xl">{done ? prize?.icon : m.icon}</span>
                <span className="text-[10px] font-black uppercase mt-4">W-{m.id}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return null;
}
