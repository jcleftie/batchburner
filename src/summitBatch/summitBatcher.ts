import { NS } from '@ns';

/** @param {NS} ns */
export async function main(ns: NS) {
  const target = 'summit-uni';
  const hackThreads = 14; // tHack 25% of max money
  const weakenThreads1 = Math.ceil((hackThreads * 0.002) / 0.05);
  const growThreads = 820; // Use grow x2 for quick restoration
  const weakenThreads2 = Math.ceil((growThreads * 0.004) / 0.05);

  // Timings for each operation
  const hackTime = ns.getHackTime(target);
  const growTime = ns.getGrowTime(target);
  const weakenTime = ns.getWeakenTime(target);

  while (true) {
    const host = ns.getHostname();

    // Execute Hack
    if (
      ns.getServerUsedRam(host) + ns.getScriptRam('summitBatch/hackHelper.js') * hackThreads <=
      ns.getServerMaxRam(host)
    ) {
      ns.exec('summitBatch/hackHelper.js', host, hackThreads, target);
      ns.print(`Started hack with ${hackThreads} threads on ${target}`);
    }

    // Schedule Weaken1 to start immediately after hack
    await ns.sleep(200); // Small delay to ensure execution order
    if (
      ns.getServerUsedRam(host) + ns.getScriptRam('summitBatch/weakenHelper.js') * weakenThreads1 <=
      ns.getServerMaxRam(host)
    ) {
      ns.exec('summitBatch/weakenHelper.js', host, weakenThreads1, target);
      ns.print(`Started weaken1 with ${weakenThreads1} threads on ${target}`);
    }

    // Schedule Grow 10 seconds after Weaken1 starts
    await ns.sleep(10000);
    if (
      ns.getServerUsedRam(host) + ns.getScriptRam('summitBatch/growHelper.js') * growThreads <=
      ns.getServerMaxRam(host)
    ) {
      ns.exec('summitBatch/growHelper.js', host, growThreads, target);
      ns.print(`Started grow with ${growThreads} threads on ${target}`);
    }

    // Schedule Weaken2 1 second after Grow finishes
    await ns.sleep(growTime + 1000);
    if (
      ns.getServerUsedRam(host) + ns.getScriptRam('summitBatch/weakenHelper.js') * weakenThreads2 <=
      ns.getServerMaxRam(host)
    ) {
      ns.exec('summitBatch/weakenHelper.js', host, weakenThreads2, target);
      ns.print(`Started weaken2 with ${weakenThreads2} threads on ${target}`);
    }

    // Sleep for a buffer period before starting the next batch
    await ns.sleep(1000); // Adjust buffer time as necessary
  }
}
