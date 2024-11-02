import { NS } from '@ns';

export async function main(ns: NS) {
  ns.tprint('Hello World!');

  const pservs = ns.getPurchasedServers();

  // Loop through each purchased server
  for (const pserv of pservs) {
    // Get the max RAM of the current server
    const maxRam = ns.getServerMaxRam(pserv);

    // Print the server name and its max RAM
    ns.tprint(`${pserv}: ${maxRam} GB`);
  }
}
