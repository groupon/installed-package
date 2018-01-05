/*
 * Copyright (c) 2016, Groupon
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * Redistributions of source code must retain the above copyright notice,
 * this list of conditions and the following disclaimer.
 *
 * Redistributions in binary form must reproduce the above copyright
 * notice, this list of conditions and the following disclaimer in the
 * documentation and/or other materials provided with the distribution.
 *
 * Neither the name of GROUPON nor the names of its contributors may be
 * used to endorse or promote products derived from this software without
 * specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 * IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
 * TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
 * PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 * TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/* eslint-disable import/no-dynamic-require, global-require */

'use strict';

const childProcess = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Prevent multiple installs caused by different test files.
function once(fn) {
  const cache = {};
  return function fnOnce(arg) {
    if (!(arg in cache)) cache[arg] = fn(arg);
    return cache[arg];
  };
}

const installOnce = once(function install(original) {
  if (!childProcess.execFileSync) {
    /* eslint-disable no-console */
    console.warn('installed-package requires execFileSync (node >=4) to work.');
    /* eslint-enable no-console */
    return original;
  }
  // Make sure we don't overwrite other package.json files etc.
  const originalHash = crypto
    .createHash('sha1')
    .update(original)
    .digest('hex');
  const baseDir = path.join(os.tmpdir(), originalHash);

  // Start with a clean slate
  childProcess.execFileSync('rm', ['-rf', baseDir]);
  fs.mkdirSync(baseDir);

  // Force npm to treat this as a project directory and ignore parent directories.
  fs.writeFileSync(
    path.join(baseDir, 'package.json'),
    JSON.stringify({
      // Prevent npm warnings...
      name: 'installed-package-fake-project',
      version: '0.0.0',
      description: 'No description',
      repository: {},
      license: 'UNLICENSED',
    })
  );
  // Prevent even more npm warnings...
  fs.writeFileSync(path.join(baseDir, 'README'), 'None');

  const pkgJson = require(path.join(original, 'package.json'));
  const location = path.join(baseDir, 'node_modules', pkgJson.name);

  // Do the actual install!
  childProcess.execFileSync('npm', ['install', original], { cwd: baseDir });

  return location;
});

function installPackage(packageRoot, useRealInstall) {
  const originalLocation = packageRoot
    ? path.resolve(packageRoot)
    : process.cwd();
  if (useRealInstall === undefined) useRealInstall = !!process.env.CI;

  let location;
  if (useRealInstall) {
    location = installOnce(originalLocation);
  } else {
    location = originalLocation;
  }

  function requireFromLocation(relativePath) {
    const modulePath = relativePath
      ? path.join(location, relativePath)
      : location;
    return require(modulePath);
  }
  requireFromLocation.location = location;
  return requireFromLocation;
}
module.exports = installPackage;
