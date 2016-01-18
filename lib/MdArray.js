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
	console.log("In set and this is: " + this);
	console.log("Index is: " + idx);
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
	       "Wrong number of arguments to index array with " + this.strides.length
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
		    new MdArray(
			{data : this.data.slice(0), shape: this.dims.slice(0)}
		    );
	    transposed.strides.reverse();
	    return transposed;
	}
    },
    foreach: function(f) {
	var indices = enumerateDims(this.dims);
	for (var i = 0; i < indices.length; i++) {
	    f(this.data[this.findIndex(indices[i])]);
	}
    },
    createView: function(sliceInfo) {
	return new ArrayView
	(
	    this.data,
	    this.dims.slice(0),
	    this.strides.slice(0),
	    sliceInfo
	);
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
 * Return an MdArray of zeros. Args are the shape of the array.
 *
 * @param args    An object containing a shape field with an array of
 *                dimensions.
 *
 * @returns An MdArray of the requested shape containing all zeros.
 */
MdArray.zeros = function(args /* args.shape = [d1, d2, ...dn] */) {
    'use strict';
    args.fill = 0;
    return MdArray.createFilled(args);
};

/**
 * Return an MdArray of ones. Args are the shape of the array.
 *
 * @param args    An object containing a shape field with an array of
 *                dimensions.
 *
 * @returns An MdArray of the requested shape containing all ones.
 */
MdArray.ones = function(args /* args.shape = [d1, d2, ...dn] */) {
    'use strict';
    args.fill = 1;
    return MdArray.createFilled(args);
};

/**
 * Return an MdArray of containing the requested fill value.
 *
 * @param args    An object containing a shape field with an array of
 *                dimensions, and a fill field.
 *
 * @returns An MdArray of the requested shape containing the repeated fill value.
 */
MdArray.createFilled = function(args/* args.shape = [d1, d2, ...dn], args.val = n */)
{
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

/**
 * Create an MdArray containing a range of numeric values.
 *
 * @param args    An object containing a shape field with an array of dimensions,
 *                an end field, and an optional start and by field.
 *
 * @return An MdArray containing the requested range of values.
 */
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
 * Given the dimensions of an MdArray, return an array of strides for the
 * array.
 *
 * @param dims     An array of dimensions for the MdArray.
 *
 * @returns An array containing the strides for the MdArray.
 */
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

/**
 * Construct an ArrayView object 
 */
function ArrayView(orgData, orgDims, orgStrides, sliceInfo) {
    this.data = orgData;
    this.dims = orgDims;
    this.strides = orgStrides;
    this.slices = processSlices(orgDims, sliceInfo);
    return this;
}

ArrayView.prototype = Object.create(MdArray.prototype);

_us.extend (ArrayView.prototype, {
    // Constructor
    constructor: ArrayView,
    /**
     * Return the required 1-d javascript array index indicated by the supplied
     * index coordinates.
     *
     * @param idx  An array containing the coordinate of the requested element.
     */
    findIndex: function(idx) {
	'use strict';
	console.log("In findIndex and this is: " + this);
	console.log("Received idx is: " + idx);
	var myThis = this;
	assert(idx.length == this.strides.length,
	       "Wrong number of arguments to index array with " + this.strides.length
	       + " dimensions.");
        var md_idx = _us.zip(idx, this.slices, this.strides);
	assert(_us.every(md_idx, function(val, idx) {
	    return (val[0] + val[1].start) < myThis.dims[idx];
	 }), "ArrayView: Index out of range.");
	
	return _us.reduce(md_idx, function(memo, val) {
	    console.log("val[0] is: " + val[0]);
	    console.log("val[1].start is: " + val[1].start);
	    console.log("val[1].end is: " + val[1].end);
	    console.log("val[2] is: " + val[2]);
	    return memo + (val[0] + val[1].start) * val[2];
	}, 0);
    },
    /**
     * Return a string representation of the the multi-Dimensional array.
     *
     * @returns A readable string for the array.
     */
    toString: function() {
	var idxInfo = _us.zip(this.slices.slice(0), this.strides.slice(0));
	function ts(ss, idx, data) {
	    s = "[";
	    if (ss.length == 1)
	    {
		s += "\t";
		
		var firstDim = ss[0];
		for (var i = firstDim[0].start; i < firstDim[0].end; i++) {
		    s += " " + data[idx + i * firstDim[1]];
		}
		s += "   ]";
	    }
	    else {
		var firstDim = _us.first(ss);
		for (var i = firstDim[0].start; i < firstDim[0].end; i++) {
		    s += ts(_us.rest(ss), idx + i * firstDim[1], data);
		    if (i < firstDim[0].end - 1) {
			s += "\n";
		    }
		}
		s += "]";
	    }
	    if (ss.length == idxInfo.length) {
		s += "\n";
	    }
	    return s;
	}
	return ts(idxInfo, 0, this.data);
    },
    flatten: function() {
	throw "Can't flatten an Array View.";
    },
    foreach: function(f) {
	var indices = enumerateSlices(this.slices);
	for (var i = 0; i < indices.length; i++) {
	    f(this.data[this.findIndex(indices[i])]);
	}
    }
});

/**
 * Return an array of objects with start and end index values calculated
 * from the values in dims and sliceInfo.
 *
 * @param dims      An array containing the dimensions of the original MdArray.
 * @param sliceInfo An array of slice strings.
 *
 * @returns An array of objects, each of which has a start and end indicating
 *          the start and end of a slice for a particular dimension.
 */
function processSlices(dims, sliceInfo) {
    assert(dims.length === sliceInfo.length,
	   "ArrayView: dims and sliceInfo parameters must be of the same length.");
    var ds = _us.zip(dims, sliceInfo);
    var processedSlices = _us.map(ds, function(val) {
	var dim = val[0];
	var si = val[1].replace(/\s/g, "");
	var siSplits = si.split(":");
	var splitObj = {};
	if (siSplits.length === 1) {
	    // Just an index
	    splitObj.start = parseInt(siSplits[0]);
	    splitObj.end = Math.min(splitObj.start + 1, dim);
	}
	else {
	    splitObj.start = (siSplits[0].length > 0) ?
		parseInt(siSplits[0]) : 0;
	    splitObj.end = (siSplits[1].length > 0) ?
		parseInt(siSplits[1]) : dim;
	}
	assert(splitObj.start >= 0 && splitObj.start < splitObj.end,
	       "ArrayView: First slice index must be > 0 and < the second index.");
	assert(splitObj.end <= dim,
	       "ArrayView: Second slice index must be less than dim");
	return splitObj;
    });
    return processedSlices;
}

/**
 * Return a list of all coordinates for the given MdArray.
 *
 * @param dims  An array of dimensions for an MdArray.
 *
 * @returns An ordered list containing a coordinate for every element of the
 *          MdArray.
 */
function enumerateDims(dims) {

    if (dims.length == 0) {
	return [];
    }
    var firstRange = _us.map(_us.range(_us.first(dims)), function(val) {
	return [val];
    });
    if (dims.length == 1) {
	return firstRange;
    }
    else {
	var restDims = enumerateDims(_us.rest(dims));
	var final = [];
	_us.each(firstRange, function(val) {
	    var final1 = _us.map(restDims, function(rVal) {
		return val.slice(0).concat(rVal.slice(0));
	    });
	    final = final.concat(final1);
	});
	return final;
    }
}

/**
 * Return a list of all coordinates for the given MdArray.
 *
 * @param dims  An array of dimensions for an MdArray.
 *
 * @returns An ordered list containing a coordinate for every element of the
 *          MdArray.
 */
function enumerateSlices(slices) {

    if (slices.length == 0) {
	return [];
    }
    var firstSlice = _us.first(slices);
    var firstRange =
	    _us.map(_us.range(firstSlice.start, firstSlice.end), function(val) {
		return [val - firstSlice.start];
	    });
    if (slices.length == 1) {
	return firstRange;
    }
    else {
	var restSlices = enumerateSlices(_us.rest(slices));
	var final = [];
	_us.each(firstRange, function(val) {
	    var final1 = _us.map(restSlices, function(rVal) {
		return val.slice(0).concat(rVal.slice(0));
	    });
	    final = final.concat(final1);
	});
	return final;
    }
}


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


