const { Client } = require("discord.js")
const mongoose = require("mongoose");
require('dotenv').config();
//It's finally over
module.exports = {
    name: "ready",
    once: true,
    /**
    * 
    * @param {Client} client 
    */
    execute(client) {
        console.log("The client is now ready!");
        client.user.setActivity("You.", {type:"LISTENING"});
    
        mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology:true
        }).then(() => {
            console.log("The client is now connected to the database");
        }).catch((err) => {
            console.log(err);
        })
    }
}