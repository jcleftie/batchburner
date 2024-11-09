import { NS } from '@ns';

/** @param {NS} ns */
export async function main(ns: NS): Promise<void> {
  // Ensure correct usage with two arguments: server and hackAmount
  if (ns.args.length < 2) {
    ns.tprint('Usage: run hackThreadsCalculator.js [server] [hackAmount]');
    ns.tprint('Example: run hackThreadsCalculator.js n00dles 100000');
    return;
  }

  // Parse arguments
  const target = ns.args[0] as string;
  const hackAmount = Number(ns.args[1]);

  // Check for valid hackAmount input
  if (hackAmount <= 0) {
    ns.tprint('Error: hackAmount must be greater than zero.');
    return;
  }

  // Calculate the number of threads required to hack the specified amount
  const hackThreads = ns.hackAnalyzeThreads(target, hackAmount);

  // Check if the function returned -1, which indicates an invalid hackAmount
  if (hackThreads === -1) {
    ns.tprint(
      `Error: Cannot hack ${hackAmount} from ${target}. Either amount is too high or the target has insufficient funds.`,
    );
  } else {
    // Display the result as an integer thread count
    const requiredThreads = Math.ceil(hackThreads); // Round up to ensure we hack the full amount
    ns.tprint(`To hack ${hackAmount} from ${target}, you need approximately ${requiredThreads} threads.`);
  }
}
