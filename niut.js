
var niut = (function () {

  var ExecutionTrap = function (method, onError) {
    if (typeof window !== 'undefined') {
      window.onerror = function (msg, file, line) {
        onError({
          message: msg,
          file: file,
          line: line
        });
      };
      method.call(window);
    } else {
      var d = require('domain').create();
      // console.warn ('SETUP TRAP');
      ExecutionTrap.domain = d;
      d.on('error', onError);
      d.run(method);
    }
  };

  var DisableTrap = function () {
    if (typeof window !== 'undefined') {
      window.onerror = null;
    } else {
      // console.warn ('CLEAR TRAP');
      ExecutionTrap.domain.exit();
      ExecutionTrap.domain = null;
    }
  };

  var Assert = (function () {

    var Assert = function (name) {

      var data = {
        testName: name,
        testCount: 0,
        messages: [],
      };

      Object.defineProperty(this, '__statistics', {
        enumerable: false,
        value: function () { return data; }
      });
    };

    Assert.prototype.display = function(prefix) {
      prefix = prefix || '';
      var msgs = this.__statistics().messages;
      for (var i = 0; i < msgs.length; ++i) {
        console.warn(prefix + msgs[i]);
      }
    };

    Assert.prototype.haveFailed = function() {
      return this.__statistics().messages.length !== 0;
    };

    Assert.prototype.fails = function(msg) {
      msg = msg || 'Assertion: ' + this.__statistics().testName;
      // console.error (msg);
      this.__statistics().messages.push(msg);
    }

    Assert.prototype.isTrue = function(expr, msg) {
      msg = msg || 'Expects true, got "' + expr + '".';
      this.__statistics().testCount++;
      if (!expr) {
        this.fails(msg);
      }
    };

    Assert.prototype.isFalse = function(expr, msg) {
      msg = msg || 'Expects false, got "' + expr + '".';
      this.isTrue(!expr, msg);
    };

    Assert.prototype.isEquals = function(a, b, msg) {
      msg = msg || 'Expects "' + a + '" === "' + b + '".';
      this.isTrue(a === b, msg);
    };

    Assert.prototype.isNull = function(obj, msg) {
      msg = msg || 'Expects null, got "' + obj + '".';
      this.isTrue(obj === null, msg);
    };

    Assert.prototype.isNotNull = function(obj, msg) {
      msg = msg || 'Expects not null, got "' + obj + '".';
      this.isTrue(obj !== null && obj !== undefined, msg);
    };

    Assert.prototype.willThrow = function(callback, msg) {
      msg = msg || 'Expects throw but didn\'t.';
      this.__statistics().testCount++;
      try {
        callback();
        this.fails(msg);
      } catch (e) {
      }
    };

    return Assert;
  })();

  var TestSuite = (function () {

    var TestSuite = function (name) {
      this.name = name;
      this.tests = [];
    };

    TestSuite.prototype.test = function (name, callback) 
    {
      this.tests.push ({
        name: name,
        method: callback,
      });
    };


    TestSuite.prototype.startTest = function (name, method, callback)
    {
      var handled = false;
      var assert = new Assert(name);
      var runTest = function () {
        method(assert, function () {
          handled = true;
          DisableTrap();
          if (assert.haveFailed()) {
            callback('FAILED', assert);
          } else {
            callback('SUCCESS');
          }
        });
      }
      ExecutionTrap (runTest, function (err) {
        if (handled) {
          throw err;
        }
        handled = true;
        // console.error ('TRAPED', name, err);
        DisableTrap();
        callback('ERROR', err);
      });
    };

    TestSuite.prototype.start = function (callback) 
    {
      callback = callback || function () {};
      var log = {
        ERROR: '[\033[91mErr.\033[0m]  ',
        FAILED: '[\033[93mFail\033[0m]  ',
        SUCCESS: '[\033[92m Ok \033[0m]  ',
      }
      var result = {
        ERROR: 0,
        FAILED: 0,
        SUCCESS: 0,
        TOTAL: 0,
      }
      var self = this;
      var idx = 0;
      var next = function () {
        var test = self.tests[idx++];
        if (test == null) {
          console.log ('');
          result.ECHEC = (result.SUCCESS !== result.TOTAL);
          return callback(result);
        }
        self.startTest(test.name, test.method, function (status, err) {
          result.TOTAL++;
          result[status]++;
          console.log ('  - ' + log[status] + test.name);
          if (status === 'FAILED') {
            err.display('      ');
          } else if (status === 'ERROR') {
            console.log ('      ', err);
          }
          next();
        });
      };

      if (this.name) {
        console.log ('TestSuite: ' + this.name);
      }
      next();
    };

    return TestSuite;
  })();

  var niut = {} ; // new TestSuite();

  niut.runner = function (suites, callback) {
    var idx = 0;
    var echec = false;
    var launchNextSuite = function () {
      var mod = suites[idx++];
      if (mod == null) {
        return callback(echec);
      } else if (typeof mod === 'string') {
        mod = require(mod);
      }
      mod.start(function (res) {
        echec = res.ECHEC || echec;
        launchNextSuite();
      });
    };
    launchNextSuite();
  };

  niut.newSuite = function (name) {
    return new TestSuite(name);
  };

  niut.Assert = Assert;

  return niut;
})();

if (typeof module !== 'undefined' && module.exports) {// Node.js
  module.exports = niut;
}
