import { NS } from '@ns';

/** @param {NS} ns */
export async function main(ns: NS): Promise<void> {
  ns.disableLog('sleep');
  ns.disableLog('getServerMoneyAvailable');
  ns.disableLog('getServerSecurityLevel');

  const target = 'joesguns';
  const growScript = 'toddlerbatch/growHelper.js';
  const weakenScript = 'toddlerbatch/weakenHelper.js';

  // Parameters for threads - adjust based on your pserv capacity
  const growThreads = 10; // Adjust based on your available RAM per pserv
  const weakenThreads = 20; // Adjust based on your available RAM per pserv

  while (true) {
    const currentMoney = ns.getServerMoneyAvailable(target);
    const maxMoney = ns.getServerMaxMoney(target);
    const currentSecurity = ns.getServerSecurityLevel(target);
    const minSecurity = ns.getServerMinSecurityLevel(target);

    if (currentMoney < maxMoney) {
        ns.print(`Growing ${target} - Current Money: ${ns.formatNumber(currentMoney)} / ${ns.formatNumber(maxMoney)}`);
        for (const server of ns.getPurchasedServers()) {
            const availableRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
            const maxPossibleGrowThreads = Math.floor(availableRam / ns.getScriptRam(growScript));
            const threadsToUse = Math.min(growThreads, maxPossibleGrowThreads);
            if (threadsToUse > 0) {
                ns.exec(growScript, server, threadsToUse, target);
            }
        }
        await ns.sleep(ns.getGrowTime(target) + 100); // Buffer time for growth
    } else if (currentSecurity > minSecurity) {
        ns.print(`Weakening ${target} - Current Security: ${currentSecurity.toFixed(2)} / ${minSecurity}`);
        for (const server of ns.getPurchasedServers()) {
            const availableRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
            const maxPossibleWeakenThreads = Math.floor(availableRam / ns.getScriptRam(weakenScript));
            const threadsToUse = Math.min(weakenThreads, maxPossibleWeakenThreads);
            if (threadsToUse > 0) {
                ns.exec(weakenScript, server, threadsToUse, target);
            }
        }
        await ns.sleep(ns.getWeakenTime(target) + 100); // Buffer time for weakening
    } else {
        ns.print(`${target} is fully prepped!`);
        break; // Exit the loop when target is fully prepped
    }
}

// Start the controller after the prep is complete
ns.exec('toddlerbatch/gunController.js', 'home', 1);
}
