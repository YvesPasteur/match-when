'use strict';

const match = require('./match').match;
const t = require('chai').assert;

describe('when multiple values can be hit', () => {
  it("doesn't hit the first one",  () => {
    t.strictEqual(match(
      pattern =>
        pattern.range(0, 43) && 42
        || pattern(42) && 72
        || pattern() && 'should never be hit'
    )(42), 42);
  });
});

describe('match', () => {
  const input = [{protocol: 'HTTP', i:10}, {protocol: 'AMQP', i:11}, {protocol: 'AMQP', i:5}, {protocol: 'WAT', i:3}];

  it('does not require a catch-all at the definition of the match', () => {
    t.doesNotThrow(() => match(
      pattern =>
        pattern({protocol:'HTTP'}) && ((o) => o.i+1)(pattern.value)
        || pattern({protocol:'HTTP'}) && ((o) => o.i+1)(pattern.value)
        || when({protocol:'AMQP'}) && ((o) => o.i+2)(pattern.value)
    ));
  });

  describe('when matching without a catch-all', function () {
    beforeEach(function () {
      this.doMatch = match(
        pattern =>
          pattern('value') && 42
          || pattern('other value') && 99
      );
    });

    it('works when a match is hit', function () {
      t.strictEqual(this.doMatch('value'), 42);
    });

    it('throws an Error when no matches are hit', function () {
      t.throws(() => {
        this.doMatch('not a value');
      });
    });
  });

  describe('match(<input>, specification)', () => {
    it('instantly performs the match, rather than returning a function', function () {
      t.strictEqual(
        match('value',
          pattern =>
            pattern('value') && 42
            || pattern() && 99
        ),
        42
      );
    });

    describe('the example in the docs', function () {
      it('works correctly', function () {
        function fact(n){
          return match(n,
            pattern =>
              pattern(0) && 1
              || pattern() && ((n) => n * fact(n-1))(pattern.value)
          );
        }

        t.deepEqual(fact(10), 3628800);
      });
    });
  });

  describe('matching', () => {
    it('matches objects based on properties', () => {
      const output = input.map(match(
        pattern =>
          pattern({protocol:'HTTP', i:12}) && (((o) => 1000)(pattern.value))
          || pattern({protocol:'HTTP'}) && (((o) => o.i+1)(pattern.value))
          || pattern({protocol:'AMQP', i:12}) && (((o) => 1001)(pattern.value))
          || pattern({protocol:'AMQP'}) && (((o) => o.i+2)(pattern.value))
          || pattern() && (((o) => 0)(pattern.value))
      ));

      t.deepEqual(output, [11, 13, 7, 0]);
    });


    it('matches arrays based on indexes and content', () => {
      const output = [['a', 'b'], ['c'], ['d', 'e', 1]].map(match(
        pattern =>
          pattern(['c']) && 1000
          || pattern(['a', 'b']) && 1001
          || pattern([]) && 1002
          || pattern(['d', 'e', 1]) && 1003
          || pattern() && (((o) => 0)(pattern.value))
      ));

      t.deepEqual(output, [1001, 1000, 1003]);
    });

    it('matches number as well', () => {
      function fact(n) {
        return match(
            pattern =>
          pattern(0) && 1
          || pattern() && (((n) => n * fact(n - 1))(pattern.value)) // pattern() === catch-all
        )(n);
      }

      t.strictEqual(fact(10),3628800);
    });

    it('matches empty array', () => {
      function length(list){
        return match(
          pattern =>
            pattern([]) && pattern.wrapper(0)
            || pattern.headTail() && (((head, tail) => 1 + length(tail))(pattern.head, pattern.tail))
        )(list);
      }

      t.strictEqual(length([1, 2, 3]), 3);
      t.strictEqual(length([{}, {}, {}, {}]), 4);
    });

    it('supports regexp match', () => {
      const output = [3, ' 2', 1, 'zEro', 90].map(match(
        pattern =>
          pattern(/1/) && 'one'
          || pattern(/2/g) && 'two'
          || pattern(/3/) && 'three'
          || pattern(/zero/i) && 'zero'
          || pattern() && pattern.value
      ));

      t.deepEqual(output, ['three', 'two', 'one', 'zero', 90]);

      const invalidEmails = ['hey.com', 'fg@plop.com', 'fg+plop@plop.com', 'wat']
        .filter(match(
        pattern =>
          pattern(/\S+@\S+\.\S+/) && pattern.wrapper(false) // **seems** to be a valid email
          || pattern() && true // the email may be invalid, return it
      ));

      t.deepEqual(invalidEmails, ['hey.com', 'wat']);
    });

    describe('when.and', () => {
      it('supports AND conditional', () => {
        const output = input.map(match(
          pattern =>
            pattern.and({protocol:'AMQP'}, {i:5}) && ((o => o.i)(pattern.value))
            || pattern.and({protocol:'HTTP'}, {i:10}) && ((o => o.i)(pattern.value))
            || pattern() && ((o => 0)(pattern.value))
        ));

        t.deepEqual(output, [10, 0, 5, 0]);
      })
    });

    describe('when.or', () => {
      it('supports OR conditional matching', () => {
        // example from https://kerflyn.wordpress.com/2011/02/14/playing-with-scalas-pattern-matching/

        function parseArgument(arg){
          return match(
            pattern =>
              pattern.or("-h", "--help") &&  (() => displayHelp)(pattern.value)
              || pattern.or("-v", "--version") && (() => displayVersion)(pattern.value)
              || pattern() && (whatever => unknownArgument.bind(null, whatever))(pattern.value)
          )(arg);
        }

        function displayHelp(){
          console.log('help.');
        }

        function displayVersion(){
          console.log('v0.0.0');
        }

        function unknownArgument(whatever){
          throw new Error(`command ${whatever} not found`);
        }

        t.strictEqual(parseArgument('-h'), displayHelp);
        t.strictEqual(parseArgument('--help'), displayHelp);
        t.strictEqual(parseArgument('-v'), displayVersion);
        t.strictEqual(parseArgument('--version'), displayVersion);
        t.throws(() => {
          parseArgument('hey')();
        });
      });
    })
  });

  describe('when.range', () => {
    const rangeStart = 0,
      rangeEnd = 5;

    beforeEach(function () {
      this.withinRange = match(
        pattern =>
          pattern.range(rangeStart, rangeEnd) && true
          || pattern() && pattern.wrapper(false)
      );
    });

    describe('given a value within the range', function () {
      it('matches', function () {
        t.isTrue(this.withinRange(rangeStart+1));
      });
    });

    describe('given a value at the lower bound', function () {
      it('matches', function () {
        t.isTrue(this.withinRange(rangeStart));
      });
    });

    describe('given a value at the upper bound', function () {
      it('matches', function () {
        t.isTrue(this.withinRange(rangeEnd));
      });
    });

    describe('given a value above the upper bound', function () {
      it('does not match', function () {
        t.isFalse(this.withinRange(rangeEnd+1));
      });
    });

    describe('given a value below the lower bound', function () {
      it('does not match', function () {
        t.isFalse(this.withinRange(rangeStart-1));
      });
    });

    describe('the example in the docs', function () {
      it('works correctly', function () {
        var result = [12, 42, 99, 101].map(match(
          pattern =>
            pattern.range(0, 41) && '< answer'
            || pattern.range(43, 100) && '> answer'
            || pattern(42) && 'answer'
            || pattern() && '< 0, or > 100'
        ));

        var expected = ['< answer', 'answer', '> answer', '< 0, or > 100']

        t.deepEqual(result, expected);
      });
    });

  });

  describe('yielding', () => {
    it('yields primitive values', () => {
      const output = input.map(match(
        pattern =>
          pattern({protocol:'HTTP'}) && 1
          || pattern({protocol:'AMQP'}) && 2
          || pattern() && 0
      ));

      t.deepEqual(output, [1, 2, 2, 0]);
    });
  });
});
