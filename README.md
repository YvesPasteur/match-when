### match-when - Pattern matching for modern JavaScript 

This code is a fork of the FGRibreau's work (https://github.com/FGRibreau/match-when)
The main objective is to have some fun with ECMAScript6 (and to discover it).
  
I like this FGRibreau's idea and I try to give it some of my tastes on the interface and
implementation.
For the interface I'm not a big fan of the imbricated objects / array.
In the implementation, I don't find all the serialization/deserialization stuff
and the increment variable very sexy.

My idea is to use the conditional conditions (|| and &&) and to take benefit of the lazy
execution.

#### Usage

The setup is pretty simple, simply require the library with `match` and you are ready to go!

```js
const match = require('match-when').match;
```

or globally

```js
require('match-when/register'); // `match` is now globally available
```

Now let's see how we would write a factorial function:

```js
const fact = match(
  p => p.with
    || p(0) && 1
    || p() && ((n) => n * fact(n-1))
);

fact(10); // 3628800
```

Clear and simple right?

Alternatively, `match(<input>, patternSpecification)` can be used to instantly perform a match:

```js
function fact(n){
  return match(n,
    p => p.with
      || p(0) && 1
      || p() && ((n) => n * fact(n-1))
  );
}

fact(10); // 3628800
```

Note that `p()` is a catch-all pattern and, if used, should always be the last condition. If you forget it `match()` will throw a `MissingCatchAllPattern` exception if nothing was matched.

##### Setup

```
todo
```

##### High Order Functions

`match` works well with high order functions like `map`, `filter` (and so on) too:

```js
[2, 4, 1, 2].map(match(
  p => p.with
    || p(1) && "one"
    || p(2) && "two"
    || p() && "many"
));

// [ 'two', 'many', 'one', 'two' ]
```

##### Arrays


It also works with **arrays**:

```js
function length(list){
  return match(
    p => p.with
      || p([]) && (() => 0)
      || p(p.head, p.tail) && ((head, tail) => 1 + length(tail))
  )(list);
}

length([1, 1, 1]); // 3
```

Note: because we use conditional operators, the right member of a matching line can not return
a value which can be evaluated to false (false, 0, ...). So the use of a function is a workaround.

##### OR

Sadly JavaScript does not offer us a way to overload operators so we're stuck with `p.or`:

```js
function parseArgument(arg){
  return match(
      p => p.with
        || p.or("-h", "--help") &&  (() => displayHelp)
        || p.or("-v", "--version") && (() => displayVersion)
        || p() && (whatever => unknownArgument.bind(null, whatever))
    )(arg);
}

parseArgument(process.argv.slice(1)); // displayHelp || displayVersion || (binded)unknownArgument
```

##### AND

```js
const output = input.map(match(
  p => p.with
    || p.and({protocol:'AMQP'}, {i:5}) && (o => o.i)
    || p.and({protocol:'HTTP'}, {i:10}) && (o => o.i)
    || p() && (o => 0)
));
```

##### Regular Expressions

match-when supports [regular expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp) as well:

```js
['hey.com', 'fg@plop.com', 'fg+plop@plop.com', 'wat']
  .filter(match(
    p => p.with
      || p(/\S+@\S+\.\S+/) && (o => false) // **seems** to be a valid email
      || p() && true // the email may be invalid, return it
  ));

// ['hey.com', 'wat']
```

##### Range

```js
[12, 42, 99, 101].map(match(
  p => p.with
    || p.range(0, 41) && '< answer'
    || p.range(43, 100) && '> answer'
    || p(42) && 'answer'
    || p() && '< 0, or > 100'
));

// ['< answer', 'answer', '> answer', '< 0, or > 100']
```

### Supported patterns:


- `{ x1: pattern1, ..., xn: patternn }` - matches any object with property names `x1` to `xn` matching patterns `pattern1` to `patternn`, respectively. Only the own properties of the pattern are used.
- `[pattern0, ..., patternn]` - matches any object with property names 0 to n matching patterns `pattern0` to `patternn`, respectively.
- `/pattern/flags` - matches any values than pass the regular expression test
- `p.range(low, high)` matches any number value in the range [low, high], `low` and `high` included.
- `p.or(pattern0, ..., patternn)` - matches if at [least one](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some) `pattern` matches.
- `p.and(pattern0, ..., patternn)` - matches if [every](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every) `pattern` matches.

### Todo:

- discover an alternative to the && separator that I don't like very much (not very expressive)


## iAdvize

<p align="center">
<a target="_blank" href="https://vimeo.com/121470910"><img style="width:100%" src="https://i.vimeocdn.com/video/509763980.png?mw=638&mh=1080&q=70"></a>
</p>

I work at [iAdvize](http://iadvize.com). iAdvize is the **leading real-time customer engagement platform in Europe** and is used in 40 different countries. We are one of the french startup with the [fastest growth](http://www.iadvize.com/fr/wp-content/uploads/sites/2/2014/11/CP-Fast-50.pdf) and one of [the **greatest place to work** in **France**](https://vimeo.com/122438055).

We are looking for a [**NodeJS backend developer**](http://smrtr.io/FqP79g), a [Scala backend developer](http://smrtr.io/FqP79g), a [**JavaScript frontend developer**](http://smrtr.io/wR-y4Q), a [Full-stack Developer](http://smrtr.io/SGhrew) and a [DevOps System Engineer](http://smrtr.io/OIFFMQ) in Paris or Nantes. **[Send a tweet to FGRibreau](https://twitter.com/FGRibreau) if you have any questions**!

## [The Story](http://blog.fgribreau.com/2015/12/match-when-pattern-matching-for-modern.html)

## [Changelog](/CHANGELOG.md)
