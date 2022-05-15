const { CommandInteraction } = require("discord.js");
const voice = require('@discordjs/voice');

module.exports = {
    name: "leave",
    description: "ouuuuuuut",
    permission: "SEND_MESSAGES",
    /**
     * 
     * @param {CommandInteraction} interaction
     */
    execute(interaction){
        voice.getVoiceConnection(interaction.guild.id).disconnect();
        interaction.reply({content:"leaving"});
    }

}