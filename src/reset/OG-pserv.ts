import { NS } from '@ns';
import { Logger } from '../logger/logger';

/**
 * Main function to purchase servers and deploy a script.
 * This script attempts to fill all available purchased server slots with servers of a specified RAM size,
 * and deploys a given script to each server.
 *
 * @param ns - Netscript environment
 */
export async function main(ns: NS): Promise<void> {
  const logger = new Logger(ns, 'OG-getPservs');
  const ram = 8; // RAM for each purchased server (8 GB by default)
  const threads = 3; // Number of threads to run the script with on each server
  const delay = 1000; // Delay between attempts in milliseconds

  // Iterator we'll use for our loop
  let i = 0;

  // Continuously try to purchase servers until we've reached the maximum
  // amount of servers
  while (i < ns.getPurchasedServerLimit()) {
    // Check if we have enough money to purchase a server
    if (ns.getServerMoneyAvailable('home') > ns.getPurchasedServerCost(ram)) {
      // If we have enough money, then:
      //  1. Purchase the server
      //  2. Copy our hacking script onto the newly-purchased server
      //  3. Run our hacking script on the newly-purchased server with 3 threads
      //  4. Increment our iterator to indicate that we've bought a new server
      let hostname = ns.purchaseServer('pserv-' + i, ram);
      ns.scp('earlyOG.js', hostname);
      ns.exec('earlyOG.js', hostname, threads);
      logger.info(`Purchased server ${hostname} with ${ram} GB of RAM.`);
      ++i;
    }
    //Make the script wait for a second before looping again.
    //Removing this line will cause an infinite loop and crash the game.
    await ns.sleep(delay);
  }
}
