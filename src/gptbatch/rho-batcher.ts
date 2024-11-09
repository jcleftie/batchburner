import { NS } from '@ns';

/** @param {NS} ns */
export async function main(ns: NS): Promise<void> {
    ns.disableLog('sleep');
    const target = 'rho-construction';
    const hackThreads = 33;
    const growThreads = 475;
    // using dynamic calculations instead of const weakenThreads = 60;

    // Action times for rho-construction
    const hackTime = 35 * 1000; // 35 seconds in milliseconds
    const growTime = 113 * 1000; // 1 minute 53 seconds
    const weakenTime = 141 * 1000; // 2 minutes 21 seconds

    // Calculate weaken threads dynamically based on hack and grow thread counts
    const weakenThreads1 = Math.max(Math.ceil((hackThreads * 0.002) / 0.05), 1);
    const weakenThreads2 = Math.max(Math.ceil((growThreads * 0.004) / 0.05), 1);

    // Delays between actions to align with the longest action (Weaken)
    const delayWeaken1 = hackTime; // Weaken1 starts after Hack completes
    const delayGrow = weakenTime; // Grow starts after Weaken1
    const delayWeaken2 = growTime + weakenTime; // Weaken2 starts after Grow

    while (true) {
        const host = ns.getHostname();

        // Step 1: Execute Hack with no delay
        ns.exec('gptbatch/hackLogHelper.js', host, hackThreads, target, 0);

        // Step 2: Execute Weaken1 after Hack completes
        ns.exec('gptbatch/weakLogHelper.js', host, weakenThreads1, target, delayWeaken1);

        // Step 3: Execute Grow after Weaken1 completes
        ns.exec('gptbatch/growLogHelper.js', host, growThreads, target, delayGrow);

        // Step 4: Execute Weaken2 after Grow completes
        ns.exec('gptbatch/weakLogHelper.js', host, weakenThreads2, target, delayWeaken2);

        // Wait for the batch to finish before starting the next
        await ns.sleep(weakenTime + 200); // Ensures a continuous flow of batches
    }
}
