import { NS } from '@ns';

/** @param {NS} ns */
export async function main(ns: NS): Promise<void> {
  const target = 'rho-construction';
  const batcherScript = 'gptbatch/rho-batcher.js';
  const purchasedServers = ns.getPurchasedServers();
  const servers = [...purchasedServers];

  // RAM required for a single thread of batcher.js
  const batcherScriptRam = ns.getScriptRam(batcherScript, 'home');

  // Define weaken threads based on your observation
  const hackThreads = 16;
  const growThreads = 475;

  // Calculate weaken threads needed based on hack and grow threads
  const weakenThreads1 = Math.max(Math.ceil((hackThreads * 0.002) / 0.05), 1); // Security impact of hacking
  const weakenThreads2 = Math.max(Math.ceil((growThreads * 0.004) / 0.05), 1); // Security impact of growing

  // Total threads needed for the full batch (hack + weaken1 + grow + weaken2)
  const totalThreads = hackThreads + weakenThreads1 + growThreads + weakenThreads2;

  // Clear existing instances of batcher.js on all servers before starting
  for (const server of servers) {
    if (ns.scriptRunning(batcherScript, server)) {
      ns.scriptKill(batcherScript, server);
      ns.print(`Killed existing batcher instance on ${server}`);
    }
  }

  // Start batcher.js on each server
  for (const server of servers) {
    const maxRam = ns.getServerMaxRam(server);
    const usedRam = ns.getServerUsedRam(server);
    const availableRam = maxRam - usedRam;

    // Calculate maximum threads this server can support for batcher.js
    const maxThreads = Math.floor(availableRam / batcherScriptRam);

    // Check if the server can support the full batch
    if (maxThreads >= totalThreads) {
      ns.exec(batcherScript, server, totalThreads, target);
      ns.print(`Started batcher on ${server} with ${totalThreads} threads targeting ${target}`);
    } else if (maxThreads > 0) {
      // Run with as many threads as possible on servers with limited RAM
      ns.exec(batcherScript, server, maxThreads, target);
      ns.print(`Started batcher on ${server} with ${maxThreads} threads (limited RAM) targeting ${target}`);
    } else {
      ns.print(`Not enough RAM to run batcher on ${server}`);
    }
  }
}

