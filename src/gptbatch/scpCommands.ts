import { NS } from '@ns';

/** @param {NS} ns */
export async function main(ns: NS): Promise<void> {
  // List of target servers
  const targetServers = [
    'n00dles',
    'foodnstuff',
    'sigma-cosmetics',
    'max-hardware',
    'joesguns',
    'CSEC',
    'hong-fang-tea',
    'harakiri-sushi',
    'nectar-net',
    'neo-net',
    'the-hub',
    'rothman-uni',
    'summit-uni',
    'alpha-ent',
    'omnia',
    'univ-energy',
    'millenium-fitness',
    'global-pharm',
    'phantasy',
    'I.I.I.I',
    'omega-net',
    'zb-institute',
    'lexo-corp',
    'unitalife',
    'solaris',
    'catalyst',
    'aevum-police',
    'iron-gym',
    'zer0',
    'silver-helix',
    'netlink',
    'avmnite-02h',
    'rho-construction',
  ];

  // Add purchased servers (pserv-0 to pserv-24)
  for (let i = 0; i <= 24; i++) {
    targetServers.push(`pserv-${i}`);
  }

  // Define the files to copy
  const files = ['gptbatch/rho-batcher.js'];

  // pulled out thee for now 'gptbatch/hackLogHelper.js', 'gptbatch/growLogHelper.js', 'gptbatch/weakLogHelper.js',
  
  // Generate and display the scp command for each target server
  let scpCommands = '';
  for (const server of targetServers) {
    for (const file of files) {
      scpCommands += `scp ${file} ${server}; `;
    }
  }

  // Print the command to the terminal
  ns.tprint('Run the following command in the terminal to copy the files:');
  ns.tprint(scpCommands);
}
