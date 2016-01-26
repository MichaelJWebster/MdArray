'use strict';
var _us = require("underscore");
var MdArray = require('../lib/MdArray.js');

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
    var testArray = new MdArray({data : testD });
    var passed = _us.reduce(testD, function(memo, val, idx) {
	return memo && (val == testArray.get(idx));
    }, true);
    test.ok(passed,
	    "test1DCreateNoSizeGiven: Error creating and testing values in 1D MdArray.");
    test.done();
};

exports.testCreate1DSizeGiven = function(test) {
    var testD = _us.range(11);
    var testArray = new MdArray({data :testD, shape: [11]});
    var passed = _us.reduce(testD, function(memo, val, idx) {
	return memo && (val == testArray.get(idx));
    }, true);
    test.ok(passed,
	    "test1DCreateSizeGiven: Error creating and testing values in 1D MdArray.");
    test.done();
};

exports.testCreate2DSizeGiven = function(test) {
    var testD = _us.range(6);
    var testArray = new MdArray({data : testD, shape: [3,2]});
    var passed = _us.reduce(testD, function(memo, val, idx) {
	return memo && (val == testArray.get(Math.floor(idx/2), idx % 2));
    }, true);
    test.ok(passed,
	    "test2DCreate: Error creating and testing values in 2D MdArray.");
    test.done();
};

exports.testZeros = function(test) {
    var testArray = MdArray.zeros({shape: [3,2]});
    var flattened = testArray.flatten();
    var passed = _us.reduce(flattened, function(memo, val, idx) {
	return memo && (val == testArray.get(Math.floor(idx/2), idx % 2));
    }, true);
    test.ok(passed,
	    "testZeros: Error creating and testing values in 2D array of Zeros.");
    test.done();
};

exports.testOnes = function(test) {
    var testArray = MdArray.ones({shape: [3,2]});
    var flattened = testArray.flatten();
    var passed = _us.reduce(flattened, function(memo, val, idx) {
	return memo && (val == testArray.get(Math.floor(idx/2), idx % 2));
    }, true);
    test.ok(passed,
	    "testOnes: Error creating and testing values in 2D array of Ones.");
    test.done();
};

exports.testArange = function(test) {
    var testArray = MdArray.arange({end: 50, shape : [5 ,10]});
    var testVal = _us.range(50);
    var passed = _us.reduce(testVal, function(memo, val, idx) {
	return memo && (val == testArray.get(Math.floor(idx/10), idx % 10));
    }, true);
    test.ok(passed,
	    "testaRange: Error creating and testing values in aRange 2D array.");
    test.done();
};


exports.testPlus = function(test) {
    var testArray1 = MdArray.ones({shape: [5, 10]});
    var testArray2 = MdArray.ones({shape: [5, 10]});
    var testArray3 = testArray1.add(testArray2);
    var d = testArray3.data;
    var passed = _us.every(d, function(x) { return x === 2; });
    test.ok(passed,
	    "testPlus: Error adding 2 2D arrays.");
    test.done();
};

exports.testSub = function(test) {
    var testArray1 = MdArray.ones({shape: [5, 10]});
    var testArray2 = MdArray.ones({shape: [5, 10]});
    var testArray3 = testArray1.sub(testArray2);
    var d = testArray3.data;
    var passed = _us.every(d, function(x) { return x === 0; });
    test.ok(passed,
	    "testPlus: Error adding 2 2D arrays.");
    test.done();
};

exports.testMul = function(test) {
    var testArray1 = MdArray.ones({shape: [5, 10]}).mul(2);
    var testArray2 = MdArray.ones({shape: [5, 10]}).mul(2);
    var testArray3 = testArray1.mul(testArray2);
    var d = testArray3.data;
    var passed = _us.every(d, function(x) { return x === 4; });
    test.ok(passed,
	    "testPlus: Error adding 2 2D arrays.");
    test.done();
};

exports.testViewCreate = function(test) {
    var testArray = MdArray.arange({start:50, end:100, shape: [10, 5]});
    var testView = testArray.slice([":", "3:"]);
    var indices = testView.enumerateIndices();
    var viewElements = [];
    testView.foreach(function(x) { viewElements.push(x); });
    var orgVals = [];
    for (var i = 0; i < 10; i++) {
	for (var j = 3; j < 5; j++) {
	    orgVals.push(testArray.get(i, j));
	}
    }
    //console.log("orgVals are:\n" + orgVals);
    var testVals = _us.zip(orgVals, viewElements);
    test.ok(_us.every(testVals, function(val) { return val[0] === val[1]; }),
	    "testViewCreate: Error in values.");
    test.done();
};

exports.testSetSliced = function(test) {
    var testArray = MdArray.arange({start:50, end:100, shape: [25, 2]});
    var testView = testArray.slice([":", "1:"]);
    var indices = testView.enumerateIndices();
    var viewElements = [];
    testView.foreach(function(x) { viewElements.push(x); });
    var orgVals = MdArray.ones({shape: [25, 1]});
    testView.setSlice(orgVals.data);
    viewElements = [];
    testView.foreach(function(x) { viewElements.push(x); });    
    test.ok(_us.every(viewElements, function(val) { return val === 1; }),
	    "testViewCreate: Error in values.");
    test.done();
};

exports.testDot1D = function(test) {
    var tA1 = MdArray.arange({start:1, end:5, shape: [4]});
    var tA2 = MdArray.arange({start:4, end:0, by: -1, shape: [4]});    
    var tA1DotA2 = tA1.dot(tA2);
    var dataVals = _us.zip(tA1.data, tA2.data);
    var expectedVal = _us.reduce(dataVals, function(memo, val) {
	return memo + val[0] * val[1];
    }, 0);
    test.ok(tA1DotA2 === expectedVal, "testDot1D: Error in values.");
    test.done();
};

exports.testDot2D = function(test) {
    var t2D1 = MdArray.arange({start:1, end:5, shape: [2, 2]});
    var t2D2 = MdArray.arange({start:4, end:0, by: -1, shape: [2, 2]});
    var t2DDot = t2D1.dot(t2D2);
    var passed = (t2DDot.get(0,0) === 8) && (t2DDot.get(0, 1) == 5) &&
	    (t2DDot.get(1,0) === 20) && (t2DDot.get(1,1) == 13);
    test.ok(passed, 
	    "testDot2D: Error in values.");
    test.done();
};

exports.groupOps = {
    objs: {},
    
    setUp: function(callback) {
	exports.groupOps.objs.SevenBySeven = MdArray.arange({start: 1, end: 50, shape: [7, 7]});
	exports.groupOps.objs.OneBySevenOnes = MdArray.ones({start: 1, end: 8, shape: [1, 7]});
	exports.groupOps.objs.OneBySevenTwos = exports.groupOps.objs.OneBySevenOnes.mul(2);
	exports.groupOps.objs.SevenByOneOnes = MdArray.ones({start: 1, end: 8, shape: [7, 1]});
	exports.groupOps.objs.SevenByOneTwos = exports.groupOps.objs.SevenByOneOnes.mul(2);
	if (callback) {
	    callback();
	}
    },

    testMul: function(test) {
	var arr1 = exports.groupOps.objs.SevenBySeven.mul(2);
	var arr2 = exports.groupOps.objs.SevenBySeven.mul(exports.groupOps.objs.OneBySevenTwos);
	var resultData = _us.zip(arr1.data, arr2.data);
	var passed = _us.every(resultData, function(d) {
	    return d[0] === d[1];
	});
	test.ok(passed, "testMul 1: Error in values.");
	arr1 = exports.groupOps.objs.SevenBySeven.mul(2);
	arr2 = exports.groupOps.objs.SevenBySeven.mul(exports.groupOps.objs.SevenByOneTwos);
	resultData = _us.zip(arr1.data, arr2.data);
	passed = _us.every(resultData, function(d) {
	    return d[0] === d[1];
	});
	test.ok(passed, "testMul 2: Error in values.");
	test.done();
    },

    testSumAxis: function(test) {
	var arr1 = exports.groupOps.objs.SevenBySeven.mul(10);
	var tens = exports.groupOps.objs.OneBySevenTwos.mul(5);
	var arr2 = exports.groupOps.objs.SevenBySeven.mul(tens);
	var sumCol1 = arr1.sum(1);
	var sumCol2 = arr2.sum(1);
	var passed = (sumCol1.dims[0] == 1) && (sumCol2.dims[0] == 1);
	passed = passed && (sumCol1.dims[1] == arr1.dims[1]) && (sumCol2.dims[1] == sumCol1.dims[1]);
	var resultData = _us.zip(sumCol1.data, sumCol2.data);
	passed = passed && _us.every(resultData, function(d) {
	    return d[0] === d[1];
	});
	test.ok(passed, "testSumAxis 1: Error in Summing over columns.");
	var sumRow1 = arr1.sum(0);
	var sumRow2 = arr2.sum(0);
	passed = (sumCol1.dims[0] == 1) && (sumCol2.dims[0] == 1);
	passed = passed && (sumCol1.dims[1] == arr1.dims[1]) && (sumCol2.dims[1] == sumCol1.dims[1]);
	resultData = _us.zip(sumRow1.data, sumRow2.data);
	passed = passed && _us.every(resultData, function(d) {
	    return d[0] === d[1];
	});
	test.ok(passed, "testSumAxis 2: Error in summing over rows.");
	test.done();
    }
};

// More tests.
// Fixed bug in transpose - add more big transposes
/*exports['MdArray'] = {
  setUp: function(done) {
    // setup here
    done();
  },
  'no args': function(test) {
    test.expect(1);
    // tests here
    test.equal(MdArray.awesome(), 'awesome', 'should be awesome.');
    test.done();
  },
};*/
