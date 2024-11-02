import { Logger } from '@/logger/logger';
import { NS, Server } from '@ns';
import { BatchScriptBundle } from '@/util/types';

export class BaseServer {
  protected hostname: string;
  protected ns: NS;
  protected logger: Logger;
  protected data: Server;
  protected workers: BatchScriptBundle;
  protected hackPrograms: string[];
  protected serverList: string[];
  constructor(ns: NS, hostname?: string) {
    this.ns = ns;
    this.logger = new Logger(ns, 'baseServerV2');
    this.hostname = hostname ? hostname : this.ns.getHostname();
    this.data = this.ns.getServer(this.hostname);
    this.hackPrograms = ['BruteSSH.exe', 'FTPCrack.exe', 'relaySMTP.exe', 'HTTPWorm.exe', 'SQLInject.exe'];
    this.workers = {
      hack: '',
      grow: '',
      weaken: '',
      all: [],
    };
    this.serverList = this.recursiveScan();

    const killLogs: string[] = [
      'scan',
      'sleep',
      'exec',
      'getHackingLevel',
      'getServerMaxRam',
      'getServerUsedRam',
      'getServerMinSecurityLevel',
      'getServerSecurityLevel',
      'getServerMaxMoney',
      'getServerMoneyAvailable',
      'brutessh',
      'ftpcrack',
      'relaysmtp',
      'httpworm',
      'sqlinject',
      'nuke',
    ];
    killLogs.forEach((log) => {
      this.ns.disableLog(log);
    });
    ns.clearLog();
  }
  /**
   * @returns An array of all server hostnames.
   */
  protected recursiveScan(debug?: boolean): Array<string> {
    const visited: Set<string> = new Set<string>();
    const queue: string[] = ['home'];
    const servers: string[] = [];
    while (queue.length > 0) {
      const current: string | undefined = queue.shift();
      if (visited.has(current!)) {
        continue;
      }
      visited.add(current!);
      servers.push(current!);
      const neighbors: string[] = this.ns.scan(current!);
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          queue.push(neighbor);
        }
      }
    }
    if (debug) this.logger.debug('Generated Server List => ', servers);
    this.serverList = servers;
    return servers;
  }
  /**
   * Tries to copy the specified hacking scripts to all specified target servers
   */
  protected copy(scripts: string[]): void {
    const hosts: string[] = this.recursiveScan();
    for (const hostname of hosts) {
      for (const script of scripts) {
        if (!this.ns.fileExists(script, hostname)) {
          this.ns.scp(script, hostname, 'home');
        }
      }
    }
  }
  /**
   * Attempts to gain root/adminstrator permissions on the target server.
   */
  protected root(): void {
    let openPorts: number = 0;
    for (const server of this.serverList) {
      if (server !== 'home') {
        try {
          this.ns.nuke(server);
        } catch {}
        if (this.ns.fileExists('brutessh.exe', 'home')) {
          if (!this.data.sshPortOpen) {
            this.ns.brutessh(server);
            openPorts += 1;
            try {
              this.ns.nuke(server);
              this.copy(this.workers.all);
            } catch {}
          }
        }
        if (this.ns.fileExists('ftpcrack.exe', 'home')) {
          if (!this.data.ftpPortOpen) {
            this.ns.ftpcrack(server);
            openPorts += 1;
            try {
              this.ns.nuke(server);
              this.copy(this.workers.all);
            } catch {}
          }
        }
        if (this.ns.fileExists('relaysmtp.exe', 'home')) {
          if (!this.data.smtpPortOpen) {
            this.ns.relaysmtp(server);
            openPorts += 1;
            try {
              this.ns.nuke(server);
              this.copy(this.workers.all);
            } catch {}
          }
        }
        if (this.ns.fileExists('httpworm.exe', 'home')) {
          if (!this.data.httpPortOpen) {
            this.ns.httpworm(server);
            openPorts += 1;
            try {
              this.ns.nuke(server);
              this.copy(this.workers.all);
            } catch {}
          }
        }
        if (this.ns.fileExists('sqlinject.exe', 'home')) {
          if (!this.data.sqlPortOpen) {
            this.ns.sqlinject(server);
            openPorts += 1;
            try {
              this.ns.nuke(server);
              this.copy(this.workers.all);
            } catch {}
          }
        }
      }
    }
  }
}
