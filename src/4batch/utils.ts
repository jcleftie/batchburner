import { NS, NetscriptPort } from '@ns';
import { MetricsData } from '@types';

/*
  The utility function library. The purpose of this library is to give a place for the sorts of functions
  that will often be used by multiple different scripts. This way we don't need to keep copying them.
 */

/** @param {NS} ns */
export async function main(ns: NS) {
  ns.tprint("This is just a function library, it doesn't do anything.");
}

export class Deque {
  #capacity = 0; // The maximum length.
  #length = 0; // The actual number of items in the queue
  #front = 0; // The index of the "head" where data is read from the queue.
  #deleted = 0; // The number of "dead" items in the queue. These occur when items are deleted by index. They are bad.
  #elements; // An inner array to store the data.
  #index = new Map(); // A hash table to track items by ID. Try not to delete items using this, it's bad.

  // Create a new queue with a specific capacity.
  constructor(capacity: number) {
    this.#capacity = capacity;
    this.#elements = new Array(capacity);
  }

  // You can also convert arrays.
  static fromArray(array: number, overallocation = 0) {
    const result = new Deque(array.length + overallocation);
    array.forEach((item) => result.push(item));
    return result;
  }

  // Deleted items don't count towards length, but they still take up space in the array until they can be cleared.
  // Seriously, don't use the delete function unless it's absolutely necessary.
  get size() {
    return this.#length - this.#deleted;
  }

  isEmpty() {
    return this.#length - this.#deleted === 0;
  }

  // Again, "deleted" items still count towards this. Use caution.
  isFull() {
    return this.#length === this.#capacity;
  }

  // The "tail" where data is typically written to.
  // Unlike the front, which points at the first piece of data, this point at the first empty slot.
  get #back() {
    return (this.#front + this.#length) % this.#capacity;
  }

  // Push a new element into the queue.
  push(value) {
    if (this.isFull()) {
      throw new Error('The deque is full. You cannot add more items.');
    }
    this.#elements[this.#back] = value;
    this.#index.set(value.id, this.#back);
    ++this.#length;
  }

  // Pop an item off the back of the queue.
  pop() {
    while (!this.isEmpty()) {
      --this.#length;
      const item = this.#elements[this.#back];
      this.#elements[this.#back] = undefined; // Free up the item for garbage collection.
      this.#index.delete(item.id); // Don't confuse index.delete() with this.delete()
      if (item.status !== 'deleted') return item; // Clear any "deleted" items we encounter.
      else --this.#deleted; // If you needed another reason to avoid deleting by ID, this breaks the O(1) time complexity.
    }
    throw new Error('The deque is empty. You cannot delete any items.');
  }

  // Shift an item off the front of the queue. This is the main method for accessing data.
  shift() {
    while (!this.isEmpty()) {
      // Our pointer already knows exactly where the front of the queue is. This is much faster than the array equivalent.
      const item = this.#elements[this.#front];
      this.#elements[this.#front] = undefined;
      this.#index.delete(item.id);

      // Move the head up and wrap around if we reach the end of the array. This is essentially a circular buffer.
      this.#front = (this.#front + 1) % this.#capacity;
      --this.#length;
      if (item.status !== 'deleted') return item;
      else --this.#deleted;
    }
    throw new Error('The deque is empty. You cannot delete any items.');
  }

  // Place an item at the front of the queue. Slightly slower than pushing, but still faster than doing it on an array.
  unshift(value) {
    if (this.isFull()) {
      throw new Error('The deque is full. You cannot add more items.');
    }
    this.#front = (this.#front - 1 + this.#capacity) % this.#capacity;
    this.#elements[this.#front] = value;
    this.#index.set(value.id, this.#front);
    ++this.#length;
  }

  // Peeking at the front is pretty quick, since the head is already looking at it. We just have to clear those pesky "deleted" items first.
  peekFront() {
    if (this.isEmpty()) {
      throw new Error('The deque is empty. You cannot peek.');
    }

    while (this.#elements[this.#front].status === 'deleted') {
      this.#index.delete(this.#elements[this.#front]?.id);
      this.#elements[this.#front] = undefined;
      this.#front = (this.#front + 1) % this.#capacity;
      --this.#deleted;
      --this.#length;

      if (this.isEmpty()) {
        throw new Error('The deque is empty. You cannot peek.');
      }
    }
    return this.#elements[this.#front];
  }

  // Peeking at the back is ever so slightly slower, since we need to recalculate the pointer.
  // It's a tradeoff for the faster push function, and it's a very slight difference either way.
  peekBack() {
    if (this.isEmpty()) {
      throw new Error('The deque is empty. You cannot peek.');
    }

    let back = (this.#front + this.#length - 1) % this.#capacity;
    while (this.#elements[back].status === 'deleted') {
      this.#index.delete(this.#elements[back].id);
      this.#elements[back] = undefined;
      back = (back - 1 + this.#capacity) % this.#capacity;
      --this.#deleted;
      --this.#length;

      if (this.isEmpty()) {
        throw new Error('The deque is empty. You cannot peek.');
      }
    }

    return this.#elements[back];
  }

  // Fill the queue with a single value.
  fill(value) {
    while (!this.isFull()) {
      this.push(value);
    }
  }

  // Empty the whole queue.
  clear() {
    while (!this.isEmpty()) {
      this.pop();
    }
  }

  // Check if an ID exists.
  exists(id) {
    return this.#index.has(id);
  }

  // Fetch an item by ID
  get(id) {
    let pos = this.#index.get(id);
    return pos !== undefined ? this.#elements[pos] : undefined;
  }

  // DON'T
  delete(id) {
    let item = this.get(id);
    if (item !== undefined) {
      item.status = 'deleted';
      ++this.#deleted;
      return item;
    } else {
      throw new Error('Item not found in the deque.');
    }
  }
}

// The recursive server navigation algorithm. The lambda predicate determines which servers to add to the final list.
// You can also plug other functions into the lambda to perform other tasks that check all servers at the same time.
/** @param {NS} ns */
export function getServers(
  ns: NS,
  lambdaCondition: (hostname: string) => boolean = () => true,
  hostname: string = 'home',
  servers: string[] = [],
  visited: string[] = [],
): string[] {
  if (visited.includes(hostname)) return servers;

  visited.push(hostname);
  if (lambdaCondition(hostname)) servers.push(hostname);

  const connectedNodes = ns.scan(hostname);
  if (hostname !== 'home') connectedNodes.shift(); // Skip parent node

  for (const node of connectedNodes) {
    getServers(ns, lambdaCondition, node, servers, visited);
  }
  // Include purchased servers
  const pservs = ns.getPurchasedServers();
  for (const pserv of pservs) {
    if (lambdaCondition(pserv)) {
      servers.push(pserv);
    }
  }

  return servers;
}

// Here are a couple of my own getServers modules.
// This one finds the best target for hacking. It tries to balance expected return with time taken.
/** @param {NS} ns */
export function checkTarget(ns: NS, server: string, target: string = 'n00dles', forms: boolean = false): string {
  if (!ns.hasRootAccess(server)) return target;
  const player = ns.getPlayer();
  const serverSim = ns.getServer(server);
  const pSim = ns.getServer(target);
  let previousScore;
  let currentScore;

  if (forms) {
    previousScore = (pSim.moneyMax ?? 0) / (pSim.minDifficulty ?? 0) / ns.formulas.hacking.hackTime(pSim, player);
    currentScore = (serverSim.moneyMax ?? 0) / (serverSim.minDifficulty ?? 0) / ns.formulas.hacking.hackTime(serverSim, player);
  } else {
    previousScore = (pSim.moneyMax ?? 0) / (pSim.minDifficulty ?? 0) / ns.getHackTime(target);
    currentScore = (serverSim.moneyMax ?? 0) / (serverSim.minDifficulty ?? 0) / ns.getHackTime(server);
  }

  if (currentScore > previousScore) return server;
  return target;
}

// Function to check if a server is prepped
/** @param {NS} ns */
export function isPrepped(ns: NS, target: string): boolean {
  return (
    ns.getServerMinSecurityLevel(target) === ns.getServerSecurityLevel(target) &&
    ns.getServerMoneyAvailable(target) === ns.getServerMaxMoney(target)
  );
}

// Function to prepare a server
/** @param {NS} ns */
export async function prep(ns: NS, metrics: any, values: any, ramNet: any): Promise<boolean> {
  const maxMoney = values.maxMoney;
  const minSec = values.minSec;
  let money = values.money;
  let sec = values.sec;

  while (!isPrepped(ns, values.target)) {
    const wTime = metrics.wTime;
    const gTime = wTime * 0.8;
    const dataPort = ns.getPortHandle(ns.pid);
    dataPort.clear();

    const pRam = ramNet.cloneBlocks();
    const maxThreads = Math.floor(ramNet.maxBlockSize / 1.75);
    const totalThreads = ramNet.prepThreads;
    let wThreads1 = 0;
    let wThreads2 = 0;
    let gThreads = 0;
    let batchCount = 1;
    let script, mode;

    // Logic to determine mode, batch count, etc.
    if (money < maxMoney) {
      gThreads = Math.ceil(ns.growthAnalyze(values.target, maxMoney / money));
      wThreads2 = Math.ceil(ns.growthAnalyzeSecurity(gThreads) / 0.05);
    }
    if (sec > minSec) {
      wThreads1 = Math.ceil((sec - minSec) * 20);
      if (!(wThreads1 + wThreads2 + gThreads <= totalThreads && gThreads <= maxThreads)) {
        gThreads = 0;
        wThreads2 = 0;
        batchCount = Math.ceil(wThreads1 / totalThreads);
        if (batchCount > 1) wThreads1 = totalThreads;
        mode = 0;
      } else mode = 2;
    } else if (gThreads > maxThreads || gThreads + wThreads2 > totalThreads) {
      mode = 1;
      const oldG = gThreads;
      wThreads2 = Math.max(Math.floor(totalThreads / 13.5), 1);
      gThreads = Math.floor(wThreads2 * 12.5);
      batchCount = Math.ceil(oldG / gThreads);
    } else mode = 2;

    // Calculate end times and deploy threads
    const wEnd1 = Date.now() + wTime + 1000;
    const gEnd = wEnd1 + metrics.spacer;
    const wEnd2 = gEnd + metrics.spacer;

    let sufficientRam = false;

    for (const block of pRam) {
      while (block.ram >= 1.75) {
        const bMax = Math.floor(block.ram / 1.75);
        let threads = 0;

        if (wThreads1 > 0) {
          script = './tWeaken.js';
          metrics.type = 'pWeaken1';
          metrics.time = wTime;
          metrics.end = wEnd1;
          threads = Math.min(wThreads1, bMax);
          if (wThreads2 === 0 && wThreads1 - threads <= 0) metrics.report = true;
          wThreads1 -= threads;
        } else if (wThreads2 > 0) {
          script = './tWeaken.js';
          metrics.type = 'pWeaken2';
          metrics.time = wTime;
          metrics.end = wEnd2;
          threads = Math.min(wThreads2, bMax);
          if (wThreads2 - threads === 0) metrics.report = true;
          wThreads2 -= threads;
        } else if (gThreads > 0 && mode === 1) {
          script = './tGrow.js';
          metrics.type = 'pGrow';
          metrics.time = gTime;
          metrics.end = gEnd;
          threads = Math.min(gThreads, bMax);
          metrics.report = false;
          gThreads -= threads;
        } else if (gThreads > 0 && bMax >= gThreads) {
          script = './tGrow.js';
          metrics.type = 'pGrow';
          metrics.time = gTime;
          metrics.end = gEnd;
          threads = gThreads;
          metrics.report = false;
          gThreads = 0;
        } else break;

        // Ensure the block can actually assign the job
        metrics.server = block.server;
        const pid = ns.exec(script, block.server, { threads: threads, temporary: true }, JSON.stringify(metrics));
        if (pid) {
          block.ram -= 1.75 * threads;
          sufficientRam = true; // <<<<-- add this: confirm we assigned a job
        } else {
          ns.print(`Unable to assign ${script} on ${block.server}. Skipping job.`);
          break; // <---- change to this: skip this block if exec fails
        }
      }
    }
    if (!sufficientRam) {
      ns.print(`Insufficient RAM to complete batch for ${values.target}. Skipping.`);
      return false; // <---- change to this: Exit prep early if no RAM can satisfy the job
    }

    const tEnd = ((mode === 0 ? wEnd1 : wEnd2) - Date.now()) * batchCount + Date.now();
    const timer = setInterval(() => {
      ns.clearLog();
      switch (mode) {
        case 0:
          ns.print(`Weakening security on ${values.target}...`);
          break;
        case 1:
          ns.print(`Maximizing money on ${values.target}...`);
          break;
        case 2:
          ns.print(`Finalizing preparation on ${values.target}...`);
      }
      ns.print(`Security: +${ns.formatNumber(sec - minSec, 3)}`);
      ns.print(`Money: \$${ns.formatNumber(money, 2)}/${ns.formatNumber(maxMoney, 2)}`);
      const time = tEnd - Date.now();
      ns.print(`Estimated time remaining: ${ns.tFormat(time)}`);
      ns.print(`~${batchCount} ${batchCount === 1 ? 'batch' : 'batches'}.`);
    }, 200);
    ns.atExit(() => clearInterval(timer));

    // Wait for the last weaken to finish
    do await dataPort.nextWrite();
    while (!dataPort.read().startsWith('pWeaken'));
    clearInterval(timer);
    await ns.sleep(100);

    money = ns.getServerMoneyAvailable(values.target);
    sec = ns.getServerSecurityLevel(values.target);
  }
  return true;
}



// A simple function for copying a list of scripts to a server.
/** @param {NS} ns */
export function copyScripts(ns: NS, server: string, scripts: string[], overwrite = false) {
	for (const script of scripts) {
		if ((!ns.fileExists(script, server) || overwrite) && ns.hasRootAccess(server)) {
			ns.scp(script, server);
		}
	}
}

// a function to get the data port
/** @param {NS} ns */
export function getDataPort(ns: NS, portNumber = 1): NetscriptPort {
  return ns.getPortHandle(portNumber);
};


