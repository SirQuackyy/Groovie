const { CommandInteraction } = require("discord.js");
const voice = require('@discordjs/voice');

module.exports = {
    name: "play",
    description: "Plays a requested song",
    permission: "SEND_MESSAGES",
    /**
     * 
     * @param {CommandInteraction} interaction
     */
    execute(interaction){
        const connection = voice.getVoiceConnection(interaction.guild.id);
        interaction.reply({content:"Player"});
    }
}