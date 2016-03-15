'use strict';

const match = require('./match').match;
const t = require('chai').assert;

describe('when multiple values can be hit', () => {
  it("doesn't hit the first one",  () => {
    t.strictEqual(match(
      p => p.with
        || p.range(0, 43) && 42
        || p(42) && 72
        || p() && 'should never be hit'
    )(42), 42);
  });
});

describe('match', () => {
  const input = [{protocol: 'HTTP', i:10}, {protocol: 'AMQP', i:11}, {protocol: 'AMQP', i:5}, {protocol: 'WAT', i:3}];

  it('does not require a catch-all at the definition of the match', () => {
    t.doesNotThrow(() => match(
      p => p.with
        || p({protocol:'HTTP'}) && ((o) => o.i+1)
        || p({protocol:'HTTP'}) && ((o) => o.i+1)
        || p({protocol:'AMQP'}) && ((o) => o.i+2)
    ));
  });

  describe('when matching without a catch-all', function () {
    beforeEach(function () {
      this.doMatch = match(
        p => p.with
          || p('value') && 42
          || p('other value') && 99
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
          p => p.with
            || p('value') && 42
            || p() && 99
        ),
        42
      );
    });

    describe('the example in the docs', function () {
      it('works correctly', function () {
        function fact(n){
          return match(n,
            p => p.with
              || p(0) && 1
              || p() && ((n) => n * fact(n-1))
          );
        }

        t.deepEqual(fact(10), 3628800);
      });
    });
  });

  describe('matching', () => {
    it('matches objects based on properties', () => {
      const output = input.map(match(
        p => p.with
          || p({protocol:'HTTP', i:12}) && ((o) => 1000)
          || p({protocol:'HTTP'}) && ((o) => o.i+1)
          || p({protocol:'AMQP', i:12}) && ((o) => 1001)
          || p({protocol:'AMQP'}) && ((o) => o.i+2)
          || p() && ((o) => 0)
      ));

      t.deepEqual(output, [11, 13, 7, 0]);
    });


    it('matches arrays based on indexes and content', () => {
      const output = [['a', 'b'], ['c'], ['d', 'e', 1]].map(match(
        p => p.with
          || p(['c']) && 1000
          || p(['a', 'b']) && 1001
          || p([]) && 1002
          || p(['d', 'e', 1]) && 1003
          || p() && ((o) => 0)
      ));

      t.deepEqual(output, [1001, 1000, 1003]);
    });

    it('matches number as well', () => {
      function fact(n) {
        return match(
          p => p.with
            || p(0) && 1
            || p() && ((n) => n * fact(n - 1)) // p() === catch-all
        )(n);
      }

      t.strictEqual(fact(10),3628800);
    });

    it('matches empty array', () => {
      function length(list){
        return match(
          p => p.with
            || p([]) && (o => 0)
            || p(p.head, p.tail) && ((head, tail) => 1 + length(tail))
        )(list);
      }

      t.strictEqual(length([1, 2, 3]), 3);
      t.strictEqual(length([{}, {}, {}, {}]), 4);
    });

    it('supports regexp match', () => {
      const output = [3, ' 2', 1, 'zEro', 90].map(match(
        p => p.with
          || p(/1/) && 'one'
          || p(/2/g) && 'two'
          || p(/3/) && 'three'
          || p(/zero/i) && 'zero'
          || p() && p.value
      ));

      t.deepEqual(output, ['three', 'two', 'one', 'zero', 90]);

      const invalidEmails = ['hey.com', 'fg@plop.com', 'fg+plop@plop.com', 'wat']
        .filter(match(
          p => p.with
            || p(/\S+@\S+\.\S+/) && (o => false) // **seems** to be a valid email
            || p() && true // the email may be invalid, return it
      ));

      t.deepEqual(invalidEmails, ['hey.com', 'wat']);
    });

    describe('when.and', () => {
      it('supports AND conditional', () => {
        const output = input.map(match(
          p => p.with
            || p.and({protocol:'AMQP'}, {i:5}) && (o => o.i)
            || p.and({protocol:'HTTP'}, {i:10}) && (o => o.i)
            || p() && (o => 0)
        ));

        t.deepEqual(output, [10, 0, 5, 0]);
      })
    });

    describe('when.or', () => {
      it('supports OR conditional matching', () => {
        // example from https://kerflyn.wordpress.com/2011/02/14/playing-with-scalas-pattern-matching/

        function parseArgument(arg){
          return match(
            p => p.with
              || p.or("-h", "--help") &&  (() => displayHelp)
              || p.or("-v", "--version") && (() => displayVersion)
              || p() && (whatever => unknownArgument.bind(null, whatever))
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
        p => p.with
          || p.range(rangeStart, rangeEnd) && true
          || p() && (o => false)
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
          p => p.with
            || p.range(0, 41) && '< answer'
            || p.range(43, 100) && '> answer'
            || p(42) && 'answer'
            || p() && '< 0, or > 100'
        ));

        var expected = ['< answer', 'answer', '> answer', '< 0, or > 100']

        t.deepEqual(result, expected);
      });
    });

  });

  describe('yielding', () => {
    it('yields primitive values', () => {
      const output = input.map(match(
        p => p.with
          || p({protocol:'HTTP'}) && 1
          || p({protocol:'AMQP'}) && 2
          || p() && 0
      ));

      t.deepEqual(output, [1, 2, 2, 0]);
    });
  });
});
