import { NS } from '@ns';
import { BaseServer } from './baseServer';
import { Logger } from '@/logger/logger';
import { BatchScriptBundle } from './types';

export class PServer extends BaseServer {
  protected logger: Logger;
  protected maxRam: number;
  protected mult: number;
  protected workers: BatchScriptBundle;
  protected pServerList: string[];
  private homeRamThreshold: number;
  private homeCoreThreshold: number;
  private budgetThreshold: number;

  constructor(ns: NS) {
    super(ns);
    this.workers = {
      hack: 'batcher/payloads/batchHack.js',
      grow: 'batcher/payloads/batchGrow.js',
      weaken: 'batcher/payloads/batchWeaken.js',
      all: ['batcher/payloads/batchHack.js', 'batcher/payloads/batchGrow.js', 'batcher/payloads/batchWeaken.js'],
    };
    this.logger = new Logger(ns, 'PServer');
    this.mult = 3;
    this.pServerList = ns.getPurchasedServers().sort((a, b) => ns.getServerMaxRam(a) - ns.getServerMaxRam(b));
    this.maxRam = Math.pow(2, 20); // Cap at 1 TB until reaching `home` milestones

    // Define milestones and budget limits
    this.homeRamThreshold = 131072; // Target for 131.07 TB
    this.homeCoreThreshold = 5;     // Target for 5 cores
    this.budgetThreshold = 1e9;     // Threshold for available cash (1 billion)
  }

  /**
   * Checks if `home` server has reached target RAM and core milestones.
   */
  private checkHomeMilestones(): boolean {
    const homeServer = this.ns.getServer("home");
    return homeServer.maxRam >= this.homeRamThreshold && homeServer.cpuCores >= this.homeCoreThreshold;
  }

  /**
   * Generates a random name for a newly purchased server.
   */
  protected generateServerName(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
    return Array.from({ length: 5 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  }

  /**
   * Calculates the maximum RAM for the next server purchase or upgrade, capped at 4096 GB until `home` milestones are reached.
   */
  protected calcMaxRam(): number {
    let ram = Math.min(this.maxRam, Math.pow(2, this.mult));
    const maxExistingRam = this.pServerList.reduce((max, server) => Math.max(max, this.ns.getServerMaxRam(server)), 3);

    const capRam = 4096; // Cap at 4096 GB until `home` milestones reached
    while (ram <= Math.min(maxExistingRam, this.checkHomeMilestones() ? this.maxRam : capRam)) {
      ram = Math.min(this.maxRam, Math.pow(2, ++this.mult));
    }
    return ram;
  }

  /**
   * Attempts to copy the required batcher scripts to the new servers.
   */
  protected copyScriptsToServer(server: string): void {
    this.workers.all.forEach(script => this.ns.scp(script, server));
  }

  /**
   * Manages server purchases and upgrades, ensuring budget constraints and home milestones.
   */
  protected async upgrade(): Promise<void> {
    this.pServerList = this.ns.getPurchasedServers().sort((a, b) => this.ns.getServerMaxRam(a) - this.ns.getServerMaxRam(b));
    const ramToPurchase = this.calcMaxRam();
    const isFull = this.pServerList.length >= this.ns.getPurchasedServerLimit();
    const delayBetweenPurchases = 5000; // 5 seconds between purchases

    if (!this.checkHomeMilestones()) {
      const cashOnHand = this.ns.getServerMoneyAvailable('home');
      if (cashOnHand >= this.budgetThreshold) {
        this.logger.info(`Waiting for home milestones. Pausing purchases.`);
        return;
      }
    }

    if (isFull) {
      // Attempt to upgrade existing servers
      for (const server of this.pServerList) {
        const cashOnHand = this.ns.getServerMoneyAvailable('home');
        const cost = this.ns.getPurchasedServerUpgradeCost(server, ramToPurchase);
        if (cost <= cashOnHand) {
          this.ns.upgradePurchasedServer(server, ramToPurchase);
          this.logger.info(`Upgraded ${server} to ${ramToPurchase}GB RAM.`);
          this.copyScriptsToServer(server);
          await this.ns.sleep(delayBetweenPurchases);
        } else {
          this.logger.info(`Insufficient funds for upgrading ${server}.`);
        }
      }
    } else {
      // Fill server slots with new servers if the list is not full
      while (this.pServerList.length < this.ns.getPurchasedServerLimit()) {
        const cashOnHand = this.ns.getServerMoneyAvailable('home');
        const cost = this.ns.getPurchasedServerCost(8); // Base cost for 8GB server

        if (cost > cashOnHand) {
          this.logger.info(`Insufficient funds for new server. Pausing purchases.`);
          return;
        }

        const serverName = `pserv-${this.generateServerName()}`;
        if (this.ns.purchaseServer(serverName, 8)) {
          this.logger.info(`Purchased new server: ${serverName} with 8GB RAM.`);
          this.copyScriptsToServer(serverName);
          await this.ns.sleep(delayBetweenPurchases);
        } else {
          this.logger.error(`Failed to purchase server: ${serverName}.`);
          break;
        }
      }
    }
  }

  /**
   * Starts the server management upgrade loop.
   */
  async run(): Promise<void> {
    await this.upgrade();
  }
}
