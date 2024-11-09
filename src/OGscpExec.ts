import { NS } from '@ns';

/** @param {NS} ns */
export async function main(ns:NS) {
  ns.tail();
  

  // Define your target servers
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

  // Combine both arrays into one for easier iteration
  const allServers = [...targetServers];

  // Iterate through each server
  for (const server of allServers) {
    // Check if the server exists
    if (ns.serverExists(server)) {
      ns.print(`Killing all scripts on ${server}...`);

      // Kill all running scripts on the server
      const result = ns.killall(server);
      await ns.sleep(100); // short delay before scp
      const filesToCopy = [
        'earlyOG.js'
        ];
        for (const file of filesToCopy) {
            await ns.scp(file, server, "home");
            ns.print(`Copied ${file} to ${server}`);
            }
        let num = 0;
        const hthreads = Math.floor(ns.getServerMaxRam(server) / ns.getScriptRam(filesToCopy[0]));
        for (const exec of filesToCopy) {
            ns.exec(exec, server, hthreads);
            ns.print(`Executed ${exec} on ${server}`);
            }
      if (result) {
        ns.tprint(`Successfully killed all scripts on ${server} and copied ${filesToCopy}`);
      } else {
        ns.print(`No scripts running on ${server}`);
      }
    } else {
      ns.print(`Server ${server} does not exist.`);
    }
  }
}
