'use strict';
var _us = require("underscore");
var MdArrayjs = require('MdArrayjs');

var data0 = _us.range(11);

var x0 = new MdArrayjs(data0);

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

var x = new MdArrayjs(data, 3, 3);

console.log("x[0, 2] is: " + x.get(0,2));
console.log("x[1, 1] is: " + x.get(1,1));
console.log("x[2, 2] is: " + x.get(2,2));

x.set(22, 2,2);
console.log("x[2, 2] is: " + x.get(2,2));

//console.log("x is:\n" + x);

var data2 = _us.range(27);

console.log("data is: " + data2);
x = new MdArrayjs(data2, 3, 3, 3);


console.log("x[0, 2, 2] is: " + x.get(0,2, 2));
console.log("x[1, 2, 2] is: " + x.get(1,2, 2));
console.log("x[2, 2, 2] is: " + x.get(2,2, 2));
console.log("x is:\n" + x)

var data3 = _us.range(81);

console.log("data is: " + data3);
x = new MdArrayjs(data3, 3, 3, 3, 3);

console.log("x[0,0,0,0] is: " + x.get(0,0,0,0));
console.log("x[0, 2, 2, 2] is: " + x.get(0,2, 2, 2));
console.log("x[1, 2, 2, 2] is: " + x.get(1,2, 2, 2));
console.log("x[2, 2, 2, 2] is: " + x.get(2,2, 2, 2));
console.log("x[2,2,2,2] is: " + x.get(2,2,2,2));
//console.log("x is:\n" + x);












