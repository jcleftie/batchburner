import { NS } from '@ns';
import { Logger } from '../logger/logger';

const TARGET_PORT = 1;
const targetScript = 'reset/early.js';

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
 * Main function to execute a script across specified servers.
 * @param ns - The Netscript environment.
 */
export async function main(ns: NS): Promise<void> {
  const logger = new Logger(ns, 'ez-exec');

  // Retrieve the target server using the `getTarget` function.
  let target: string;
  try {
    target = getTarget(ns);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message);
    } else {
      logger.error(String(error));
    }
    return;
  }

  // List of all servers to run the script on
  const targetHosts = [
    ...ns.getPurchasedServers(),
    'neo-net',
    'silver-helix',
    'omega-net',
    'johnson-ortho',
    'the-hub',
    'computek',
    'netlink',
    'catalyst',
    'millenium-fitness',
    'rho-construction',
    'run4theh111z',
    'syscore',
    'global-pharm',
    'solaris',
    'helios',
    'deltaone',
    'vitalife',
    'taiyang-digital',
    'The-Cave',
    'aerocorp',
    'omnitek',
    'CSEC',
    'I.I.I.I',
    'n00dles',
    'foodnstuff',
    'sigma-cosmetics',
    'joesguns',
    'nectar-net',
    'hong-fang-tea',
    'harakiri-sushi',
    'zer0',
    'max-hardware',
    'phantasy',
    'iron-gym',
    'crush-fitness',
    'rothman-uni',
    'aevum-police',
    'summit-uni',
    'alpha-ent',
    'lexo-corp',
    'snap-fitness',
    'zb-institute',
    'nova-med',
    'zb-def',
    'univ-energy',
    'applied-energetics',
    'zeus-med',
    'unitalife',
    'galactic-cyber',
    'titan-labs',
    'microdyne',
    'icarus',
    'omnia',
    'infocomm',
    'blade',
    'defcomm',
    'b-and-a',
    'powerhouse-fitness',
    'stormtech',
    'kuai-gong',
    '4sigma',
    'clarkinc',
    'fulcrumtech',
    'megacorp',
    'nwo',
    'ecorp',
    'fulcrumassets',
    'avmnite-02h',
  ];

  for (const host of targetHosts) {
    // Calculate available threads based on server RAM and script RAM usage
    const availableRam = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
    const scriptRam = ns.getScriptRam(targetScript);

    const maxThreads = Math.floor(availableRam / scriptRam);
    if (maxThreads < 1) {
      logger.info(`Skipping ${host} - insufficient RAM for even 1 thread.`);
      continue;
    }

    // Execute script with maximum possible threads, using `target` as an argument
    const pid = ns.exec(targetScript, host, maxThreads, target);
    if (pid === 0) {
      logger.warn(`Failed to execute ${targetScript} on ${host} with ${maxThreads} threads.`);
    } else {
      logger.info(`Executing ${targetScript} on ${host} targeting ${target} with ${maxThreads} threads.`);
    }
  }
  logger.info('Execution script complete.');
}
