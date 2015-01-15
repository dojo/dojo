define([
    'intern!object',
    'intern/chai!assert',
    'require'
], function (registerSuite, assert, require) {
    var selectors =
        [
            "lite",
            "css2",
            "css2.1",
            "css3",
            "acme"
        ];

    for (var _selectorIdx = 0; _selectorIdx < selectors.length; _selectorIdx++) {
        var selectorIdx = _selectorIdx
        registerSuite({
            name: "query - selector: " + selectors[selectorIdx],
            before: function () {
                return this.get("remote")
                    .get(require.toUrl("./query.html"))
                    .setExecuteAsyncTimeout(10000)
                    .executeAsync(function (selector, send) {
                        require([
                            'dojo/query!' + selector,
                            'dojo/sniff',
                            'dojo/dom',
                            'dojo/dom-construct',
                            'dojo/request/iframe',
                            'dojo/domReady!'
                        ], function (_query, _sniff, _dom, _domConstruct, _iframe) {
                            query = _query
                            has = _sniff;
                            dom = _dom;
                            domConstruct = _domConstruct;
                            iframe = _iframe;

                            send();
                        })
                    }, [selectors[selectorIdx]])
                    .execute(function () {
                        window.createDocument = function(xml) {
                            var fauxXhr = { responseText: xml };
                            if ("DOMParser" in window) {
                                var parser = new DOMParser();
                                fauxXhr.responseXML = parser.parseFromString(xml, "text/xml");
                            }
                            // kludge: code from dojo.xhr contentHandler to create doc on IE
                            var result = fauxXhr.responseXML;
                            if (has("ie")) {
                                // Needed for IE6-8
                                if ((!result || !result.documentElement)) {
                                    var ms = function (n) { return "MSXML" + n + ".DOMDocument"; };
                                    var dp = ["Microsoft.XMLDOM", ms(6), ms(4), ms(3), ms(2)];
                                    array.some(dp, function (p) {
                                        try {
                                            var dom = new ActiveXObject(p);
                                            dom.async = false;
                                            dom.loadXML(fauxXhr.responseText);
                                            result = dom;
                                        } catch (e) { return false; }
                                        return true;
                                    });
                                }
                            }
                            return result; // DOMDocument
                        }
                    });

            },
            "css2": {
                "basic sanity checks": function () {

                    return this.get("remote")
                        .execute(function () {
                            var result = {};

                            result['h3'] = query('h3');
                            result['#t'] = query('#t');
                            result['#bug'] = query('#bug');
                            result['#t h3'] = query('#t h3');
                            result['div#t'] = query('div#t');
                            result['div#t h3'] = query('div#t h3');
                            result['span#t'] = query('span#t');
                            result['.bogus'] = query('.bogus');
                            result['.bogus-scoped'] = query('.bogus', dom.byId('container'));
                            result['#bogus'] = query('#bogus');
                            result['#bogus-scoped'] = query('#bogus', dom.byId('container'));
                            result['#t div > h3'] = query('#t div > h3');
                            result['.foo'] = query('.foo');
                            result['.foo.bar'] = query('.foo.bar');
                            result['.baz'] = query('.baz');
                            result['#t > h3'] = query('#t > h3');
                            result['null'] = query(null);

                            return result;
                        }).then(function (results) {
                            assert.equal((results['h3']).length, 4);
                            assert.equal((results['#t']).length, 1);
                            assert.equal((results['#bug']).length, 1);
                            assert.equal((results['#t h3']).length, 4);
                            assert.equal((results['div#t']).length, 1);
                            assert.equal((results['div#t h3']).length, 4);
                            assert.equal((results['span#t']).length, 0);
                            assert.equal((results['.bogus']).length, 0);
                            assert.equal((results['.bogus-scoped']).length, 0);
                            assert.equal((results['#bogus']).length, 0);
                            assert.equal((results['#bogus-scoped']).length, 0);
                            assert.equal((results['#t div > h3']).length, 1);
                            assert.equal((results['.foo']).length, 2);
                            assert.equal((results['.foo.bar']).length, 1);
                            assert.equal((results['.baz']).length, 2);
                            assert.equal((results['#t > h3']).length, 3);
                            assert.equal((results['null']).length, 0);
                        });
                },
                "comma1": function () {
                    return this.get("remote")
                        .execute(function () {
                            return query('#baz,#foo,#t');
                        })
                        .then(function (result) {
                            assert.equal(result.length, 2);
                        });
                },
                "comma2": function () {
                    return this.get("remote")
                        .execute(function () {
                            return query('#foo,#baz,#t');
                        })
                        .then(function (result) {
                            assert.equal(result.length, 2);
                        });
                },
                "syntactic equivalents": function () {
                    return this.get("remote")
                        .execute(function () {
                            var result = {};

                            result["#t > *"] = query('#t > *');
                            result[".foo > *"] = query('.foo > *');

                            return result;
                        })
                        .then(function (result) {
                            assert.equal(result["#t > *"].length, 12);
                            assert.equal(result[".foo > *"].length, 3);
                        });
                },
                "with a root, by ID": function () {
                    return this.get("remote")
                        .execute(function () {
                            var result = {};

                            result['> *'] = query('> *', 'container');
                            result['> *, > h3'] = query('> *, > h3', 'container');
                            result['> h3'] = query('> h3', 't');

                            return result;
                        })
                        .then(function (result) {
                            assert.equal(result['> *'].length, 3);
                            assert.equal(result['> *, > h3'].length, 3);
                            assert.equal(result['> h3'].length, 3);
                        });

                },
                "compound queries": function () {
                    return this.get("remote")
                        .execute(function () {
                            var result = {};

                            result['.foo, .bar'] = query('.foo, .bar');
                            result['.foo,.bar'] = query('.foo,.bar');

                            return result;
                        })
                        .then(function (result) {
                            assert.equal(result['.foo, .bar'].length, 2);
                            assert.equal(result['.foo,.bar'].length, 2);
                        });
                },

                "multiple class attribute": function () {
                    return this.get("remote")
                        .execute(function () {
                            var result = {};

                            result['.foo.bar'] = query('.foo.bar');
                            result['.foo'] = query('.foo');
                            result['.baz'] = query('.baz');

                            return result;
                        })
                        .then(function (result) {
                            assert.equal(result['.foo.bar'].length, 1);
                            assert.equal(result['.foo'].length, 2);
                            assert.equal(result['.baz'].length, 2);
                        });
                },
                "case sensitivity": function () {
                    return this.get("remote")
                        .execute(function () {
                            var result = {};

                            result['span.baz'] = query('span.baz');
                            result['sPaN.baz'] = query('sPaN.baz');
                            result['SPAN.baz'] = query('SPAN.baz');
                            result['.fooBar'] = query('.fooBar');

                            return result;
                        })
                        .then(function (result) {
                            assert.equal(result['span.baz'].length, 1);
                            assert.equal(result['sPaN.baz'].length, 1);
                            assert.equal(result['SPAN.baz'].length, 1);
                            assert.equal(result['.fooBar'].length, 1);
                        });
                },
                "attribute selectors": function () {
                    return this.get("remote")
                        .execute(function () {
                            var result = {};

                            result['[foo]'] = query('[foo]');

                            return result;
                        })
                        .then(function (result) {
                            assert.equal(result['[foo]'].length, 3);
                        });
                },
                "attribute substring selectors": function () {
                    return this.get("remote")
                        .execute(function () {
                            var result = {};

                            result['[foo$=\"thud\"]'] = query('[foo$=\"thud\"]');
                            result['[foo$=thud]'] = query('[foo$=thud]');
                            result['[foo$=\"thudish\"]'] = query('[foo$=\"thudish\"]');
                            result['#t [foo$=thud]'] = query('#t [foo$=thud]');
                            result['#t [title$=thud]'] = query('#t [title$=thud]');
                            result['#t span[title$=thud ]'] = query('#t span[title$=thud ]');
                            result['[id$=\'55555\']'] = query('[id$=\'55555\']');
                            result['[foo~=\"bar\"]'] = query('[foo~=\"bar\"]');
                            result['[ foo ~= \"bar\" ]'] = query('[ foo ~= \"bar\" ]');
                            result['[foo|=\"bar\"]'] = query('[foo|=\"bar\"]');
                            result['[foo|=\"bar-baz\"]'] = query('[foo|=\"bar-baz\"]');
                            result['[foo|=\"baz\"]'] = query('[foo|=\"baz\"]');

                            return result;
                        })
                        .then(function (result) {
                            assert.equal(result['[foo$=\"thud\"]'].length, 1);
                            assert.equal(result['[foo$=thud]'].length, 1);
                            assert.equal(result['[foo$=\"thudish\"]'].length, 1);
                            assert.equal(result['#t [foo$=thud]'].length, 1);
                            assert.equal(result['#t [title$=thud]'].length, 1);
                            assert.equal(result['#t span[title$=thud ]'].length, 0);
                            assert.equal(result['[id$=\'55555\']'].length, 1);
                            assert.equal(result['[foo~=\"bar\"]'].length, 2);
                            assert.equal(result['[ foo ~= \"bar\" ]'].length, 2);
                            assert.equal(result['[foo|=\"bar\"]'].length, 2);
                            assert.equal(result['[foo|=\"bar-baz\"]'].length, 1);
                            assert.equal(result['[foo|=\"baz\"]'].length, 0);
                        });
                },
                "descendant selectors": function () {
                    return this.get("remote")
                        .execute(function () {
                            var result = {};

                            result['> *'] = query('> *', 'container');
                            result['> [qux]'] = query('> [qux]', 'container');
                            result['> [qux][0].id'] = query('> [qux]', 'container')[0].id;
                            result['> [qux][1].id'] = query('> [qux]', 'container')[1].id;
                            result['>*'] = query('>*', 'container');
                            result['#bug[0].value'] = query('#bug')[0].value;

                            return result;
                        })
                        .then(function (result) {
                            assert.equal(result['> *'].length, 3);
                            assert.equal(result['> [qux]'].length, 2);
                            assert.equal(result['> [qux][0].id'], "child1");
                            assert.equal(result['> [qux][1].id'], "child3");
                            assert.equal(result['>*'].length, 3);
                            assert.equal(result['#bug[0].value'], "passed");
                        });
                },
                "bug 9071": function () {
                    // bug 9071
                    return this.get("remote")
                        .execute(function () {
                            var result = {};

                            result['t4 a'] = query('a', 't4');
                            result['t4 p a'] = query('p a', 't4');
                            result['t4 div p'] = query('div p', 't4');
                            result['t4 div p a'] = query('div p a', 't4');
                            result['t4 .subA'] = query('.subA', 't4');
                            result['t4 .subP .subA'] = query('.subP .subA', 't4');
                            result['t4 .subDiv .subP'] = query('.subDiv .subP', 't4');
                            result['t4 .subDiv .subP .subA'] = query('.subDiv .subP .subA', 't4');

                            return result;
                        })
                        .then(function (result) {
                            assert.equal(result['t4 a'].length, 2);
                            assert.equal(result['t4 p a'].length, 2);
                            assert.equal(result['t4 div p'].length, 2);
                            assert.equal(result['t4 div p a'].length, 2);
                            assert.equal(result['t4 .subA'].length, 2);
                            assert.equal(result['t4 .subP .subA'].length, 2);
                            assert.equal(result['t4 .subDiv .subP'].length, 2);
                            assert.equal(result['t4 .subDiv .subP .subA'].length, 2);

                        });
                },
                "failed scope arg": function () {
                    return this.get("remote")
                        .execute(function () {
                            var result = {};

                            result['thinger *'] = query('*', 'thinger');
                            result['div#foo'] = query('div#foo');

                            return result;
                        })
                        .then(function (result) {
                            assert.equal(result['thinger *'].length, 0);
                            assert.equal(result['div#foo'].length, 0);
                        });
                },

                "escaping special characters with quotes": function () {
                    // http://www.w3.org/TR/CSS21/syndata.html#strings
                    // bug 10651
                    return this.get("remote")
                        .execute(function () {
                            var result = {};

                            result['option[value="a+b"]'] = query('option[value="a+b"]', "attrSpecialChars");
                            result['option[value="a~b"]'] = query('option[value="a~b"]', "attrSpecialChars");
                            result['option[value="a^b"]'] = query('option[value="a^b"]', "attrSpecialChars");
                            result['option[value="a,b"]'] = query('option[value="a,b"]', "attrSpecialChars");

                            return result;
                        })
                        .then(function (result) {
                            assert.equal(result['option[value="a+b"]'].length, 1);
                            assert.equal(result['option[value="a~b"]'].length, 1);
                            assert.equal(result['option[value="a^b"]'].length, 1);
                            assert.equal(result['option[value="a,b"]'].length, 1);
                        });
                },
                "selector with substring that contains equals sign - bug 7479": function () {
                    return this.get("remote")
                        .execute(function () {
                            var result = {};

                            result['a[href*=\'foo=bar\']'] = query("a[href*='foo=bar']", 'attrSpecialChars');

                            return result;
                        })
                        .then(function (result) {
                            assert.equal(result['a[href*=\'foo=bar\']'].length, 1);
                        });
                },
                "selector with substring that contains brackets - bug 9193, 11189, 13084": function () {
                    return this.get("remote")
                        .execute(function () {
                            var result = {};

                            result['input[name="data[foo][bar]"]'] = query('input[name="data[foo][bar]"]', "attrSpecialChars");
                            result['input[name="foo[0].bar'] = query('input[name="foo[0].bar"]', "attrSpecialChars");
                            result['input[name="test[0]"]'] = query('input[name="test[0]"]', "attrSpecialChars");

                            return result;
                        })
                        .then(function (result) {
                            assert.equal(result['input[name="data[foo][bar]"]'].length, 1);
                            assert.equal(result['input[name="foo[0].bar'].length, 1);
                            assert.equal(result['input[name="test[0]"]'].length, 1);
                        });
                },
                "escaping special characters with backslashes": function () {
                    //http://www.w3.org/TR/CSS21/syndata.html#characters
                    // selector with substring that contains brackets (bug 9193, 11189, 13084)
                    // eval() converts 4 backslashes --> 1 by the time dojo.query() sees the string
                    return this.get("remote")
                        .execute(function () {
                            var result = {};

                            result['input[name=data\\[foo\\]\\[bar\\]]'] = query("input[name=data\\[foo\\]\\[bar\\]]", "attrSpecialChars");
                            result['input[name=foo\\[0\\]\\.bar]'] = query("input[name=foo\\[0\\]\\.bar]", "attrSpecialChars");

                            return result;
                        })
                        .then(function (result) {
                            assert.equal(result['input[name=data\\[foo\\]\\[bar\\]]'].length, 1);
                            assert.equal(result['input[name=foo\\[0\\]\\.bar]'].length, 1);
                        });
                },
                "crossDocumentQuery": function () {
                    return this.get("remote")
                            .execute(function () {
                                var result = {};
                                var t3 = window.frames["t3"];
                                var doc = iframe.doc(t3);
                                doc.open();
                                doc.write([
                                    "<html><head>",
                                    "<title>inner document</title>",
                                    "</head>",
                                    "<body>",
                                    "   <div id='st1'>",
                                    "       <h3>h3",
                                    "           <span>",
                                    "               span",
                                    "               <span>",
                                    "                   inner",
                                    "                   <span>",
                                    "                       inner-inner",
                                    "                   </span>",
                                    "               </span>",
                                    "           </span>",
                                    "           endh3",
                                    "       </h3>",
                                    "   </div>",
                                    "</body>",
                                    "</html>"
                                ].join(""));

                                result["st1 h3"] = query('h3', dom.byId("st1", doc));
                                // use a long query to force a test of the XPath system on FF. see bug #7075
                                result['st1 h3 > span > span > span'] = query('h3 > span > span > span', dom.byId("st1", doc));
                                result['body.children[0] h3 > span > span > span'] = query('h3 > span > span > span', doc.body.children[0]);

                                return result;
                            })
                            .then(function (result) {
                                assert.equal(result['st1 h3'].length, 1);
                                assert.equal(result['st1 h3 > span > span > span'].length, 1);
                                assert.equal(result['body.children[0] h3 > span > span > span'].length, 1);
                            });
                },
                "escaping of ':' chars inside an ID": {
                    "silly_IDs1": function () {
                        return this.get("remote")
                            .execute(function () {
                                var result = {};

                                result["silly:id::with:colons"] = document.getElementById("silly:id::with:colons");
                                result["#silly\\:id\\:\\:with\\:colons"] = query("#silly\\:id\\:\\:with\\:colons");
                                result["#silly\\~id"] = query("#silly\\~id");

                                return result;
                            })
                            .then(function (result) {
                                assert.isNotNull(result["silly:id::with:colons"], "getElementById");
                                assert.equal(result["#silly\\:id\\:\\:with\\:colons"].length, 1, "query(\"#silly\\:id\\:\\:with\\:colons\")");
                                assert.equal(result["#silly\\~id"].length, 1, "query(\"#silly\\~id\")");
                            });
                    }
                },
                "xml": function () {
                    return this.get("remote")
                        .execute(function () {
                            var result = {};

                            var doc = createDocument([
                                "<ResultSet>",
                                "<Result>One</Result>",
                                "<RESULT>Two</RESULT>",
                                "<result><nested>Three</nested></result>",
                                "<result>Four</result>",
                                "</ResultSet>"
                            ].join("")
                            );
                            var de = doc.documentElement;

                            result["result"] = query("result", de);
                            result["result>nested"] = query("result>nested", de);
                            result["Result"] = query("Result", de);
                            result["RESULT"] = query("RESULT", de);
                            result["resulT"] = query("resulT", de);
                            result["rEsulT"] = query("rEsulT", de);

                            return result;
                        })
                        .then(function (result) {
                            assert.equal(result["result"].length, 2, "all lower");

                            //assert.equal(result["result>nested", de).length, 1, "nested XML");
                            assert.equal(result["Result"].length, 1, "mixed case");
                            assert.equal(result["RESULT"].length, 1, "all upper");
                            assert.equal(result["resulT"].length, 0, "no match");
                            assert.equal(result["rEsulT"].length, 0, "no match");
                        });

                },
                "xml_attrs": function () {
                    return this.get("remote")
                        .execute(function () {
                            var result = {};

                            if (!has("ie")) {	// remove if() when #14880 is fixed
                                var doc = createDocument([
                                    "<ResultSet>",
                                    "<RESULT thinger='blah'>ONE</RESULT>",
                                    "<RESULT thinger='gadzooks'><CHILD>Two</CHILD></RESULT>",
                                    "</ResultSet>"
                                ].join(""));
                                var de = doc.documentElement;

                                result["RESULT"] = query("RESULT", de);
                                result["RESULT[THINGER]"] = query("RESULT[THINGER]", de);
                                result["RESULT[thinger]"] = query("RESULT[thinger]", de);
                                result["RESULT[thinger=blah]"] = query("RESULT[thinger=blah]", de);
                                result["RESULT > CHILD"] = query("RESULT > CHILD", de);

                            } else {
                                this.skip("do not run in IE till bug #14880 is fixed");
                            }
                            return result;
                        })
                        .then(function (result) {
                            assert.equal(result["RESULT"].length, 2, "result elements");
                            assert.equal(result["RESULT[THINGER]"].length, 0, "result elements with attrs (wrong)");
                            assert.equal(result["RESULT[thinger]"].length, 2, "result elements with attrs");
                            assert.equal(result["RESULT[thinger=blah]"].length, 1, "result elements with attr value");
                            assert.equal(result["RESULT > CHILD"].length, 1, "Using child operator");
                        });
                },
                "sort": function () {
                    return this.get("remote")
                        .execute(function () {
                            var i = query("div");
                            // smoke test
                            i.sort(function (a, b) { return 1; });
                            return true;
                        })
                        .then(function (result) {
                            assert.isTrue(result);
                        });
                    
                },
                "document_fragment": function () {
                    return this.get("remote")
                        .execute(function () {
                            var result = {};
                            var detachedDom = domConstruct.toDom("<i><u><a></a><b id='b'></b></u></i>");
                            var documentFragment = domConstruct.toDom("<i></i>    <u><a></a><b id='b'></b></u>");
                            var detachedDom2 = domConstruct.toDom("<i><u><a></a><b></b></u></i>");
                            var documentFragment2 = domConstruct.toDom("<i></i>    <u><a></a><b></b></u>");

                            result["#b detached"] = query("#b", detachedDom);
                            result["#b detached first child"] = query("#b", detachedDom.firstChild);
                            result["#b fragment"] = query("#b", documentFragment);
                            result["#b fragment child"] = query("#b", documentFragment.childNodes[2]);
                            result["#b detached2"] = query("#b", detachedDom2);
                            result["#b fragment2"] = query("#b", documentFragment2);

                            return result;
                        })
                        .then(function (result) {
                            assert.equal(result["#b detached"].length, 1);
                            assert.equal(result["#b detached first child"].length, 1);
                            assert.equal(result["#b fragment"].length, 1);
                            assert.equal(result["#b fragment child"].length, 1);
                            assert.equal(result["#b detached2"].length, 0);
                            assert.equal(result["#b fragment2"].length, 0);
                        });
                }
            },
            "css2.1": function () {
                if (/css2.1|css3|acme/.test(selectors[selectorIdx])) {
                    return this.get("remote")
                        .execute(function () {
                            var result = {};

                            result["h1:first-child"] = query('h1:first-child');
                            result["h3:first-child"] = query('h3:first-child');
                            result[".foo+ span"] = query('.foo+ span');
                            result[".foo+span"] = query('.foo+span');
                            result[".foo +span"] = query('.foo +span');
                            result[".foo + span"] = query('.foo + span');

                            return result;
                        })
                        .then(function (result) {
                            // first-child
                            assert.equal(result["h1:first-child"].length, 1);
                            assert.equal(result["h3:first-child"].length, 2);

                            // + sibling selector
                            assert.equal(result[".foo+ span"].length, 1);
                            assert.equal(result[".foo+span"].length, 1);
                            assert.equal(result[".foo +span"].length, 1);
                            assert.equal(result[".foo + span"].length, 1);
                        });
                    
                } else {
                    this.skip("out of scope for this selector engine");
                }
            },
            "css3": (function () {
                if (/css3|acme/.test(selectors[selectorIdx])) {
                    return {
                        "sub-selector parsing": function () {
                            return this.get("remote")
                                .execute(function () {
                                    var result = {};

                                    result["#t span.foo:not(:first-child)"] = query('#t span.foo:not(:first-child)');

                                    return result;
                                })
                                .then(function (result) {
                                    assert.equal(result['#t span.foo:not(:first-child)'].length, 1);
                                });
                            
                        },
                        "~ sibling selector": function () {
                            return this.get("remote")
                                .execute(function () {
                                    var result = {};

                                    result[".foo~ span"] = query('.foo~ span');
                                    result[".foo~span"] = query('.foo~span');
                                    result[".foo ~span"] = query('.foo ~span');
                                    result[".foo ~ span"] = query('.foo ~ span');
                                    result["#foo~ *"] = query('#foo~ *');
                                    result["#foo ~*"] = query('#foo ~*');
                                    result["#foo ~*"] = query('#foo ~*');
                                    result["#foo ~ *"] = query('#foo ~ *');

                                    return result;
                                })
                                .then(function (result) {
                                    assert.equal(result[".foo~ span"].length, 4);
                                    assert.equal(result[".foo~span"].length, 4);
                                    assert.equal(result[".foo ~span"].length, 4);
                                    assert.equal(result[".foo ~ span"].length, 4);
                                    assert.equal(result["#foo~ *"].length, 1);
                                    assert.equal(result["#foo ~*"].length, 1);
                                    assert.equal(result["#foo ~*"].length, 1);
                                    assert.equal(result["#foo ~ *"].length, 1);
                                });
                            
                        },
                        "nth-child tests": function () {
                            return this.get("remote")
                                .execute(function () {
                                    var result = {};

                                    result["#t > h3:nth-child(odd)"] = query('#t > h3:nth-child(odd)');
                                    result["#t h3:nth-child(odd)"] = query('#t h3:nth-child(odd)');
                                    result["#t h3:nth-child(2n+1)"] = query('#t h3:nth-child(2n+1)');
                                    result["#t h3:nth-child(even)"] = query('#t h3:nth-child(even)');
                                    result["#t h3:nth-child(2n)"] = query('#t h3:nth-child(2n)');
                                    result["#t h3:nth-child(2n+3)"] = query('#t h3:nth-child(2n+3)');
                                    result["#t h3:nth-child(1)"] = query('#t h3:nth-child(1)');
                                    result["#t > h3:nth-child(1)"] = query('#t > h3:nth-child(1)');
                                    result["#t :nth-child(3)"] = query('#t :nth-child(3)');
                                    result["#t > div:nth-child(1)"] = query('#t > div:nth-child(1)');
                                    result["#t :nth-child(3)"] = query('#t :nth-child(3)');
                                    result["#t > div:nth-child(1)"] = query('#t > div:nth-child(1)');
                                    result["#t span"] = query('#t span');
                                    result["#t > *:nth-child(n+10)"] = query('#t > *:nth-child(n+10)');
                                    result["#t > *:nth-child(n+12)"] = query('#t > *:nth-child(n+12)');
                                    result["#t > *:nth-child(-n+10)"] = query('#t > *:nth-child(-n+10)');
                                    result["#t > *:nth-child(-2n+10)"] = query('#t > *:nth-child(-2n+10)');
                                    result["#t > *:nth-child(2n+2)"] = query('#t > *:nth-child(2n+2)');
                                    result["#t > *:nth-child(2n+4)"] = query('#t > *:nth-child(2n+4)');
                                    result["#t> *:nth-child(2n+4)"] = query('#t> *:nth-child(2n+4)');
                                    result["#t > *:nth-child(n-5)"] = query('#t > *:nth-child(n-5)');
                                    result["#t >*:nth-child(n-5)"] = query('#t >*:nth-child(n-5)');
                                    result["#t > *:nth-child(2n-5)"] = query('#t > *:nth-child(2n-5)');
                                    result["#t>*:nth-child(2n-5)"] = query('#t>*:nth-child(2n-5)');
                                    result[":nth-child(2)"] = query(':nth-child(2)')[0] === query('script')[1];

                                    return result;
                                })
                                .then(function (result) {
                                    // nth-child tests
                                    assert.equal(result["#t > h3:nth-child(odd)"].length, 2);
                                    assert.equal(result["#t h3:nth-child(odd)"].length, 3);
                                    assert.equal(result["#t h3:nth-child(2n+1)"].length, 3);
                                    assert.equal(result["#t h3:nth-child(even)"].length, 1);
                                    assert.equal(result["#t h3:nth-child(2n)"].length, 1);
                                    assert.equal(result["#t h3:nth-child(2n+3)"].length, 1);
                                    assert.equal(result["#t h3:nth-child(1)"].length, 2);
                                    assert.equal(result["#t > h3:nth-child(1)"].length, 1);
                                    assert.equal(result["#t :nth-child(3)"].length, 3);
                                    assert.equal(result["#t > div:nth-child(1)"].length, 0);
                                    assert.equal(result["#t span"].length, 7);
                                    assert.equal(result["#t > *:nth-child(n+10)"].length, 3);
                                    assert.equal(result["#t > *:nth-child(n+12)"].length, 1);
                                    assert.equal(result["#t > *:nth-child(-n+10)"].length, 10);
                                    assert.equal(result["#t > *:nth-child(-2n+10)"].length, 5);
                                    assert.equal(result["#t > *:nth-child(2n+2)"].length, 6);
                                    assert.equal(result["#t > *:nth-child(2n+4)"].length, 5);
                                    assert.equal(result["#t> *:nth-child(2n+4)"].length, 5);
                                    assert.equal(result["#t > *:nth-child(n-5)"].length, 12);
                                    assert.equal(result["#t >*:nth-child(n-5)"].length, 12);
                                    assert.equal(result["#t > *:nth-child(2n-5)"].length, 6);
                                    assert.equal(result["#t>*:nth-child(2n-5)"].length, 6);
                                    // TODO: uncomment when #14879 fixed
                                    // function(){ doh.is(dom.byId('_foo'), result[".foo:nth-child(2)"][0]); },
                                    assert.isTrue(result[":nth-child(2)"]);
                                });
                            
                        },
                        ":checked pseudo-selector": function () {
                            return this.get("remote")
                                .execute(function () {
                                    var result = {};

                                    result["#t2 > :checked"] = query('#t2 > :checked');
                                    result["#t2 > input[type=checkbox]:checked"] = 
                                        query('#t2 > input[type=checkbox]:checked')[0] === dom.byId('checkbox2');
                                    result["#t2 > input[type=radio]:checked"] = 
                                        query('#t2 > input[type=radio]:checked')[0] === dom.byId('radio2');
                                    
                                    result["#t2select option:checked"] =query('#t2select option:checked');

                                    result["#radio1:disabled"] = query('#radio1:disabled');
                                    result["#radio1:enabled"] = query('#radio1:enabled');
                                    result["#radio2:disabled"] = query('#radio2:disabled');
                                    result["#radio2:enabled"] = query('#radio2:enabled');
                                    
                                    return result;
                                })
                                .then(function (result) {
                                    assert.equal(result['#t2 > :checked'].length, 2);
                                    assert.isTrue(result['#t2 > input[type=checkbox]:checked']);
                                    assert.isTrue(result['#t2 > input[type=radio]:checked']);
                                    // This :checked selector is only defined for elements that have the checked property, option elements are not specified by the spec (http://www.w3.org/TR/css3-selectors/#checked) and not universally supported
                                    //assert.equal(result['#t2select option:checked'].length, 2);

                                    assert.equal(result['#radio1:disabled'].length, 1);
                                    assert.equal(result['#radio1:enabled'].length, 0);
                                    assert.equal(result['#radio2:disabled'].length, 0);
                                    assert.equal(result['#radio2:enabled'].length, 1);
                                });
                            
                        },
                        ":empty pseudo-selector": function () {
                            return this.get("remote")
                                .execute(function () {
                                    var result = {};

                                    result["#t > span:empty"] = query('#t > span:empty');
                                    result["#t span:empty"] = query('#t span:empty');
                                    result["h3 span:empty"] = query('h3 span:empty');
                                    result["h3 :not(:empty)"] = query('h3 :not(:empty)');

                                    return result;
                                })
                                .then(function (result) {
                                    assert.equal(result['#t > span:empty'].length, 4);
                                    assert.equal(result['#t span:empty'].length, 6);
                                    assert.equal(result['h3 span:empty'].length, 0);
                                    assert.equal(result['h3 :not(:empty)'].length, 1);
                                });
                            
                        }
                    };
                } else {
                    return {
                        "skipped": function () {
                            this.skip("out of scope for this selector engine")
                        }
                    };
                }
            })(),
            "acme": (function () {
                if (selectors[selectorIdx] == "acme") {
                    return {
                        "Case insensitive class selectors - bug #8775, #14874": function () {
                            // Case insensitive class selectors (#8775, #14874).
                            // In standards mode documents, querySelectorAll() is case-sensitive about class selectors,
                            // but acme is case-insensitive for backwards compatibility.
                            return this.get("remote")
                                .execute(function () {
                                    var result = {};

                                    result[".fooBar"] = query(".fooBar");

                                    return result;
                                })
                                .then(function (result) {
                                    assert.equal(result['.fooBar'].length, 1);
                                });
                        },
                        "sub-selector parsing": function () {
                            // TODO: move this test to CSS3 section when #14875 is fixed
                            return this.get("remote")
                                .execute(function () {
                                    var result = {};

                                    result['#t span.foo:not(span:first-child)'] = query('#t span.foo:not(span:first-child)');

                                    return result;
                                })
                                .then(function (result) {
                                    assert.equal(result['#t span.foo:not(span:first-child)'].length, 1);
                                });
                        },
                        "special characters in attribute values without backslashes": function () {
                            // supported by acme but apparently not standard, see http://www.w3.org/TR/CSS21/syndata.html#characters
                            function attrSpecialCharsNoEscape() {
                                // bug 10651
                                return this.get("remote")
                                .execute(function () {
                                    var result = {};

                                    result["option[value=a+b]"] = query('option[value=a+b]', 'attrSpecialChars');
                                    result["option[value=a~b]"] = query('option[value=a~b]', 'attrSpecialChars');
                                    result["option[value=a^b]"] = query('option[value=a^b]', 'attrSpecialChars');

                                    return result;
                                })
                                .then(function (result) {
                                    assert.equal(result["option[value=a+b]"].length, 1, "value=a+b");
                                    assert.equal(result["option[value=a~b]"].length, 1, "value=a~b");
                                    assert.equal(result["option[value=a^b]"].length, 1, "value=a^b");
                                });
                            }
                        },
                        "implied * after > (non-standard syntax)": function () {
                            return this.get("remote")
                                .execute(function () {
                                    var result = {};

                                    result['#t >'] = query('#t >');
                                    result['.foo >'] = query('.foo >');
                                    result['>'] = query('>', 'container');
                                    result['> .not-there'] = query('> .not-there');
                                    result['#foo ~'] = query('#foo ~');
                                    result['#foo~'] = query('#foo~');

                                    return result;
                                })
                                .then(function (result) {
                                    assert.equal(result['#t >'].length, 12);
                                    assert.equal(result['.foo >'].length, 3);
                                    assert.equal(result['>'].length, 3);
                                    assert.equal(result['> .not-there'].length, 0);
                                    assert.equal(result['#foo ~'].length, 1);
                                    assert.equal(result['#foo~'].length, 1);
                                });
                            
                        },
                        "implied * before and after + and ~ (non-standard syntax)": function () {
                            return this.get("remote")
                                .execute(function () {
                                    var result = {};
                                    result["+"] = query('+', 'container');
                                    result["~"] = query('~', 'container');
                                    return result;
                                })
                                .then(function (result) {
                                    assert.equal(result['+'].length, 1);
                                    assert.equal(result['~'].length, 3);
                                });
                            
                        },
                        "check for correct document order": {
                            // not sure if this is guaranteed by css3, so putting in acme section
                            domOrder: function () {
                                return this.get("remote")
                                .execute(function () {
                                    var result = {};

                                    var inputs = query(".upperclass .lowerclass input");

                                    result["notbug"] = inputs[0].id;
                                    result["bug"] = inputs[1].id;
                                    result["checkbox1"] = inputs[2].id;
                                    result["checkbox2"] = inputs[3].id;
                                    result["radio1"] = inputs[4].id;
                                    result["radio2"] = inputs[5].id;
                                    result["radio3"] = inputs[6].id;

                                    return result;
                                })
                                .then(function (result) {
                                    assert.equal(result["notbug"], "notbug");
                                    assert.equal(result["bug"], "bug");
                                    assert.equal(result["checkbox1"], "checkbox1");
                                    assert.equal(result["checkbox2"], "checkbox2");
                                    assert.equal(result["radio1"], "radio1");
                                    assert.equal(result["radio2"], "radio2");
                                    assert.equal(result["radio3"], "radio3");
                                });
                            },

                            // TODO: move to css2 section after #7869 fixed for lite engine (on IE)
                            xml_nthchild: function () {
                                return this.get("remote")
                                .execute(function () {

                                    var result = {};
                                    var doc = createDocument([
                                        "<ResultSet>",
                                        "<result>One</result>",
                                        "<result>Two</result>",
                                        "<result>Three</result>",
                                        "<result>Four</result>",
                                        "</ResultSet>"
                                    ].join("")
                                    );
                                    var de = doc.documentElement;

                                    result["result:nth-child(4)"] = query("result:nth-child(4)", de)[0].firstChild.data

                                    return result;
                                })
                                .then(function (result) {
                                    assert.equal(result["result:nth-child(4)"], "Four", "fourth child");
                                });
                            }
                        }
                    };
                } else {
                    return {
                        "skipped": function () {
                            this.skip("out of scope for this selector engine")
                        }
                    }
                }
            })()
        });
    }
});
