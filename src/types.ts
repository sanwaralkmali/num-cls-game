export type NumberCategory = 
  | 'complex'
  | 'imaginary'
  | 'rational'
  | 'irrational'
  | 'real'
  | 'whole'
  | 'natural';

export interface NumberCard {
  id: string;
  value: string;
  correctCategory: NumberCategory;
}

export interface CategoryDropzone {
  id: NumberCategory;
  label: string;
  description: string;
}

export type GameState = 'instructions' | 'start' | 'playing' | 'results' | 'gameOver';

export interface Question {
  number: string;
  correctCategory: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
} 