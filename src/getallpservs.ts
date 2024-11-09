import { NS } from '@ns';

/** @param {NS} ns */
export async function main(ns: NS) {
  // How much RAM each purchased server will have. In this case, it'll
  // be 8GB.
  const ram = 8;

  // Iterator we'll use for our loop
  let i = 0;
  

  // Continuously try to purchase servers until we've reached the maximum
  // amount of servers
  while (i < ns.getPurchasedServerLimit()) {
    // Check if we have enough money to purchase a server
    if (ns.getServerMoneyAvailable('home') > ns.getPurchasedServerCost(ram)) {
      // If we have enough money, then:
      //  1. Purchase the server
      let hostname = ns.purchaseServer('pserv-' + i, ram);
      if (hostname) {
        //  2. Copy our hacking script onto the newly-purchased server
        await ns.scp(['dt1batch/tGrow.js', 'dt1batch/tHack.js', 'dt1batch/tWeaken.js'], hostname);
        //  3. Run our hacking script on the newly-purchased server with 3 threads (later)
        //  4. Increment our iterator to indicate that we've bought a new server
        ++i;
      }
    }
    // Make the script wait for a second before looping again.
    // Removing this line will cause an infinite loop and crash the game.
    await ns.sleep(1000);
  }
  const pservs = ns.getPurchasedServers();
  for (const pserv of pservs) {
    const maxRam = ns.getServerMaxRam(pserv);
    ns.tprint(`${pserv}: ${maxRam} GB`);
  }
}
