'use strict';

require('./');
const t = require('chai').assert;

describe('match', () => {
  it('should expose match and when globally', () => {
    t.strictEqual(match, require('../').match);
  })
})
