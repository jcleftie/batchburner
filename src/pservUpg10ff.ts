import { NS } from '@ns';
import { Logger } from './logger/logger';

/**
 * Upgrades all purchased servers to the specified target RAM, if affordable.
 *
 * @param ns - Netscript environment
 */
export async function main(ns: NS): Promise<void> {
  const targetRam = 1024; // Target RAM in GB for each purchased server
  const logger = new Logger(ns, 'pserv-upgrade');

  // Get a list of all purchased servers
  const purchasedServers = ns.getPurchasedServers();

  // Log start of upgrade process
  logger.info(`Starting pserv upgrade process to ${targetRam} GB.`);

  // Iterate over each purchased server
  for (const server of purchasedServers) {
    const currentRam = ns.getServerMaxRam(server); // Current max RAM of the server

    // Upgrade only if current RAM is below target RAM
    if (currentRam < targetRam) {
      const cost = ns.getPurchasedServerUpgradeCost(server, targetRam); // Cost to upgrade

      // Check if you have enough money for the upgrade
      if (ns.getServerMoneyAvailable('home') >= cost) {
        const success = ns.upgradePurchasedServer(server, targetRam); // Attempt to upgrade

        // Log success or failure of the upgrade
        if (success) {
          logger.info(`${server} successfully upgraded to ${targetRam} GB!`);
        } else {
          logger.error(`Failed to upgrade ${server} to ${targetRam} GB.`);
        }
      } else {
        logger.warn(`Not enough money to upgrade ${server}. Cost: ${ns.nFormat(cost, '$0.00a')}`);
      }
    } else {
      logger.info(`${server} already has ${currentRam} GB or more.`);
    }
  }
  // Log completion of upgrade process
  logger.info(`Finished pserv upgrade process.`);
}
