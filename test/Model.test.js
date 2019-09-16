/* eslint-env mocha */

var should = require('chai').should()
var chai = require('chai')
var dirtyChai = require('dirty-chai')
var chaiAsPromised = require('chai-as-promised')
var ulog = require('ulog')

chai.use(chaiAsPromised).should()
chai.use(dirtyChai)

ulog.level = ulog.NONE

const Model = require('../src/models/Model')

describe('The Model instance', function () {
  describe('when initialized', function () {
    it('should store the given database and table name', function () {
      const database = {
        getSQLiteDB: () => 'SQLite Database'
      }

      const model = new Model(database, 'myTable')

      model.getDatabase().should.equal(database)
      model.getSQLiteDB().should.equal(database.getSQLiteDB())
      model.getTableName().should.equal('myTable')
    })

    it('should error without a database instance', function () {
      const database = null
      const fn = () => new Model(database, 'myTable')

      fn.should.throw(Error)
    })

    it('should error without an sqlite instance', function () {
      const database = {
        getSQLiteDB: () => null
      }

      const fn = () => new Model(database, 'myTable')

      fn.should.throw(Error)
    })
  })

  describe('when setData() is called', function () {
    const database = { getSQLiteDB: () => 'db' }
    let model = null

    beforeEach(function () {
      model = new Model(database, 'myTable')
    })

    it('should set values in the given object into the model instance', function () {
      const values = {
        stringVal: 'Woot',
        numVal: 234,
        boolVal: true
      }

      model.setData(values)

      should.exist(model.stringVal)
      should.exist(model.numVal)
      should.exist(model.boolVal)

      model.stringVal.should.equal(values.stringVal)
      model.numVal.should.equal(values.numVal)
      model.boolVal.should.equal(values.boolVal)
    })

    it('should overwrite values already set', function () {
      const firstValue = 'hello maria'
      const secondValue = 42

      model.setData({ existingValue: firstValue })
      should.exist(model.existingValue)
      model.existingValue.should.equal(firstValue)

      model.setData({ existingValue: secondValue })
      should.exist(model.existingValue)
      model.existingValue.should.equal(secondValue)
    })

    it('should allow additional data to be set', function () {
      const one = 'hola'
      const two = 'maria'

      model.setData({ firstValue: one })

      should.exist(model.firstValue)
      model.firstValue.should.equal(one)

      model.setData({ anotherValue: two })

      should.exist(model.firstValue)
      should.exist(model.anotherValue)

      model.firstValue.should.equal(one)
      model.anotherValue.should.equal(two)
    })

    it('should avoid setting private variables', function () {
      model.setData({ _testPrivate: '123' })

      should.not.exist(model._testPrivate)

      should.exist(model.testPrivate)
      model.testPrivate.should.equal('123')
    })

    it('should allow only changing existing values', function () {
      model.setData({ exists: '123' })
      model.exists.should.equal('123')

      model.setData({ exists: '456', notExists: 'ABC' }, true)
      model.exists.should.equal('456')
      should.not.exist(model.notExists)
    })
  })

  describe('when getData() is called', function () {
    const database = { getSQLiteDB: () => 'db' }
    let model = null

    beforeEach(function () {
      model = new Model(database, 'myTable')
    })

    it('should return an empty object when nothing has been set', function () {
      // Future developer note: 'eql' in chai is a deep equal that isn't strict

      model.getData().should.eql({})
    })

    it('should get all values set in the object', function () {
      const values = {
        stringVal: 'Woot',
        numVal: 234,
        boolVal: true
      }

      model.setData(values)

      should.exist(model.stringVal)
      should.exist(model.numVal)
      should.exist(model.boolVal)

      model.getData().should.eql(values)
    })

    it('should get all values from multiple sets in the object', function () {
      const firstValue = {
        stringVal: 'Woot'
      }

      const secondValue = {
        boolVal: true
      }

      model.setData(firstValue)
      model.setData(secondValue)

      should.exist(model.stringVal)
      should.exist(model.boolVal)

      model.getData().should.eql({
        stringVal: firstValue.stringVal,
        boolVal: secondValue.boolVal
      })
    })

    it('should not return any private (_) values', function () {
      model.setData({ _private: 'can be set', public: 'can also be set' })
      model._actuallyPrivate = 'hard set in object'

      should.exist(model.private)
      should.exist(model.public)
      should.exist(model._actuallyPrivate)

      model.getData().should.eql({ private: 'can be set', public: 'can also be set' })
    })
  })

  describe('when set() is called', function () {
    const database = { getSQLiteDB: () => 'db' }
    let model = null

    beforeEach(function () {
      model = new Model(database, 'myTable')
    })

    it('should set a value', function () {
      const val = 'My value'

      model.set('myColumn', val)

      model.myColumn.should.equal(val)
    })

    it('should overwrite a value', function () {
      const val1 = true
      const val2 = 667

      model.set('myColumn', val1)
      model.myColumn.should.equal(val1)

      model.set('myColumn', val2)
      model.myColumn.should.equal(val2)
    })

    it('should avoid setting a private value', function () {
      const val = 23838

      model.set('_private', val)
      should.not.exist(model._private)
      model.private.should.equal(val)
    })
  })

  describe('when get() is called', function () {
    const database = { getSQLiteDB: () => 'db' }
    let model = null

    beforeEach(function () {
      model = new Model(database, 'myTable')
    })

    it('should return nothing if no value is set', function () {
      should.not.exist(model.get('noValue'))
    })

    it('should return a set() value', function () {
      const val = 'amigos'

      model.set('aValue', val)

      model.get('aValue').should.equal(val)
    })

    it('should avoid returning private values', function () {
      model._db.should.exist()
      should.not.exist(model.get('_db'))
    })
  })

  describe('when convenience methods are called', function () {
    const database = { getSQLiteDB: () => 'db' }
    let model = null

    beforeEach(function () {
      model = new Model(database, 'myTable')
    })

    it('getOrDefault() should return a default when not set', function () {
      should.not.exist(model.noValue)
      model.getOrDefault('noValue', 'my default').should.equal('my default')
    })

    it('getOrDefault() should return the set value if it exists', function () {
      model.set('yesValue', 'yes')
      model.getOrDefault('yesValue', 'thats a no for me').should.equal('yes')
    })

    it('getBoolean() should return nothing if no value is set', function () {
      should.not.exist(model.aBoolean)
      should.not.exist(model.getBoolean('aBoolean'))
    })

    it('getBoolean() should return false if the value is anything but true', function () {
      model.set('aNumber', 123)
      model.aNumber.should.exist()
      model.getBoolean('aNumber').should.equal(false)

      model.set('aString', 'homebody')
      model.aString.should.exist()
      model.getBoolean('aString').should.equal(false)

      model.set('aYes', 'yes')
      model.aYes.should.exist()
      model.getBoolean('aYes').should.equal(false)

      model.set('aFalse', false)
      model.aFalse.should.exist()
      model.getBoolean('aFalse').should.equal(false)
    })

    it('getBoolean() should return true if the value is a boolean true', function () {
      model.set('aTrue', true)
      model.aTrue.should.exist()
      model.getBoolean('aTrue').should.equal(true)
    })

    it('getBoolean() should return true if the value is a string true', function () {
      model.set('aStringTrue', 'true')
      model.aStringTrue.should.exist()
      model.getBoolean('aStringTrue').should.equal(true)

      model.set('aBigTrue', 'TRUE')
      model.aBigTrue.should.exist()
      model.getBoolean('aBigTrue').should.equal(true)
    })

    it('getBooleanOrDefault() should return a default if the value is not set', function () {
      should.not.exist(model.aBoolean)
      model.getBooleanOrDefault('aBoolean', true).should.equal(true)
    })

    it('getBooleanOrDefault() should return the boolean value when set', function () {
      model.set('aString', 'homebody')
      model.aString.should.exist()
      model.getBooleanOrDefault('aString', true).should.equal(false)

      model.set('aNumber', 123)
      model.aNumber.should.exist()
      model.getBooleanOrDefault('aNumber', true).should.equal(false)

      model.set('aTrue', true)
      model.aTrue.should.exist()
      model.getBooleanOrDefault('aTrue', false).should.equal(true)

      model.set('aCrazyStringTrue', 'TrUe')
      model.aCrazyStringTrue.should.exist()
      model.getBooleanOrDefault('aCrazyStringTrue', false).should.equal(true)
    })

    it('getBooleanOrDefault() should error if trying to get a default non-boolean', function () {
      should.not.exist(model.aBoolean)

      const fn = () => model.getBooleanOrDefault('aBoolean', 'not a boolean')

      fn.should.throw(Error)
    })
  })
})
