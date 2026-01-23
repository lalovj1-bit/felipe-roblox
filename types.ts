
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
export type GameScreen = 'intro' | 'mission_select' | 'syncing' | 'playing' | 'scramble' | 'game_over' | 'passport';

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
  scrambleWords: string[];
  selectedWords: string[];
  stamps: number[]; 
  postcards: Record<number, string>; // Mapa de misión ID -> URL de imagen
  isGeneratingPostcard: boolean;
  viewingPostcardId?: number;
}
