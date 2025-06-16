import { LeaderboardEntry } from '../types';

const LEADERBOARD_KEY = 'number_classification_leaderboard';

export const saveToLeaderboard = async (entry: LeaderboardEntry): Promise<void> => {
  try {
    // Get current leaderboard from localStorage
    const currentData = localStorage.getItem(LEADERBOARD_KEY);
    const entries: LeaderboardEntry[] = currentData ? JSON.parse(currentData) : [];
    
    // Add new entry
    entries.push(entry);
    
    // Sort by score (highest first) and keep only top 10
    entries.sort((a, b) => b.score - a.score);
    const topEntries = entries.slice(0, 10);
    
    // Save back to localStorage
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(topEntries));
  } catch (error) {
    console.error('Error saving to leaderboard:', error);
  }
};

export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  try {
    const data = localStorage.getItem(LEADERBOARD_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return [];
  }
}; 