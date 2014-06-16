# doh2intern

All of the work is currently in https://github.com/bryanforbes/dojo/tree/intern-conversion and for now
I'll accept pull requests in this repository. Once the conversion is complete,
it can be squashed and committed to the main repository.

All Intern tests are currently housed in the "tests-intern" directory with the structure:
```
tests-intern/
    intern.js - SauceLabs configuration
    intern.local.js - Local Selenium configuration
    functional/ - Functional tests
        all.js - Module referencing all functional tests to run
    unit/ - Unit tests
        all.js - Module referencing all unit tests to run
    support/ - Supporting files such as pre-run scripts for SauceLabs
    services/ - Service proxy server plus service modules
```

The `tests-intern` directory also contains a runner script to launch an HTTP server,
pick up test services, proxy the Intern instrumentation server, and start Intern's test runner. 

## Running the tests

To get started, simply run the following commands in the dojo directory:
```
npm install -g grunt-cli		# Grunt must be installed globally
npm install
```

This will install grunt, Intern, and some supporting libraries in `node_modules`. 

Once complete, intern tests may be tested via SauceLabs by running the
following command anywhere in the dojo repository:

```
grunt test
```

This command will attempt to open a tunnel to SauceLabs and run the test
suite in all of the browsers defined in `tests-intern/intern.js`.
SauceLabs does require an account (SL offers free accounts), however I'm
not sure if the foundation or the toolkit has an account already. Once I find out, I'll update this document.

If a local Selenium instance is more desirable, install "selenium-standalone-server"
and the drivers for the browsers to test, launch Selenium on port 4444, and issue the following command:
```
grunt test:local
```

During development of tests, it is often desirable to run the test suite
or portions of the test suite in a local browser. To do this, simply run
the test runner in proxy-only mode:

```
grunt test:proxy
```

With the proxy running, navigate to the following URL:
```
http://localhost:9001/__intern/client.html?config=tests-intern/intern
```

This will run the entire test suite and output the results in the
console. To only run certain modules, use the "suites" query parameter.
The following URL will only run the dojo/request/script tests:
```
http://localhost:9001/__intern/client.html?config=tests-intern/intern&suites=tests-intern/request/script
```

One last feature of Intern that I find very useful is code coverage.
Intern can produce an lcov file which can then be used to generate an
HTML report to see how much of the code is being covered by tests. You
will need to download lcov to generate the HTML report. After that is
done, simply append ":coverage" to the grunt task to generate coverage information.

For instance, to get coverage information for a SauceLabs run:
```
grunt test:coverage
```

For a local run:
```
grunt test:local:coverage
```

This will output HTML files to "dojo/html-report" which can be viewed to
see code coverage information for individual files (including a view of
the source code with which lines were not covered).

## Writing tests

To add a test suite to the suites to automatically run when the runner
executes, add the module ID of the suite to either tests-intern/suites.js (for unit tests)
or tests-intern/functional.js (for functional tests).

For information on how to write Intern tests, see
https://github.com/theintern/intern/wiki/Writing-Tests-with-Intern or
the tests I have converted for dojo/request.

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

Or look at the dojo/request test services in "tests-intern/request/".

Once a service is written, it can be accessed from the proxy via the
following URL pattern:
```
http://localhost:9001/__services/path/to/service
```

Taking "tests-intern/request/xhr.service.js" as an example, its URL
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
