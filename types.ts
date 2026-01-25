
export interface Question {
  id: number;
  mission: number;
  text: string;
  options: string[];
  correctAnswer: string;
  hint: string;
  explanation: string;
  translation: string;
  audioUrl?: string;
}

export interface ScrambleQuestion {
  id: number;
  sentence: string;
  translation: string;
}

export type FeedbackType = 'none' | 'success' | 'hint' | 'error';
export type GameScreen = 'intro' | 'mission_select' | 'playing' | 'game_over' | 'passport' | 'chat';

export type Accessory = 'none' | 'sunglasses' | 'safari_hat' | 'pilot_headset' | 'party_ears' | 'camera';

export interface ChatMessage {
  role: 'user' | 'felipe';
  text: string;
}

export interface GameState {
  screen: GameScreen;
  activeMission: number;
  currentQuestionIndex: number; 
  userAnswer: string;
  attempts: number;
  score: number;
  hunger: number; // 0 to 100
  isNight: boolean;
  feedbackType: FeedbackType;
  showExplanation: boolean;
  stamps: number[]; 
  postcards: Record<number, string>; 
  diaries: Record<number, string>;
  isGeneratingPostcard: boolean;
  equippedAccessory: Accessory;
  unlockedAccessories: Accessory[];
  scrambleWords: string[];
  selectedWords: string[];
  chatHistory: ChatMessage[];
  dailyChallenge: string;
}
