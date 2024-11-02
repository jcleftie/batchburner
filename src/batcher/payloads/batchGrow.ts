import { NS } from '@ns';

/**
 *
 * @param ns NetScript API
 * @param threads Number of threads to run the worker script with
 * @param time Amount of time (in ms) to wait before executing the worker script
 * @param target The target server to execute the worker script on
 * @returns void
 */
export async function main(
  ns: NS,
  threads = ns.args[0] as number,
  time = ns.args[1] as number,
  target = ns.args[2] as string,
): Promise<void> {
  await ns.sleep(time);
  await ns.grow(target, { threads });
}
