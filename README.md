# esbuild-plugin-mxn-copy

[![npm@latest](https://badgen.net/npm/v/esbuild-plugin-mxn-copy)](https://www.npmjs.com/package/esbuild-plugin-mxn-copy)
[![Install size](https://packagephobia.now.sh/badge?p=esbuild-plugin-mxn-copy)](https://packagephobia.now.sh/result?p=esbuild-plugin-mxn-copy)
[![Downloads](https://img.shields.io/npm/dm/esbuild-plugin-mxn-copy.svg)](https://npmjs.com/esbuild-plugin-mxn-copy)

A Esbuild plugin for copying assets into the output directory of your bundle

- ~7.96kb size
- ~2.54kb minified + gzipped

## Install

```
$ npm install --save-dev esbuild-plugin-mxn-copy
```

## Usage

Suppose we have a bunch of assets in `./src` directory:

```bash
# ls -1 ./src
index.html
index.js
logo.svg
preact
```

We want some of these files to be copied over into the output folder of our esbuild bundle.

Create a `esbuild.config.js` [build script file](https://esbuild.github.io/getting-started/#build-scripts) and import the plugin:

```js
// esbuild.config.js
// ... other imports ...
import esbuildMxnCopy from "esbuild-plugin-mxn-copy";
// ... other imports, etc ...

export default {
	input: "src/index.js",
	// ...
	output: {
		file: "bundle/bundle.js",
		format: "iife"
	},
	plugins: [
		// ... other plugins ...
		esbuildMxnCopy({
			copy: [
				// You can include files & directories
				{ from: "src/index.html", to: "bundle/index.html" },
				{ from: "src/logo.svg",   to: "bundle/" },
				{ from: "src/preact",     to: "bundle/preact" }
			]
		})
	]
};
```

Then call `rollup` either via the [CLI](https://www.rollupjs.org/guide/en/#command-line-reference) or the [API](https://www.rollupjs.org/guide/en/#javascript-api).

On final bundle generation the provided files will be copied over into the output folder of your rollup bundle, maintaining the original hierarchy and relativity to the input file.

## Options

This plugin has the following configuration options:

| Property      | Description    | Default      |
|---------------|----------------|--------------|
| `copy`        | An array of objects with paths to files or directories to copy `from` source `to` destination. | `[]` |
| `verbose`     | This option will output additional information about operations being performed. | `false` |
| `restrictive` | Enabling this option restricts access to all directories, except for input and output. | `false` |

## License

This module is released under the MIT license.

## Related

- [rollup-plugin-mxn-copy](https://github.com/ZimNovich/rollup-plugin-mxn-copy) - Rollup plugin for copying assets into the output directory of your bundle
- [rollup-plugin-mxn-jsx](https://github.com/ZimNovich/rollup-plugin-mxn-jsx) - Rollup JSX plugin that transpiles JSX into JavaScript
- [rollup-plugin-mxn-svg](https://github.com/ZimNovich/rollup-plugin-mxn-svg) - Rollup plugin that imports SVG files as JSX components
