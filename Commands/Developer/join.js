const { CommandInteraction, MessageEmbed } = require("discord.js"); 
const Transcriber = require("discord-speech-to-text");
const { AudioPlayerStatus, joinVoiceChannel, getVoiceConnection, createAudioPlayer, createAudioResource, NoSubscriberBehavior, VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const events = require('events');
const queue = new Map();
const ytdl = require("ytdl-core");
const yts = require("yt-search");
const fs = require('fs');

const Genius = require("genius-lyrics");
const GClient = new Genius.Client(process.env.GENIUS_KEY);
const { mongoConnection } = require("mongoose");

const pagination = require('@acegoal07/discordjs-pagination');
const { MessageActionRow } = require("discord.js");
const { MessageButton } = require("discord.js");

const player = createAudioPlayer();

var startTime = 0;

const firstSong = null;

var pos = 0;

const video_player = async (guild, song) => {
    server_queue = queue.get(guild.id);
    var actualTime = song.duration.split(':');
    var timeinmilli = 0;
    if(hhmmss(song.duration)){
        timeinmilli = ((+actualTime[0]) * 60 * 60 + (+(actualTime[1])) * 60 + (+actualTime[2])) * 1000;
    } else {
        timeinmilli = ((+(actualTime[0])) * 60 + (+(actualTime[1]))) * 1000;
    }
    startTime = Date.now() + timeinmilli;

    //If no song is left in the server queue. Leave the voice channel and delete the key and value pair from the global queue.
    if (!song) {
        queue.delete(guild.id);
        return;
    }
    const stream = ytdl(song.url, { filter: 'audioonly', quality: "highest"});

    let voiceConnection = getVoiceConnection(guild.id);

    voiceConnection.subscribe(player);
    let resource = createAudioResource(stream);
    dispatcher = player.play(resource);
    player.on(AudioPlayerStatus.Idle, () => {
        pos += 1;
        startTime = 0;
        server_queue.songs.shift();
        if(server_queue.songs == 0){
            pos = 0;
            return interaction.channel.send("No more songs in the queue");
        }
        video_player(guild, server_queue.songs[0]);
    }); 
    await server_queue.text_channel.send(`🎶 Now playing **${song.title}**`);
}

module.exports = {
    name: "join",
    description: "Join the voice chat you are currently in",
    permission: "SEND_MESSAGES",
    /**
     * 
     * @param {CommandInteraction} interaction
     */
    execute(interaction){
        const voice_channel = interaction.member.voice.channel;
        let server_queue = null;
        const transcriber = new Transcriber(process.env.WITAI_KEY);
        if (interaction.member.voice.channel && interaction.member.voice.channel.id){
            const connection = joinVoiceChannel({
                channelId: interaction.member.voice.channel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator,
                selfDeaf: false
            });
           
            interaction.reply({content: "Joined VC"});
            connection.receiver.speaking.on("start", (userId) => {
                transcriber.listen(connection.receiver, userId, interaction.client.users.cache.get(userId)).then((data) => {
                    if (!data.transcript.text) return;
                    let text = data.transcript.text;
                    let user = data.user;
                    voiceParser = new VoiceParser(["current", "now playing", "playing", "queue", "cue", "q", "que", "play", "played", "pause", "paws", "paused", "resume", "resumed", "skip", "skipped", "shuffle", "shuffled", "leave", "disconnect", "dc", "stop", "lyrics", "lyric","undo","remove"]);
                    let parsed = voiceParser.parse(text);
                    console.log(parsed);
                    if(parsed){
                        switch (parsed.toString().split(" ")[0]) {
                            case 'current':
                            case 'now playing':
                            case 'playing':
                                //HERE
                                break;
                            case 'played':
                            case 'play':
                                let song = {};
                                if(parsed.toString().split(" ").length == 1){
                                    player.unpause();
                                }
                                if(parsed.toString().split(" ").length > 1){
                                    let query = parsed.replace("play", "").trim();
                                    console.log(query);
                                    const video_finder = async (equery) => {
                                        const videoResult = await yts(equery);
                                        return (videoResult.videos.length > 1) ? videoResult.videos[0] : null;
                                    }
        
                                    video_finder(query).then((video) => {
                                        if (video){
                                            if(video.type === "live"){
                                                return interaction.channel.send("Can not play live streams");
                                            }
                                            song = {title: video.title, url: video.url, duration: video.duration.timestamp, requested: interaction.client.users.cache.get(userId)};
                                        } else {
                                            return console.log("Error L rip bozo nerd causal no vid");
                                        }
                                        if (!server_queue){
                                            console.log(server_queue);
                                            const queue_constructor = {
                                                voice_channel: voice_channel,
                                                text_channel: interaction.channel,
                                                connection: null,
                                                songs: []
                                            }
                                            queue_constructor.songs.push(song);
                                            queue.set(interaction.guild.id, queue_constructor);
                                            try {
                                                queue_constructor.connection = connection;
                                                video_player(interaction.guild, queue_constructor.songs[0]);
                                                
                                            } catch (err) {
                                                queue.delete(interaction.guild.id);
                                                interaction.channel.send('There was an error connecting!');
                                                throw err;
                                            }
                                            server_queue = queue.get(interaction.guild.id);
                                        } else{
                                            console.log(server_queue.songs);
                                            server_queue.songs.push(song);
                                            console.log(server_queue.songs);
                                            return interaction.channel.send(`👍 **${song.title}** added to queue!`);
                                        }
                                    });
                                }
                                break;
                            case 'queue':
                            case 'q':
                            case 'que':
                            case 'cue':
                                if(!server_queue){
                                    break;
                                } else {
                                    interaction.channel.send("Fetching Queue").then((message) => {
                                        var queues = "";
                                        var pages = [];
                                        var remaining = startTime - Date.now();
                                        for(var i = 0; i < server_queue.songs.length; i++){
                                            queues += (`**${(i + 1)}.** [${server_queue.songs[i].title}](${server_queue.songs[i].url}) **[${server_queue.songs[i].duration}]**\n*Requested by [${server_queue.songs[i].requested}]*\n`);
                                            if((i+1)%9 == 0){
                                                const embed = new MessageEmbed();
                                                if(startTime == 0){
                                                    embed
                                                    .setColor('#58D68D')
                                                    .setDescription(`**Now Playing**\n**[N/A]**\n\n**Queue**\n${queues}`); 
                                                } else {
                                                    embed
                                                    .setColor('#58D68D')
                                                    .setDescription(`**Now Playing**\n**${pos + 1}.** [${server_queue.songs[pos].title}](${server_queue.songs[pos].url})` + ' **[' + `${msToHMS(remaining)} remaining` + `]**\n*Requested by [${server_queue.songs[pos].requested}]*\n\n**Queue**\n${queues}`);
                                                }
                                                pages.push(embed);
                                                queues = "";
                                            }
                                        }
                                        if(server_queue.songs.length % 9 != 0){
                                            const embed = new MessageEmbed();
                                            if(startTime == 0){
                                                embed
                                                .setColor('#58D68D')
                                                .setDescription(`**Now Playing**\n**[N/A]**\n\n**Queue**\n${queue}`); 
                                            } else {
                                                embed
                                                .setColor('#58D68D')
                                                .setDescription(`**Now Playing**\n**${pos + 1}.** [${server_queue.songs[pos].title}](${server_queue.songs[pos].url})` + ' **[' + `${msToHMS(remaining)} remaining` + `]**\n*Requested by [${server_queue.songs[pos].requested}]*\n\n**Queue**\n${queues}`);
                                            }
                                                pages.push(embed);
                                        }
    
                                            const previousButtonQueue = new MessageButton()
                                                    .setCustomId('previous_page')
                                                    .setLabel('Previous')
                                                    .setStyle('DANGER');
    
                                            const nextButtonQueue = new MessageButton()
                                                    .setCustomId('next_page')
                                                    .setLabel('Next')
                                                    .setStyle('SUCCESS');
    
                                            buttonList = [previousButtonQueue, nextButtonQueue]
                                            const timeout = 30000;
                                            pagination({message, pageList:pages, buttonList, timeout:timeout})
                                    });
                                }
                                break;
                            case 'skipped':
                            case 'skip':
                                try {
                                    server_queue.songs.shift();
                                    video_player(interaction.guild, server_queue.songs[0]);
                                    interaction.channel.send("⏩ Skipped the song.");
                                } catch (err){
                                    interaction.channel.send(`There was an error doing this.`);
                                    throw err;
                                }
                                break;
                            case 'resumed':
                            case 'resume':
                                if(!player){
                                    break;
                                } else {
                                    player.unpause();
                                    interaction.channel.send("▶️ Resumed the song.");    
                                    break;
                                }
                            case 'paws':
                            case 'paused':
                            case 'pause':
                                if(!player){
                                    break;
                                } else {
                                    player.pause();
                                    interaction.channel.send("⏸️ Paused the song.");
                                    break;
                                }
                            case 'shuffled':
                            case 'shuffle':
                                if (!server_queue){
                                    break;
                                }else{
                                    let curId = server_queue.songs.length;
                                    while (0 !== curId) {
                                        let randId = Math.floor(Math.random() * curId);
                                        curId -= 1;
                                        let tmp = server_queue.songs[curId];
                                        server_queue.songs[curId] = server_queue.songs[randId];
                                        server_queue.songs[randId] = tmp;
                                    }
                                    interaction.channel.send("🔀 Queue shuffled.")
                                    break;
                                }
                            case 'stop':
                            case 'disconnect':
                            case 'dc':
                            case 'leave':
                                if(!server_queue){
                                    try{
                                        if(!connection.destroyed){
                                            connection.destroy();
                                            interaction.channel.send("👋 Leaving the voice channel.");
                                        }   
                                    } catch (err){
                                        console.log(err);
                                    }
                                    break;
                                } else {
                                    try{
                                        server_queue.songs = [];
                                        if(!connection.destroyed){
                                            connection.destroy();
                                            interaction.channel.send("👋 Leaving the voice channel.");
                                        }   
                                    } catch (err){
                                        console.log(err);
                                    }
                                    break;
                                }
                            case 'lyrics':
                            case 'lyric':
                                    if(server_queue.songs.length > 0){
                                        interaction.channel.send("Fetching Lyrics for Song").then((message) => {
                                            GClient.songs.search(server_queue.songs[0].title).then((searches) => { //smh andrew you forgor .title you sent the fridgin ddos of the song or smth
                                                searches[0].lyrics().then((lyrics) => {
                                                var asdf = true;
                                                var pages = [];
                                                var num  = 0; 
                                                while (asdf){
                                                    const embed = new MessageEmbed();
                                                    if (num + 750 > lyrics.length){
                                                        embed
                                                        .setTitle("Lyrics")
                                                        .setColor("#ADD8E6")
                                                        .setDescription(lyrics.slice(num,lyrics.length));
                                                        asdf = false;
                                                    }else{
                                                        embed
                                                        .setTitle("Lyrics")
                                                        .setColor("#ADD8E6")
                                                        .setDescription(lyrics.slice(num,num += 750));
                                                }
                                                    pages.push(embed);
                                                }
                                                const previousButtonLyrics = new MessageButton()
                                                .setCustomId('previous_page')
                                                .setLabel('Previous')
                                                .setStyle('DANGER');

                                                const nextButtonLyrics = new MessageButton()
                                                        .setCustomId('next_page')
                                                        .setLabel('Next')
                                                        .setStyle('SUCCESS');

                                                buttonList = [previousButtonLyrics, nextButtonLyrics]
                                                const timeout = 30000;
                                                pagination({message, pageList:pages, buttonList, timeout:timeout})
                                                });
                                        });
                                        });
                                    }
                                break;
                            case 'undo':
                            case 'remove':
                                let e = server_queue.songs[server_queue.songs.length];
                                if (server_queue.songs.length > 1)
                                   {server_queue.songs.pop();}
                                interaction.channel.send(`❌ Removed [${e}] from the queue.`)
                                break;
                            default:
                                break;
                        }   
                    }
                });
              });
        }
    }

}

class VoiceParser {
    constructor(possible) {
      this.possible = possible.map((item) => item.trim().toLowerCase());
      return this;
    }
  
    parse(string) {
      let output = string.repeat(1);
      string = string.replace("/\./g", "");
      let check = string.toLowerCase().split(" ");
      let checked = false;
      for(let i = 0; i < check.length; i++){
          if(check[i] == "groovy"){
            checked = true; 
            let stringAfter = string.substring(str.indexOf('groovy') + 1);
            string = string.toLowerCase().replace("groovy", "").trim();
            if (stringAfter.includes(" ")) stringAfter = stringAfter.split(" ")[0];
            stringAfter = stringAfter.trim();
            if (!this.possible.includes(stringAfter)) return false; 
            output = output.replace(/\./g, "").toLowerCase().substring(str.indexOf('groovy') + 1).trim();
            break;
          } else if (check[i] == "ruby"){
            checked = true; 
            let stringAfter = string.substring(str.indexOf('ruby') + 1);
            string = string.toLowerCase().replace("ruby", "").trim();
            if (stringAfter.includes(" ")) stringAfter = stringAfter.split(" ")[0];
            stringAfter = stringAfter.trim();
            if (!this.possible.includes(stringAfter)) return false; 
            output = output.replace(/\./g, "").toLowerCase().substring(str.indexOf('ruby') + 1).trim();
            break;
          } else if (check[i] == "movie"){
            checked = true; 
            let stringAfter = string.substring(str.indexOf('movie') + 1);
            string = string.toLowerCase().replace("movie", "").trim();
            if (stringAfter.includes(" ")) stringAfter = stringAfter.split(" ")[0];
            stringAfter = stringAfter.trim();
            if (!this.possible.includes(stringAfter)) return false; 
            output = output.replace(/\./g, "").toLowerCase().substring(str.indexOf('movie') + 1).trim();
            break;
          }
      }
      if(!checked){
          return false;
      }
      return output;
    }
  }
  function hhmmss(time){
    if(/^\d{1,}:\d{2}:\d{2}$/.test(time)){
        return true;
    }
    return false;
}

function msToHMS(duration) {
    var milliseconds = Math.floor((duration % 1000)) / 100,
        seconds = Math.floor((duration / 1000)) % 60,
        minutes = Math.floor((duration / (1000 * 60))) % 60,
        hours = Math.floor((duration / (1000 * 60 * 60)));

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;
    if(hours === '00'){
        return minutes + ":" + seconds;
    }
    return hours + ":" + minutes + ":" + seconds;
}