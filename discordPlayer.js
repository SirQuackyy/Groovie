const { AudioPlayerStatus, joinVoiceChannel, getVoiceConnection, createAudioPlayer, createAudioResource, NoSubscriberBehavior, VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const { MessageEmbed } = require("discord.js");
const events = require('events');

const ytdl = require("ytdl-core");
const yts = require("yt-search");

const Genius = require("genius-lyrics");

class VoiceParser {
  constructor(possible) {
    this.possible = possible.map((item) => item.trim().toLowerCase());
    return this;
  }

  parse(string) {
    let output = string.repeat(1);
    string = string.replace("/\./g", "");
    string = string.toLowerCase().replace("music", "").trim();
    if (string.includes(" ")) string = string.split(" ")[0];
    string = string.trim();
    if (!this.possible.includes(string)) return false;
    output = output.replace(/\./g, "").toLowerCase().replace("music", "").trim();
    return output;
  }
}