const sqlite = require('sqlite')
const Promise = require('bluebird')
const path = require('path')
const fs = require('fs')
const log = require('ulog')('Database')

const SettingsModel = require('./models/SettingsModel.js')

class Database {
  /**
   *
   * @param {String} name The name of the database
   * @param {*} settings
   */
  constructor (name, { dataDirectory = 'data' } = {}) {
    this._directory = path.join('./', dataDirectory)
    this._path = path.join(this._directory, name + '.sqlite3')
    this._name = name
    this._db = null
    this._settingsCache = {}
  }

  /**
   * Attempt to open the database instance, creating the data
   * directory if required.
   *
   * If an instance of the database has already been opened then it will first
   * be closed before opening again.
   *
   * Will perform migrations if new migrations have not been applied yet.
   */
  async open () {
    if (this._db) await this.close()

    if (!fs.existsSync(this._directory)) {
      log.info('No data directory found, creating directory:', this._directory)

      fs.mkdirSync(this._directory)
    }

    this._db = await sqlite.open(this._path, { Promise })
      .catch(error => Promise.reject(error))

    log.info('Successfully opened:', this._path)

    log.info('Migrating database...')
    await this._db.migrate()
      .then(() => log.info('Migrations complete.'))
      .catch(error => Promise.reject(error)(error))

    return this
  }

  /**
   * Close the database instance.
   */
  async close () {
    if (this._db) {
      this._db.close()
      this._db = null
    }
  }

  getName () {
    return this._name
  }

  getPath () {
    return this._path
  }

  getSQLiteDB () {
    return this._db
  }

  /**
   * Get a new model of the given type.
   *
   * Errors if this Database has not been opened.
   *
   * @param {Model} Model
   * @param {String} tableName
   */
  getModel (Model, tableName) {
    if (this._db == null) throw new Error('A database instance must be open before a model can be created.')

    return new Model(this, tableName)
  }

  /**
   * Returns an instance of a settings model - a single record table for storing settings.
   *
   * This is a convenience method that maintains a cache of requested instances, refreshing
   * them automatically before returning them to the user.
   *
   * To disable refresh pass refresh = false to the options.
   *
   * @param {string} tableName
   * @param {*} options
   */
  async getSettings (tableName,
    {
      refresh = true,
      refreshSettings = undefined,
      Model = SettingsModel
    } = { }) {
    let modelInstance = this._settingsCache[tableName]

    if (!modelInstance) {
      modelInstance = this.getModel(Model, tableName)
      this._settingsCache[tableName] = modelInstance
    }

    if (refresh) { await modelInstance.refresh(refreshSettings) }

    return modelInstance
  }
}

module.exports = Database
