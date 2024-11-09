import { NS } from '@ns';

/** @param {NS} ns */
export async function main(ns: NS) {
    ns.tail();
    ns.disableLog('sleep');
    ns.print('Starting Balanced Batcher Distribution with Round-Robin...');

    // List of all files in the gptbatch folder to copy to pservs
    const filesToCopy = [
        'gptbatch/controller-batcher.js',
        'gptbatch/growHelper.js',
        'gptbatch/growLogHelper.js',
        'gptbatch/hackHelper.js',
        'gptbatch/hackLogHelper.js',
        'gptbatch/noodles-batcher.js',
        'gptbatch/phantasy-batcher.js',
        'gptbatch/rho-batcher.js',
        'gptbatch/weakenHelper.js',
        'gptbatch/weakLogHelper.js',
    ];

    // List of batcher scripts and their respective targets
    const batchers = [
        { script: 'gptbatch/noodles-batcher.js', target: 'n00dles' },
        { script: 'gptbatch/phantasy-batcher.js', target: 'phantasy' },
        { script: 'gptbatch/rho-batcher.js', target: 'rho-construction' },
    ];

    const purchasedServers = ns.getPurchasedServers();
    const targetRamUtilization = 0.7; // Utilize up to 70% of available RAM
    const maxBatcherThreads = 1000; // Cap the number of threads per batcher to prevent runaway allocation

    // Step 1: Copy all necessary files to all purchased servers
    for (const server of purchasedServers) {
        for (const file of filesToCopy) {
            await ns.scp(file, server);
            ns.print(`Copied ${file} to ${server}`);
        }
    }

    // Step 2: Distribute batcher scripts in a balanced, round-robin manner
    let batcherIndex = 0; // To cycle through batchers
    const totalBatchers = batchers.length;

    while (true) {
        for (const server of purchasedServers) {
            const maxRam = ns.getServerMaxRam(server);
            const targetRam = maxRam * targetRamUtilization;
            const availableRam = maxRam - ns.getServerUsedRam(server);

            // Select the batcher to run in a round-robin fashion
            const batcher = batchers[batcherIndex];
            const scriptRam = ns.getScriptRam(batcher.script, server);

            // Calculate max threads to utilize available memory while staying within target RAM utilization
            let maxThreads = Math.floor(availableRam / scriptRam);
            maxThreads = Math.min(maxThreads, maxBatcherThreads); // Cap threads

            // Run the batcher if there is sufficient RAM available
            if (maxThreads > 0 && ns.getServerUsedRam(server) + (maxThreads * scriptRam) <= targetRam) {
                ns.exec(batcher.script, server, maxThreads, batcher.target);
                ns.print(`Started ${batcher.script} on ${server} targeting ${batcher.target} with ${maxThreads} threads`);
            }

            // Move to the next batcher in the list for round-robin distribution
            batcherIndex = (batcherIndex + 1) % totalBatchers;
        }

        // Small delay to allow for state updates before next iteration
        await ns.sleep(100);
    }
}



// old version
// /** @param {NS} ns */
// export async function main(ns: NS) {
//   ns.print('Starting SCP and Exec for Batcher Setup on pservs...');

//   // List of all files in the gptbatch folder to copy to pservs
//   const filesToCopy = [
//     'gptbatch/controller-batcher.js',
//     'gptbatch/growHelper.js',
//     'gptbatch/growLogHelper.js',
//     'gptbatch/hackHelper.js',
//     'gptbatch/hackLogHelper.js',
//     'gptbatch/noodles-batcher.js',
//     'gptbatch/phantasy-batcher.js',
//     'gptbatch/rho-batcher.js',
//     'gptbatch/weakenHelper.js',
//     'gptbatch/weakLogHelper.js',
//   ];

//   // List of batcher scripts and their respective targets
//   const batchers = [
//     { script: 'gptbatch/noodles-batcher.js', target: 'n00dles' },
//     { script: 'gptbatch/phantasy-batcher.js', target: 'phantasy' },
//     { script: 'gptbatch/rho-batcher.js', target: 'rho-construction' },
//   ];

//   const purchasedServers = ns.getPurchasedServers();
//   const batchThreads = 10; // Number of threads per batch; adjust as needed
//   const staggerDelay = 500; // Stagger delay in milliseconds for launching batches

//   // Step 1: Copy all necessary files to all purchased servers
//   for (const server of purchasedServers) {
//     for (const file of filesToCopy) {
//       await ns.scp(file, server);
//       ns.print(`Copied ${file} to ${server}`);
//     }
//   }

//   // Step 2: Execute batcher scripts on all purchased servers
//   for (const server of purchasedServers) {
//     for (const batcher of batchers) {
//       // Check if the script is already running; if not, start it
//       if (!ns.scriptRunning(batcher.script, server)) {
//         ns.exec(batcher.script, server, batchThreads, batcher.target);
//         ns.print(`Started ${batcher.script} on ${server} targeting ${batcher.target}`);
//       } else {
//         ns.print(`${batcher.script} is already running on ${server}`);
//       }

//       // Stagger the launches for each batcher
//       await ns.sleep(staggerDelay);
//     }
//   }

//   ns.print('SCP and Exec process completed.');
// }
