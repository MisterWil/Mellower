const Model = require('../../src/models/Model.js')

let constructorCalls = 0
let refreshCalls = 0
let saveCalls = 0

class MockModel extends Model {
  constructor (db, tableName) {
    super(db, tableName)
    constructorCalls++
  }

  async refresh ({ errorOnNotFound = false } = {}) {
    refreshCalls++
  }

  async save () {
    saveCalls++
  }

  constructorCalls () {
    return constructorCalls
  }

  refreshCalls () {
    return refreshCalls
  }

  saveCalls () {
    return saveCalls
  }

  reset () {
    constructorCalls = refreshCalls = saveCalls = 0
  }
}

module.exports = MockModel
