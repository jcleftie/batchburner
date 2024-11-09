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
  const logger = new Logger(ns, 'getPservs');
  const logPort = 20; // Define which port to use
  const ram = 8; // RAM for each purchased server (8 GB by default)
  const serverScript = 'reset/early.js'; // Script to deploy on each purchased server
  const logScript = 'logger/logger.js'; // Logger script to deploy on each purchased server
  const threads = 3; // Number of threads to run the script with on each server
  const delay = 10000; // Delay between attempts in milliseconds

  // Log the start of the process
  const startMessage = 'Starting the getPservs script.';
  logger.info(startMessage);
  ns.writePort(logPort, startMessage);

  while (ns.getPurchasedServers().length < ns.getPurchasedServerLimit()) {
    for (let i = 0; i < ns.getPurchasedServerLimit(); i++) {
      const hostname = `pserv-${i}`;

      // Only attempt to purchase if the server slot is empty
      if (!ns.serverExists(hostname)) {
        if (ns.getServerMoneyAvailable('home') > ns.getPurchasedServerCost(ram)) {
          // Purchase the server and get its hostname
          const newHostname = ns.purchaseServer(hostname, ram);

          // Check if purchase was successful
          if (newHostname) {
            // Copy the script from "home" to the purchased server
            const scpSuccess = await ns.scp([serverScript, logScript], newHostname, 'home');
            if (!scpSuccess) {
              logger.error(`Failed to copy scripts to ${newHostname}.`);
              continue; // Skip execution if the copy failed
            }

            // Attempt to execute the script and capture the PID
            const pid = ns.exec(serverScript, newHostname, threads);
            if (pid === 0) {
              logger.error(
                `Failed to execute ${serverScript} on ${newHostname} with ${threads} thread(s). Check RAM or path.`,
              );
            } else {
              logger.info(
                `Distributed and executed ${serverScript} on ${newHostname} with ${threads} thread(s). PID: ${pid}`,
              );
            }
          } else {
            logger.error(`Failed to purchase server for ${hostname}.`);
          }
        } else {
          logger.warn(`Insufficient funds for purchasing server with ${ram} GB RAM. Retrying...`);
          await ns.sleep(delay); // Wait and recheck funds
        }
      }
    }
    await ns.sleep(delay); // Wait before rechecking the server slots
  }

  // Log the completion of the process
  const endMessage = 'Finished attempting to purchase and set up all servers.';
  logger.info(endMessage);
  ns.writePort(logPort, endMessage);
}
