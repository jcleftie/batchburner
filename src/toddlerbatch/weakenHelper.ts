import { NS } from '@ns';

/** @param {NS} ns */
export async function main(ns: NS): Promise<void> {
    const target = 'joesguns';
    const additionalMsec = 200;

    // Perform the weaken action with the specified delay
    await ns.weaken(target, { additionalMsec });
}
