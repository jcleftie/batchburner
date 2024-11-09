interface RunningScript {
  args: any[];
  dynamicRamUsage: number | undefined;
  filename: string;
  logs: string[];
  offlineExpGained: number;
  offlineMoneyMade: number;
  offlineRunningTime: number;
  onlineExpGained: number;
  onlineMoneyMade: number;
  onlineRunningTime: number;
  parent: number;
  pid: number;
  ramUsage: number;
  server: string;
  tailProperties: any | null;
  temporary: boolean;
  threads: number;
  title: string | JSX.Element;
}
