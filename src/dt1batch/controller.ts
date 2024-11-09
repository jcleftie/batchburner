import { NS } from '@ns';
import { JobType, MetricsData, RamBlock } from '@types';
import { copyScripts, checkTarget, isPrepped, prep, getDataPort } from '@utils';

const WORKERS = ['./tHack.js', './tWeaken.js', './tGrow.js'];
const TYPES = ['hack', 'weaken1', 'grow', 'weaken2'];
const SCRIPTS = {
  hack: './tHack.js',
  weaken1: './tWeaken.js',
  grow: './tGrow.js',
  weaken2: './tWeaken.js',
};
const COSTS = { hack: 1.7, weaken1: 1.75, grow: 1.75, weaken2: 1.75 };
const OFFSETS = { hack: 0, weaken1: 1, grow: 2, weaken2: 3 };

class Job {
  constructor(type: JobType, metrics: MetricsData, server = 'none') {
    this.type = type;
    this.end = metrics.ends[type];
    this.time = metrics.times[type];
    this.target = metrics.target;
    this.threads = metrics.threads[type];
    this.cost = this.threads * COSTS[type];
    this.server = server;
    this.report = false;
    this.port = metrics.port;
    this.batch = 0;
  }
  
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

class Metrics implements MetricsData {
  target: string;
  maxMoney: number;
  money: number;
  minSec: number;
  sec: number;
  prepped: boolean;
  chance: number;
  wTime: number;
  delay: number;
  spacer: number;
  greed: number;
  depth: number;
  times: Record<JobType, number>;
  ends: Record<JobType, number>;
  threads: Record<JobType, number>;
  port: number;

  constructor(ns: NS, target: string) {
    this.target = target;
    this.maxMoney = ns.getServerMaxMoney(target);
    this.money = Math.max(ns.getServerMoneyAvailable(target), 1);
    this.minSec = ns.getServerMinSecurityLevel(target);
    this.sec = ns.getServerSecurityLevel(target);
    this.prepped = isPrepped(ns, target);
    this.chance = 0;
    this.wTime = 0;
    this.delay = 0;
    this.spacer = 5;
    this.greed = 0.1;
    this.depth = 0;
    this.times = { hack: 0, weaken1: 0, grow: 0, weaken2: 0 };
    this.ends = { hack: 0, weaken1: 0, grow: 0, weaken2: 0 };
    this.threads = { hack: 0, weaken1: 0, grow: 0, weaken2: 0 };
    this.port = ns.pid;
  }

  calculate(ns: NS, greed = this.greed) {
    this.money = ns.getServerMoneyAvailable(this.target);
    this.sec = ns.getServerSecurityLevel(this.target);
    this.wTime = ns.getWeakenTime(this.target);
    this.times = {
      hack: this.wTime / 4,
      weaken1: this.wTime,
      grow: this.wTime * 0.8,
      weaken2: this.wTime,
    };
    const hPercent = ns.hackAnalyze(this.target);
    const hThreads = Math.max(Math.floor(ns.hackAnalyzeThreads(this.target, this.maxMoney * greed)), 1);
    const tGreed = hPercent * hThreads;
    const gThreads = Math.ceil(ns.growthAnalyze(this.target, this.maxMoney / (this.maxMoney - this.maxMoney * tGreed)));
    this.threads = {
      hack: hThreads,
      weaken1: Math.max(Math.ceil((hThreads * 0.002) / 0.05), 1),
      grow: gThreads,
      weaken2: Math.max(Math.ceil((gThreads * 0.004) / 0.05), 1),
    };
    this.chance = ns.hackAnalyzeChance(this.target);
  }
}


class RamNet {
  private _blocks: RamBlock[] = [];
  private _minBlockSize = Infinity;
  private _maxBlockSize = 0;
  private _totalRam = 0;
  private _maxRam = 0;
  private _prepThreads = 0;
  private _index = new Map<string, number>();

  constructor(ns: NS, servers: any[]) {
    for (const server of servers) {
      if (server.rootAccess) {
        const maxRam = server.maxRam;
        const ram = maxRam - server.usedRam;
        if (ram >= 1.6) {
          const block: RamBlock = { server: server.hostname, ram: ram };
          this._blocks.push(block);
          if (ram < this._minBlockSize) this._minBlockSize = ram;
          if (ram > this._maxBlockSize) this._maxBlockSize = ram;
          this._totalRam += ram;
          this._maxRam += maxRam;
          this._prepThreads += Math.floor(ram / 1.75);
        }
      }
    }
    this.sortBlocks();
    this._blocks.forEach((block, index) => this._index.set(block.server, index));
  }

  sortBlocks() {
    this._blocks.sort((a, b) => (a.server === 'home' ? 1 : b.server === 'home' ? -1 : a.ram - b.ram));
  }

  getBlock(server: string) {
    const index = this._index.get(server);
    return index !== undefined ? this._blocks[index] : null;
  }

  get totalRam() {
    return this._totalRam;
  }

  get maxRam() {
    return this._maxRam;
  }

  get maxBlockSize() {
    return this._maxBlockSize;
  }

  get prepThreads() {
    return this._prepThreads;
  }

  assign(job: Job): boolean {
    const block = this._blocks.find((block) => block.ram >= job.cost);
    if (block) {
      job.server = block.server;
      block.ram -= job.cost;
      this._totalRam -= job.cost;
      return true;
    }
    return false;
  }

  finish(job: Job) {
    const block = this.getBlock(job.server);
    if (block) {
      block.ram += job.cost;
      this._totalRam += job.cost;
    }
  }

  cloneBlocks(): RamBlock[] {
    return this._blocks.map((block) => ({ ...block }));
  }

  printBlocks(ns: NS) {
    for (const block of this._blocks) ns.print(block);
  }
}

export async function main(ns: NS) {
  ns.disableLog('sleep');
  ns.tail();
  const dataPort = getDataPort(ns);
  let batchCount = 0;

  // Load and parse the server data from serverData.json
  let serverData;
  try {
    const jsonData = ns.read('dt1batch/serverData.json');
    if (!jsonData) {
      ns.tprint('Error: serverData.json is empty or not found.');
      return;
    }
    serverData = JSON.parse(jsonData);
  } catch (e: any) {
    ns.tprint('Error parsing serverData.json: ' + e.message);
    return;
  }

  while (true) {
    // Retrieve all servers with root access
    const pservs = ns.getPurchasedServers();
    const targetHosts = [
      'neo-net',
      'silver-helix',
      'omega-net',
      'johnson-ortho',
      'the-hub',
      'computek',
      'netlink',
      'catalyst',
      'millenium-fitness',
      'rho-construction',
      'run4theh111z',
      'syscore',
      'global-pharm',
      'solaris',
      'helios',
      'deltaone',
      'vitalife',
      'taiyang-digital',
      'The-Cave',
      'aerocorp',
      'omnitek',
      'CSEC',
      'I.I.I.I',
      'n00dles',
      'foodnstuff',
      'darkweb',
      'sigma-cosmetics',
      'joesguns',
      'nectar-net',
      'hong-fang-tea',
      'hong-fang-tea',
      'harakiri-sushi',
      'zer0',
      'max-hardware',
      'phantasy',
      'iron-gym',
      'crush-fitness',
      'rothman-uni',
      'aevum-police',
      'summit-uni',
      'alpha-ent',
      'lexo-corp',
      'snap-fitness',
      'zb-institute',
      'nova-med',
      'zb-def',
      'univ-energy',
      'applied-energetics',
      'zeus-med',
      'unitalife',
      'galactic-cyber',
      'titan-labs',
      'microdyne',
      'icarus',
      'omnia',
      'infocomm',
      'blade',
      'defcomm',
      'b-and-a',
      'powerhouse-fitness',
      'stormtech',
      'kuai-gong',
      '4sigma',
      'clarkinc',
      'fulcrumtech',
      'megacorp',
      'nwo',
      'ecorp',
      'fulcrumassets',
      'avmnite-02h',
    ];
    let hostname = [...targetHosts];
    const servers = hostname.map((host) => ns.getServer(host));

    let target = 'n00dles';
    target = checkTarget(ns, target, target, ns.fileExists('Formulas.exe', 'home'));

    for (const server of servers) {
      if (server.maxRam > 4) {
        await copyScripts(ns, server.hostname, WORKERS, true);
      }
    }
    for (const pserv of pservs) {
      if (ns.getServerMaxRam(pserv) > 4) {
        await copyScripts(ns, pserv, WORKERS, true);
    }

    const metrics = new Metrics(ns, target);
    const ramNet = new RamNet(ns, servers);

    const values = {
      maxMoney: ns.getServerMaxMoney(target),
      minSec: ns.getServerMinSecurityLevel(target),
      money: ns.getServerMoneyAvailable(target),
      sec: ns.getServerSecurityLevel(target),
      target: target,
    };

    if (!isPrepped(ns, target)) {
      await prep(ns, metrics, values, ramNet);
    }

    metrics.calculate(ns);
    const batch: Job[] = [];
    batchCount++;

    for (const type of TYPES as JobType[]) {
      metrics.ends[type] = Date.now() + metrics.wTime + metrics.spacer * OFFSETS[type] + 100;
      const job = new Job(type, metrics);

      if (!ramNet.assign(job)) {
        ns.print(`Skipping ${type} on ${job.target} due to insufficient RAM.`);
        continue;
      }
      batch.push(job);
    }

    for (const job of batch) {
      job.end += metrics.delay;
      const jobPid = ns.exec(
        SCRIPTS[job.type],
        job.server,
        { threads: job.threads, temporary: true },
        JSON.stringify(job),
      );
      if (!jobPid) {
        ns.print(`Failed to start ${job.type} on ${job.server}. Skipping job.`);
        ramNet.finish(job);
        continue;
      }
    }

    const timer = setInterval(() => {
      ns.clearLog();
      ns.print(`Batch Count: ${batchCount}`);
      ns.print(`Hacking \$${ns.formatNumber(metrics.money * metrics.greed)} from ${metrics.target}`);
      ns.print(`Running batch: ETA ${ns.tFormat(metrics.ends.weaken2 - Date.now())}`);
    }, 20000); // Log every 5 seconds instead of every second

    ns.atExit(() => clearInterval(timer));
    await ns.sleep(metrics.wTime + 2000);
    dataPort.clear();
    clearInterval(timer);
    await ns.print(`Batch ${batchCount} complete.`);
  }
}
}
