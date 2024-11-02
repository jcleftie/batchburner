import { NS } from '@ns';
import { Logger } from '../logger/logger';

/**
 * Distributes and runs a specified script on a list of target servers.
 *
 * @param ns - Netscript environment
 */
export async function main(ns: NS): Promise<void> {
  const logger = new Logger(ns, 'distribution');
  const script = 'reset/early.js'; // Script to distribute
  const defaultThreads = 1; // Default threads per server
  const delay = 500; // Delay between deployments in milliseconds

  // Define target servers
  const targetHosts = [
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
    'darkweb',
    'sigma-cosmetics',
    'joesguns',
    'nectar-net',
    'hong-fang-tea',
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

  logger.info('Starting script distribution...');

  for (const host of targetHosts) {
    if (!ns.hasRootAccess(host)) {
      logger.info(`Skipping ${host} - no root access.`);
      continue;
    }

    const scpSuccess = await ns.scp(script, host, 'home');
    if (!scpSuccess) {
      logger.error(`Failed to copy ${script} to ${host}.`);
      continue;
    }

    const availableRam = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
    const requiredRam = ns.getScriptRam(script);
    const maxPossibleThreads = Math.floor(availableRam / requiredRam);

    if (maxPossibleThreads < 1) {
      logger.info(`Skipping ${host} - insufficient RAM for even 1 thread of ${script}.`);
      continue;
    }

    // Run with as many threads as possible, up to the default
    const threadsToUse = Math.min(maxPossibleThreads, defaultThreads);
    const pid = ns.exec(script, host, threadsToUse); // Execute with target as an argument
    if (pid === 0) {
      logger.error(`Failed to execute ${script} on ${host} with ${threadsToUse} threads.`);
    } else {
      logger.info(`Successfully executed ${script} on ${host} with ${threadsToUse} threads. PID: ${pid}`);
    }

    await ns.sleep(delay); // Slight delay to manage distribution speed
  }

  logger.info('Script distribution complete.');
}
