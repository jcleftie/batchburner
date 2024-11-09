import { NS } from '@ns';

/** @param {NS} ns */
export async function main(ns: NS): Promise<void> {
    ns.tail();
    const portNumber = 1;             // Port number to listen on
    const logFileName = "gptbatch/logs/workerLog.json"; // File to save logs
    const logInterval = 3 * 60 * 1000; // 3 minutes in milliseconds

    const logData: { [timestamp: string]: string[] } = {}; // Store logs with timestamps


    // Main logging loop
    while (true) {
        const portHandle = ns.getPortHandle(portNumber);

        // Collect messages from the port until it's empty
        while (!portHandle.empty()) {
            const message = portHandle.read();
            const timestamp = new Date().toISOString();

            // Add message to logData under the current timestamp
            if (!logData[timestamp]) {
                logData[timestamp] = [];
            }
            logData[timestamp].push(message as string);
        }

        // Write log data to JSON file
        await ns.write(logFileName, JSON.stringify(logData, null, 2), "w");

        // Clear the logData after saving and clear the port to avoid duplications
        ns.clearPort(portNumber);

        // Wait for 3 minutes before the next update
        await ns.sleep(logInterval);
    }
}
