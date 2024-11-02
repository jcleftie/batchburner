import { NetscriptPort, NS } from '@ns';
import { Logger } from './logger/logger';

export async function main(ns: NS): Promise<void> {
  const hostname = (ns.args[0] as string) ?? 'home';
  const reservedRam = (ns.args[1] as number) ?? 20;

  const logger = new Logger(ns, 'dashboard');
  ns.clearPort(logger.logPort);
  ns.clearLog();

  // Disable unnecessary logs
  const killLogs: string[] = ['sleep', 'run'];
  killLogs.forEach((log) => ns.disableLog(log));

  // Tail and customize UI
  ns.tail();
  ns.resizeTail(1250, 250);
  ns.moveTail(700, 0);

  // Log arguments and their types
  logger.info(
    `Starting dashboard with hostname: ${hostname} (Type: ${typeof hostname}), reservedRam: ${reservedRam} (Type: ${typeof reservedRam})`,
  );

  // Validate target and reservedRam arguments
  if (!hostname || isNaN(reservedRam)) {
    logger.error("Invalid arguments: 'hostname' should be a string and 'reservedRam' a number. Exiting dashboard...");
    return;
  }

  // Attempt to run `batchLoop.js` if not already running
  if (!ns.scriptRunning('batcher/batchLoop.js', hostname)) {
    const pid = ns.run('batcher/batchLoop.js', 1, hostname, reservedRam);

    if (pid === 0) {
      const availableRam = ns.getServerMaxRam(hostname) - ns.getServerUsedRam(hostname);
      logger.error(
        `Failed to start batchLoop.js! Hostname: ${hostname}, Reserved RAM: ${reservedRam}, Available RAM: ${availableRam}`,
      );
      logger.info(`Possible issues: Insufficient RAM, incorrect script path, or invalid arguments.`);
    } else {
      logger.info(`BatchLoop started successfully with PID: ${pid}`);
    }
  } else {
    logger.warn(`batchLoop.js is already running on ${hostname}`);
  }

  while (true) {
    // Check and log messages from logger's designated port
    const port: NetscriptPort = ns.getPortHandle(logger.logPort);
    while (!port.empty()) {
      const data = port.read();
      ns.print(data);
    }
    await ns.sleep(100);
  }
}
