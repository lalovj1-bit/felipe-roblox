import React, { useState, useRef, useMemo } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { QUESTIONS } from './constants';
import { GameState, Question } from './types';

// --- HELPERS PARA AUDIO PCM ---
const decodeBase64 = (base64: string) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
};

const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) => {
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.length / 2);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};

// --- COMPONENTE FELIPE VOXEL ---
const VoxelFelipe = ({ isActive }: { isActive: boolean }) => (
  <div className={`relative w-48 h-48 flex items-center justify-center transition-all duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}>
    <div className="absolute inset-0 bg-cyan-400/10 blur-[60px] rounded-full"></div>
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]">
      <rect x="35" y="15" width="40" height="30" fill="#a3e635" stroke="#000" strokeWidth="2" />
      <rect x="30" y="25" width="50" height="15" fill="#a3e635" stroke="#000" strokeWidth="2" />
      <rect x="65" y="25" width="8" height="8" fill="#000" />
      <rect x="68" y="27" width="3" height="3" fill="#fff" />
      <rect x="25" y="45" width="35" height="40" fill="#a3e635" stroke="#000" strokeWidth="2" />
      <rect x="5" y="70" width="20" height="10" fill="#a3e635" stroke="#000" strokeWidth="1.5" />
      <rect x="15" y="60" width="10" height="10" fill="#a3e635" stroke="#000" strokeWidth="1.5" />
      <rect x="25" y="85" width="12" height="10" fill="#84cc16" stroke="#000" strokeWidth="2" />
      <rect x="48" y="85" width="12" height="10" fill="#84cc16" stroke="#000" strokeWidth="2" />
      <rect x="32" y="10" width="8" height="35" fill="#22d3ee" stroke="#000" strokeWidth="2" />
      <rect x="32" y="10" width="25" height="6" fill="#22d3ee" stroke="#000" strokeWidth="2" />
      <rect x="34" y="30" width="4" height="6" fill="#f472b6" className={isActive ? "animate-pulse" : ""} />
    </svg>
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden rounded-full">
      <div className="scan-line"></div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [state, setState] = useState<GameState>({
    gameStarted: false,
    activeMission: 1,
    currentQuestionIndex: 0,
    userAnswer: '',
    attempts: 0,
    score: 0,
    feedbackType: 'none',
    feedbackMessage: '',
    isGameOver: false,
    showExplanation: false,
  });

  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const initAudio = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  const playTTS = async (text: string) => {
    const ctx = await initAudio();
    setIsLoadingAudio(true);
    try {
      // Usar process.env.API_KEY directamente, Vite se encarga del reemplazo
      const apiKey = process.env.API_KEY || '';
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } },
        },
      });
      const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64) {
        const buffer = await decodeAudioData(decodeBase64(base64), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
      }
    } catch (e) {
      console.error("Audio Error:", e);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const currentQuestions = useMemo(() => 
    QUESTIONS.filter((q: Question) => q.mission === state.activeMission), 
    [state.activeMission]
  );
  
  const currentQuestion = currentQuestions[state.currentQuestionIndex];

  const handleOptionClick = (option: string) => {
    if (state.showExplanation) return;
    const isCorrect = option === currentQuestion.correctAnswer;
    if (isCorrect) {
      setState(s => ({ 
        ...s, 
        userAnswer: option, 
        score: s.score + 10, 
        feedbackType: 'success', 
        feedbackMessage: 'MISSION CLEARED!', 
        showExplanation: true 
      }));
      playTTS(`Great! ${option} is correct.`);
    } else {
      setState(s => ({ 
        ...s, 
        userAnswer: option, 
        feedbackType: 'error', 
        feedbackMessage: 'WRONG CODE!',
        attempts: s.attempts + 1 
      }));
    }
  };

  if (!state.gameStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="voxel-card p-12 max-w-md w-full text-center relative border-cyan-400/40 border-2">
          <div className="flex justify-center mb-10">
            <VoxelFelipe isActive={false} />
          </div>
          <h1 className="text-6xl font-black italic tracking-tighter mb-4 neon-text text-white leading-none">
            FELIPE<br/><span className="text-lime-400">QUEST</span>
          </h1>
          <p className="mono text-[10px] text-cyan-400/60 uppercase tracking-[0.4em] mb-12">Roblox_Dino_Engine v2.1</p>
          <button 
            onClick={() => { initAudio(); setState(s => ({ ...s, gameStarted: true })); }}
            className="w-full roblox-btn py-6 text-2xl"
          >
            INITIALIZE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4">
      <header className="w-full max-w-xl flex justify-between items-center mb-8 px-4">
        <div>
          <h2 className="text-xl font-black text-cyan-400 italic">MISSION_DASH</h2>
          <p className="mono text-[8px] text-pink-500 uppercase tracking-widest">Signal: Stable</p>
        </div>
        <div className="voxel-card px-6 py-2 border-cyan-400/30">
          <span className="mono text-xs text-cyan-400">XP: </span>
          <span className="text-2xl font-black text-white">{state.score.toString().padStart(4, '0')}</span>
        </div>
      </header>

      <main className="w-full max-w-xl voxel-card p-8 md:p-12 relative overflow-hidden">
        {state.isGameOver ? (
          <div className="text-center py-12">
            <h2 className="text-4xl font-black text-lime-400 mb-8 italic">MISSION CLEAR!</h2>
            <div className="text-9xl mb-12 animate-bounce">🦖</div>
            <button onClick={() => window.location.reload()} className="roblox-btn w-full py-6">RESTART_SYSTEM</button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-8">
              <span className="bg-black border border-cyan-400/50 text-cyan-400 px-3 py-1 rounded mono text-[10px]">TASK_{state.currentQuestionIndex + 1}</span>
              <div className="w-32 h-2 bg-slate-900 overflow-hidden">
                <div className="h-full bg-cyan-400 transition-all duration-500" style={{ width: `${((state.currentQuestionIndex + 1) / currentQuestions.length) * 100}%` }}></div>
              </div>
            </div>

            <div className="flex justify-center mb-8">
               <VoxelFelipe isActive={state.showExplanation} />
            </div>

            <h3 className="text-2xl md:text-3xl font-bold text-white mb-10 leading-tight text-center">
              {currentQuestion.text.split('________').map((part, i, arr) => (
                <React.Fragment key={i}>
                  {part}{i < arr.length - 1 && <span className="text-pink-500 border-b-4 border-pink-500/40 mx-2">{state.userAnswer || "____"}</span>}
                </React.Fragment>
              ))}
            </h3>

            <div className="flex justify-center mb-10">
              <button 
                onClick={() => playTTS(currentQuestion.text)}
                disabled={isLoadingAudio}
                className="bg-black border-2 border-cyan-400/40 text-cyan-400 px-6 py-2 mono text-[10px] uppercase hover:bg-cyan-900 flex items-center gap-2"
              >
                {isLoadingAudio ? 'SYNCING...' : '🔊 Play_Audio'}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-8">
              {currentQuestion.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleOptionClick(opt)}
                  disabled={state.showExplanation}
                  className={`p-5 border-4 font-black text-left transition-all uppercase tracking-tight text-lg ${
                    state.userAnswer === opt 
                      ? 'bg-cyan-400 border-black text-black' 
                      : 'bg-black/40 border-black text-white hover:border-cyan-400'
                  }`}
                >
                  <span className="mono opacity-30 mr-4">0{i+1}</span> {opt}
                </button>
              ))}
            </div>

            {state.showExplanation && (
              <div className="mt-8 p-6 bg-lime-400 border-4 border-black text-black">
                <h4 className="font-black text-xl mb-2 italic">ACCESS GRANTED!</h4>
                <p className="text-2xl font-black mb-1 uppercase">{currentQuestion.translation}</p>
                <p className="mono text-[10px] font-bold opacity-70 mb-6 uppercase">"{currentQuestion.explanation}"</p>
                <button 
                  onClick={() => {
                    if (state.currentQuestionIndex + 1 < currentQuestions.length) {
                      setState(s => ({ ...s, currentQuestionIndex: s.currentQuestionIndex + 1, userAnswer: '', showExplanation: false }));
                    } else {
                      setState(s => ({ ...s, isGameOver: true }));
                    }
                  }}
                  className="w-full bg-black text-white py-4 font-black uppercase text-sm border-2 border-black"
                >
                  NEXT_OBJECTIVE >>
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="mt-12 mono text-[9px] text-cyan-400/20 uppercase tracking-[0.5em] text-center">
        Roblox_Dino_Core // build_ver_2.1.0_prod
      </footer>
    </div>
  );
};

export default App;