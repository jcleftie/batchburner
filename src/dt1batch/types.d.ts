// types.d.ts

// Defines the types of job operations for hacking batch operations.
export type JobType = 'hack' | 'weaken1' | 'grow' | 'weaken2'; 

// Interfaces for tracking batch job metrics and data
export interface MetricsData {
  times: Record<JobType, number>;
  ends: Record<JobType, number>;
  threads: Record<JobType, number>;
  target: string;
  port: number;
}

// Interface for representing a single block of RAM on a server.
export interface RamBlock {
  server: string;
  ram: number;
}

// Interface for the format of a Job used in batching.
export interface Job {
  type: JobType;
  end: number;
  time: number;
  target: string;
  threads: number;
  cost: number;
  server: string;
  report: boolean;
  port: number;
  batch: number;
}


