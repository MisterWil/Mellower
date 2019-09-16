const BotClient = require('./BotClient.js')
const WebClient = require('./WebServer.js')
const Database = require('./Database.js')

let bot = null
const start = function () {
  const webDB = new Database('WebSettings')
  webDB.open().then((w) => {
    setTimeout(() => {
      webDB.getSettings('bot').then((botSettings) => {
        if (botSettings && botSettings.token) {
          bot = new BotClient(webDB, botSettings)
          bot.init().catch(() => { console.error('Failed initializing DiscordBot. Is your token correct?') })
        } else console.log('There is no bot token provided. Please check your configuration!')
        new WebClient(webDB, bot).init()
      })
    }, 1000)
  })
}

start()
