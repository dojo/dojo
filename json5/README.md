These modules are adapted from the [JSON5](https://github.com/json5/json5) project. JSON5 was adopted by
the Dojo Toolkit for use by `dojo/parser` to facilitate parsing data attributes without using the unsafe
JavaScript function `eval()`. As such only the parsing related modules from JSON5 are included.

Updates from the JSON5 project can be incorporated into the Dojo Toolkit with the following process:

* Clone the [JSON5 repository](https://github.com/json5/json5.git)
* Convert the relevant files to ES5 syntax with TypeScript's compiler:
```bash
tsc lib/parse.js lib/unicode.js lib/util.js --allowJs --module ES6 --outDir dojo --removeComments --target ES5
```
* Copy or move the files from the `dojo` folder within the JSON5 folder to the `json5` folder within the Dojo
Toolkit folder.
* Manually convert indentation to tabs in each module
* Manually convert each module to AMD syntax
* Update `json5/parse.js` to use `dojo/string` methods for ES5 String methods:
  * require `'../string'` as `dstring`
  * replace calls to `codePointAt` with `dstring.codePointAt(str, position)`
  * replace calls to `String.fromCodePoint` with `dstring.fromCodePoint`
* Update the line below recording the most recent update

Current as of 2020-06-12, commit [32bb2cd](https://github.com/json5/json5/commit/32bb2cdae4864b2ac80a6d9b4045efc4cc54f47a)
