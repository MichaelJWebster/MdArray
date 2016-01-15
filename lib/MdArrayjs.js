/*
 * MdArrayjs
 * https://github.com/michaelw/MdArray
 *
 * A multi-dimensional array implementation for use in machine learning and
 * other calculations.
 *
 * Copyright (c) 2016 Michael Webster
 * Licensed under the MIT license.
 */
var _us = require("underscore");

'use strict';

//exports.awesome = function() {
//  return 'awesome';
//};

/**
 * Construct an Ml_ndarray object from it's shape in terms of rows,columns,
 * and any other dimensions it has.
 *
 * @param data                A javascript array.
 * @param arguments.slice(1)  An array contaiing the dimensions of the data.
 */
var MdArrayjs = function(data) {
    'use strict';
    this.data = data;
    this.totalLength = data.length;
    this.dims = [];
    var args = _us.rest(arguments);
    if (args.length <= 1)
    {
	this.dims.push(data.length);
	this.strides = [1];
    }
    else
    {
	for (var i = 0; i < args.length; i++)
	{
            var newDim = args[i];
            this.dims.push(newDim);
	}

	var strides = [];
	var reversed = this.dims.reverse();
	_us.each(reversed, function(val, idx, arr) {
	    if (idx == 0) {
		strides.unshift(1);
		strides.unshift(val);
	    }
	    else if (idx != arr.length - 1) {
		strides.unshift(val * strides[0]);
	    }
	});
	this.strides = strides;
    }	    
    var tSize = _us.reduce(this.dims, function(memo, val) {
        return memo * val;
    }, 1);
    assert(tSize == this.totalLength,
	   "Data must by the right size for the supplied dimenstions.");
};

MdArrayjs.prototype = {
    constructor: MdArrayjs,

    /**
     * Get the value of the element indexed by the coordinate values in the
     * arguments.
     *
     * @returns The value at the array position specified.
     */ 
    get: function() {
	'use strict';
	var args = _us.toArray(arguments);
        var idx = this.findIndex(args);
        return this.data[idx];
    },

    /**
     * Set the value in the array element indexed by the remaining values in
     * arguments.
     *
     * @param val   The value to be assigned into the array.
     */
    set: function(val) {
	'use strict';
        var idx = this.findIndex(_us.rest(arguments));
        this.data[idx] = val;
    },

    /**
     * Return the required 1-d javascript array index indicated by the supplied
     * index coordinates.
     *
     * @param idx  An array containing the coordinate of the requested element.
     */
    findIndex: function(idx) {
	'use strict';
	assert(idx.length == this.strides.length,
	       "Wrong number of argumnets to index array with " + this.strides.length
	       + " dimensions.");
        var md_idx = _us.zip(idx, this.strides);	
	return _us.reduce(md_idx, function(memo, val) {
	    return memo + val[0] * val[1];
	}, 0);
    
    },

    /**
     * Return a string representation of the the multi-Dimensional array.
     *
     * @returns A readable string for the array.
     */
    toString: function() {
	var fullDims = this.dims;
	function ts(dims, idx, data) {
	    s = "[";
	    if (dims.length == 1)
	    {
		s += "\t";
		var first = dims[0];
		for (var i = idx; i < idx + first; i++) {
		    s += " " + data[i];
		}
		s += "   ]";
	    }
	    else {
		var first = _us.first(dims);
		for (var i = 0; i < first; i++) {
		    s += ts(_us.rest(dims), first * (idx + i) , data);
		    if (i < first - 1) {
			s += "\n";
		    }
		}
		s += "]";
	    }
	    if (dims.length == fullDims.length) {
		s += "\n";
	    }
	    return s;
	}
	return ts(fullDims, 0, this.data);
    }
};

module.exports = MdArrayjs;

/**
 * Raise an error if possible, when there is a violation of the expectations
 * of the ml-ndarray module.
 */
function assert(condition, message) {
    'use strict';
    if (!condition) {
        message = message || "Assertion failed";
        if (typeof Error !== "undefined") {
            throw new Error(message);
        }
        throw message;
    }
}
