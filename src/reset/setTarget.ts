import { NS } from '@ns';
import { Logger } from '../logger/logger';

const TARGET_PORT = 1;

/**
 * Sets the target server to be used by other scripts.
 * Writes the target hostname to a port for accessibility across servers.
 *
 * @param ns - Netscript environment
 */
export async function main(ns: NS): Promise<void> {
  const target = ns.args[0] as string | undefined;
  const logger = new Logger(ns, 'TargetSystem');

  if (!target) {
    ns.tprint('Please provide a target hostname as an argument.');
    return;
  }

  // Check if target exists on the network
  if (!ns.serverExists(target)) {
    ns.tprint(`Target ${target} does not exist on the network.`);
    return;
  }

  // Clear the port and write the target to it
  ns.clearPort(TARGET_PORT);
  const success = await ns.tryWritePort(TARGET_PORT, target);

  if (success) {
    logger.info(`Target server set to: ${target}`);
  } else {
    logger.error(`Failed to set target server to: ${target}`);
  }
}


import { NS } from '@ns';

const TARGET_PORT = 1;

/**
 * Gets the target server from an argument or from the target port.
 *
 * @param ns - Netscript environment
 * @returns target - Target hostname as a string
 */
function getTarget(ns: NS): string {
  const argTarget = ns.args[0] as string | undefined;

  if (argTarget) return argTarget;
  const portData = ns.peek(TARGET_PORT);
  if (portData !== 'NULL PORT DATA') {
    return portData as string;
  }
  throw new Error('Target server not provided and no target set in the target port.');
}

/**
 * Example main function utilizing getTarget to identify the target server.
 *
 * @param ns - Netscript environment
 */
export async function main(ns: NS): Promise<void> {
  try {
    const target = getTarget(ns);
    ns.tprint(`Target server: ${target}`);
    // Use `target` in your script logic here
  } catch (error) {
    ns.tprint(error);
  }
}
