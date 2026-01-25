
export interface Question {
  id: number;
  mission: number;
  text: string;
  options: string[];
  correctAnswer: string;
  hint: string;
  explanation: string;
  translation: string;
}

export interface ScrambleQuestion {
  id: number;
  sentence: string;
  translation: string;
}

export type FeedbackType = 'none' | 'success' | 'hint' | 'error';
export type GameScreen = 'intro' | 'mission_select' | 'playing' | 'summary' | 'passport' | 'chat' | 'settings';

export type Accessory = 'none' | 'sunglasses' | 'safari_hat' | 'pilot_headset' | 'party_ears' | 'camera';

export interface ChatMessage {
  role: 'user' | 'felipe';
  text: string;
}

export interface VolumeSettings {
  bgm: number;
  sfx: number;
  voice: number;
}

export interface GameState {
  screen: GameScreen;
  activeMission: number;
  currentQuestionIndex: number; 
  userAnswer: string;
  attempts: number;
  score: number;
  coins: number;
  errorsInMission: number;
  missionStars: Record<number, number>; // missionId -> 1, 2, or 3 stars
  isNight: boolean;
  feedbackType: FeedbackType;
  showExplanation: boolean;
  stamps: number[]; // Completed mission IDs
  unlockedAccessories: Accessory[];
  equippedAccessory: Accessory;
  scrambleWords: string[];
  selectedWords: string[];
  chatHistory: ChatMessage[];
  volumeSettings: VolumeSettings;
}
