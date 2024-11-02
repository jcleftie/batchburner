import { NS } from '@ns';
import { Logger } from '../logger/logger';
/**
 * Distributes and runs a specified script on a list of target servers.
 *
 * @param ns - Netscript environment
 */

export async function main(ns: NS): Promise<void> {
  const logger = new Logger(ns, 'ez-scp');
  const FILES_TO_COPY = ['logger/logger.js', 'reset/early.js'];
  

  // Identify purchased servers and target hosts
  // const pservs = ns.getPurchasedServers();
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

  // Combine pservs and targetHosts into one list
  const hostsToCopy = [...targetHosts];
  // ...pservs taken out of array

  // Copy files to each host
  for (const host of hostsToCopy) {
    const success = await ns.scp(FILES_TO_COPY, host, 'home');
    if (success) {
      logger.info(`Successfully copied files to ${host}`);
    } else {
      logger.error(`Failed to copy files to ${host}`);
    }
  }
  logger.info('SCP setup complete.');
}
