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
  const threads = 3; // Number of threads to run the script with on each server
  const delay = 1000; // Delay between attempts in milliseconds

  // Log the start of the process
  const startMessage = 'Starting the getPservs script.';
  logger.info(startMessage);
  ns.writePort(logPort, startMessage);

  for (let i = 0; i < ns.getPurchasedServerLimit(); i++) {
    if (ns.getServerMoneyAvailable('home') > ns.getPurchasedServerCost(ram)) {
      // Purchase the server and get its hostname
      const hostname = `pserv-${i}`;
      const newHostname = ns.purchaseServer(hostname, ram);

      // Check if purchase was successful
      if (newHostname) {
        // Copy the script from "home" to the purchased server
        const scpSuccess = await ns.scp(serverScript, newHostname, 'home');
        if (!scpSuccess) {
          logger.error(`Failed to copy ${serverScript} to ${newHostname}.`);
          continue; // Skip execution if the copy failed
        }

        // Attempt to execute the script and capture the PID
        const pid = ns.exec(serverScript, newHostname, threads);
        if (pid === 0) {
          // Log failure if PID is 0 (indicating an execution failure)
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
      logger.warn(`Insufficient funds for purchasing server with ${ram} GB RAM.`);
    }
    await ns.sleep(delay); // Wait between each purchase attempt
  }

  // Log the completion of the process
  const endMessage = 'Finished attempting to purchase and set up all servers.';
  logger.info(endMessage);
  ns.writePort(logPort, endMessage);
}
