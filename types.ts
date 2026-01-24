
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
export type GameScreen = 'intro' | 'mission_select' | 'syncing' | 'playing' | 'game_over' | 'passport';

export type Accessory = 'none' | 'sunglasses' | 'safari_hat' | 'pilot_headset' | 'party_ears' | 'camera';

export interface GameState {
  screen: GameScreen;
  activeMission: number;
  currentQuestionIndex: number; 
  userAnswer: string;
  attempts: number;
  score: number;
  feedbackType: FeedbackType;
  feedbackMessage: string;
  showExplanation: boolean;
  syncProgress: number;
  stamps: number[]; 
  postcards: Record<number, string>; 
  diaries: Record<number, string>;
  isGeneratingPostcard: boolean;
  viewingPostcardId?: number;
  equippedAccessory: Accessory;
  unlockedAccessories: Accessory[];
  // Scramble mode state
  scrambleWords: string[];
  selectedWords: string[];
}
