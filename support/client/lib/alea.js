// From http://baagoe.com/en/RandomMusings/javascript/
function Alea() {
  return (function(args) {
    // Johannes Baagøe <baagoe@baagoe.com>, 2010
    var state = {
      s0: 0,
      s1: 0,
      s2: 0,
      c: 1
    };

    if (args.length == 0) {
      args = [+new Date];
    }
    var mash = Mash();
    state.s0 = mash(' ');
    state.s1 = mash(' ');
    state.s2 = mash(' ');

    for (var i = 0; i < args.length; i++) {
      state.s0 -= mash(args[i]);
      if (state.s0 < 0) {
        state.s0 += 1;
      }
      state.s1 -= mash(args[i]);
      if (state.s1 < 0) {
        state.s1 += 1;
      }
      state.s2 -= mash(args[i]);
      if (state.s2 < 0) {
        state.s2 += 1;
      }
    }
    mash = null;

    var random = function() {
      var t = 2091639 * state.s0 + state.c * 2.3283064365386963e-10; // 2^-32
      state.s0 = state.s1;
      state.s1 = state.s2;
      return state.s2 = t - (state.c = t | 0);
    };
    random.uint32 = function() {
      return random() * 0x100000000; // 2^32
    };
    random.fract53 = function() {
      return random() + 
        (random() * 0x200000 | 0) * 1.1102230246251565e-16; // 2^-53
    };
    random.version = 'Alea 0.9';
    random.args = args;
    random.state = state;
    return random;

  } (Array.prototype.slice.call(arguments)));
};
