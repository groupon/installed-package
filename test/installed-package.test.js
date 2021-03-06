'use strict';

const childProcess = require('child_process');

const assert = require('assertive');

const installPackage = require('../');

describe('installPackage', function() {
  it('is a function', function() {
    assert.hasType(Function, installPackage);
  });

  describe('self-test', function() {
    if (!process.env.CI) {
      it('is skipped because it is not running with CI=1', function() {
        this.skip();
      });
      return;
    }
    if (!childProcess.execFileSync) {
      it('childProcess.execFileSync is required for this feature', function() {
        this.skip();
      });
      return;
    }

    let installed;
    before(function() {
      installed = installPackage();
    });

    it('installs a separate copy', function() {
      assert.notEqual(installed, installPackage);
    });

    it('can *not* require example files', function() {
      const err = assert.throws(function() {
        installPackage('examples/canary');
      });
      assert.equal('MODULE_NOT_FOUND', err.code);
    });
  });

  describe('self-test with forced non-install', function() {
    let installed;
    before(function() {
      installed = installPackage(undefined, false);
    });

    it('just uses the normal installed version', function() {
      assert.equal(installed(), installPackage);
    });

    it('can require example files', function() {
      assert.equal('This will not be shipped', installed('examples/canary'));
    });
  });
});
