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

  // Define the batcher file and target for the batcher script
  const batcherScript = 'gptbatch/batcher.js';
  const targetForBatcher = 'phantasy'; // Target server for batching; change if needed
  const threads = 20; // Number of threads to run; adjust as needed

  // Generate and display the run command for each server
  let runCommands = '';
  for (const server of targetServers) {
    runCommands += `run ${batcherScript} -t ${threads} ${targetForBatcher} -s ${server}; `;
  }

  // Print the command to the terminal
  ns.tprint('Run the following command in the terminal to start the batcher on all servers:');
  ns.tprint(runCommands);
}
