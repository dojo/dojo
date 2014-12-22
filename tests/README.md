# Dojo Tests

This directory has the following structure:
```
tests/
    dojo.intern.js - SauceLabs configuration
    dojo.intern.local.js - Local Selenium configuration
    dojo.intern.proxy.js - Proxy configuration without instrumentation
    functional/ - Functional tests
        all.js - Module referencing all functional tests to run
    unit/ - Unit tests
        all.js - Module referencing all unit tests to run
    support/ - Supporting files such as pre-run scripts for SauceLabs
    services/ - Service proxy server plus service modules
```

## Running the tests

To get started, simply run the following commands in the dojo directory:
```
npm install
```

This will install Intern and some supporting libraries in `node_modules`.

Once complete, intern tests may be tested by several `npm run` scripts issued
from the root of the repository. To run the unit test suite in Node, run the
following command:
```
npm run test
```

To run unit and functional tests via SauceLabs run the following command:
```
npm run test-remote
```

This command will attempt to open a tunnel to SauceLabs and run the test
suite in all of the browsers defined in `tests/dojo.intern.js`. SauceLabs
requires an account (SL offers free accounts). The Dojo Foundation has an
account, but please use your own when running your own tests.

If a local Selenium instance is more desirable, install "selenium-standalone-server"
and the drivers for the browsers to test, launch Selenium on port 4444, and issue
the following command:
```
npm run test-local
```

During development of tests, it is often desirable to run the test suite
or portions of the test suite in a local browser. To do this, simply run
the test runner in proxy-only mode:
```
grunt run test-proxy
```

With the proxy running, navigate to the following URL:
```
http://localhost:9001/__intern/client.html?config=tests/dojo.intern
```

This will run the entire unit test suite and output the results in the
console. To only run certain modules, use the "suites" query parameter.
The following URL will only run the dojo/request/script tests:
```
http://localhost:9001/__intern/client.html?config=tests/dojo.intern&suites=tests/request/script
```

Intern can also produce code coverage reports in HTML format. Simply append
`-coverage` to any of the test run commands:
```
npm run test-coverage # Coverage for unit tests run in node
npm run test-remote-coverage # Coverage for unit + functional via SauceLabs
npm run test-local-coverage # Coverage for unit + functional via local Selenium
```

This will output HTML files to the `html-report` directory which can be
viewed to see code coverage information for individual files (including a
view of the source code with which lines were not covered).

More information about running intern tests can be found at
https://github.com/theintern/intern/wiki/Running-Intern.

## Writing tests

To add a test suite to the suites to automatically run when the runner
executes, add the module ID of the suite to either tests/unit/all.js (for unit tests)
or tests/functional/all.js (for functional tests).

For information on how to write Intern tests, see
https://github.com/theintern/intern/wiki/Writing-Tests-with-Intern. Please
follow the style of the tests currently written.

If tests are required to communicate with a server (for instance,
dojo/request), services can be written for the test runner. Simply
create an AMD module and be sure the filename ends in "service.js". The
module must return a function that accepts a JSGI request object and
returns either an object describing the response or a promise that will
resolve to an object describing the response. For services, I've chosen
when.js for generating and manipulating promises, mostly because it is
AMD compatible, but it also comes with a whole host of utilities. For
more information on JSGI and when.js, see the following links:

* https://github.com/kriszyp/jsgi-node/
* https://github.com/cujojs/when
* https://github.com/cujojs/when/blob/master/docs/api.md#api

Or look at the dojo/request test services in "tests/request/".

Once a service is written, it can be accessed from the proxy via the
following URL pattern:
```
http://localhost:9001/__services/path/to/service
```

Taking "tests/request/xhr.service.js" as an example, its URL
endpoint would be:
```
http://localhost:9001/__services/request/xhr
```

While this is very useful, I want to make sure to note that *most tests
should be mocking their data instead of using live data from a service*.
Services should only be written for tests that absolutely *MUST*
communicate with a server, such as tests for IO functionality.


## Continuous integration
CI tests are running TravisCI using Intern's Open Sauce account. You can see the result of the latest builds here:
https://travis-ci.org/bryanforbes/dojo/builds

When pull requests are submitted, they will have a test build run via TravisCI
and the result of the test run will show up in the pull request.

## Notes
* We are currently experiencing intermittent errors in IE when running tests on Sauce Labs,
especially `dojo/request` tests. It appears to be an issue with Sauce Labs infrastructure not allowing
POST requests over a particular size. Sauce Labs was made aware of the issue but has been slow to respond.
* I haven't looked into testing builds. Rawld and I will need to do that offline, but I'm pretty sure it will be doable.
