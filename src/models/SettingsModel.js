const log = require('ulog')('SettingsModel')

const Model = require('./Model')

class SettingsModel extends Model {
  /**
   * Query for all values from this models table where the id=1.
   *
   * Use errorOnNotFound to error if no values currently exist.
   *
   * Use populateFields to use the table metadata to populate the object with null
   * values when no settings record currently exist. Will not execute if errorOnNotFound
   * is set to true.
   *
   * @param {*} settings
   */
  async refresh ({ errorOnNotFound = false, populateFields = false, populateFieldsDefault = null } = {}) {
    return this._sqlite.get('SELECT * FROM ' + this._tableName + ' WHERE id=1')
      .then(result => {
        this.setData(result)
        return Promise.resolve(this)
      })
      .catch(error => {
        log.debug('Failed to select data from table:', this.getTableName(), error)
        if (errorOnNotFound) return Promise.reject(error)

        if (populateFields) return this.populateFields({ defaultVal: populateFieldsDefault })

        return Promise.resolve(this)
      })
  }

  /**
   * Populate this Model with the columns in the table, if the table exists.
   *
   * Set the default value by using the defaultVal setting.
   *
   * @param {*} settings
   */
  async populateFields ({ defaultVal = null } = {}) {
    return this._sqlite.all('PRAGMA table_info(' + this.getTableName() + ')')
      .then(records => {
        for (var i = 0; i < records.length; i++) {
          if (records[i].name !== 'id') { this[records[i].name] = defaultVal }
        }
        return Promise.resolve(this)
      })
  }

  /**
   * Save all values in this model to the models table where id=1.
   *
   * Will attempt to delete an existing record first before inserting. If
   * for whatever reason you want this operation to fail if a record doesn't already exist
   * then set errorOnDelete to true.
   *
   * @param {*} settings
   */
  async save ({ errorOnDelete = false } = {}) {
    await this.delete()
      .catch((error) => {
        log.info('Failed to run delete during save() on:', this.getTableName(), error)

        if (errorOnDelete) return Promise.reject(error)
      })

    return this.insert()
      .catch((error) => {
        log.error('Failed to run insert during save() on:', this._tableName, error)
        return Promise.reject(error)
      })
  }

  async delete () {
    return this._sqlite.run('DELETE FROM ' + this._tableName + ' WHERE id=1')
  }

  async insert () {
    const columns = []
    const values = []
    let valueString = ''

    let index = 0
    for (const [key, value] of Object.entries(this.getData())) {
      columns.push(key)
      values.push(value)
      valueString += index++ > 0 ? ', ?' : '?'
    }

    const columnNames = columns.join(', ')

    const insertSQL = 'INSERT INTO ' + this._tableName +
                ' (' + columnNames + ') VALUES' +
                ' (' + valueString + ')'

    return this._sqlite.run(insertSQL, values)
      .then(() => Promise.resolve(this))
  }
}

module.exports = SettingsModel
