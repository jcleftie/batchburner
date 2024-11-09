import { NS } from '@ns';

/** @param {NS} ns */
export async function main(ns: NS) {
  ns.tail();
  ns.disableLog('sleep');
  ns.disableLog('scp');
  ns.disableLog('getServerUsedRam');
  ns.print('Starting Balanced Prep Distribution with Round-Robin...');

  // List of all files in the toddlerbatch folder to copy to pservs
  const filesToCopy = [
    'toddlerbatch/guns-batcher.js',
    'toddlerbatch/gunsPrep.js',
    'toddlerbatch/growHelper.js',
    'toddlerbatch/hackHelper.js',
    'toddlerbatch/weakenHelper.js',
  ];

  // List of prep scripts and their respective targets
  const batchers = [{ script: 'toddlerbatch/gunsPrep.js', target: 'joesguns' }];

  const purchasedServers = ns.getPurchasedServers();
  const targetRamUtilization = 0.9; // Utilize up to 90% of available RAM
  const maxBatcherThreads = 10; // Cap the number of threads per batcher to prevent runaway allocation

  // Step 1: Copy all necessary files to all purchased servers
  for (const server of purchasedServers) {
    for (const file of filesToCopy) {
      const result = await ns.scp(file, server, 'home');
      ns.print(`Copied ${file} to ${server}: ${result ? 'Success' : 'Failed'}`);
    }
  }

  // Step 2: Distribute prep scripts in a balanced, round-robin manner
  let batcherIndex = 0; // To cycle through batchers
  const totalBatchers = batchers.length;

  while (true) {
    for (const server of purchasedServers) {
      const maxRam = ns.getServerMaxRam(server);
      const targetRam = maxRam * targetRamUtilization;
      const availableRam = maxRam - ns.getServerUsedRam(server);

      // Select the prep script to run in a round-robin fashion
      const batcher = batchers[batcherIndex];
      const scriptRam = ns.getScriptRam(batcher.script, server);

      if (scriptRam === 0) {
        ns.print(`Error: Could not determine RAM usage for ${batcher.script} on ${server}`);
        continue; // Skip this server if the script RAM is not determined correctly
      }

      // Calculate max threads to utilize available memory while staying within target RAM utilization
      let maxThreads = Math.floor(availableRam / scriptRam);
      maxThreads = Math.min(maxThreads, maxBatcherThreads); // Cap threads

      // Run the prep script if there is sufficient RAM available
      if (maxThreads > 0) {
        const pid = ns.exec(batcher.script, server, maxThreads, batcher.target);
        if (pid > 0) {
          ns.print(`Started ${batcher.script} on ${server} targeting ${batcher.target} with ${maxThreads} threads`);
        } else {
          ns.print(`Failed to start ${batcher.script} on ${server} due to insufficient resources or other issues`);
        }
      } else {
        ns.print(`Not enough RAM on ${server} to start ${batcher.script}`);
      }

      // Move to the next prep script in the list for round-robin distribution
      batcherIndex = (batcherIndex + 1) % totalBatchers;
    }

    // Small delay to allow for state updates before next iteration
    await ns.sleep(1000); // Increased delay for clearer logs
  }
}
