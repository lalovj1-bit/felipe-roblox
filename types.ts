
export interface Question {
  id: number;
  mission: number;
  text: string;
  options: string[];
  correctAnswer: string;
  hint: string;
  explanation: string;
  translation: string;
  type?: 'mcq' | 'writing' | 'scramble';
}

export type GameScreen = 'intro' | 'mission_select' | 'playing' | 'summary' | 'settings' | 'shelf';

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
  missionStars: Record<number, number>;
  isNight: boolean;
  feedbackType: 'none' | 'success' | 'error';
  showExplanation: boolean;
  stamps: number[];
  scrambleWords: string[];
  selectedWords: string[];
  volumeSettings: VolumeSettings;
}
