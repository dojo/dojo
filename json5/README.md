These modules are adapted from the [JSON5](https://github.com/json5/json5) project. JSON5 was adopted by
the Dojo Toolkit for use by `dojo/parser` to facilitate parsing data attributes without using the unsafe
JavaScript function `eval()`. As such only the parsing ability is included.

Updates from the JSON5 project can be incorporated into the Dojo Toolkit with the following process:

1. Clone the [JSON5 repository](https://github.com/json5/json5.git)
2. Convert the relevant files to ES5 syntax with TypeScript's compiler:
```bash
tsc lib/parse.js lib/unicode.js lib/util.js --allowJs --module ES6 --outDir dojo --removeComments --target ES5
```
3. In each file convert indentation to tabs
4. Copy or move the files from the `dojo` folder within the JSON5 folder to the `json5` folder within the Dojo
Toolkit folder.
5. Convert to AMD syntax
6. Update `json5/parse.js` to use `dojo/string` methods for ES5 String methods:
  * require `'../string'` as `dstring`
  * replace calls to `codePointAt` with `dstring.codePointAt(str, position)`
  * replace calls to `String.fromCodePoint` with `dstring.fromCodePoint`
7. Run Dojo's JSON5 and parser tests to ensure all updates were successful
  * [JSON5 tests](/TODO)
  * [parser tests](/TODO)
8. Update the line below recording the most recent update

Current as of 2020-06-12, commit 32bb2cdae4864b2ac80a6d9b4045efc4cc54f47a
