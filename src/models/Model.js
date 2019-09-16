class Model {
  /**
   *
   * @param {Database} database The Database instance
   * @param {string} tableName The name of the table for this model
   */
  constructor (database, tableName) {
    if (!database) throw Error('Database wrapper must exist')
    if (!database.getSQLiteDB()) throw Error('SQLite database not opened in given database wrapper')

    this._db = database
    this._sqlite = database.getSQLiteDB()
    this._tableName = tableName
  }

  getDatabase () {
    return this._db
  }

  getSQLiteDB () {
    return this._sqlite
  }

  getTableName () {
    return this._tableName
  }

  /**
   * Will attempt to query and update this model with new data from the database.
   *
   * @param {*} settings
   */
  async refresh ({ defaultSettings } = {}) {
    throw new Error('Not Implemented')
  }

  /**
   * Will attempt to save any data in this model to the database.
   *
   * @param {*} settings
   */
  async save ({ defaultSettings } = {}) {
    throw new Error('Not Implemented')
  }

  /**
   * Will assign the given data object values to this model, overwriting any
   * values that already exist in this model.
   *
   * Uses the set() functionality and as such will correct private (_) variables
   * by removing leading underscores.
   *
   * @param {*} data The data to assign to this model
   * @param {boolean} onlyExisting Only update existing keys in the object
   */
  setData (data, onlyExisting = false) {
    for (const key of Object.keys(data)) {
      if (key in this || !onlyExisting) {
        this.set(key, data[key])
      }
    }
  }

  /**
   * Will return all values assigned to this model, skipping any private (_) values.
   */
  getData () {
    const data = {}
    for (const [key, value] of Object.entries(this)) {
      if (!key.startsWith('_')) data[key] = value
    }
    return data
  }

  /**
   * Set a value to a specific key in this model.
   *
   * Will lazily rectify any private (_) column names by removing the private character
   * from the start.
   *
   * @param {string} column
   * @param {*} value
   */
  set (column, value) {
    if (column.startsWith('_')) column = column.slice(1)
    this[column] = value
  }

  /**
   * Get a value assigned to this model.
   *
   * @param {String} column
   */
  get (column) {
    if (column.startsWith('_')) column = column.slice(1)
    return this[column]
  }

  /**
   * Get a value assigned to this model, or the given default if no value exists.
   *
   * @param {String} column
   * @param {*} defaultValue
   */
  getOrDefault (column, defaultValue) {
    return this.get(column) == null ? defaultValue : this.get(column)
  }

  /**
   * Get a boolean value assigned to this model.
   *
   * Will only return true if the value is literally true or the string value is "true" (case insensitive)
   *
   * @param {String} column
   */
  getBoolean (column) {
    const colVal = this.get(column)
    if (colVal == null) return null
    return !!(colVal === true || (colVal + '').toLowerCase() === 'true')
  }

  /**
   * Get a boolean value assigned to this model, or the given default if no value exists.
   *
   * Will only return true if the value is literally true or the string value is "true" (case insensitive).
   *
   * Will give you ants if you attempt to get a defaultBoolean that is not actually a boolean.
   *
   * @param {String} column
   * @param {Boolean} defaultBoolean
   */
  getBooleanOrDefault (column, defaultBoolean) {
    if (typeof defaultBoolean !== 'boolean') throw Error('Do you want ants? Because this is how you get ants.')
    return this.getBoolean(column) == null ? defaultBoolean : this.getBoolean(column)
  }
}

module.exports = Model
