import { NS } from '@ns';
import { Logger } from '../logger/logger';

const serverList: string[] = [
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

/**
 * Attempts to crack open servers by using available port-opening programs
 * and gains root access if enough ports are opened.
 * @param ns - Netscript environment
 */
export async function main(ns: NS): Promise<void> {
  const logger = new Logger(ns, 'apc');
  const startTime = new Date().toISOString();
  const logPort = 20; // Define which port to use
  const crackedServers: { [server: string]: string[] } = {}; // Track servers and the tools used to crack them
  const failedServers: string[] = []; // Track servers that couldn't be cracked

  logger.info('Starting the APC script for port cracking.');

  for (const server of serverList) {
    let portsOpened = 0;
    const numPortsRequired = ns.getServerNumPortsRequired(server);
    const availableOpeners: string[] = [];

    if (!ns.hasRootAccess(server)) {
      // Try each port-opening tool if available
      if (ns.fileExists('BruteSSH.exe', 'home')) {
        ns.brutessh(server);
        portsOpened++;
        availableOpeners.push('BruteSSH');
      }
      if (portsOpened < numPortsRequired && ns.fileExists('FTPCrack.exe', 'home')) {
        ns.ftpcrack(server);
        portsOpened++;
        availableOpeners.push('FTPCrack');
      }
      if (portsOpened < numPortsRequired && ns.fileExists('relaySMTP.exe', 'home')) {
        ns.relaysmtp(server);
        portsOpened++;
        availableOpeners.push('relaySMTP');
      }
      if (portsOpened < numPortsRequired && ns.fileExists('HTTPWorm.exe', 'home')) {
        ns.httpworm(server);
        portsOpened++;
        availableOpeners.push('HTTPWorm');
      }
      if (portsOpened < numPortsRequired && ns.fileExists('SQLInject.exe', 'home')) {
        ns.sqlinject(server);
        portsOpened++;
        availableOpeners.push('SQLInject');
      }

      // Attempt to gain root if sufficient ports were opened
      if (portsOpened >= numPortsRequired) {
        ns.nuke(server);
        logger.info(`Successfully cracked and nuked ${server}.`);
        crackedServers[server] = availableOpeners; // Record successfully cracked server and tools used
      } else {
        failedServers.push(server); // Record if not enough ports were opened
        logger.info(`Failed to crack ${server}. Opened ${portsOpened} out of ${numPortsRequired} required ports.`);
      }
    } else {
      logger.info(`Skipping ${server} - already has root access.`);
    }

    await ns.sleep(500); // Short delay between each attempt
  }

  // Log and save results to JSON
  const summary = {
    startTime,
    endTime: new Date().toISOString(),
    crackedServers,
    failedServers,
  };

  const filename = `/data/nukem-${Date.now()}.json`;
  await ns.write(filename, JSON.stringify(summary, null, 2), 'w');

  logger.info(`APC script completed. Results saved to ${filename}`);
  logger.info('SCP setup complete.');
  // Log the completion of the process
  const endMessage = 'Finished port crack attempts.';
  logger.info(endMessage);
  ns.writePort(logPort, endMessage);
}
