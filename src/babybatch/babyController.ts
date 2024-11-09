import { NS } from '@ns';

export async function main(ns: NS) {
  ns.print('Initiating Batch Controller...');
  ns.disableLog('sleep');
  ns.disableLog('exec');

  const batcher1 = 'babybatch/noodles-batcher.js';
  const target1 = 'n00dles';
  const maxBatches = 5;
  const maxBatchThreads = 2; // Maximum threads per batcher instance
  const staggerDelay = 500; // Stagger delay in milliseconds
  const purchasedServers = ns.getPurchasedServers();
  const allServers = [...purchasedServers, 'home'];

  // Step 1: Setup and distribute scripts
  for (const server of allServers) {
    if (ns.serverExists(server)) {
      ns.print(`Killing all scripts on ${server}...`);
      const result = ns.killall(server);
      await ns.sleep(100);
      const filesToCopy = [
        'babybatch/noodles-batcher.js',
        'babybatch/growHelper.js',
        'babybatch/hackHelper.js',
        'babybatch/weakenHelper.js',
      ];
      for (const file of filesToCopy) {
        await ns.scp(file, server, 'home');
        ns.print(`Copied ${file} to ${server}`);
      }

      if (result) {
        ns.print(`Killed all scripts on ${server} and copied batch files.`);
      } else {
        ns.print(`No scripts were running on ${server}`);
      }
    } else {
      ns.print(`Server ${server} does not exist.`);
    }
  }

  // Step 2: Batch execution loop
  while (true) {
    for (const server of allServers) {
      // Launch batches for target 1 (n00dles)
      const runningBatches1 = ns.ps(server).filter((p) => p.filename === batcher1 && p.args.includes(target1)).length;

      // Only proceed if the number of running batches is below the maximum allowed
      if (runningBatches1 < maxBatches) {
        const availableRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
        const scriptRam = ns.getScriptRam(batcher1, server);
        const maxPossibleThreads = Math.floor(availableRam / scriptRam);
        const threadsToUse = Math.min(maxPossibleThreads, maxBatchThreads); // Cap threads

        if (threadsToUse > 0) {
          ns.exec(batcher1, server, threadsToUse, target1);
          ns.print(
            `Launched ${batcher1} targeting ${target1} on ${server} with ${threadsToUse} threads. Running batches: ${
              runningBatches1 + 1
            }`,
          );
        } else {
          ns.print(`Not enough RAM on ${server} to launch ${batcher1}`);
        }
      } else {
        ns.print(`Max batches reached on ${server}: ${runningBatches1}/${maxBatches}`);
      }
    }

    await ns.sleep(staggerDelay);
  }
}
