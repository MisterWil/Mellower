/* eslint-env mocha */

var fs = require('fs')
var path = require('path')
var should = require('chai').should()
var chai = require('chai')
var dirtyChai = require('dirty-chai')
var chaiAsPromised = require('chai-as-promised')
var ulog = require('ulog')

chai.use(chaiAsPromised).should()
chai.use(dirtyChai)

ulog.level = ulog.NONE

const Database = require('../src/Database.js')
const MockModel = require('./mocks/MockModel.js')

describe('The Database instance', function () {
  let db = null
  let testDataDir = null
  let testDataPath = null
  let testDatabaseName = null

  beforeEach(function () {
    // Create a new directory for our test database
    testDataDir = 'data_test_' + Math.random().toString(36).substring(7)
    testDataPath = path.join('./', testDataDir)
    testDatabaseName = 'test_' + Math.random().toString(36).substring(7)
  })

  afterEach(function () {
    // Ensure DB is closed
    if (db) db.close()

    // Delete the new directory and its contents if created
    rimraf(testDataPath)
  })

  describe('when initialized', function () {
    it('should store the database name', function () {
      db = new Database('awesomeName')
      db.getName().should.equal('awesomeName')
    })

    it('should store a path to the default directory', function () {
      db = new Database('mySQLdatabase')
      db.getPath().should.equal(path.normalize('./data/mySQLdatabase.sqlite3'))
    })

    it('should store a path to a custom directory', function () {
      db = new Database('mySQLdatabase', { dataDirectory: 'customDirectory' })
      db.getPath().should.equal(path.normalize('./customDirectory/mySQLdatabase.sqlite3'))
    })

    it('should start with no sqlite database instance', function () {
      db = new Database('mySQLdatabase')
      should.not.exist(db.getSQLiteDB())
    })

    it('should allow for a call to close without an sqlite database instance', function () {
      db = new Database('mySQLdatabase')
      db.close().should.eventually.be.fulfilled()
    })
  })

  describe('wen calling open()', function () {
    it('should resolve to an instance of itself', async () => {
      db = new Database(testDatabaseName, { dataDirectory: testDataDir })

      const result = await db.open()

      result.should.equal(db)
    })

    it('should create a data directory if it does not exist', async () => {
      fs.existsSync(testDataPath).should.be.false()

      db = new Database(testDatabaseName, { dataDirectory: testDataDir })
      await db.open()

      fs.existsSync(testDataPath).should.be.true()
    })

    it('should create a database file with the name we passed in', async () => {
      fs.existsSync(path.join(testDataPath, testDatabaseName + '.sqlite3')).should.be.false()

      db = new Database(testDatabaseName, { dataDirectory: testDataDir })
      await db.open()

      fs.existsSync(path.join(testDataPath, testDatabaseName + '.sqlite3')).should.be.true()
    })

    it('should use an existing data directory', async () => {
      fs.existsSync(testDataPath).should.be.false()
      fs.mkdirSync(testDataPath)
      fs.existsSync(testDataPath).should.be.true()

      db = new Database(testDatabaseName, { dataDirectory: testDataDir })

      await db.open()

      fs.existsSync(path.join(testDataPath, testDatabaseName + '.sqlite3')).should.be.true()
    })

    it('should use a second named database in the same directory', async () => {
      fs.existsSync(testDataPath).should.be.false()

      // Create and open our first database
      db = new Database(testDatabaseName, { dataDirectory: testDataDir })
      await db.open()
      fs.existsSync(testDataPath).should.be.true()

      fs.existsSync(path.join(testDataPath, testDatabaseName + '.sqlite3')).should.be.true()

      // Create and open our second database
      const db2 = new Database('testSecondInstance', { dataDirectory: testDataDir })
      await db2.open()

      fs.existsSync(path.join(testDataPath, 'testSecondInstance.sqlite3')).should.be.true()

      // Explicitly close our second database
      await db2.close()
    })
  })

  describe('when calling getModel()', function () {
    let model = null

    beforeEach(function () {
      db = new Database(testDatabaseName, { dataDirectory: testDataDir })
    })

    afterEach(function () {
      if (model) model.reset()
    })

    it('should error if the database is not open', function () {
      const fn = function () { db.getModel(MockModel, 'myTableName') }
      fn.should.throw(Error)
    })

    it('should return an instance of my model when the database is open', async () => {
      await db.open()

      model = db.getModel(MockModel, 'myTableName')

      should.exist(model)
    })
  })

  describe('when calling getSettings()', function () {
    let model = null

    beforeEach(async function () {
      db = new Database(testDatabaseName, { dataDirectory: testDataDir })
      await db.open()
    })

    afterEach(function () {
      if (model) model.reset()
    })

    it('should construct a new instance of the model', async () => {
      model = await db.getSettings('testTable', { Model: MockModel })

      model.constructorCalls().should.equal(1)
    })

    it('should return a cached model instance for the same table name', async () => {
      model = await db.getSettings('testTable', { Model: MockModel })
      const modelTwo = await db.getSettings('testTable', { Model: MockModel })

      model.constructorCalls().should.equal(1)
      model.should.equal(modelTwo)
    })

    it('should refresh the model by default', async () => {
      model = await db.getSettings('testTable', { Model: MockModel })
      await db.getSettings('testTable', { Model: MockModel })

      model.constructorCalls().should.equal(1)
      model.refreshCalls().should.equal(2)
    })

    it('should allow refresh to be disabled', async () => {
      model = await db.getSettings('testTable', { Model: MockModel })
      const modelTwo = await db.getSettings('testTable', { refresh: false, Model: MockModel })

      model.constructorCalls().should.equal(1)
      model.refreshCalls().should.equal(1)
      model.should.equal(modelTwo)
    })
  })
})

/**
 * Remove directory recursively.
 *
 * @param {string} dir_path
 * @see https://stackoverflow.com/a/42505874/3027390
 */
function rimraf (dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach(function (entry) {
      var entryPath = path.join(dirPath, entry)
      if (fs.lstatSync(entryPath).isDirectory()) {
        rimraf(entryPath)
      } else {
        fs.unlinkSync(entryPath)
      }
    })
    fs.rmdirSync(dirPath)
  }
}
