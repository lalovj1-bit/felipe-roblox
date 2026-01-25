
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { QUESTIONS, PRIZES, FELIPE_SYSTEM_PROMPT } from './constants';
import { GameState, ChatMessage, Accessory } from './types';

function decodeBase64(base64: string) {
  const binaryString = window.atob(base64);
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

const missionIcons = ['💻', '🛹', '🏆', '🌲', '🌌', '🔊', '🍕', '⏰'];
const missionTitles = ['Pixel Academy', 'Adventure Street', 'Olympic Arena', 'Deep Woods', 'Star Voyager', 'Word Hunter', 'Yummy Yard', 'Dino Dungeon'];

const playSynthNote = (ctx: AudioContext, freq: number, duration: number, volume = 0.05) => {
  if (!ctx || ctx.state !== 'running') return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
};

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

const VoxelFelipe = ({ isDancing, isSpeaking, isLoadingAudio }: { isDancing?: boolean, isSpeaking?: boolean, isLoadingAudio?: boolean }) => (
  <div className={`relative w-40 h-40 flex items-center justify-center transition-all ${isDancing ? 'animate-bounce' : 'animate-felipe'}`}>
    {isSpeaking && <div className="absolute -top-12 bg-white border-4 border-black px-3 py-1 rounded-full text-[10px] font-bold animate-pulse z-10 text-black mc-logo">SPEAKING!</div>}
    {isLoadingAudio && <div className="absolute -top-12 bg-yellow-400 border-4 border-black px-3 py-1 rounded-full text-[10px] font-bold animate-bounce z-10 text-black mc-logo">LOADING...</div>}
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
      <rect x="30" y="45" width="45" height="40" fill="#00a800" stroke="#000" strokeWidth="4" />
      <rect x="35" y="15" width="35" height="35" fill="#00ff00" stroke="#000" strokeWidth="4" />
      <rect x="42" y="30" width="8" height="10" fill="#000" />
      <rect x="58" y="30" width="8" height="10" fill="#000" />
      <rect x="40" y="60" width="25" height="5" fill="#000" opacity={isSpeaking ? "0.8" : "0.3"} />
    </svg>
  </div>
);

export default function App() {
  const [state, setState] = useState<GameState>({
    screen: 'intro', activeMission: 1, currentQuestionIndex: 0, userAnswer: '', attempts: 0, score: 0, hunger: 100,
    isNight: false, feedbackType: 'none', showExplanation: false, stamps: [], postcards: {}, diaries: {},
    isGeneratingPostcard: false, equippedAccessory: 'none', unlockedAccessories: ['none'],
    scrambleWords: [], selectedWords: [], chatHistory: [{ role: 'felipe', text: "Hello! Ready for adventure?" }], dailyChallenge: ''
  });

  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [isFelipeSpeaking, setIsFelipeSpeaking] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const ensureAudioContext = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  const playTTS = async (text: string) => {
    if (!text) return;
    try {
      const ctx = await ensureAudioContext();
      setIsLoadingAudio(true);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: { 
          responseModalities: [Modality.AUDIO], 
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } } } 
        },
      });

      const audioPart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (audioPart?.inlineData?.data) {
        const audioBuffer = await decodeAudioData(decodeBase64(audioPart.inlineData.data), ctx, 24000, 1);
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
      console.error("TTS Error:", error);
      setIsLoadingAudio(false);
    }
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
          setShuffledOptions(shuffle([q.correctAnswer, "Dog", "Blue", "Apple"]));
        } else {
          setState(s => ({ ...s, scrambleWords: shuffle(q.correctAnswer.split(' ')), selectedWords: [] }));
        }
        playTTS(q.text);
      }
    }
  }, [state.screen, state.currentQuestionIndex, state.activeMission]);

  const handleNext = async () => {
    await ensureAudioContext();
    if (state.currentQuestionIndex >= 9) {
      setState(s => ({ ...s, screen: 'game_over', stamps: [...new Set([...s.stamps, s.activeMission])] }));
    } else {
      setState(s => ({ ...s, currentQuestionIndex: s.currentQuestionIndex + 1, showExplanation: false }));
    }
  };

  if (state.screen === 'intro') return (
    <div className="game-container justify-center bg-[#5c94fc]">
      <div className="mario-panel p-10 max-w-[480px] w-full text-center">
        <h1 className="mc-logo text-xl mb-6 text-black">SUPER FELIPE XL</h1>
        <VoxelFelipe isSpeaking={isFelipeSpeaking} isLoadingAudio={isLoadingAudio} />
        <button onClick={async () => { await ensureAudioContext(); setState(s => ({ ...s, screen: 'mission_select' })); }} className="mario-button w-full mt-8 bg-green-500 text-white mc-logo">START</button>
      </div>
    </div>
  );

  if (state.screen === 'mission_select') return (
    <div className="game-container bg-sky-400 p-6">
      <h2 className="mc-logo text-black mb-6">WORLD MAP</h2>
      <div className="grid grid-cols-2 gap-4 w-full max-w-[500px]">
        {Array.from({ length: 8 }).map((_, i) => {
          const missionId = i + 1;
          const isDone = state.stamps.includes(missionId);
          return (
            <button key={i} onClick={async () => {
              await ensureAudioContext();
              setState(s => ({ ...s, screen: 'playing', activeMission: missionId, currentQuestionIndex: 0, showExplanation: false }));
            }} className={`mario-panel p-4 flex flex-col items-center gap-2 ${isDone ? 'bg-yellow-100' : 'bg-white'}`}>
              <span className="text-4xl">{missionIcons[i]}</span>
              <span className="text-[10px] font-bold mc-logo">{missionTitles[i]}</span>
              {isDone && <span className="text-green-600 font-bold">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );

  if (state.screen === 'playing') {
    const q = currentMissionQs[state.currentQuestionIndex];
    const isScramble = state.currentQuestionIndex >= 5;

    return (
      <div className="game-container bg-emerald-600 p-4">
        <div className="mario-panel w-full max-w-[500px] p-6 bg-white min-h-[500px] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold">M{state.activeMission} - Q{state.currentQuestionIndex + 1}/10</span>
            <span className="text-blue-600 font-bold">XP {state.score}</span>
          </div>

          <VoxelFelipe isDancing={state.showExplanation} isSpeaking={isFelipeSpeaking} isLoadingAudio={isLoadingAudio} />
          
          <div className="bg-sky-50 p-4 border-2 border-black rounded-lg my-4 text-center font-bold min-h-[80px] flex items-center justify-center">
            {isScramble ? q.translation : q.text}
          </div>

          <button onClick={() => playTTS(isScramble ? q.correctAnswer : q.text)} className="mario-button bg-yellow-400 py-2 mb-4 text-sm">🔊 REPEAT</button>

          {!isScramble ? (
            <div className="grid grid-cols-2 gap-3">
              {shuffledOptions.map((o, i) => (
                <button key={i} disabled={state.showExplanation} onClick={async () => {
                  await ensureAudioContext();
                  if (o === q.correctAnswer) {
                    setState(s => ({ ...s, score: s.score + 10, showExplanation: true }));
                    playSynthNote(audioContextRef.current!, 987, 0.1);
                  } else {
                    playSynthNote(audioContextRef.current!, 110, 0.2);
                  }
                }} className={`mario-button text-xs ${state.showExplanation && o === q.correctAnswer ? 'bg-green-400' : 'bg-white'}`}>{o}</button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="bg-gray-100 p-3 min-h-[60px] border-2 border-black flex flex-wrap gap-2">
                {state.selectedWords.map((w, i) => <span key={i} className="bg-white px-2 border-2 border-black">{w}</span>)}
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {state.scrambleWords.map((w, i) => (
                  <button key={i} onClick={() => {
                    const newSelected = [...state.selectedWords, w];
                    const newScramble = state.scrambleWords.filter((_, idx) => idx !== i);
                    setState(s => ({ ...s, selectedWords: newSelected, scrambleWords: newScramble }));
                    if (newSelected.join(' ') === q.correctAnswer) {
                      setState(s => ({ ...s, score: s.score + 15, showExplanation: true }));
                    }
                  }} className="mario-button text-xs py-2">{w}</button>
                ))}
              </div>
            </div>
          )}

          {state.showExplanation && (
            <div className="mt-auto pt-4 border-t-4 border-black text-center">
              <p className="text-sm font-bold text-green-700 mb-2">"{q.correctAnswer}"</p>
              <button onClick={handleNext} className="mario-button bg-blue-500 text-white w-full py-2">NEXT »</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (state.screen === 'game_over') return (
    <div className="game-container justify-center bg-black">
      <div className="mario-panel p-10 text-center text-black">
        <h2 className="mc-logo text-emerald-600 mb-4">WORLD CLEAR!</h2>
        <span className="text-6xl mb-6 block">{PRIZES[state.activeMission - 1]?.icon}</span>
        <button onClick={() => setState(s => ({ ...s, screen: 'mission_select' }))} className="mario-button w-full bg-orange-500 text-white mc-logo">MAP</button>
      </div>
    </div>
  );

  return null;
}
