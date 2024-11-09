import { NS } from '@ns';

/** @param {NS} ns */
export async function main(ns: NS) {
  const target = 'summit-uni';
  const weakenScript = 'summitBatch/prepSummitUniWeaken.js'; // Name of weaken script
  const growScript = 'summitBatch/prepSummitUniGrow.js'; // Name of grow script

  // Set up maximum threads to avoid overconsumption
  const maxWeakenThreadsCap = 20000; // Set a cap for weaken threads
  const maxGrowThreadsCap = 20000; // Set a cap for grow threads

  // Get action times for accurate timing
  const weakenTime = ns.getWeakenTime(target);
  const growTime = ns.getGrowTime(target);

  // Define timing offsets
  const growDelay = 10000; // 10 seconds delay after weaken starts
  const weakenOffset = 1000; // 1 second after grow ends

  ns.print(`Starting controlled preparation for ${target}...`);

  while (true) {
    // Calculate threads for weaken operation
    const availableRam = ns.getServerMaxRam(ns.getHostname()) - ns.getServerUsedRam(ns.getHostname());
    const weakenScriptRam = ns.getScriptRam(weakenScript);
    let maxWeakenThreads = Math.floor(availableRam / weakenScriptRam);
    maxWeakenThreads = Math.min(maxWeakenThreads, maxWeakenThreadsCap); // Cap the maximum threads

    if (maxWeakenThreads > 0) {
      ns.exec(weakenScript, ns.getHostname(), maxWeakenThreads, target);
      ns.print(`Started weaken with ${maxWeakenThreads} threads on ${target}`);
    } else {
      ns.print(`Insufficient RAM to start weaken on ${target}. Waiting...`);
      await ns.sleep(1000);
      continue; // Wait and retry
    }

    // Delay before starting grow
    await ns.sleep(growDelay);

    // Calculate threads for grow operation
    const availableRamForGrow = ns.getServerMaxRam(ns.getHostname()) - ns.getServerUsedRam(ns.getHostname());
    const growScriptRam = ns.getScriptRam(growScript);
    let maxGrowThreads = Math.floor(availableRamForGrow / growScriptRam);
    maxGrowThreads = Math.min(maxGrowThreads, maxGrowThreadsCap); // Cap the maximum threads

    if (maxGrowThreads > 0) {
      ns.exec(growScript, ns.getHostname(), maxGrowThreads, target);
      ns.print(`Started grow with ${maxGrowThreads} threads on ${target}`);
    } else {
      ns.print(`Insufficient RAM to start grow on ${target}. Waiting...`);
    }

    // Wait for weaken time plus offset before starting next iteration
    await ns.sleep(weakenTime + weakenOffset);

    // Check conditions to stop the loop if the server is fully prepared
    if (
      ns.getServerMoneyAvailable(target) >= ns.getServerMaxMoney(target) &&
      ns.getServerSecurityLevel(target) <= ns.getServerMinSecurityLevel(target)
    ) {
      ns.print(`${target} is prepared: Max Money and Min Security achieved.`);
      break;
    }
  }

  ns.print(`Preparation for ${target} completed.`);
}
