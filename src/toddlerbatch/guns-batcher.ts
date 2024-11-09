import { NS } from '@ns';

/** @param {NS} ns */
export async function main(ns: NS): Promise<void> {
  ns.disableLog('sleep');
  ns.disableLog('exec');

  const target = 'joesguns';
  const hackScript = 'toddlerbatch/hackHelper.js';
  const growScript = 'toddlerbatch/growHelper.js';
  const weakenScript = 'toddlerbatch/weakenHelper.js';

  const hackThreads = 22;
  const growThreads = 1301;
  const weakenThreads = 100;

  // Calculate action durations
  const hackTime = ns.getHackTime(target);
  const growTime = ns.getGrowTime(target);
  const weakenTime = ns.getWeakenTime(target);

  // Staggered delays for execution
  const delayWeaken1 = hackTime;
  const delayGrow = weakenTime;
  const delayWeaken2 = growTime + weakenTime;
  
  let batchCount = 0;

  while (true) {
    const host = ns.getHostname();

    // Step 1: Execute Hack
    ns.exec(hackScript, host, hackThreads, target, 0);

    // Step 2: Execute Weaken1 after Hack completes
    ns.exec(weakenScript, host, weakenThreads, target, delayWeaken1);

    // Step 3: Execute Grow after Weaken1 completes
    ns.exec(growScript, host, growThreads, target, delayGrow);

    // Step 4: Execute Weaken2 after Grow completes
    ns.exec(weakenScript, host, weakenThreads, target, delayWeaken2);

    batchCount++;
    ns.print(`Batch ${batchCount} launched for ${target} with staggered operations.`);

    // Sleep for the duration of the longest operation before launching the next batch
    await ns.sleep(weakenTime + growTime + 200); // Buffer for smooth batching
  }
}
