const BotClient = require('./BotClient.js');
const WebClient = require('./WebServer.js');
const Database = require('./Database.js');

let bot = null;
let start = function () {
    let webDB = new Database('WebSettings');
    webDB.init().then((w) => {
        setTimeout(() => {
            webDB.loadSettings('bot').then((botSettings) => {
                if (botSettings && botSettings.token) {
                    bot = new BotClient(webDB, botSettings);
                    bot.init().catch(() => { console.error('Failed initializing DiscordBot. Is your token correct?') });
                } else console.log('There is no bot token provided. Please check your configuration!');
                new WebClient(webDB, bot).init();
            });
        }, 1000);
    });
}

start();