import { frequencies } from './frequencyCourse.ts';
import { LOCAL_LEARNING_STORAGE_KEYS } from '../../lib/localLearningStorage.ts';

export const STORY_DATA = [23, 12, 35, 20, 18, 30, 29, 23];
export const OTHER_CLASS_DATA = [19, 34, 20, 10, 39, 28, 31, 15, 30];
export const STORY_NAMES = ['민서', '지우', '서준', '하린', '도윤', '수아', '예준', '유진'];
export const STORY_STORAGE_KEY = LOCAL_LEARNING_STORAGE_KEYS.frequencyStory;

export function storyRange(value: number): number | null {
  if (!Number.isFinite(value) || value < 10 || value >= 40) return null;
  return Math.floor((value - 10) / 10);
}

export function placeStoryCard(placed: Record<number, number>, card: number, range: number): Record<number, number> {
  if (!Number.isInteger(card) || card < 0 || card >= STORY_DATA.length || placed[card] !== undefined || storyRange(STORY_DATA[card]) !== range) return placed;
  return { ...placed, [card]: range };
}

export function checkStoryReport(data: number[], answers: string[], includeTable: boolean): boolean {
  const counts = frequencies(data);
  const numbers = includeTable ? answers.slice(0, 3) : [];
  if (includeTable && (numbers.length !== 3 || !counts.every((count,index) => numbers[index]?.trim() !== '' && Number(numbers[index]) === count))) return false;
  const offset = includeTable ? 3 : 0;
  return answers[offset]?.trim() !== '' && Number(answers[offset]) === counts[2]
    && answers[offset + 1] === String(counts.indexOf(Math.max(...counts)));
}
