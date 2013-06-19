# Pattern Objects

This is a new take on "classes" and object inheritance for ECMA5.  JavaScript has traditionally used special functions called constructors that had a special `prototype` property on them and used that to simulate classical inheritance. This works well for many people, but I long for something simpler and with less indirection.

> "The classical object model is by far the most popular today, but I think that the prototypal object model is more capable and offers more expressive power." - Douglas Crockford <http://javascript.crockford.com/prototypal.html>

Inspired by quotes like these and seeing the new power we have in ECMA5 I set out to implement a simple, but robust prototypal object system for my personal use.

Forget all you know about the distinction between classes and instances and enter the realm of prototypes.

## Pattern - The base for everything

To install simply do `npm install pattern`.

The first module you will need to learn is called `pattern.js`.  It implements the base prototype `Pattern`.  This prototype has two functions on it.  They are `new` and `extend`.

    var Pattern = require('pattern');

### Pattern.extend() - Creating more specific patterns

The great thing about inheritance in object-oriented programming is you can specify behavior generally and later add more specific features.  While I don't recommend deep prototypes trees, this is good for a shallow listing of patterns that all inherit the base `new()` and `extend()` functions.  Also it's great for a plugin pattern in larger projects where a plugin is merely an extension of the base prototype.  Thus you don't actually modify the original prototype and break it for other uses.

If a object is passed in, it's prototype is set to this object and the new object is automatically frozen, making it immutable.  This prevents you from accidentally changing the prototype later on or calling initialize directly on the prototype.  A prototype is a template, something to be copied, not something to change.

If you do want more flexibility, simple call `extend()` without any arguments.  It will return a new object that inherits from itself that it still mutable.  You can modify at will and freeze it later if you wish.

    // Create a Rectangle pattern that has a simple initializer and an `area` getter.
    var Rectangle = Pattern.extend({
      initialize: function initialize(width, height) {
        this.width = width;
        this.height = height;
      },
      get area() {
        return this.width * this.height;
      }
    });

### Pattern.new() - Creating new objects from a pattern

This function is much like the `new` operator in JavaScript.  It creates a new object that inherits from the pattern, but has it's own local state.  Also `new()` will call the pattern's `initialize()` function if it has one passing on any arguments that were given to `new()`.  If `initialize()` was called, the new object it sealed to prevent accidental adding or removing of properties later on in code.  This prevents a large class of errors and allows runtimes like V8 to optimize the structure of the generated objects and run much faster.

The `new()` function is available on any pattern that inherits from the base `Pattern`.  This is can be used on things like `Queue` and `Hash`

    // Create an object based on the Rectangle pattern from above.
    var rect = Rectangle.new(3, 5);

## Hash - Iterable Objects

Often in JavaScript you want an object that stores arbitrary keys to values and you want to be able to iterate over this.  ECMA5 added some nice functions to `Array` instances like `forEach()` and `map()`, but left these off of `Object` instances.  Since you don't want to change the `Object.prototype` directly, this `Hash` pattern is a great drop in replacement for plain objects that you treat as data containers.

    var Hash = require('pattern/hash');

### Hash.new() - Create a new hash

Hash overrides the `new()` function from `Pattern` to create objects more efficiently.  This is so that it can be used in hot loops in your program with minimal overhead.  If no arguments are passed in, then a new object that inherits from `Hash` is created.  If you pass in an object, it's prototype is set to `Hash`.  `Hash` objects are not sealed upon creation since their purpose is to store new keys and values.

    var data = Hash.new();
    data.foo = true;
    data.bar = false;
    var person = Hash.new({name: "Tim", age: 28});

### Hash.forEach() - Loop over keys and values of a hash

The `forEach()` function has the same semantics as the built-in `Array.prototype.forEach`  This means that it takes a callback and a this pointer to be used in the loop.  The callback is given the value, the key, and the entire hash object.

    data.forEach(function (value, key) {
      console.log("%s = %s", key, value);
    });

### Hash.map() - Loop and generate an array

This works just like `Array.prototype.map`.  It build an array from the return values of the calls to the callback.  The rest of the api is the same as `forEach()`.

    var url = person.map(function (value, key) {
      return escape(key) + "=" + escape(value);
    }).join("&");

## Queue - Fast work queues

When you're writing a node server often you need to queue items so that they run in order later on.  Hopefully your queues don't get very large, but sometimes they just do. For this case you'll soon find out that JavaScript's built in `Array.prototype.shift` function is terribly slow for large arrays.

This Pattern is a simple queue that uses some internal tricks to make `push()` and `shift()` calls fast at any size.

    var Queue = require('pattern/queue');

### Queue.new() - Make a new Queue

The initializer takes optionally any number of arguments and the queue will be pre-populated with their values.

    var toDo = Queue.new("Wake Up", "Eat Breakfast", "Write Code", "Sleep");
    var callbacks = Queue.new();

### Queue.push() - Add an item to the queue

To add an item to the queue, you simple call it's `push()` function and your item will be added.

    toDo.push("Play with kiddos");

### Queue.shift() - Grab the first item off the queue

This function will grab the first/oldest item off the queue.  If there is nothing left, this will return `undefined`

    var nextTask = toDo.shift();

### Queue.length - Special length property

This is a special length property that calculates and gives the current length of the items left in the queue.  It's somewhat expensive and it's better to shift till you get undefined if possible (for performance reasons).

    console.log("I have %s tasks left", toDo.length);
