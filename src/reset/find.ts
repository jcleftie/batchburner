import { NS } from '@ns';
import { Logger } from '../logger/logger';

/**
 * Recursively discovers all servers connected to a given server.
 *
 * @param ns - Netscript environment
 * @param currentServer - The server to start scanning from
 * @param discoveredServers - Set to keep track of discovered servers and avoid duplicates
 */
function recursivelyFindAllServers(ns: NS, currentServer: string, discoveredServers: Set<string>) {
  const connectedServers = ns.scan(currentServer);

  for (const server of connectedServers) {
    if (!discoveredServers.has(server)) {
      discoveredServers.add(server);
      recursivelyFindAllServers(ns, server, discoveredServers); // Recur for each newly found server
    }
  }
}

/**
 * Main function to initiate recursive server discovery.
 * Starts from 'home' server by default.
 *
 * @param ns - Netscript environment
 */
export async function main(ns: NS): Promise<void> {
  const logger = new Logger(ns, 'ServerDiscovery');
  const discoveredServers = new Set<string>(['home']);

  // Log the start of the discovery process
  logger.info('Starting recursive server discovery...');

  // Discover servers
  recursivelyFindAllServers(ns, 'home', discoveredServers);

  // Convert Set to Array
  const serverList = Array.from(discoveredServers);

  // Log the end of the discovery process
  logger.info(`Server discovery completed. Total servers found: ${serverList.length}`);

  // Save results to a JSON file in data folder with a timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `/data/find-${timestamp}.json`;
  await ns.write(filename, JSON.stringify(serverList, null, 2), 'w');

  // Log the saved file location
  logger.info(`Discovery results saved to ${filename}`);
}
