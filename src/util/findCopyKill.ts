import { NS } from '@ns';

interface ServerInfo {
  hostname: string;
  organizationName: string;
  rootAccess: boolean;
  backdoorInstalled: boolean;
  canRunScripts: boolean;
  maxRam: number;
  usedRam: number;
  moneyAvailable: number;
  maxMoney: number;
  minSecurityLevel: number;
  currentSecurityLevel: number;
  growthRate: number;
  hackDifficulty: number;
  requiredHackingSkill: number;
  hackChance: number;
  hackTime: number;
  growTime: number;
  weakenTime: number;
  numOpenPortsRequired: number;
  openPorts: { ssh: boolean; ftp: boolean; smtp: boolean; http: boolean; sql: boolean };
}

const TARGET_JSON_FILE = '/serverData.json';

export async function main(ns: NS): Promise<void> {
  const file = ns.args[0] as string;
  if (!file) {
    ns.tprint('Error: Please provide the filename to copy as the first argument.');
    return;
  }

  const serverSet: Set<string> = new Set(['home']);

  // Discover all reachable servers
  function discoverServers(server: string): void {
    const connectedServers = ns.scan(server);
    for (const connectedServer of connectedServers) {
      if (!serverSet.has(connectedServer)) {
        serverSet.add(connectedServer);
        discoverServers(connectedServer);
      }
    }
  }
  discoverServers('home');

  const results: ServerInfo[] = [];

  for (const server of serverSet) {
    // Gather server information
    const serverData: ServerInfo = {
      hostname: server,
      organizationName: ns.getServer(server).organizationName,
      rootAccess: ns.hasRootAccess(server),
      backdoorInstalled: ns.getServer(server).backdoorInstalled ?? false,
      canRunScripts: ns.getServerMaxRam(server) > 0,
      maxRam: ns.getServerMaxRam(server),
      usedRam: ns.getServerUsedRam(server),
      moneyAvailable: ns.getServerMoneyAvailable(server),
      maxMoney: ns.getServerMaxMoney(server),
      minSecurityLevel: ns.getServerMinSecurityLevel(server),
      currentSecurityLevel: ns.getServerSecurityLevel(server),
      growthRate: ns.getServerGrowth(server),
      hackDifficulty: ns.hackAnalyzeChance(server),
      requiredHackingSkill: ns.getServerRequiredHackingLevel(server),
      hackChance: ns.hackAnalyzeChance(server),
      hackTime: ns.getHackTime(server) / 1000, // Convert to seconds
      growTime: ns.getGrowTime(server) / 1000, // Convert to seconds
      weakenTime: ns.getWeakenTime(server) / 1000, // Convert to seconds
      numOpenPortsRequired: ns.getServerNumPortsRequired(server),
      openPorts: {
        ssh: ns.getServer(server).sshPortOpen,
        ftp: ns.getServer(server).ftpPortOpen,
        smtp: ns.getServer(server).smtpPortOpen,
        http: ns.getServer(server).httpPortOpen,
        sql: ns.getServer(server).sqlPortOpen,
      },
    };

    results.push(serverData);

    // Copy the file to each server without checking root access
    const scpSuccess = await ns.scp(file, server);
    if (scpSuccess) {
      ns.tprint(`File ${file} successfully copied to ${server}.`);
    } else {
      ns.tprint(`Failed to copy file ${file} to ${server}.`);
    }
  }

  // Write server information to a JSON file
  await ns.write(TARGET_JSON_FILE, JSON.stringify(results, null, 2), 'w');
  ns.tprint(`Server information saved to ${TARGET_JSON_FILE}.`);
}
