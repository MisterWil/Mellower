/* eslint-env mocha */

var should = require('chai').should()
var chai = require('chai')
var td = require('testdouble')
var dirtyChai = require('dirty-chai')
var chaiAsPromised = require('chai-as-promised')
var ulog = require('ulog')

chai.use(chaiAsPromised).should()
chai.use(dirtyChai)

ulog.level = ulog.NONE

const SettingsModel = require('../src/models/SettingsModel')

describe('The SettingsModel instance', function () {
  let get = null
  let all = null
  let run = null
  let mockDatabase = null

  beforeEach(function () {
    get = td.func('sqlite.get')
    all = td.func('sqlite.all')
    run = td.func('sqlite.run')

    mockDatabase = {
      getSQLiteDB: () => {
        return {
          get: get,
          all: all,
          run: run
        }
      }
    }
  })

  describe('when refresh() is called', function () {
    it('should query for settings by table name', async function () {
      const settingsModel = new SettingsModel(mockDatabase, 'myTable')

      td
        .when(get('SELECT * FROM myTable WHERE id=1'))
        .thenResolve({ selectedKey: 'selected value' })

      var result = await settingsModel.refresh()

      // Refresh resolves into its own model
      result.should.equal(settingsModel)

      // Refresh added the returned "database" key correctly
      should.exist(settingsModel.selectedKey)
      settingsModel.selectedKey.should.equal('selected value')
    })

    it('should fail gracefully if the select returns nothing', async function () {
      const settingsModel = new SettingsModel(mockDatabase, 'myTable')

      td
        .when(get('SELECT * FROM myTable WHERE id=1'))
        .thenReject(new Error('This database is an empty bitch'))

      const result = await settingsModel.refresh()

      // Refresh resolves into its own model
      result.should.equal(settingsModel)
    })

    it('should reject if error on not found is enabled', async function () {
      const settingsModel = new SettingsModel(mockDatabase, 'myTable')

      td
        .when(get('SELECT * FROM myTable WHERE id=1'))
        .thenReject(new Error('This database is an empty bitch'))

      settingsModel.refresh({ errorOnNotFound: true }).should.eventually.be.rejected()
    })

    it('should populate fields if enabled', async function () {
      const settingsModel = new SettingsModel(mockDatabase, 'myTable')

      td
        .when(get('SELECT * FROM myTable WHERE id=1'))
        .thenReject(new Error('This database is an empty bitch'))

      td
        .when(all('PRAGMA table_info(myTable)'))
        .thenResolve([{ name: 'col1' }, { name: 'col2' }, { name: 'fizz' }, { name: 'id' }])

      const result = await settingsModel.refresh({ populateFields: true })

      // Refresh resolves into its own model
      result.should.equal(settingsModel)

      // Populate added the returned "database" columns correctly, except for ID which is ignored
      settingsModel.getData().should.eql({ col1: null, col2: null, fizz: null })
    })

    it('should populate fields if enabled with a given default', async function () {
      const settingsModel = new SettingsModel(mockDatabase, 'myTable')

      td
        .when(get('SELECT * FROM myTable WHERE id=1'))
        .thenReject(new Error('This database is an empty bitch'))

      td
        .when(all('PRAGMA table_info(myTable)'))
        .thenResolve([{ name: 'col1' }, { name: 'col2' }])

      const result = await settingsModel.refresh({ populateFields: true, populateFieldsDefault: 'foobar' })

      // Refresh resolves into its own model
      result.should.equal(settingsModel)

      // Populate added the returned "database" columns correctly, except for ID which is ignored
      settingsModel.getData().should.eql({ col1: 'foobar', col2: 'foobar' })
    })
  })

  describe('when save() is called', function () {
    it('should delete and insert new values successfully', async function () {
      const settingsModel = new SettingsModel(mockDatabase, 'myTable')

      settingsModel.set('myColumn', 'myValue')

      td
        .when(run('DELETE FROM myTable WHERE id=1'))
        .thenResolve()

      td
        .when(run('INSERT INTO myTable (myColumn) VALUES (?)', ['myValue']))
        .thenResolve()

      // If successful then it should resolve into itself
      settingsModel.save().should.eventually.equal(settingsModel)
    })

    it('should insert multiple fields', async function () {
      const settingsModel = new SettingsModel(mockDatabase, 'myTable')

      settingsModel.set('myColumn', 'myValue')
      settingsModel.set('myOtherColumn', 'myOtherValue')

      td
        .when(run('DELETE FROM myTable WHERE id=1'))
        .thenResolve()

      td
        .when(run('INSERT INTO myTable (myColumn, myOtherColumn) VALUES (?, ?)', ['myValue', 'myOtherValue']))
        .thenResolve()

      // If successful then it should resolve into itself
      settingsModel.save().should.eventually.equal(settingsModel)
    })

    it('should insert new values successfully when delete fails', async function () {
      const settingsModel = new SettingsModel(mockDatabase, 'myTable')

      settingsModel.set('myColumn', 'myValue')

      td
        .when(run('DELETE FROM myTable WHERE id=1'))
        .thenReject()

      td
        .when(run('INSERT INTO myTable (myColumn) VALUES (?)', ['myValue']))
        .thenResolve()

      // If successful then it should resolve into itself
      settingsModel.save().should.eventually.equal(settingsModel)
    })

    it('should be rejected on delete when configured to fail', async function () {
      const settingsModel = new SettingsModel(mockDatabase, 'myTable')

      settingsModel.set('myColumn', 'myValue')

      td
        .when(run('DELETE FROM myTable WHERE id=1'))
        .thenReject(new Error('This bitch does not exist yo'))

      // Should reject when configured to error on delete
      settingsModel.save({ errorOnDelete: true }).should.eventually.be.rejected()
    })

    it('should be rejected if insert fails', async function () {
      const settingsModel = new SettingsModel(mockDatabase, 'myTable')

      settingsModel.set('myColumn', 'myValue')

      td
        .when(run('DELETE FROM myTable WHERE id=1'))
        .thenResolve()

      td
        .when(run('INSERT INTO myTable (myColumn) VALUES (?)', ['myValue']))
        .thenReject(new Error('Your insert is bad and you should feel bad'))

      settingsModel.save().should.eventually.be.rejected()
    })
  })
})
