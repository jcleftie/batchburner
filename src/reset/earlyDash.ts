import { NetscriptPort, NS } from '@ns';
import { Logger } from '../logger/logger';
// Define the port number for target sharing
const TARGET_PORT = 1;


/**
 * Main function to initialize and execute all early reset scripts sequentially,
 * then monitor system status and log information periodically.
 * @param ns - Netscript environment
 */
export async function main(ns: NS): Promise<void> {
  const logger = new Logger(ns, 'earlyDash');
  const logInterval = 5000; // Interval between dashboard updates (5 seconds)
  ns.clearPort(logger.logPort);
  const target = ns.args[0] as string | undefined;
  ns.clearLog();

  // Disable unnecessary logs
  const killLogs: string[] = ['sleep'];
  killLogs.forEach((log) => ns.disableLog(log));

  // Set up the Tail window for the dashboard
  ns.tail();
  ns.resizeTail(1250, 250);
  ns.moveTail(700, 0);

  // Set the target and log it
  if (target) {
    ns.clearPort(TARGET_PORT);
    await ns.writePort(TARGET_PORT, target);
    logger.info(`Target server set to: ${target}`);
  } else {
    logger.error('No target provided. Please pass a target as an argument.');
    return;
  }

  // Execute each script in order and wait for completion
  // await runScript(ns, 'reset/find.js', logger);
  // await runScript(ns, 'reset/apc.js', logger);
  // await runScript(ns, 'reset/distribute.js', logger);
  // await runScript(ns, 'reset/getPserv.js', logger);
  await runScript(ns, 'reset/scpSetup.js', logger);
  await runScript(ns, 'reset/execScript.js', logger);

  logger.info('All reset scripts executed. Entering dashboard monitoring.');

  // Begin monitoring loop
  while (true) {
    // Retrieve and display messages from the logger's designated port
    const port: NetscriptPort = ns.getPortHandle(logger.logPort);
    while (!port.empty()) {
      const data = port.read();
      ns.print(data);
    }

    // Wait before next update cycle
    await ns.sleep(logInterval);
  }
}

/**
 * Helper function to run a script on 'home' and wait for it to complete.
 * Logs the start and completion of each script.
 * @param ns - Netscript environment
 * @param script - The path of the script to execute
 * @param logger - Logger instance for logging actions
 */
async function runScript(ns: NS, script: string, logger: Logger): Promise<void> {
  const pid = ns.run(script);
  if (pid === 0) {
    logger.error(`Failed to start ${script}. Check for sufficient RAM.`);
    return;
  }

  logger.info(`Running ${script} (PID: ${pid})...`);
  while (ns.isRunning(pid)) {
    await ns.sleep(500); // Check every half second
  }
  logger.info(`${script} completed.`);
}


// perhaps return this after the wile true monitoring loop
// // Display general server information
    // const homeRam = ns.getServerMaxRam('home');
    // const homeUsedRam = ns.getServerUsedRam('home');
    // const purchasedServers = ns.getPurchasedServers();

    // ns.print(`\n=== Early Dash Dashboard ===`);
    // ns.print(`Time: ${new Date().toLocaleTimeString()}`);
    // ns.print(`Home Server RAM: ${homeUsedRam.toFixed(2)} GB / ${homeRam.toFixed(2)} GB`);

    // // Display purchased server status
    // ns.print(`\nPurchased Servers: ${purchasedServers.length} / ${ns.getPurchasedServerLimit()}`);
    // purchasedServers.forEach((server) => {
    //   const ram = ns.getServerMaxRam(server);
    //   ns.print(`  - ${server}: ${ram} GB`);
    // });

    // // Log current money and milestones
    // const money = ns.getServerMoneyAvailable('home');
    // const homeCoreMilestone = 5;
    // const homeRamMilestone = 131072; // Example: 131.07 TB

    // ns.print(`\n=== Financial Status ===`);
    // ns.print(`Money Available: $${money.toLocaleString()}`);
    // ns.print(`Core Milestone: ${homeCoreMilestone} Cores`);

    // // Display milestone completion status
    // const homeServer = ns.getServer('home');
    // const ramMilestoneReached = homeServer.maxRam >= homeRamMilestone;
    // const coreMilestoneReached = homeServer.cpuCores >= homeCoreMilestone;

    // ns.print(`\n=== Milestone Progress ===`);
    // ns.print(`RAM Milestone Reached: ${ramMilestoneReached ? 'Yes' : 'No'}`);
    // ns.print(`Core Milestone Reached: ${coreMilestoneReached ? 'Yes' : 'No'}`);

    // // Log status details
    // logger.info(`Money Available: $${money.toLocaleString()}`);
    // logger.info(`Home Server RAM: ${homeUsedRam.toFixed(2)} GB / ${homeRam.toFixed(2)} GB`);
    // logger.info(`Core Milestone: ${coreMilestoneReached ? 'Achieved' : 'Pending'}`);
    // logger.info(`RAM Milestone: ${ramMilestoneReached ? 'Achieved' : 'Pending'}`);