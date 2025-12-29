
export type LotteryRegion = 'KR' | 'US' | 'AS';

export enum LotteryType {
  KR_LOTTO = 'KR_LOTTO', // 6/45
  US_POWERBALL = 'US_POWERBALL', // 5/69 + 1/26
  US_MEGA_MILLIONS = 'US_MEGA_MILLIONS', // 5/70 + 1/25
  SG_TOTO = 'SG_TOTO', // 6/49 + 1
  HK_MARK_SIX = 'HK_MARK_SIX' // 6/49 + 1
}

export interface PastResult {
  round: string;
  numbers: number[];
  bonus?: number;
  date: string;
  sources?: { title: string; url: string }[];
}

export interface LottoResult {
  id: string;
  numbers: number[];
  bonusNumber?: number;
  date: string;
  type: 'random' | 'ai';
  lotteryType: LotteryType;
  round: number;
  message?: string;
  analysis?: string;
}

export enum Tab {
  RANDOM = 'RANDOM',
  AI = 'AI',
  HISTORY = 'HISTORY'
}

export interface BallProps {
  number: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  isSpecial?: boolean;
}
