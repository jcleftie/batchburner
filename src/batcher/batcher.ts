import { Logger } from '@/logger/logger';
import { BaseServer } from '@/util/baseServer';
import { BatchWorkerScript, BatchThreads, PrepThreads } from '@/util/types';
import { NS } from '@ns';

export class Batcher extends BaseServer {
  protected logger: Logger;
  protected workers: BatchWorkerScript;

  protected marginForError: number;
  protected hackPercent: number;
  constructor(ns: NS, hostname?: string) {
    super(ns, hostname);
    this.workers = {
      hack: 'batcher/payloads/batchHack.js',
      grow: 'batcher/payloads/batchGrow.js',
      weaken: 'batcher/payloads/batchWeaken.js',
      all: ['batcher/payloads/batchHack.js', 'batcher/payloads/batchGrow.js', 'batcher/payloads/batchWeaken.js'],
    };
    this.logger = new Logger(ns, 'Batcher');

    this.root();
    this.copy(this.workers.all);
    this.marginForError = 1.1;
    this.hackPercent = 0.25;
  }
  protected prepareBatchThreads(target: string): BatchThreads {
    const moneyPerHack: number = this.ns.getServerMaxMoney(target) * this.hackPercent;
    const hackThreads: number = Math.floor(this.ns.hackAnalyzeThreads(target, moneyPerHack));
    const growThreads: number = Math.ceil(
      this.marginForError * this.ns.growthAnalyze(target, 1 / (1 - this.hackPercent)),
    );
    const securityChangePerHack: number = this.marginForError * this.ns.hackAnalyzeSecurity(hackThreads);
    const securityChangePerGrow: number = this.marginForError * this.ns.growthAnalyzeSecurity(growThreads);
    let w1Threads: number = Math.ceil(securityChangePerHack / 0.05);
    let w2Threads: number = Math.ceil(securityChangePerGrow / 0.05);
    while (this.ns.weakenAnalyze(w1Threads) < securityChangePerHack) w1Threads += 5;
    while (this.ns.weakenAnalyze(w2Threads) < securityChangePerGrow) w2Threads += 5;
    const totalThreads: number = hackThreads + w1Threads + growThreads + w2Threads;
    this.logger.debug('BatchThreads', {
      hackThreads: hackThreads,
      w1Threads: w1Threads,
      growThreads: growThreads,
      w2Threads: w2Threads,
      totalThreads: totalThreads,
    });
    return {
      hackThreads: hackThreads,
      w1Threads: w1Threads,
      growThreads: growThreads,
      w2Threads: w2Threads,
      totalThreads: totalThreads,
    };
  }
  /**
   * @returns True if this server's security is at the lowest possible value, and that the money available is equal to the maximum money available on the server. False otherwise.
   */
  isPrepped(target: string): boolean {
    if (
      this.ns.getServerMinSecurityLevel(target) == this.ns.getServerSecurityLevel(target) &&
      this.ns.getServerMoneyAvailable(target) == this.ns.getServerMaxMoney(target)
    ) {
      return true;
    }
    return false;
  }
  prepServer(target: string): void {
    this.logger.info(`Prepping target: ${target}`);
    const ramPerThread: number = this.ns.getScriptRam(this.workers.grow, 'home');
    const preparePrepThreads = (target: string) => {
      const growAmt: number = this.ns.getServerMaxMoney(target) / this.ns.getServerMoneyAvailable(target);
      const growThreads: number = Math.ceil(this.ns.growthAnalyze(target, growAmt));
      const securityChangePerGrow: number = this.ns.growthAnalyzeSecurity(growThreads);
      // Distance to minimum security level, in terms of weaken threads.
      const distanceToMinSecurity: number =
        (this.ns.getServerSecurityLevel(target) - this.ns.getServerMinSecurityLevel(target)) / 0.05;
      const weakenThreads: number = Math.ceil(securityChangePerGrow + distanceToMinSecurity);
      return { growThreads: growThreads, weakenThreads: weakenThreads } as PrepThreads;
    };
    let { growThreads, weakenThreads } = preparePrepThreads(target);
    const growRatio: number = growThreads / (growThreads + weakenThreads);
    const weakenRatio: number = weakenThreads / (growThreads + weakenThreads);
    const serverList: string[] = this.recursiveScan();
    for (const server of serverList) {
      const availableRam: number = this.ns.getServerMaxRam(server) - this.ns.getServerUsedRam(server);
      const availableThreads: number = Math.floor(availableRam / ramPerThread);
      if (availableThreads == 0) continue;
      const growPrepThreads: number = Math.min(Math.floor(growRatio * availableThreads));
      const weakenPrepThreads: number = Math.min(Math.floor(weakenRatio * availableThreads), weakenThreads);
      if (growPrepThreads > 0 && this.ns.hasRootAccess(server))
        this.ns.exec(this.workers.grow, server, growPrepThreads, growPrepThreads, 0, target);
      if (weakenPrepThreads > 0 && this.ns.hasRootAccess(server))
        this.ns.exec(this.workers.weaken, server, weakenPrepThreads, weakenPrepThreads, 0, target);
      growThreads -= growPrepThreads;
      weakenThreads -= weakenPrepThreads;
      if (growThreads <= 0 && weakenThreads <= 0) break;
    }
  }
  async runBatch(target: string, reservedRam: number): Promise<void> {
    this.logger.info(`Running batch on ${target} with ${reservedRam} GB of Reserved RAM`);
    this.root();
    this.copy(this.workers.all);
    const timeToWeaken: number = this.ns.getWeakenTime(target);
    let delay: number = 0;
    const hackDelayTime: number = Math.floor(timeToWeaken - this.ns.getHackTime(target));
    const growDelayTime: number = Math.floor(timeToWeaken - this.ns.getGrowTime(target));
    const ramPerThread: number = this.ns.getScriptRam(this.workers.grow, 'home');
    const { hackThreads, w1Threads, growThreads, w2Threads, totalThreads } = this.prepareBatchThreads(target);
    const serverInfoPre: Array<object> = [];
    const serverInfoPost: Array<object> = [];
    if (w1Threads == 0 || w2Threads == 0 || growThreads == 0 || hackThreads == 0) {
      this.logger.error('Could not spin up batch due to error in thread allocation!', {
        hackThreads,
        w1Threads,
        w2Threads,
        growThreads,
        totalThreads,
      });
      return;
    }
    const serverList: string[] = this.recursiveScan();
    for (const server of serverList) {
      let availableRam: number =
        Math.floor(this.ns.getServerMaxRam(server)) - Math.floor(this.ns.getServerUsedRam(server));
      if (server == 'home') availableRam -= reservedRam;
      const availableThreads: number = Math.floor(availableRam / ramPerThread);
      serverInfoPre.push({ server: server, availableRam: availableRam, availableThreads: availableThreads });
      const cycles: number = Math.floor(availableThreads / totalThreads);
      for (let i = 0; i < Math.min(cycles, 10000); i++) {
        this.ns.exec(this.workers.hack, server, hackThreads, hackThreads, hackDelayTime + delay, target);
        this.ns.exec(this.workers.weaken, server, w1Threads, w1Threads, delay, target);
        this.ns.exec(this.workers.grow, server, growThreads, growThreads, growDelayTime + delay, target);
        this.ns.exec(this.workers.weaken, server, w2Threads, w2Threads, 3 + delay, target);
        delay += 4;
      }
    }
    for (const server of serverList) {
      let availableRam: number =
        Math.floor(this.ns.getServerMaxRam(server)) - Math.floor(this.ns.getServerUsedRam(server));
      if (server == 'home') availableRam -= reservedRam;
      const availableThreads: number = Math.floor(availableRam / ramPerThread);
      serverInfoPost.push({ server: server, availableRam: availableRam, availableThreads: availableThreads });
      const growThreads: number = Math.floor(availableThreads / 2);
      const weakenThreads: number = Math.ceil(availableThreads / 2);
      if (growThreads > 0) {
        this.ns.exec(this.workers.grow, server, growThreads, growThreads, growDelayTime + delay + 100, target);
      }
      if (weakenThreads > 0) {
        this.ns.exec(this.workers.weaken, server, weakenThreads, weakenThreads, delay + 200, target);
      }
    }
    //this.logger.debug('Server Information Pre-Allocation => ', serverInfoPre);
    //this.logger.debug('Server Information Post-Allocation => ', serverInfoPost);
    await this.ns.sleep(timeToWeaken + delay + 2000);
    return;
  }
}
