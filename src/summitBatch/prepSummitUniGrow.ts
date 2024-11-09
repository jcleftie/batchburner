import { NS } from '@ns';

/** @param {NS} ns */
export async function main(ns: NS) {
  const target = 'summit-uni';

  // Get the maximum money available on the target
  const maxMoney = ns.getServerMaxMoney(target);

  ns.print(`Growing ${target} to max money...`);

  while (ns.getServerMoneyAvailable(target) < maxMoney) {
    // Calculate threads needed for a x3 growth
    const growThreads = Math.max(Math.floor(ns.hackAnalyzeThreads(target, maxMoney)), 1); // Adjust as needed based on growth rate

    // Execute grow
    await ns.grow(target);
  }

  ns.print(`${target} grown to max money.`);
}
