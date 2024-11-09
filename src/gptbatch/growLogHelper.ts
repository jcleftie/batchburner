import { NS } from '@ns';

/** @param {NS} ns */
export async function main(ns: NS): Promise<void> {
    const target = ns.args[0] as string;
    const additionalMsec = ns.args[1] as number;
    const portNumber = 1;  // The port the logger is listening on

    // Perform the grow action with the specified delay
    await ns.grow(target, { additionalMsec });

    // Send a log message to the logger after completion
    ns.writePort(portNumber, `[Grow] Completed on ${target} with delay ${additionalMsec}ms`);
}
