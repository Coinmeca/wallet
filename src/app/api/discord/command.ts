// import { getRPSChoices } from './game.js';
import { capitalize, DiscordRequest } from "./utils";

const RPSChoices = {
    rock: {
        description: "sedimentary, igneous, or perhaps even metamorphic",
        virus: "outwaits",
        computer: "smashes",
        scissors: "crushes",
    },
    cowboy: {
        description: "yeehaw~",
        scissors: "puts away",
        wumpus: "lassos",
        rock: "steel-toe kicks",
    },
    scissors: {
        description: "careful ! sharp ! edges !!",
        paper: "cuts",
        computer: "cuts cord of",
        virus: "cuts DNA of",
    },
    virus: {
        description: "genetic mutation, malware, or something inbetween",
        cowboy: "infects",
        computer: "corrupts",
        wumpus: "infects",
    },
    computer: {
        description: "beep boop beep bzzrrhggggg",
        cowboy: "overwhelms",
        paper: "uninstalls firmware for",
        wumpus: "deletes assets for",
    },
    wumpus: {
        description: "the purple Discord fella",
        paper: "draws picture on",
        rock: "paints cute face on",
        scissors: "admires own reflection in",
    },
    paper: {
        description: "versatile and iconic",
        virus: "ignores",
        cowboy: "gives papercut to",
        rock: "covers",
    },
};

export function getRPSChoices() {
    return Object.keys(RPSChoices);
}

// Get the game choices from game.js
function createCommandChoices() {
    const choices = getRPSChoices();
    const commandChoices = [];

    for (let choice of choices) {
        commandChoices.push({
            name: capitalize(choice),
            value: choice.toLowerCase(),
        });
    }

    return commandChoices;
}

// Simple test command
const TEST_COMMAND = {
    name: "test",
    description: "Basic command",
    type: 1,
    integration_types: [0, 1],
    contexts: [0, 1, 2],
};

// Command containing options
const CHALLENGE_COMMAND = {
    name: "challenge",
    description: "Challenge to a match of rock paper scissors",
    options: [
        {
            type: 3,
            name: "object",
            description: "Pick your object",
            required: true,
            choices: createCommandChoices(),
        },
    ],
    type: 1,
    integration_types: [0, 1],
    contexts: [0, 2],
};

const ALL_COMMANDS = [TEST_COMMAND, CHALLENGE_COMMAND];

export async function InstallGlobalCommands(appId: any, commands: any) {
    // API endpoint to overwrite global commands
    const endpoint = `applications/${appId}/commands`;
    console.log("endpoint:", endpoint);

    try {
        // This is calling the bulk overwrite endpoint: https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
        await DiscordRequest(endpoint, { method: "PUT", body: commands });
    } catch (err) {
        console.error(err);
    }
}

InstallGlobalCommands("1270989696247533662", ALL_COMMANDS);
