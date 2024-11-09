import { NS } from '@ns';

/** @param {NS} ns */
export async function main(ns: NS) {
  const target = 'summit-uni';

  // Get the minimum security level for the target
  const minSecurity = ns.getServerMinSecurityLevel(target);

  ns.print(`Weakening ${target} to min security...`);

  while (ns.getServerSecurityLevel(target) > minSecurity) {
    // Calculate threads needed to bring security down efficiently
    const securityDiff = ns.getServerSecurityLevel(target) - minSecurity;
    const weakenThreads = Math.max(Math.ceil(securityDiff / 0.05), 1); // Each weaken thread reduces security by 0.05

    // Execute weaken
    await ns.weaken(target);
  }

  ns.print(`${target} weakened to min security.`);
}
