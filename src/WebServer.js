const express = require('express')
const session = require('express-session')
const path = require('path')
const BotClient = require('./BotClient.js')

class WebServer {
  constructor (db, bot) {
    this.path = path.join(__dirname, 'views/')
    this.app = express()
    this.db = db
    this.bot = bot
    this.currentView = 'general'
  }

  restartBot () {
    try {
      this.bot.deinit()
    } catch (err) {
      console.log('No BotClient is running to restart. Starting a new BotClient...')
    }
    this.db.getSettings('bot').then((botSettings) => {
      this.bot = new BotClient(this.db, botSettings)
      this.bot.init().catch(() => { console.error('Failed initializing BotClient. Is your token correct?') })
    }).catch((err) => console.error(err))
  }

  onCheckAuth () {
    return async (req, res) => {
      const post = req.body
      this.db.getSettings('general').then((table) => {
        const username = post.username || ''
        const password = post.password || ''
        if (username === table.getOrDefault('username', '') && password === table.getOrDefault('password', '')) {
          req.session.user_id = 10000
          res.redirect('/config')
        } else {
          res.render('login', {
            loginMessage: 'Login failed! Username or password incorrect.'
          })
        }
      })
    }
  }

  onLogout () {
    return (req, res) => {
      if (req.session === undefined) {
        res.redirect('/login')
      } else if (req.session.user_id === undefined) {
        res.redirect('/login')
      } else {
        delete req.session.user_id
        res.redirect('/login')
      }
    }
  }

  onConfigSave () {
    return (req, res) => {
      const options = {
        refresh: true,
        refreshSettings: { populateFields: true }
      }

      this.db.getSettings(req.path.substring(1), options)
        .then(async (settings) => {
          settings.setData(req.body, true)
          await settings.save()

          this.restartBot()
          this.currentView = req.path.replace('/', '')
          res.redirect('/config')
        })
    }
  }

  async init () {
    try {
      this.app.set('view engine', 'ejs')
      this.app.set('views', this.path)

      this.app.use(express.json())
      this.app.use(express.urlencoded({ extended: true }))
      this.app.use(session({ resave: true, secret: 'asdkjn2398easojdfh9238hrihsf', saveUninitialized: true }))
      this.app.use(express.static(this.path))

      this.app.get('/', (req, res) => res.redirect('/login'))
      this.app.get('/login', async (req, res) => {
        this.db.getSettings('general').then((general) => {
          if (general.username !== undefined && req.session.user_id !== 10000) {
            res.render('login', {
              loginMessage: ''
            })
          } else {
            res.redirect('/config')
          }
        })
      })
      this.app.post('/login', this.onCheckAuth())

      this.app.get('/config', async (req, res) => {
        const [general, bot, ombi, tautulli, sonarr, radarr] = await Promise.all([
          this.db.getSettings('general'),
          this.db.getSettings('bot'),
          this.db.getSettings('ombi'),
          this.db.getSettings('tautulli'),
          this.db.getSettings('sonarr'),
          this.db.getSettings('radarr')
        ])

        if (req.session.user_id === 10000 || !general.username) {
          res.render('config', {
            currentView: this.currentView,
            generalSettings: (general) || '',
            botSettings: (bot) || '',
            ombiSettings: (ombi) || '',
            tautulliSettings: (tautulli) || '',
            sonarrSettings: (sonarr) || '',
            radarrSettings: (radarr) || ''
          })
        } else {
          res.redirect('/login')
        }
      })
      this.app.post('/general', this.onConfigSave())
      this.app.post('/bot', this.onConfigSave())
      this.app.post('/ombi', this.onConfigSave())
      this.app.post('/tautulli', this.onConfigSave())
      this.app.post('/sonarr', this.onConfigSave())
      this.app.post('/radarr', this.onConfigSave())
      this.app.post('/logout', this.onLogout())

      const server = this.app.listen(5060, function () {
        var port = server.address().port

        console.log(`WebServer ready and listening at http://localhost:${port} - Webroot for static files set to ${this.path}`)
      })
    } catch (error) {
      console.error(error)
      console.error('Failed to start WebServer.')
    }
  }
}

module.exports = WebServer
