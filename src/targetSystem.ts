import { NS } from '@ns';

interface ServerInfo {
  hostname: string;
  requiredHackingSkill: number;
  hackChance: number;
  growthRate: number;
  hackTime: number;
  growTime: number;
  weakenTime: number;
  moneyAvailable: number;
  maxMoney: number;
}

const TARGET_JSON_FILE = '/serverData.json';

/**
 * Main function to parse server data, analyze conditions, and suggest the best hacking target.
 * @param ns - The Netscript environment.
 */
export async function main(ns: NS): Promise<void> {
  const playerHackingLevel = ns.getHackingLevel();

  // Parse the server data JSON file
  let serverData: ServerInfo[];
  try {
    serverData = JSON.parse(await ns.read(TARGET_JSON_FILE)) as ServerInfo[];
  } catch (error) {
    ns.tprint('Error: Could not load server data from JSON file.');
    return;
  }

  // Filter servers: exclude "n00dles" and those without sufficient hackChance or money
  const minHackChance = 0.5; // Minimum acceptable hack chance (50%)
  const maxAllowedTime = 180; // Max time in seconds for hack, grow, weaken
  const targets = serverData
    .filter((server) => server.hostname !== 'n00dles') // Exclude "n00dles"
    .filter((server) => server.maxMoney > 0) // Only servers with available money
    .filter((server) => server.hackChance >= minHackChance) // Avoid servers with very low hack chance
    .filter((server) => server.requiredHackingSkill <= playerHackingLevel * 0.5) // Skill requirement condition
    .sort((a, b) => {
      const scoreA = calculateScore(a, playerHackingLevel, maxAllowedTime);
      const scoreB = calculateScore(b, playerHackingLevel, maxAllowedTime);
      return scoreB - scoreA;
    });

  // Display the best target
  if (targets.length === 0) {
    ns.tprint('No suitable targets found based on the given conditions.');
  } else {
    const bestTarget = targets[0];
    ns.tprint(`Best target: ${bestTarget.hostname}`);
    ns.tprint(`Score: ${calculateScore(bestTarget, playerHackingLevel, maxAllowedTime).toFixed(2)}`);
    ns.tprint(`Details: ${JSON.stringify(bestTarget, null, 2)}`);
  }
}

/**
 * Calculates a ranking score for a server based on defined criteria.
 * Higher scores indicate better hacking targets.
 * @param server - The server to score.
 * @param playerHackingLevel - The player's current hacking level.
 * @param maxAllowedTime - Max acceptable time in seconds for hack, grow, weaken.
 * @returns A numerical score representing target suitability.
 */
function calculateScore(server: ServerInfo, playerHackingLevel: number, maxAllowedTime: number): number {
  const hackChanceWeight = 3.0;
  const growthRateWeight = 1.5;
  const timeWeight = -1.2; // Stronger penalty for longer times
  const skillMatchWeight = -0.4; // Slightly increase the skill matching penalty

  const skillProximity = Math.abs(server.requiredHackingSkill - playerHackingLevel * 0.5);

  // Adjust time components if they exceed the max allowed threshold (penalize more if above threshold)
  const hackTimePenalty = server.hackTime > maxAllowedTime ? (server.hackTime - maxAllowedTime) * 0.5 : 0;
  const growTimePenalty = server.growTime > maxAllowedTime ? (server.growTime - maxAllowedTime) * 0.5 : 0;
  const weakenTimePenalty = server.weakenTime > maxAllowedTime ? (server.weakenTime - maxAllowedTime) * 0.5 : 0;

  const hackChanceScore = server.hackChance * hackChanceWeight;
  const growthRateScore = server.growthRate * growthRateWeight;
  const timeScore =
    -(server.hackTime + server.growTime + server.weakenTime + hackTimePenalty + growTimePenalty + weakenTimePenalty) *
    timeWeight;
  const skillMatchScore = skillProximity * skillMatchWeight;

  return hackChanceScore + growthRateScore + timeScore + skillMatchScore;
}
