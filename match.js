'use strict';

function MissingCatchAllPattern() {
  Error.call(this, 'Missing when() catch-all pattern as last match argument, add [when()]: void 0');
  if (!('stack' in this)){
    this.stack = (new Error()).stack;
  }
}

MissingCatchAllPattern.prototype = Object.create(Error.prototype);

/**
 * Take one argument (function) or two (value to match and function)
 * @returns {*}
 */
function match(/* args... */) {
  const args = Array.from(arguments);

  if (args.length > 1) {
    return immediateMatch(args[1], args[0]);
  }
  return postponeMatch(args[0]);
}

/**
 *
 * @param {Function} lambda
 * @returns {Function} unapplied match
 */
function postponeMatch(lambda) {
  const f = value => {
    const res = lambda(patternizor(value));

    if (res === false) {
      throw new MissingCatchAllPattern();
    }

    if (typeof res === 'function') {
      return res(value);
    }

    return res;
  };

  return f;
}

/**
 *
 * @param {Function} lambda
 * @param mied value Value to applied to the match
 * @returns {*}
 */
function immediateMatch(lambda, value) {
  return postponeMatch(lambda)(value);
}

/**
 * the patternizor function will return a pattern object and keep the value to match in its
 * scope
 *
 *
 * @param {mixed} value Value to match
 * @returns {pattern}
 */
function patternizor(value) {
  /**
   *
   * @param mixed against undefined to match everything, elsewhere value to match against
   * @returns {boolean} Simple matching result
   */
  function pattern(against) {
    return against === undefined || _matching(against, value);
  };

  /**
   * @param start
   * @param end
   * @returns {boolean}
   */
  pattern.range = function(start, end) {
    return start <= value && value <= end;
  };

  /**
   * Define a head and a tail attributes to the pattern object if the value matches
   *
   * @returns {boolean} True if the value to match is an array with at least one element
   */
  pattern.headTail = function() {
    if(!Array.isArray(value)){
      return false;
    }

    if (value.length === 0) {
      return false;
    }
    pattern.head = value[0];
    pattern.tail = value.slice(1);

    return true;
  };

  /**
   *@returns {*} True if the value matches all the arguments given to the and function
   */
  pattern.and = function(/* args... */) {
    const args = Array.from(arguments);

    return args.every((arg) => _matching(arg, value));
  };

  /**
   * @returns {*} True if the value matches at least one of the arguments given to the or function
   */
  pattern.or = function(/* args... */) {
    const args = Array.from(arguments);

    return args.some((arg) => _matching(arg, value));
  };

  /**
   * @type {mixed} Store and expose the value to be used in the right member of the pattern
   * matching
   */
  pattern.value = value;

  /**
   * Syntactic sugar to have the || in front of all the patterns (even the first)
   * @type {boolean}
   */
  pattern.with = false;

  return pattern;
}

/**
 * Simple matching of the two arguments
 *
 * @param props
 * @param input
 * @returns {*}
 * @private
 */
function _matching(props, input){
  // implement array matching
  if(Array.isArray(input)){
    // @todo yes this is a quick and dirty way, optimize this
    return JSON.stringify(props) === JSON.stringify(input);
  }

  if(props instanceof RegExp){
    return props.test(input);
  }

  if(typeof input === 'object'){
    for(let prop in props){
      if(input[prop] !== props[prop]){
        return false;
      }
    }
    return true;
  }

  return props === input;
}

module.exports = {
  match
};
