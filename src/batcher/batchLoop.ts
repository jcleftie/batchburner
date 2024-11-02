import { NS } from '@ns';
import { Batcher } from './batcher';
import { Logger } from '../logger/logger';
import { PServer } from '@/util/purchasedServer';

const MAX_CONCURRENT_BATCHES = 5;
const TARGET_PORT = 1;
const homeReservedRamRatio = 0.3;

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

export async function main(ns: NS): Promise<void> {
  const logger = new Logger(ns, 'BatchLoop');
  let target: string;

  // Retrieve the target server using `getTarget`.
  try {
    target = getTarget(ns);
  } catch (error) {
    logger.error(`Error retrieving target: ${error instanceof Error ? error.message : String(error)}`);
    return;
  }

  const reservedRam = (ns.args[1] as number) ?? 20;
  const batcher = new Batcher(ns, target);
  const pServer = new PServer(ns);

  logger.info('Batch loop initiated.');

  while (true) {
    if (!ns.scriptRunning('dashboard.js', 'home')) {
      logger.warn("Dashboard isn't running. Exiting batch loop.");
      return;
    }

    const availableMoney = ns.getServerMoneyAvailable('home');
    if (availableMoney > 1e9) {
      await pServer.run();
      await ns.sleep(5000);
    }

    if (!(await batcher.isPrepped(target))) {
      try {
        logger.info(`Prepping target: ${target}`);
        await batcher.prepServer(target);
        await ns.sleep(ns.getWeakenTime(target) + 2000);
      } catch (error) {
        logger.error(`Error prepping target ${target}: ${error}`);
      }
    } else {
      const availableRam = ns.getServerMaxRam('home') - ns.getServerUsedRam('home');
      const homeReservedRam = homeReservedRamRatio * ns.getServerMaxRam('home');

      if (withinBatchLimit(ns) && availableRam > homeReservedRam + reservedRam) {
        try {
          await batcher.runBatch(target, reservedRam);
          logger.info(`Batch execution complete on ${target}`);
        } catch (error) {
          logger.error(`Batch execution failed on ${target}: ${error}`);
        }
      } else {
        logger.warn('Not enough RAM or batch limit reached; retrying in 5 seconds.');
        await ns.sleep(5000);
      }
    }

    await ns.sleep(1000);
  }
}

function withinBatchLimit(ns: NS): boolean {
  return ns.ps().filter((p) => p.filename.includes('batch')).length < MAX_CONCURRENT_BATCHES;
}
