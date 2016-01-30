# MdArray [![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/)

# MdArray

A Multi Dimensional array implementation for javascript.

## Features ##
* Elementwise operations, eg. X.mul(Y);
* Dot product, eg. X.dot(Y);
* Operations across dimensions, eg. X.std(1) for std deviation of columns
* Assignment to slices - eg. X.slice(["1:", "0"]).assign(val);

## Getting Started
Install the module with: `npm install MdArray`

```javascript
var MdArray = require('MdArray');
var a = MdArray([0, 1, 2, 3], 2, 2); // Create 2 X 2 array.
```

## Documentation

See: [MdArray jsdoc](https://cdn.rawgit.com/MichaelJWebster/MdArray/master/doc/index.html)

## Examples

Coming soon.

## Performance

The performance is probably pretty poor at present. For example, iterating 1000 times
with a few 500 X 3 array multiplications takes a few seconds.

The library has not been written with any mind to performance just yet. There are
a number of fixes I have in mind to improve performance.

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
0.1.3   First publish to npm.

## License
Copyright (c) 2016 Michael Webster  
Licensed under the MIT license.


