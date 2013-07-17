# utile [![Build Status](https://secure.travis-ci.org/flatiron/utile.png)](http://travis-ci.org/flatiron/utile)

A drop-in replacement for `util` with some additional advantageous functions

## Motivation
Javascript is definitely a "batteries not included language" when compared to languages like Ruby or Python. Node.js has a simple utility library which exposes some basic (but important) functionality:

``` 
$ node
> var util = require('util');
> util.
(...)

util.debug                 util.error                 util.exec                  util.inherits              util.inspect
util.log                   util.p                     util.print                 util.pump                  util.puts
```

When one considers their own utility library, why ever bother requiring `util` again? That is the approach taken by this module. To compare:

```
$ node
> var utile = require('./lib')
> utile.
(...)

utile.async                 utile.capitalize            utile.clone                 utile.cpr                   utile.createPath            utile.debug
utile.each                  utile.error                 utile.exec                  utile.file                  utile.filter                utile.find
utile.inherits              utile.log                   utile.mixin                 utile.mkdirp                utile.p                     utile.path
utile.print                 utile.pump                  utile.puts                  utile.randomString          utile.rimraf
```

As you can see all of the original methods from `util` are there, but there are several new methods specific to `utile`. A note about implementation: _no node.js native modules are modified by utile, it simply copies those methods._

**Remark:** The `util.inspect` method is not exposed in `utile` [until this issue is resolved](https://github.com/joyent/node/issues/2225).

## Methods
The `utile` modules exposes some simple utility methods:

* `.each(obj, iterator)`: Iterate over the keys of an object.
* `.mixin(target [source0, source1, ...])`: Copies enumerable properties from `source0 ... sourceN` onto `target` and returns the resulting object.
* `.clone(obj)`: Shallow clones the specified object.
* `.capitalize(str)`: Capitalizes the specified `str`.
* `.randomString(length)`: randomString returns a pseudo-random ASCII string (subset) the return value is a string of length ⌈bits/6⌉ of characters from the base64 alphabet.
* `.filter(obj, test)`: return an object with the properties that `test` returns true on.

## Packaged Dependencies 
In addition to the methods that are built-in, utile includes a number of commonly used dependencies to reduce the number of includes in your package.json. These modules _are not eagerly loaded to be respectful of startup time,_ but instead are lazy-loaded getters on the `utile` object

* `.async`: [Async utilities for node and the browser][0]
* `.mkdirp`: [Recursively mkdir, like mkdir -p, but in node.js][1]
* `.rimraf`: [A rm -rf util for nodejs][2]
* `.cpr`: [Asynchronous recursive file copying with Node.js][3]

## Installation

### Installing npm (node package manager)
```
  curl http://npmjs.org/install.sh | sh
```

### Installing utile
```
  [sudo] npm install utile
```

## Tests
All tests are written with [vows][4] and should be run with [npm][5]:

``` bash
  $ npm test
```

#### Author: [Nodejitsu Inc.](http://www.nodejitsu.com)
#### Contributors: [Charlie Robbins](http://github.com/indexzero), [Dominic Tarr](http://github.com/dominictarr)
#### License: MIT

[0]: https://github.com/caolan/async
[1]: https://github.com/substack/node-mkdirp
[2]: https://github.com/isaacs/rimraf
[3]: https://github.com/avianflu/ncp
[4]: https://vowsjs.org
[5]: https://npmjs.org
