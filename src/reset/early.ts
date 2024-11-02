import { NS } from '@ns';
import { Logger } from '../logger/logger';

const TARGET_PORT = 1; // Port used for target sharing
const SECURITY_THRESHOLD_OFFSET = 5; // Offset for security level threshold
const MONEY_THRESHOLD_RATIO = 0.75; // Ratio of max money to trigger hacking

/**
 * Function to retrieve the target server from arguments or a shared port.
 * @param ns - The Netscript environment.
 * @returns target - The target server as a string.
 */
function getTarget(ns: NS): string {
  const argTarget = ns.args[0] as string | undefined;

  // If a target is provided in args, use it; otherwise, check the port.
  if (argTarget) return argTarget;

  const portData = ns.peek(TARGET_PORT);
  if (portData !== 'NULL PORT DATA') {
    return portData as string;
  }

  throw new Error('Target server not provided and no target set in the target port.');
}

/**
 * Main function to manage hack-grow-weaken operations on a target server.
 * @param ns - The Netscript environment.
 */
export async function main(ns: NS): Promise<void> {
  const logger = new Logger(ns, 'earlyHack');

  // Retrieve the target server using the `getTarget` function.
  let target: string;
  try {
    target = getTarget(ns);
  } catch (error) {
    logger.error((error as Error).message);
    return;
  }

  const securityThreshold = ns.getServerMinSecurityLevel(target) + SECURITY_THRESHOLD_OFFSET;
  const moneyThreshold = ns.getServerMaxMoney(target) * MONEY_THRESHOLD_RATIO;

  // Disable unnecessary logs
  ns.disableLog('getServerSecurityLevel');
  ns.disableLog('getServerMoneyAvailable');
  ns.disableLog('weaken');
  ns.disableLog('grow');
  ns.disableLog('hack');

  logger.info(`Starting hack script for target: ${target}`);
  logger.info(`Security threshold: ${securityThreshold}, Money threshold: ${moneyThreshold}`);

  // Continuous loop to monitor and execute hack-grow-weaken cycles
  while (true) {
    if (ns.getServerSecurityLevel(target) > securityThreshold) {
      // Weaken if security is above the threshold
      await ns.weaken(target);
    } else if (ns.getServerMoneyAvailable(target) < moneyThreshold) {
      // Grow if money is below the threshold
      await ns.grow(target);
    } 
  }
}
