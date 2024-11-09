import { NS } from '@ns';
import { Logger } from '../logger/logger';
import { RunningScript } from '@ns'; 

const SECURITY_THRESHOLD_OFFSET = 5; // Offset for security level threshold
const MONEY_THRESHOLD_RATIO = 0.75; // Ratio of max money to trigger hacking


/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
  // Target server, either passed as argument or from the port
  const target = 'n00dles';
  const logger = new Logger(ns, 'OG-Hack');

  // Thresholds for security and money
  const securityThresh = ns.getServerMinSecurityLevel(target) + SECURITY_THRESHOLD_OFFSET;
  const moneyThresh = ns.getServerMaxMoney(target) * MONEY_THRESHOLD_RATIO;

  // Infinite loop for hack-grow-weaken operations
  while (true) {
    logger.info(`Running on host: ${ns.getHostname()} with PID: ${ns.pid}`);

    const currentSecurity = ns.getServerSecurityLevel(target);
    const currentMoney = ns.getServerMoneyAvailable(target);

    if (currentSecurity > securityThresh) {
      // If security is too high, weaken it
      await ns.weaken(target);
      logger.info(`Executed weaken on ${target} due to high security level.`);
    } else if (currentMoney < moneyThresh) {
      // If money is too low, grow it
      await ns.grow(target);
      logger.info(`Executed grow on ${target} due to low available money.`);
    } else {
      // Otherwise, hack the server
      await ns.hack(target);
      logger.info(`Executed hack on ${target} to extract funds.`);
    }

    // Log the current state
    logger.info(`Status - Target: ${target}, Security Level: ${currentSecurity}, Money Available: ${currentMoney}`);
  }
}
