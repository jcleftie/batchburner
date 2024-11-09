import { NS } from '@ns';

/** @param {NS} ns */
export async function main(ns: NS): Promise<void> {
    const target = ns.args[0] as string;
    const additionalMsec = ns.args[1] as number;

    // Perform the hack action with the specified delay
    await ns.hack(target, { additionalMsec });
}
