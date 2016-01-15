'use strict';
var _us = require("underscore");
var MdArrayjs = require('../lib/MdArrayjs.js');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports.testCreate1DNoSizeGiven = function(test) {
    var testD = _us.range(11);
    var testArray = new MdArrayjs(testD);
    var passed = _us.reduce(testD, function(memo, val, idx) {
	return memo && (val == testArray.get(idx));
    }, true);
    test.ok(passed,
	    "test1DCreateNoSizeGiven: Error creating and testing values in 1D MdArray.");
    test.done();
};

exports.testCreate1DSizeGiven = function(test) {
    var testD = _us.range(11);
    var testArray = new MdArrayjs(testD, 11);
    var passed = _us.reduce(testD, function(memo, val, idx) {
	return memo && (val == testArray.get(idx));
    }, true);
    test.ok(passed,
	    "test1DCreateSizeGiven: Error creating and testing values in 1D MdArray.");
    test.done();
};

exports.testCreate2DSizeGiven = function(test) {
    var testD = _us.range(6);
    var testArray = new MdArrayjs(testD, 3,2);
    var passed = _us.reduce(testD, function(memo, val, idx) {
	return memo && (val == testArray.get(Math.floor(idx/2), idx % 2));
    }, true);
    test.ok(passed,
	    "test2DCreate: Error creating and testing values in 2D MdArray.");
    test.done();
};

/*exports['MdArrayjs'] = {
  setUp: function(done) {
    // setup here
    done();
  },
  'no args': function(test) {
    test.expect(1);
    // tests here
    test.equal(MdArrayjs.awesome(), 'awesome', 'should be awesome.');
    test.done();
  },
};*/
