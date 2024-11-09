export type BatchScriptBundle = {
  hack: string;
  grow: string;
  weaken: string;
  all: string[];
};
export type BatchThreads = {
  hackThreads: number;
  w1Threads: number;
  w2Threads: number;
  growThreads: number;
  totalThreads: number;
};
export type PrepThreads = {
  growThreads: number;
  weakenThreads: number;
};
export type BatchWorkerScript = {
  hack: string;
  grow: string;
  weaken: string;
  all: string[];
};
export type Server = {
  hostname: string;
  maxMoney: number;
  minSecurityLevel: number;
  currentMoney: number;
  currentSecurityLevel: number;
};

export type HackResult = {
  success: boolean;
  moneyGained: number;
  securityIncreased: number;
};

export type GrowResult = {
  success: boolean;
  moneyGained: number;
  securityIncreased: number;
};

export type WeakenResult = {
  success: boolean;
  securityDecreased: number;
};