const { Client, Collection } = require("discord.js");
const client = new Client({intents: 131071});
require('dotenv').config();

client.commands = new Collection();

require("./Handlers/Events")(client);
require("./Handlers/Commands")(client);

client.login(process.env.DISCORD_TOKEN);

