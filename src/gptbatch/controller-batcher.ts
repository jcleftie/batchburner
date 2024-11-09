import { NS } from '@ns';

export async function main(ns: NS) {
  ns.print('Initiating Multi-Target Batch Controller...');
	ns.disableLog('ALL');
  const batcher1 = 'gptbatch/noodles-batcher.js';
  const batcher2 = 'gptbatch/phantasy-batcher.js';
  const batcher3 = 'gptbatch/rho-batcher.js';
  const target1 = 'n00dles';
  const target2 = 'phantasy';
  const target3 = 'rho-construction';
  const maxBatches = 200; // Maximum number of concurrent batches per target
  const batchThreads = 10; // Number of threads for each batcher instance
  const staggerDelay = 500; // Stagger delay in milliseconds

  while (true) {
    const host = ns.getHostname();

    // Launch batches for target 1 (n00dles)
    let runningBatches1 = ns.ps(host).filter((p) => p.filename === batcher1 && p.args.includes(target1)).length;
    if (runningBatches1 < maxBatches) {
      ns.exec(batcher1, host, batchThreads, target1);
      ns.print(`Launched ${batcher1} targeting ${target1}. Running batches: ${runningBatches1 + 1}`);
    }
    await ns.sleep(staggerDelay);

    // Launch batches for target 2 (phantasy)
    let runningBatches2 = ns.ps(host).filter((p) => p.filename === batcher2 && p.args.includes(target2)).length;
    if (runningBatches2 < maxBatches) {
      ns.exec(batcher2, host, batchThreads, target2);
      ns.print(`Launched ${batcher2} targeting ${target2}. Running batches: ${runningBatches2 + 1}`);
    }
    await ns.sleep(staggerDelay);

    // Launch batches for target 3 (rho-construction)
    let runningBatches3 = ns.ps(host).filter((p) => p.filename === batcher3 && p.args.includes(target3)).length;
    if (runningBatches3 < maxBatches) {
      ns.exec(batcher3, host, batchThreads, target3);
      ns.print(`Launched ${batcher3} targeting ${target3}. Running batches: ${runningBatches3 + 1}`);
    }
    await ns.sleep(staggerDelay);
  }
}
