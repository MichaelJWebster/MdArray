'use strict';
var _us = require("underscore");
var MdArray = require('MdArray');

var data0 = _us.range(11);

var x0 = new MdArray({data :data0, shape: [11]});

console.log("x[0] is: " + x0.get(0));
console.log("x[1] is: " + x0.get(1));
console.log("x[2] is: " + x0.get(2));
var passed = _us.reduce(data0, function(memo, val, idx) {
    console.log("(memo, val, idx ) = (" + memo + ", " + val + ", " + idx + ")");
    console.log("x0.get(" + idx + ") = " + x0.get(idx));
    return memo && (val == x0.get(idx));
}, true);
console.log("passed = " + passed);

var data = _us.range(9);

var x = new MdArray({data : data, shape: [3, 3]});

console.log("x[0, 2] is: " + x.get(0,2));
console.log("x[1, 1] is: " + x.get(1,1));
console.log("x[2, 2] is: " + x.get(2,2));

x.set(22, 2,2);
console.log("x[2, 2] is: " + x.get(2,2));

//console.log("x is:\n" + x);

var data2 = _us.range(27);

console.log("data is: " + data2);
x = new MdArray({data: data2, shape: [3, 3, 3]});


console.log("x[0, 2, 2] is: " + x.get(0,2, 2));
console.log("x[1, 2, 2] is: " + x.get(1,2, 2));
console.log("x[2, 2, 2] is: " + x.get(2,2, 2));
console.log("x is:\n" + x)

var data3 = _us.range(81);

console.log("data is: " + data3);
x = new MdArray({data: data3, shape: [3, 3, 3, 3]});

console.log("x[0,0,0,0] is: " + x.get(0,0,0,0));
console.log("x[0, 2, 2, 2] is: " + x.get(0,2, 2, 2));
console.log("x[1, 2, 2, 2] is: " + x.get(1,2, 2, 2));
console.log("x[2, 2, 2, 2] is: " + x.get(2,2, 2, 2));
console.log("x[2,2,2,2] is: " + x.get(2,2,2,2));
//console.log("x is:\n" + x);

var zeros = MdArray.zeros({shape :[4, 4]});
console.log("zeros([4, 4] is:\n" + zeros);

var ones = MdArray.ones({shape :[4, 4]});
console.log("ones([4, 4] is:\n" + ones);

var arange = MdArray.arange({start : 0, end : 16, shape :[4, 4]});
console.log("arange({start : 0, end : 16, shape :[4, 4]}) is:\n" + arange);

arange = MdArray.arange({end : 50, shape :[10, 5]});
console.log("arange({end : 50, shape :[10, 5]}) is:\n" + arange);

var testArray1 = MdArray.ones({shape: [5, 10]});
var testArray2 = MdArray.ones({shape: [5, 10]});
var testArray3 = testArray1.add(testArray2);
console.log("testArray3 is:\n" + testArray3);

// Create a view from testArray3
var ta3View = testArray3.slice(["0:2", ":5"]);
console.log("ta3View[0:2, :5] is: \n" + ta3View);

var ta3View1 = arange.slice([":", "3:"]);
console.log("ta3View1 [:, 3:] is: \n" + ta3View1);
ta3View1.set(999, 0, 0);
console.log("ta3View1 [:, 3:] is: \n" + ta3View1);
console.log("arange({end : 50, shape :[10, 5]}) is:\n" + arange);

var testArray = MdArray.arange({start:50, end:100, shape: [25, 2]});
var testView = testArray.slice([":", "1:"]);
var indices = testView.enumerateIndices();
var viewElements = [];
testView.foreach(function(x) { viewElements.push(x); });
var vals = _us.zip(indices, viewElements);
_us.each(vals, function(x) {
    console.log("\nIdx = " + x[0] + " value = " + x[1]);
});
var orgVals = MdArray.ones({shape: [25, 1]});
testView.setSlice(orgVals.data);

var tA1 = MdArray.arange({start:1, end:5, shape: [4]});
var tA2 = MdArray.arange({start:4, end:0, by: -1, shape: [4]});    
var tA1DotA2 = tA1.dot(tA2);

console.log("tA1 and tA2 = " + tA1 + tA2);
console.log("tA1DotA2 = " + tA1DotA2);

var t2D1 = MdArray.arange({start:1, end:5, shape: [2, 2]});
var t2D2 = MdArray.arange({start:4, end:0, by: -1, shape: [2, 2]});    
var t2DDot = t2D1.dot(t2D2);

console.log("t2D1 is:\n" + t2D1);
console.log("t2D2 is:\n" + t2D2);
console.log("t2DDot =\n" + t2DDot);

var t2D1WithOnes = t2D1.addOnes();
console.log("t2D1 with ones is:\n" + t2D1WithOnes);










