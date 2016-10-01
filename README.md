# Node Integrated Unit-Tests

 The test suite framework you wouldn't like.
 Niut is a small framework for unit test on node environment.
 He's based on the idea less is more. 
 It's big advantage been it's really small size.

## Usage

 Niut is a simple library which hold in a single script page. You can also
 download it from npm, this library doesn't have any dependencies.

    npm install niut

## Test suite

my-suite.js
```js
var niut = niut || require ('niut'),
    suite = niut.newSuite('My Test Suite');

(function () {

  suite.test('Mon Test', function (assert, done) {

    assert.isTrue(true);
    done();
  });

})();

if (typeof module !== 'undefined' && module.exports) {// Node.js
  module.exports = Validator;

  if (require.main === module) {
    niut.runner(suites, function(echec) {
      if (echec) throw new Error('CheckMate...');
    });
  }
}
```

runner.js
```js
var suites = {
  './my-suite.js',
  require('./my-second-suite.js')
};

require('niut').runner(suites, function(echec) {
  if (echec) throw new Error('CheckMate...');
});
```
