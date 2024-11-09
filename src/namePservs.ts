import { NS } from '@ns';

export async function main(ns: NS) {
  const args = ns.args;
  if (args.length < 2) {
    ns.tprint('Usage: run namePservs.js <currentServerName> <newServerName>');
    return;
  }

  const currentServerName = args[0] as string;
  const newServerName = args[1] as string;

  // Check if the server exists
  if (ns.serverExists(currentServerName)) {
    const success = ns.renamePurchasedServer(currentServerName, newServerName); // Rename the server

    if (success) {
      ns.tprint(`Renamed server ${currentServerName} to ${newServerName}.`);
    } else {
      ns.tprint(`Failed to rename server ${currentServerName}.`);
    }
  } else {
    ns.tprint(`Server ${currentServerName} does not exist.`);
  }
}
