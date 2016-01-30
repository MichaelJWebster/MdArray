if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function(require, exports, module) {
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
/*
 * FIXME: Need to add scalar multiplication/division, add etc.
 *
 */
var _us = require("underscore");

'use strict';

/**
 * @public
 * @class
 * @alias MdArray
 * @classdesc The MdArray class provides a multi-dimensional array like
 * abstraction for javascript.
 *
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
 * @constructor
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
     * @param arguments indices - eg. X.get(0,1,2);
     * @returns The value at the array position specified.
     * @method
     */ 
    get: function() {
	'use strict';
	//var args = _us.toArray(arguments);
        var idx = this.findIndex(arguments);
        return this.data[idx];
    },

    /**
     * Set the value in the array element indexed by the remaining values in
     * arguments.
     *
     * @param val   The value to be assigned into the array.
     * @param rest  A list of indices, eg. X.set(x, 0,1,2);
     *
     * @method
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
     *
     * @returns The index into data indicated by the supplied idx parameter.
     * @method
     */
    findIndex: function(idx) {
	'use strict';
	if (typeof idx[0] != 'number') {
	    idx = idx[0];
	}
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
     *
     * @method
     */
    toString: function() {
	var idxInfo = _us.zip(this.dims.slice(0), this.strides.slice(0));
	function ts(dimStrides, idx, data) {
	    var s = "[";
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

    /**
     * Return the data of this MdArray as a flat array.
     *
     * @returns A flattened array version of this.
     * @method
     */
    flatten: function() {
	return this.data;
    },

    /**
     * Apply the function opFn to all pairs of matching elements in this and that.
     *
     * @param that   The other object that is part of this operation.
     * @param opFn   The operation to be applied to pairs of elements from this
     *               and that.
     * @param dim    The dimension along which to apply opFn. For example, dim=1 to
     *               apply down columns of a 2D array.
     *
     * @returns      A new MdArray containing the results of applying opFn to
     *               this and that.
     *
     * @method
     */
    applyOp: function(that, opFn, dim) {
	if (typeof that === 'number') {
	    // Scalar that case.
	    var newArray = new MdArray({data : this.data.slice(0), shape : this.dims});
	    _us.each(newArray.data, function(val, idx) {
		newArray.data[idx] = opFn(val, that);
	    });
	    return newArray;
	}
	var rowsEqual = this.dims[0] === that.dims[0];
	var colsEqual = this.dims[1] === that.dims[1];
	if (rowsEqual && colsEqual && typeof dim === 'undefined') {
	    // Apply the operation accross very element of the two arrays.
	    var zipped = _us.zip(this.data, that.data);
	    var newData = _us.map(zipped, function(val) {
		return opFn(val[0], val[1]);
	    });
	    return new MdArray({data: newData, shape: this.dims});
	}       
	else {
	    var d = (dim || (rowsEqual && "cols") || (colsEqual && "rows"));
	    assert(d, "Cannot apply operation across dimensions of different size.");
	    if (d == "rows" && !colsEqual || d == "cols" && !rowsEqual) {
		assert(false, "Cannot apply operation accross the requested dimension.");
	    }
	    if (d == "rows") {
		/*
		 * if d == "rows" and this and that have the same number of rows,
		 * then we're applying the operator as follows:
		 *
		 * - apply op to row0 of this against row0 of that
		 * - apply op to row1 of this against row1 of that
		 * :
		 * - apply op to last row of this against last row of that
		 *
		 * If this has a lesser number of rows than that, then first we
		 * create a new array of the same size as that, which is a copy
		 * of this, with the last row of this repeated the required number of
		 * times. We do a similar operation if that has less rows than this.
		 */
		var finalThis = this;
		var finalThat = that;
		if (finalThis.dims[0] < finalThat.dims[0]) {
		    // extend finalThis along rows.
		    finalThis = finalThis.extendDims(finalThat.dims.slice(0));
		}
		else {
		    // extend final That along rows.
		    finalThat = finalThat.extendDims(finalThis.dims.slice(0));
		}
		var newData = _us.map(finalThis.data, function(val, idx) {
		    return opFn(val, finalThat.data[idx]);
		});
		return new MdArray({data: newData, shape : finalThis.dims.slice(0)});
	    }
	    else { // By columns.
		var finalThis = this;
		var finalThat = that;
		if (finalThis.dims[1] < finalThat.dims[1]) {
		    // extend finalThis along rows.
		    finalThis = finalThis.extendDims(finalThat.dims.slice(0));
		}
		else {
		    // extend final That along rows.
		    finalThat = finalThat.extendDims(finalThis.dims.slice(0));
		}
		var newData = _us.map(finalThis.data, function(val, idx) {
		    return opFn(val, finalThat.data[idx]);
		});
		return new MdArray({data: newData, shape : finalThis.dims.slice(0)});
	    }
	}
    },

    /**
     * Test whether the MdArray that is compatible with this one, so that
     * element wise operations are able to be applied between this and that.
     *
     * @param that    An MdArray object to have it's dimensions checked against
     *                this.
     *
     * @returns true => this and that are compatible, false otherwise.
     *
     * @method
     */
    compatible: function(that) {
	var dims = _us.zip(this.dims, that.dims);
	return _us.every(dims, function(x) { return x[0] === x[1]; });
    },

    /**
     * Add that to this, and return a new array containing the result.
     *
     * @param that   The array to be added to this one.
     *
     * @returns A new MdArray containing the values of that + this.
     *
     * @method
     */
    add: function(that) {
	return this.applyOp(that, function(x, y) { return x+y; });
    },

    /**
     * Subtract that from this, and return a new MdArray containing the result.
     *
     * @param that   The array to be subtracted from this one.
     *
     * @returns A new MdArray containing the values of this - that.
     *
     * @method
     */
    sub: function(that) {
	return this.applyOp(that, function(x, y) { return x-y; });
    },

    /**
     * Multiply this by that and return a new MdArray containing the result.
     *
     * @param that   The array to be multiplied with this one.
     *
     * @returns A new MdArray containing the values of this * that.
     *
     * @method
     */    
    mul: function(that) {
	return this.applyOp(that, function(x, y) { return x*y; });
    },

    /**
     * Divide this by that and return a new MdArray containing the result.
     *
     * @param that   The array to divide this by.
     *
     * @returns A new MdArray containing the values of this / that.
     *
     * @method
     */    
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

    /**
     * Return the dot product of this and that.
     *
     * Note: This method only runs for 1 or 2 dimensional MdArrays.
     *
     * @param that    An MdArray to be dotted with this one.
     *
     * @returns A value if this and that are 1-dimensional arrays, or a m x p
     *          size MdArray where m is the number of rows in this, and p is the
     *          number of columns in that.
     */
    dot: function(that) {
	assert(this.dims.length <= 2,
	       "dot is only defined for 1 or 2 dimensional MdArrays.");
	assert(this.dims.length === that.dims.length,
	       "dot is only defined between MdArray's with the same number of dimensions.");
	if (this.dims.length === 1) {
	    assert(this.dSize === that.dSize,
		   "dot is only defined for 1 dimensional MdArray's of the same size.");
	    return _us.reduce(_us.zip(this.data, that.data), function(memo, val) {
		return memo + val[0] * val[1];
	    }, 0);
	}
	else {
	    var dotProd = MdArray.zeros({shape: [this.dims[0], that.dims[1]]});
	    for (var i = 0; i < this.dims[0]; i++) {
		for (var j = 0; j < that.dims[1]; j++) {
		    var rowData = this.slice([i.toString(), ":"]).flatten();
		    var colData = that.slice([":", j.toString()]).flatten();
		    var val = _us.reduce(_us.zip(rowData, colData), function(memo, v) {
			return memo + v[0] * v[1];
		    }, 0);
		    dotProd.set(val, i, j);
		}
	    }
	    return dotProd;
	}
    },

    /**
     * Return a new array containing the transpose of this array or, if inPlace
     * is true, modify this array to be Transposed.
     *
     * @param args    An optional object containing a boolean valued key inPlace.
     *
     * @returns A new array, or this.
     *
     * @method
     */
    T: function(args /* inPlace == true/false => default false*/) {
	var inPlace = (args && args.inPlace) || false;
	if (inPlace) {
	    this.strides = this.strides.reverse();
	    return this;
	}
	else {
	    var transposed =
		    new MdArray(
			{data : this.data.slice(0), shape: this.dims.slice(0).reverse()}
		    );
	    return transposed;
	}
    },

    /**
     * Apply function f to each element of the MdArray.
     *
     * @param f   A function that can be applied to elements of this.
     *
     * @method
     */
    foreach: function(f) {
	var indices = enumerateDims(this.dims);
	for (var i = 0; i < indices.length; i++) {
	    f(this.data[this.findIndex(indices[i])]);
	}
    },

    /**
     * Raise the values in this array to power exp.
     *
     * NOTE: This operation occurs in place.
     *
     * @param exp   The exponent.
     */
    pow: function(exp) {
	var t = this;
	var indices = enumerateDims(t.dims);
	_us.each(indices, function(idx) {
	    var dIndex = t.findIndex(idx);
	    var val = Math.pow(t.data[dIndex], exp);
	    t.data[dIndex] = val;
	});
	return t;
    },

    /**
     * Create and return an ArrayView object representing a slice of this
     * array.
     *
     * The sliceInfo parameter is an array of strings that follow the python
     * numpy array slice syntax. So for example:
     *
     * - "2:5" would be taken to mean take just all the values between 2 and 5,
     * - ":" would mean take all possible values for this dimension.
     * - ":5" would mean take all values up to 5,
     * and so on.
     *
     * @param sliceInfo   An array containing strings of sliceInfo.
     *
     * @return A new ArrayView object appropriately created for the slice.
     *
     * @method
     */
    slice: function(sliceInfo) {
	return new ArrayView
	(
	    this.data,
	    this.dims.slice(0),
	    this.strides.slice(0),
	    sliceInfo
	);
    },

    /**
     * Create and return a new MdArray object containing a copy of a slice of
     * this array.
     *
     * The sliceInfo parameter is an array of strings that follow the python
     * numpy array slice syntax. So for example:
     *
     * - "2:5" would be taken to mean take just all the values between 2 and 5,
     * - ":" would mean take all possible values for this dimension.
     * - ":5" would mean take all values up to 5,
     * and so on.
     *
     * @param sliceInfo   An array containing strings of sliceInfo.
     *
     * @return A new MdArrayObject appropriately created for the slice.
     *
     * @method
     */
    newSlice: function(sliceInfo) {
	var view = new ArrayView
	(
	    this.data,
	    this.dims.slice(0),
	    this.strides.slice(0),
	    sliceInfo
	);
	var new_data = view.flatten();
	var newDims = _us.map(view.slices, function(sl) {
	    return sl.end - sl.start;
	});
	return new MdArray({data: new_data, shape: newDims});
    },

    /**
     * Add a column of ones as the first column in the MdArray.
     *
     * NOTE: This only works for 2 dimensional arrays.
     *
     * @returns A new MdArray with the 0'th column being all 1s.
     *
     * @method
     */
    addOnes: function() {
	assert(this.dims.length == 2,
	       "addOnes only defined for 2 dimensional arrays.");
	var dims = this.dims;
	var stride = this.strides[0] + 1;
	var newData = this.data.slice(0);
	//var rows = _us.range(0, dims.length);
	var rows = _us.range(0, dims[0]);

	_us.each(rows, function(val) {
	    newData.splice(val * stride, 0, 1.0);
	});
	return new MdArray({data: newData, shape: [dims[0], dims[1] + 1]});
    },

    /**
     * Return the sum of the values in this MdArray. If a dimension is supplied,
     * the sum occurs down the requested dimension.
     *
     * @param dimension   The dimension to sum along.
     *
     * @returns A new MdArray containing the sum, or if no dimension is
     *          supplied, a scalar value set to the sum over the entire
     *          MdArray.
     */
    sum: function(dimension) {
	if (typeof dimension === 'undefined') {
	    return _us.reduce(this.data, function(memo, val) {
		return memo + val;
	    }, 0);
	}
	var dim = this.dims[dimension];
	var data = [];
	var sliceInfo = _us.map(_us.range(this.dims.length), function(val) { return ":"; });
	for (var i = 0; i < dim; i++) {
	    sliceInfo[dimension] = i.toString();
	    var newView = this.slice(sliceInfo);
	    var newSum = 0;
	    newView.foreach(function(x) { newSum += x;});
	    data.push(newSum);
	}
	if (dimension == 1) {
	    // Return as a row.
	    return new MdArray({data: data, shape: [1, dim]});
	}
	else {
	    // Return as a column.
	    return new MdArray({data: data, shape: [dim, 1]});
	}
    },

    /**
     * Return the maximum of the values in this MdArray. If a dimension is
     * supplied, the max is down the requested dimension.
     *
     * @param dimension   The dimension to find the max along.
     *
     * @returns A new MdArray containing the max, or if no dimension is supplied
     *          a scalar with the value of max over the entire MdArray.
     */    
    max: function(dimension) {
	if (typeof dimension === 'undefined') {
	    return _us.reduce(this.data, function(memo, val) {
		if (val > memo) {
		    return val;
		}
	    }, Number.MIN_SAFE_INTEGER);
	}
	var data = [];
	var dim = this.dims[dimension];
	var sliceInfo = _us.map(_us.range(this.dims.length), function(val) { return ":"; });
	for (var i = 0; i < dim; i++) {
	    var max = Number.MIN_SAFE_INTEGER;	    
	    sliceInfo[dimension] = i.toString();
	    var newView = this.slice(sliceInfo);
	    var newSum = 0;
	    newView.foreach(function(x) {
		if (x > max)
		{
		    max = x;
		}
	    });
	    data.push(max);
	}
	if (dimension == 1) {
	    // Return as a row.
	    return new MdArray({data: data, shape: [1, dim]});
	}
	else {
	    // Return as a column.
	    return new MdArray({data: data, shape: [dim, 1]});
	}
    },

    /**
     * Return the minimum of the values in this MdArray. If a dimension is
     * supplied, the min is down the requested dimension.
     *
     * @param dimension   The dimension to find the min along.
     *
     * @returns A new MdArray containing the min, or if no dimension is supplied
     *          a scalar with the value of min over the entire MdArray.
     */
    min: function(dimension) {
	if (typeof dimension === 'undefined') {
	    return _us.reduce(this.data, function(memo, val) {
		if (val < memo) {
		    return val;
		}
	    }, Number.MAX_SAFE_INTEGER);
	}
	var data = [];
	var dim = this.dims[dimension];
	var sliceInfo = _us.map(_us.range(this.dims.length), function(val) { return ":"; });
	for (var i = 0; i < dim; i++) {
	    var min = Number.MAX_SAFE_INTEGER;	    
	    sliceInfo[dimension] = i.toString();
	    var newView = this.slice(sliceInfo);
	    var newSum = 0;
	    newView.foreach(function(x) {
		if (x < min)
		{
		    min = x;
		}
	    });
	    data.push(min);
	}
	if (dimension == 1) {
	    // Return as a row.
	    return new MdArray({data: data, shape: [1, dim]});
	}
	else {
	    // Return as a column.
	    return new MdArray({data: data, shape: [dim, 1]});
	}
    },

    /**
     * Return the mean of the values in this MdArray. If a dimension is
     * supplied, the mean is down the requested dimension.
     *
     * @param dimension   The dimension to find the mean along.
     *
     * @returns A new MdArray containing the mean, or if no dimension is
     *          supplied, a scalar with the value of mean over the entire
     *          MdArray.
     */
    mean: function(dimension) {
	if (typeof dimension === 'undefined') {
	    var sum = _us.reduce(this.data, function(memo, val) {
		return memo + val;
	    }, 0);
	    return sum / this.data.length;
	}
	var data = [];
	var dimSize = _us.reduce(this.dims, function(memo, val, idx) {
	    if (idx != dimension) {
		return memo * val;
	    }
	    else {
		return memo;
	    }
	}, 1);
	return this.sum(dimension).div(dimSize);
    },

    /**
     * Return the standard deviation of the values in this MdArray. If a
     * dimension is supplied, the standard deviation is calculated down the
     * requested dimension.
     *
     * @param dimension   The dimension to find the standard deviation along.
     *
     * @returns A new MdArray containing the std dev, or if no dimension is
     *          supplied, a scalar with the value of std dev over the entire
     *          MdArray.
     */    
    std: function(dim) {
	var d = dim || 1;
	var XSq = this.copy().pow(2);
	var EXSq = XSq.mean(d);
	var muSq = (this.mean(d)).pow(2);
	return EXSq.sub(muSq).pow(0.5);
    },

    /**
     * Extend the dimensions of this array to fit the values passed in in
     * newDims. The extension happens by repeating the last value, row, column
     * or other dimension, until the MdArray is of the requested size.
     * 
     * @param newDims  The new dimensions the returned MdArray is to fill.
     *
     * @return This MdArray extended to have the requested dimensions.
     */
    extendDims: function(newDims) {
	var newMdArray = MdArray.extendDims(this, newDims);
	return newMdArray;
    },

    /**
     * Create a copy of this MdArray, and return it.
     *
     * @param A new MdArray object that is a copy of this one.
     */
    copy: function() {
	'use strict';
	var newA = Object.create(MdArray.prototype);
	newA.data = this.data.slice(0);
	newA.tSize = this.tSize;
	newA.dSize = this.dSize;
	newA.dims = this.dims.slice(0);
	newA.strides = this.strides.slice(0);
	return newA;
    }
	
};

/**
 * Extend arrayInst to meet the dimensions in nDims.
 *
 * @param arrayInst   An instance of MdArray.
 * @param nDims       An array containing the required dims after extension.
 *
 * @returns A new array that is a copy of arrayInst, but extended to satisfy the
 *          extended dimensions in nDims.
 */
MdArray.extendDims = function(arrayInst, nDims) {
    var bothDims = _us.zip(arrayInst.dims.slice(0), nDims.slice(0));
    var diffElement = _us.find(bothDims, function(val) { return val[0] !== val[1]; });
    var diffIndex = _us.indexOf(bothDims, diffElement);
    // Create a slice of arrayInst containing the last row/column or whatever
    // the different dimension is of arrayInst.
    var sliceInfo = _us.map(arrayInst.dims, function(dimVal, idx) {
	if (idx == diffIndex) {
	    return (diffElement[0] - 1).toString();
	}
	else {
	    return ":";
	}
    });
    var orgView = arrayInst.slice(sliceInfo);
    var lastData = [];
    orgView.foreach(function (x) { lastData.push(x); });
    var newArray = MdArray.zeros({shape: nDims});
    var allCoords = enumerateDims(newArray.dims);
    _us.each(allCoords, function(idx) {
	if (idx[diffIndex] < diffElement[0]) {
	    newArray.set(arrayInst.get(idx), idx);
	}
	else {
	    newArray.set(lastData[idx[1 - diffIndex]], idx);
	}
    });
    return newArray;
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
};

MdArray.createFromRows = function(rows) {
    'use strict';
    var numRows = rows.length;
    var numCols = rows[0].length;
    var d = []
    _us.each(rows, function(rowVal) {
	d.push(rowVal[0]);
	d.push(rowVal[1]);
    });
    return new MdArray({data: d, shape: [numRows, numCols]});
};
	

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
 * @public
 * @class
 * @alias ArrayView
 * @classdesc A view on an MdArray.
 */
function ArrayView(orgData, orgDims, orgStrides, sliceInfo) {
    this.data = orgData;
    this.dims = orgDims;
    this.strides = orgStrides;
    this.slices = processSlices(orgDims, sliceInfo);
    this.indices = enumerateSlices(this.slices);
    return this;
}

ArrayView.prototype = Object.create(MdArray.prototype);
_us.extend (ArrayView.prototype,
{
    constructor: ArrayView,
    /**
     * Return the required 1-d javascript array index indicated by the supplied
     * index coordinates.
     *
     * @param idx  An array containing the coordinate of the requested element.
     * @method
     */
    findIndex: function(idx) {
	'use strict';
	var myThis = this;
	if (idx[0] instanceof Array) {
	    idx = idx[0];
	}
	assert(idx.length == this.strides.length,
	       "Wrong number of arguments to index array with " + this.strides.length
	       + " dimensions.");
        var md_idx = _us.zip(idx, this.slices, this.strides);
	assert(_us.every(md_idx, function(val, idx) {
	    return (val[0] + val[1].start) < myThis.dims[idx];
	 }), "ArrayView: Index out of range.");
	
	return _us.reduce(md_idx, function(memo, val) {
	    return memo + (val[0] + val[1].start) * val[2];
	}, 0);
    },
    
    /**
     * Return a string representation of the the multi-Dimensional array.
     *
     * @returns A readable string for the array.
     * @method
     */
    toString: function() {
	var idxInfo = _us.zip(this.slices.slice(0), this.strides.slice(0));
	function ts(ss, idx, data) {
	    var s = "[";
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

    /**
     * Return a new array containing the data of the view.
     * @method
     */
    flatten: function() {
	var flattened = [];
	this.foreach(function(x) {flattened.push(x); });
	return flattened;
    },

    /**
     * Apply function f to each element in this ArrayView sequentially.
     *
     * @param f   A function to apply to each element in this.
     * @method
     */    
    foreach: function(f) {
	var indices = this.indices;
	for (var i = 0; i < indices.length; i++) {
	    f(this.data[this.findIndex(indices[i])]);
	}
    },
    
    /**
     * @alias enumerateIndices
     * Enumerate the indices of this ArrayView object.
     *
     * @return An array containing the indices for each element in this array
     *         view.
     * @method
     */    
    enumerateIndices: function() {
	return this.indices;
    },

    /**
     * Set the values in this slice from vals.
     *
     * @param vals  An array of values.
     */    
    setSlice : function(vals) {
	var sliceIndices = this.indices;
	for (var i = 0; i < vals.length; i++) {
	    this.set.apply(this, [vals[i]].concat(sliceIndices.shift()));
	}
	return;
    },

    /**
     * Assign this view's values to be the same as that's values.
     *
     * @param that   A compatible MdArray or ArrayView.
     */    
    assign: function(that) {
	var sliceIndices = this.indices;
	for (var i = 0; i < sliceIndices.length; i++) {
	    this.set(that.get(sliceIndices[i]), sliceIndices[i]);
	}
	return;
    },

    /**
     * Apply opFn to the values of this and that. If a dim is requested, then
     * apply accross that dim.
     *
     * @param that   Another array view object - or possibly an MdArray object.
     * @param opFn   A function to apply to combinations of elements from this
     *               and that.
     * @param dim    If present, indicates a dimension along with to apply the
     *               opFn.
     *
     * @return A new MdArray containing the results of applying opFn to
     *         this and that as requested.
     * @method
     */
    applyOp: function(that, opFn, dim) {
	var rowsEqual = this.dims[0] === that.dims[0];
	var colsEqual = this.dims[1] === that.dims[1];

	if (rowsEqual && colsEqual && typeof dim === 'undefined') {
	    // Apply the operation accross very element of the two views.
	    var newData = _us.map(this.indices, function(idx) {
		return opFn(this.get(idx), that.get(idx));
	    });
	    return new MdArray({data: newData, shape: this.dims});
	}       
	else {
	    var d = (dim || (rowsEqual && "rows") || (colsEqual && "cols"));
	    assert(d, "Cannot apply operation across dimensions of different size.");
	    var idcs = [];
	    if (d == "rows") {
		//var range = _us.range(this.dims[0]);
		for (var i = 0; i < this.dims[0]; i++) {
		    var rowIndices = [];
		    rowIndices = _us.filter(this.indices, function(idxVal) {
			return idxVal[0] === i;
		    });
		    idcs = idcs.concat(rowIndices);
		}
	    }
	    else { // By columns.
		//var range = _us.range(this.dims[1]);
		var colIndices = [];
		for (var i = 0; i < this.dims[1]; i++) {
		    colIndices = _us.filter(this.indices, function(idxVal) {
			return idxVal[1] === i;
		    });
		    idcs = idcs.concat(colIndices);
		}
	    }
	    console.log("idcs is: " + idcs.toString());
	    var values = [];
	    var myThis = this;
	    _us.each(idcs, function(idx) {
		values.push(opFn(myThis.get.apply(myThis, idx), that.get.apply(that, idx)));
	    });
	    if (d == "rows") {
		return new MdArray({ data: values, shape: [this.dims[0], 1]});
	    }
	    else {
		return new MdArray({ data: values, shape: [1, this.dims[0]]});
	    }
	}
    },

    /**
     * Add that to this, and return a new array containing the result.
     *
     * @param that   The array to be added to this one.
     *
     * @returns A new MdArray containing the values of that + this.
     *
     * @method
     */
    add: function(that, dim) {
	return this.applyOp(that, function(x, y) { return x+y; }, dim);
    },

    /**
     * Subtract that from this, and return a new MdArray containing the result.
     *
     * @param that   The array to be subtracted from this one.
     *
     * @returns A new MdArray containing the values of this - that.
     *
     * @method
     */
    sub: function(that, dim) {
	return this.applyOp(that, function(x, y) { return x-y; }, dim);
    },

    /**
     * @alias mul
     * Multiply this by that and return a new MdArray containing the result.
     *
     * @param that   The array to be multiplied with this one.
     *
     * @returns A new MdArray containing the values of this * that.
     *
     * @method
     */    
    mul: function(that, dim) {
	return this.applyOp(that, function(x, y) { return x*y; }, dim);
    },

    /**
     * Divide this by that and return a new MdArray containing the result.
     *
     * @param that   The array to divide this by.
     *
     * @returns A new MdArray containing the values of this / that.
     *
     * @method
     */    
    div: function(that, dim) {
	if (that instanceof MdArray)
	{
	    // FIXME: Need to fix this to work for views.
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
	return this.applyOp(that, function(x, y) { return x/y; }, dim);
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


module.exports = MdArray;

});
