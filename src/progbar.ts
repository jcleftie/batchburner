import { NS } from '@ns';

/**
 * Display a stylish progress bar with Unicode triangle symbols and color in the log.
 *
 * @param ns - Netscript environment
 * @param total - Total steps in the task
 * @param current - Current progress step
 */
function displayStylishProgressBar(ns: NS, total: number, current: number) {
  const barWidth = 30; // Width of the progress bar
  const progress = Math.floor((current / total) * barWidth);
  const percentage = Math.floor((current / total) * 100);

  // Define colors
  const green = '\u001b[32m';
  const yellow = '\u001b[33m';
  const gray = '\u001b[37m';
  const reset = '\u001b[0m';

  // Symbols for progress bar
  const completed = `${green}▶${reset}`; // Filled triangle
  const remaining = `${gray}▷${reset}`; // Empty triangle

  // Construct the bar with symbols
  const bar = `${completed.repeat(progress)}${remaining.repeat(barWidth - progress)}`;

  ns.clearLog(); // Clear the log before each update
  ns.print(`╠${bar}╣ ${yellow}${percentage}%${reset}`); // Display progress with symbols
}

export async function main(ns: NS): Promise<void> {
  const totalSteps = 100;

  ns.clearLog();
  ns.disableLog('sleep');
  for (let step = 0; step <= totalSteps; step++) {
    displayStylishProgressBar(ns, totalSteps, step);
    await ns.sleep(100); // Simulate task progress
  }

  ns.tprint('✅ Task complete! 🎉'); // Only print completion message in the terminal
}
