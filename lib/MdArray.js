/*
 * MdArray
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
 * The parameter to the constructor is a javascript object containing keyword
 * arguments. Eg.:
 *
 * {
 *        data: [1, 2, 3, 4],
 *        shape: [2, 2]
 * }
 *
 * @param arrayArgs    An object containing the keyword args for the constructor.
 */
var MdArray = function(arrayArgs) {
    'use strict';
    assert(arrayArgs.data,
	   "MdArray constructor must be called with an object having at " +
	   "least one of the shape or data fields.");
    this.data = arrayArgs.data;
    this.dSize = this.data.length;

    var dims;
    var tSize;
    var strides;
    if (arrayArgs.shape) {
	dims = arrayArgs.shape;
	tSize = _us.reduce(dims, function(memo, val) {
            return memo * val;
	}, 1);
	strides = getStrides(dims);
    }
    else {
	dims = [arrayArgs.data.length];
	tSize = arrayArgs.data.length;
	strides = [1];
    }
    this.dims = dims;
    this.tSize = tSize;
    this.strides = strides;
 
    assert(this.tSize == this.dSize,
	   "Data must by the right size for the supplied dimenstions.");

    // Return this for chaining?
    return this;
};

MdArray.prototype = {
    constructor: MdArray,

    
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
	var idxInfo = _us.zip(this.dims.slice(0), this.strides.slice(0));
	function ts(dimStrides, idx, data) {
	    s = "[";
	    if (dimStrides.length == 1)
	    {
		s += "\t";
		var first = dimStrides[0];
		for (var i = 0; i < first[0]; i++) {
		    s += " " + data[idx + i * first[1]];
		}
		s += "   ]";
	    }
	    else {
		var first = _us.first(dimStrides);
		for (var i = 0; i < first[0]; i++) {
		    s += ts(_us.rest(dimStrides), idx + i * first[1], data);
		    if (i < first[0] - 1) {
			s += "\n";
		    }
		}
		s += "]";
	    }
	    if (dimStrides.length == idxInfo.length) {
		s += "\n";
	    }
	    return s;
	}
	return ts(idxInfo, 0, this.data);
    },
    flatten: function() {
	return this.data;
    },
    
    applyOp: function(that, opFn) {
	var newData = null;
	if (that instanceof MdArray) {
	    var compatible = this.compatible(that);
	    if (compatible)
	    {
		newData = _us.map(this.data, function(val, idx) {
		    return opFn(val, that.data[idx]);
		});
	    }
	    else {
		throw new Error("MdArray.applyOp: Incompatible sizes for arrays.");
	    
	    }
	}
	else { // multiply by scalar.
	    newData = _us.map(this.data, function(val) { return opFn(val, that); });
	}
	//console.log("new data is: " + newData);
	var newArray = new MdArray({data: newData, shape : this.dims.slice(0)});
	//console.log("new array is: " + newArray);
	return newArray;
    },
    compatible: function(that) {
	var dims = _us.zip(this.dims, that.dims);
	return _us.every(dims, function(x) { return x[0] === x[1]; });
    },
    add: function(that) {
	return this.applyOp(that, function(x, y) { return x+y; });
    },
    sub: function(that) {
	return this.applyOp(that, function(x, y) { return x-y; });
    },
    mul: function(that) {
	return this.applyOp(that, function(x, y) { return x*y; });
    },
    div: function(that) {
	if (that instanceof MdArray)
	{
	    if (_us.some(that.data, function(x) { return x == 0; }))
	    {
		throw new Error("MdArray.div: divisor contains a zero.");
	    }
	}
	else {
	    if (that == 0) {
		throw new Error("MdArray.div: Attempt to divide by zero.");
	    }
	}
	return this.applyOp(that, function(x, y) { return x/y; });
    },
    T: function(args /* inPlace == true/false => default false*/) {
	var inPlace = (args && args.inPlace) || false;
	if (inPlace) {
	    this.strides = this.strides.reverse();
	    return this;
	}
	else {
	    var transposed =
		    new MdArray({data : this.data.slice(0), shape: this.dims.slice(0)});
	    transposed.strides.reverse();
	    return transposed;
	}
    }
	
};

/*
 * Factory functions.
 *
 * Includes:
 * - arange Create an MdArray containing a range of numbers.
 * - zeros Create an MdArray containing 0s.
 * - ones  Create an MdArray containing 1s.
 */
/**
 * 
 */
MdArray.zeros = function(args /* args.shape = [d1, d2, ...dn] */) {
    'use strict';
    args.fill = 0;
    return MdArray.createFilled(args);
};

MdArray.ones = function(args /* args.shape = [d1, d2, ...dn] */) {
    'use strict';
    args.fill = 1;
    return MdArray.createFilled(args);
};

MdArray.createFilled = function(args /* args.shape = [d1, d2, ...dn], args.val = n */) {
    'use strict';
    var fillVal = args.fill || 0;
    var ma = Object.create(MdArray.prototype);
    var tSize = _us.reduce(args.shape, function(memo, val) {
	return memo * val;
    }, 1);
    var data = new Array(tSize);
    for (var i = 0; i < tSize; i++) {
	data[i] = fillVal;
    }
    ma.data = data;
    ma.tSize = tSize;
    ma.dSize = ma.data.length;
    ma.dims = args.shape;
    ma.strides = getStrides(ma.dims);
    return ma;
};

MdArray.arange = function(args /* [start,] end [, by] [, shape] */) {
    'use strict';
    var start = args.start || 0;
    var end = args.end;
    var by = args.by || 1;
    var rangeVal = _us.range(start, end, by);
    var shapeVal = args.shape || [rangeVal.length];
    return new MdArray({data : rangeVal, shape : shapeVal});
}

module.exports = MdArray;

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

function getStrides(dims) {
    'use strict';
    if (dims.length == 1) {
	return [1];
    }
    var reversed = dims.slice(0).reverse();
    var strides = [];
    _us.each(reversed, function(val, idx, arr) {
	if (idx == 0) {
	    strides.unshift(1);
	    strides.unshift(val);
	}
	else if (idx != arr.length - 1) {
	    strides.unshift(val * strides[0]);
	}
    });
    return strides;
}
