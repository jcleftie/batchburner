import { NS } from '@ns';
import { Logger } from '../logger/logger';

interface PathResult {
  target: string;
  path: string[];
  command: string;
}

/**
 * Main function to find the shortest path from 'home' to a target server and save the output to a JSON file.
 * @param ns - Netscript environment.
 */
export async function main(ns: NS): Promise<void> {
  const logger = new Logger(ns, 'findServer');
  const logPort = 20; // Define which port to use
  const target = ns.args[0] as string | undefined;

  if (!target) {
    ns.tprint('Please provide a target server as the first argument.');
    return;
  }

  const path = findServerPath(ns, target);

  if (!path || path.length === 0) {
    ns.tprint(`Error: Could not find a path to ${target}`);
    return;
  }

  const connectCommand = `connect ${path.join('; connect ')}`;
  const result: PathResult = {
    target: target,
    path: path,
    command: connectCommand,
  };
  // Log the end of the discovery process
  logger.info(`Server discovery completed. Total servers found: ${path.length}`);
  // Log the completion of the process
  const endMessage = 'Servers found and saved to JSON file.';
  logger.info(endMessage);
  ns.writePort(logPort, endMessage);

  // Save to JSON file
  await ns.write(`/data/pathTo_${target}.json`, JSON.stringify(result, null, 2), 'w');
}

/**
 * Finds the shortest path from 'home' to the target server using a breadth-first search.
 * @param ns - Netscript environment.
 * @param target - The name of the target server.
 * @returns An array representing the path to the target server, excluding 'home'.
 */
function findServerPath(ns: NS, target: string): string[] | null {
  const queue: string[][] = [['home']]; // Queue of paths
  const visited: Record<string, boolean> = { home: true }; // Track visited servers

  // Perform BFS
  while (queue.length > 0) {
    const path = queue.shift() as string[]; // Get the next path to check
    const current = path[path.length - 1]; // Last server in the current path

    // Check if target is reached
    if (current === target) return path.slice(1); // Exclude 'home' from path

    // Scan neighbors and add unvisited ones to the queue
    const neighbors = ns.scan(current);
    for (const neighbor of neighbors) {
      if (!visited[neighbor]) {
        visited[neighbor] = true;
        queue.push([...path, neighbor]); // Push new path to queue
      }
    }
  }
  return null;
}
