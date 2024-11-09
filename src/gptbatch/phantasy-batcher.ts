import { NS } from '@ns';

/** @param {NS} ns */
export async function main(ns: NS): Promise<void> {
    ns.disableLog('sleep');
    const target = "phantasy";
    const hackThreads = 10;
    const growThreads = 360;
    const weakenThreads = 60;

    // Action durations in milliseconds
    const hackTime = 5181;      // 5.181 seconds
    const weakenTime = 20727;   // 20.727 seconds
    const growTime = 16582;     // 16.582 seconds

    // Calculated delays between each action in a batch
    const delayWeaken1 = hackTime;             // Weaken1 starts after Hack completes
    const delayGrow = weakenTime;              // Grow starts after Weaken1 completes
    const delayWeaken2 = growTime + weakenTime; // Weaken2 starts after Grow completes

    while (true) {
        const host = ns.getHostname();

        // Step 1: Execute Hack with no delay
        ns.exec("gptbatch/hackHelper.js", host, hackThreads, target, 0);

        // Step 2: Execute Weaken1 after Hack completes
        ns.exec('gptbatch/weakenHelper.js', host, weakenThreads, target, delayWeaken1);

        // Step 3: Execute Grow after Weaken1 completes
        ns.exec('gptbatch/growHelper.js', host, growThreads, target, delayGrow);

        // Step 4: Execute Weaken2 after Grow completes
        ns.exec('gptbatch/weakenHelper.js', host, weakenThreads, target, delayWeaken2);

        // Wait for the batch to finish before starting the next
        await ns.sleep(weakenTime + 200);  // Ensures a continuous flow of batches
    }
}
