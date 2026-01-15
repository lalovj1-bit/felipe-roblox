export interface Question {
  id: number;
  mission: number;
  text: string;
  options: string[];
  correctAnswer: string;
  hint: string;
  explanation: string;
  translation: string;
  audioUrl?: string; // Campo opcional para audios pre-cargados (locales o remotos)
}

export type FeedbackType = 'none' | 'success' | 'hint' | 'error';
export type GameScreen = 'intro' | 'mission_select' | 'syncing' | 'playing' | 'game_over';

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
  syncProgress: number; // Progreso de carga de audios (0-100)
}
