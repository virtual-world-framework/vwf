// This is my proto library but without changing Object.prototype
// Then only sub-objects of Pattern have the special properties.
var Pattern = module.exports = Object.create(Object.prototype, {

  // Implement extend for easy prototypal inheritance
  extend: {value: function extend(obj) {
    if (obj === undefined) return Object.create(this);
    obj.__proto__ = this;
    Object.freeze(obj); // Lock the prototype to enforce no changes
    return obj;
  }},

  // Implement new for easy self-initializing objects
  new: {value: function new_() {
    var obj = Object.create(this);
    if (typeof obj.initialize !== 'function') return obj;

    obj.initialize.apply(obj, arguments);
    Object.seal(obj); // Lock the object down so the fields are static
    return obj;
  }}

});
//
//
// var Rectangle = Pattern.extend({
//   initialize: function initialize(width, height) {
//     this.width = width;
//     this.height = height;
//   },
//   get area() {
//     return this.width * this.height;
//   }
// });
//
// var rect = Rectangle.new(10,20);
// console.dir(rect);
// console.dir(rect instanceof Rectangle.initialize);
// console.dir(Rectangle.isPrototypeOf(rect));
// console.log(rect.area);
//
// var MagicRectangle = Rectangle.extend({
//   get area() {
//     return this.width * this.height * 100;
//   }
// });
//
// var rect2 = MagicRectangle.new(10,20);
// console.dir(rect2);
// console.dir(rect2 instanceof MagicRectangle.initialize);
// console.dir(MagicRectangle.isPrototypeOf(rect2));
// console.log(rect2.area);
