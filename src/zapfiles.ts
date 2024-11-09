import { NS } from '@ns';

/**
 * Deletes specified files from all target servers.
 *
 * Usage: run deleteFiles.js [file1] [file2] ...
 *
 * @param ns - Netscript environment
 */
export async function main(ns: NS): Promise<void> {
  const filesToDelete = ns.args as string[];

  if (filesToDelete.length === 0) {
    ns.tprint('Please provide at least one filename to delete.');
    return;
  }

  // Define the servers where files need to be deleted
  const purchasedServers = ns.getPurchasedServers();
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

  const allServers = [...purchasedServers, ...targetServers];

  for (const server of allServers) {
    if (ns.serverExists(server)) {
      ns.tprint(`Attempting to delete files on ${server}...`);
      for (const file of filesToDelete) {
        const result = ns.rm(file, server);
        if (result) {
          ns.tprint(`Successfully deleted ${file} on ${server}`);
        } else {
          ns.tprint(`Failed to delete ${file} on ${server}. File may not exist.`);
        }
      }
    } else {
      ns.tprint(`Server ${server} does not exist.`);
    }

    // Introduce a small delay to prevent system overload
    await ns.sleep(200);
  }
  ns.tprint('File deletion process complete.');
}
