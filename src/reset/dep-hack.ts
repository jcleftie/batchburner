import { NS } from '@ns';
/** @param {NS} ns */
export async function main(ns: NS) {
  const script = '1-early.js'; // The script to copy and run
  const target = ns.args[0]; // Target host for the script to attack, e.g., 'n00dles'
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

  // Get purchased servers and filter for hosts with enough RAM
  const servers = ns
    .getPurchasedServers()
    .concat(targetHosts)
    .filter((host: any) => ns.getServerMaxRam(host) > 0);

  for (const host of servers) {
    // Copy the script to the host, overwriting any existing version
    await ns.scp(script, host, "home"); 

    // Calculate the maximum number of threads based on available RAM
    const maxRam = ns.getServerMaxRam(host);
    const scriptRam = ns.getScriptRam(script);
    const maxThreads = Math.floor(maxRam / scriptRam);

    if (maxThreads > 0) {
      ns.print(`Running ${script} on ${host} with ${maxThreads} threads targeting ${target}`);
      ns.exec(script, host, maxThreads, target); // Execute with max threads
    } else {
      ns.print(`Not enough RAM on ${host} to run ${script}.`);
    }
  }
  ns.tprint('Deployment complete.');
}

// Memory check function
async function memCheck(ns, script, host) {
    // Check if the script exists on the host
    if (!ns.fileExists(script, host)) {
        ns.tprint(`Error: Script ${script} does not exist on ${host}`);
        return 0;
    }

    // Get available RAM on the host
    const maxRam = ns.getServerMaxRam(host);
    const usedRam = ns.getServerUsedRam(host);
    const availableRam = maxRam - usedRam;

    // Get RAM cost of the script
    const scriptRam = ns.getScriptRam(script, host);

    if (scriptRam === 0) {
        ns.tprint(`Error: Script ${script} has zero RAM usage or does not exist.`);
        return 0;
    }

    // Calculate the number of threads that can be run
    const threads = Math.floor(availableRam / scriptRam);

    ns.tprint(`Memory Test Result for ${host}:`);
    ns.tprint(`Available RAM: ${availableRam.toFixed(2)} GB, Script RAM: ${scriptRam.toFixed(2)} GB`);
    ns.tprint(`Threads that can be executed: ${threads}`);
    
    return threads;
}