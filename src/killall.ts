import { NS } from '@ns';

const DELAY_BETWEEN_SERVERS = 300; // Delay in milliseconds between each server check

/**
 * Main function to iterate through all purchased and target servers,
 * and kill all scripts running on each one, with a delay between each.
 *
 * @param ns - The Netscript environment.
 */
export async function main(ns: NS): Promise<void> {
  // Define your purchased servers (pserv-)
  const purchasedServers = ns.getPurchasedServers();

  // Define your target servers
  const targetServers = [
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

  // Combine both arrays into one for easier iteration
  const allServers = [...purchasedServers, ...targetServers];

  // Iterate through each server with a delay between each
  for (const server of allServers) {
    // Check if the server exists
    if (ns.serverExists(server)) {
      ns.tprint(`Killing all scripts on ${server}...`);

      // Kill all running scripts on the server
      const result = ns.killall(server);

      if (result) {
        ns.tprint(`Successfully killed all scripts on ${server}`);
      } else {
        ns.tprint(`No scripts running on ${server}`);
      }
    } else {
      ns.tprint(`Server ${server} does not exist.`);
    }

    // Delay before moving to the next server
    await ns.sleep(DELAY_BETWEEN_SERVERS);
  }
}
