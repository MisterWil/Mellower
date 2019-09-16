const Commando = require('discord.js-commando')
const path = require('path')
const sqlite = require('sqlite')

class BotClient extends Commando.Client {
  constructor (webDB, settings) {
    super({
      owner: (settings.ownerid) ? settings.ownerid : null,
      commandPrefix: settings.commandprefix,
      unknownCommandResponse: settings.getBooleanOrDefault('unknowncommandresponse', false)
    })
    this.webDB = webDB
    this.token = settings.token
    this.channelName = settings.getOrDefault('channelname', '')
    this.deleteCommands = settings.getBooleanOrDefault('deletecommandmessages', false)
    this.silentTimeout = settings.getBooleanOrDefault('silentTimeout', false)
    this.isReady = false
  }

  onReady () {
    return () => {
      console.log(`BotClient ready and logged in as ${this.user.tag} (${this.user.id}). Prefix set to ${this.commandPrefix}. Use ${this.commandPrefix}help to view the commands list!`)
      this.user.setAFK(true)
      this.user.setActivity(`${this.commandPrefix}help`, { type: 'PLAYING' })
      this.isReady = true
    }
  }

  onCommandPrefixChange () {
    return (guild, prefix) => {
      console.log(`Prefix ${prefix === '' ? 'removed' : `changed to ${prefix || 'the default'}`} ${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.`)
    }
  }

  onDisconnect () {
    return () => {
      console.warn('Disconnected!')
    }
  }

  onReconnect () {
    return () => {
      console.warn('Reconnecting...')
    }
  }

  onCmdErr () {
    return (cmd, err) => {
      if (err instanceof Commando.FriendlyError) { return }
      console.error(`Error in command ${cmd.groupID}:${cmd.memberName}`, err)
    }
  }

  onCmdBlock () {
    return (msg, reason) => {
      console.log(`Command ${msg.command ? `${msg.command.groupID}:${msg.command.memberName}` : ''} blocked; ${reason}`)
    }
  }

  onCmdStatusChange () {
    return (guild, command, enabled) => {
      console.log(`Command ${command.groupID}:${command.memberName} ${enabled ? 'enabled' : 'disabled'} ${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.`)
    }
  }

  onGroupStatusChange () {
    return (guild, group, enabled) => {
      console.log(`Group ${group.id} ${enabled ? 'enabled' : 'disabled'} ${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.`)
    }
  }

  onMessage () {
    return (msg) => {
      // Nothin' to do
    }
  }

  init () {
    // register our events for logging purposes
    this.on('ready', this.onReady())
      .on('commandPrefixChange', this.onCommandPrefixChange())
      .on('error', console.error)
      .on('warn', console.warn)
    // .on('debug', console.log)
      .on('disconnect', this.onDisconnect())
      .on('reconnecting', this.onReconnect())
      .on('commandError', this.onCmdErr())
      .on('commandBlocked', this.onCmdBlock())
      .on('commandStatusChange', this.onCmdStatusChange())
      .on('groupStatusChange', this.onGroupStatusChange())
      .on('message', this.onMessage())

    // set provider sqlite so we can actually save our config permanently
    this.setProvider(
      sqlite.open(path.join(__dirname.slice(0, -3), 'data/BotSettings.sqlite3')).then(db => new Commando.SQLiteProvider(db))
    ).catch(console.error)

    // first we register groups and commands
    this.registry
      .registerDefaultGroups()
      .registerGroups([
        ['ombi', 'Ombi'],
        ['sonarr', 'Sonarr'],
        ['radarr', 'Radarr'],
        ['tautulli', 'Tautulli']
      ])
      .registerDefaultTypes()
      .registerDefaultCommands({
        help: true,
        prefix: true,
        ping: true,
        eval_: false,
        commandState: true
      }).registerCommandsIn(path.join(__dirname, 'commands'))

    // unregister groups if apikey and host is not provided in web database
    // thanks to the commando framework we have to go the dirty way
    this.registry.groups.forEach((group) => {
      const options = {
        refresh: true,
        refreshSettings: { errorOnNotFound: true }
      }

      this.webDB.getSettings(group.name, options).then((result) => {
        if (!result || (!result.host && !result.apikey)) {
          group.commands.forEach((command) => {
            this.registry.unregisterCommand(command)
          })
        }
      }).catch(() => {})
    })

    this.dispatcher.addInhibitor((message) => {
      if (this.channelName.trim().length === 0) return false

      if (message.channel.name === undefined) return false

      return (message.channel.name.toLowerCase() !== this.channelName.toLowerCase()) ? 'Not allowed in this channel' : false
    })

    // login client with bot token
    return this.login(this.token)
  }

  deinit () {
    this.isReady = false
    return this.destroy()
  }
}

module.exports = BotClient
