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

export type FeedbackType = 'none' | 'success' | 'hint' | 'error';
export type GameScreen = 'intro' | 'mission_select' | 'playing' | 'game_over';

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
}
