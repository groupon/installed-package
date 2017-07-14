# `installed-package`

**Note:** For the installs to actually work, you'll need a version of node that supports `execFileSync` (node >=4).
The module will gracefully degrade for earlier node versions.

A helper library that lets you run your tests against an installed version of your package.
This helps catch publish-related problems like:

* Files that aren't included in the npm package.
* Imports of `devDependencies` in the files shipped to npm.

During normal test runs it will just require the files from the project directory.
Only when you run the tests with `CI=true` will it do a fresh install of the package to a temporary directory and redirect imports there.

## Usage

### Install

```bash
npm install --save-dev installed-package
```

### Test Setup

If this is how your tests are currently importing your package:

```js
var mainExport = require('..');
var secondaryEntryPoint = require('../secondary');

// Test code that uses `mainExport`/`secondaryEntryPoint`...
```

Replace it with the following:

```js
var installed = require('installed-package')();

var mainExport = installed();
var secondaryEntryPoint = installed('secondary');

// Test code that uses `mainExport`/`secondaryEntryPoint`...
```

## API

The default export of this module is `installPackage`.

### `installPackage(packageRoot = process.cwd(), doInstall = process.env.CI)`

Installs the npm package located at `packageRoot` into a temporary directory.
Returns a function that will require a module relative to the installed package.
If the function is called without an argument, the main entry point of the package will be required.
