define([
    'intern!object',
    'intern/chai!assert',
    'require',
    '../../../query',
    '../../../sniff',
    '../../../dom',
    '../../../dom-construct',
    '../../../request/iframe',
    '../../../text!./queryQuirks.html'
], function (registerSuite, assert, require, query, has, dom, domConstruct, iframe, queryRawHTML) {

    var selectors =
        [
            "lite",
            "css2",
            "css2.1",
            "css3",
            "acme"
        ],
        container,
        iframeElement,
        document;

    for (var selectorIdx = 0; selectorIdx < selectors.length; selectorIdx++) {
        require(["../../../query!" + selectors[selectorIdx]], function (qd) {
            var runCounter, //number of runs completed
                query;

            function createDocument(xml) {
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

            registerSuite({
                name: "dojo/query with quirks - selector: " + selectors[selectorIdx],
                setup: function () {
                    if (!container) {
                        container = window.document.createElement("div");
                        iframeElement = window.document.createElement("iframe");
                        window.document.body.appendChild(container);
                        container.appendChild(iframeElement);
                        iframeElement.contentDocument.open();
                        iframeElement.contentDocument.write(queryRawHTML);

                        var t3 = iframeElement.contentWindow.frames["t3"];
                        var doc = t3.document;
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

                        domConstruct.place(container, window.document.body);
                        document = iframeElement.contentDocument;
                    }
                    query = function (selector, context) {
                        return qd(selector, context || document);
                    }

                },
                teardown: function () {
                    runCounter++;

                    //to be run only when all tests are done
                    if (runCounter === selectors.length) {
                        domConstruct.destroy(container);
                        runCounter = 0; //reset in case of new run
                    }
                },
                "css2": {
                    "basic sanity checks": function () {
                        assert.equal((query('h3')).length, 4);
                        assert.equal((query('#t')).length, 1);
                        assert.equal((query('#bug')).length, 1);
                        assert.equal((query('#t h3')).length, 4);
                        assert.equal((query('div#t')).length, 1);
                        assert.equal((query('div#t h3')).length, 4);
                        assert.equal((query('span#t')).length, 0);
                        assert.equal((query('.bogus')).length, 0);
                        assert.equal((query('.bogus', dom.byId('container', document))).length, 0);
                        assert.equal((query('#bogus')).length, 0);
                        assert.equal((query('#bogus', dom.byId('container', document))).length, 0);
                        assert.equal((query('#t div > h3')).length, 1);
                        assert.equal((query('.foo')).length, 2);
                        assert.equal((query('.foo.bar')).length, 1);
                        assert.equal((query('.baz')).length, 2);
                        assert.equal((query('#t > h3')).length, 3);
                        assert.equal((query(null)).length, 0);
                    },
                    "comma1": function () {
                        assert.equal(query('#baz,#foo,#t').length, 2);
                    },
                    "comma2": function () {
                        assert.equal((query('#foo,#baz,#t')).length, 2);
                    },
                    "syntactic equivalents": function () {
                        assert.equal((query('#t > *')).length, 12);
                        assert.equal((query('.foo > *')).length, 3);
                    },
                    "with a root, by ID": function () {
                        this.skip("having to run this in an iframe to get quirks mode in Intern, so query by id doesn't work.")
                        assert.equal((query('> *', 'container')).length, 3);
                        assert.equal((query('> *, > h3', 'container')).length, 3);
                        assert.equal((query('> h3', 't')).length, 3);
                    },
                    "compound queries": function () {
                        assert.equal((query('.foo, .bar')).length, 2);
                        assert.equal((query('.foo,.bar')).length, 2);
                    },

                    "multiple class attribute": function () {
                        assert.equal((query('.foo.bar')).length, 1);
                        assert.equal((query('.foo')).length, 2);
                        assert.equal((query('.baz')).length, 2);
                    },
                    "case sensitivity": function () {
                        assert.equal((query('span.baz')).length, 1);
                        assert.equal((query('sPaN.baz')).length, 1);
                        assert.equal((query('SPAN.baz')).length, 1);
                        // For quirks mode, case sensitivity is browser dependent, so querying .fooBar
                        //  may return 1 or 2 entries.   See #8775 and #14874 for details.
                        // assert.equal(query('.fooBar').length, 1);
                    },
                    "attribute selectors": function () {
                        assert.equal((query('[foo]')).length, 3);
                    },
                    "attribute substring selectors": function () {
                        assert.equal((query('[foo$=\"thud\"]')).length, 1);
                        assert.equal((query('[foo$=thud]')).length, 1);
                        assert.equal((query('[foo$=\"thudish\"]')).length, 1);
                        assert.equal((query('#t [foo$=thud]')).length, 1);
                        assert.equal((query('#t [title$=thud]')).length, 1);
                        assert.equal((query('#t span[title$=thud ]')).length, 0);
                        assert.equal((query('[id$=\'55555\']')).length, 1);
                        assert.equal((query('[foo~=\"bar\"]')).length, 2);
                        assert.equal((query('[ foo ~= \"bar\" ]')).length, 2);
                        assert.equal((query('[foo|=\"bar\"]')).length, 2);
                        assert.equal((query('[foo|=\"bar-baz\"]')).length, 1);
                        assert.equal((query('[foo|=\"baz\"]')).length, 0);
                    },
                    "descendant selectors": function () {
                        assert.equal(query('> *', dom.byId('container', document)).length, 3);
                        assert.equal(query('> [qux]', dom.byId('container', document)).length, 2);
                        assert.equal(query('> [qux]', dom.byId('container', document))[0].id, "child1");
                        assert.equal(query('> [qux]', dom.byId('container', document))[1].id, "child3");
                        assert.equal(query('> *', dom.byId('container', document)).length, 3);
                        assert.equal(query('>*', dom.byId('container', document)).length, 3);
                        assert.equal(query('#bug')[0].value, "passed");
                    },
                    "bug 9071": function () {
                        // bug 9071
                        assert.equal((query('a', dom.byId('t4', document))).length, 2);
                        assert.equal((query('p a', dom.byId('t4', document))).length, 2);
                        assert.equal((query('div p', dom.byId('t4', document))).length, 2);
                        assert.equal((query('div p a', dom.byId('t4', document))).length, 2);
                        assert.equal((query('.subA', dom.byId('t4', document))).length, 2);
                        assert.equal((query('.subP .subA', dom.byId('t4', document))).length, 2);
                        assert.equal((query('.subDiv .subP', dom.byId('t4', document))).length, 2);
                        assert.equal((query('.subDiv .subP .subA', dom.byId('t4', document))).length, 2);
                    },
                    "failed scope arg": function () {
                        assert.equal((query('*', 'thinger')).length, 0);
                        assert.equal((query('div#foo').length), 0);
                    },

                    "escaping special characters with quotes": function () {
                        // http://www.w3.org/TR/CSS21/syndata.html#strings
                        // bug 10651
                        assert.equal(query('option[value="a+b"]', dom.byId("attrSpecialChars", document)).length, 1);
                        assert.equal(query('option[value="a~b"]', dom.byId("attrSpecialChars", document)).length, 1);
                        assert.equal(query('option[value="a^b"]', dom.byId("attrSpecialChars", document)).length, 1);
                        assert.equal(query('option[value="a,b"]', dom.byId("attrSpecialChars", document)).length, 1);
                    },
                    "selector with substring that contains equals sign - bug 7479": function () {
                        assert.equal(1, query("a[href*='foo=bar']", dom.byId("attrSpecialChars", document)).length);
                    },
                    "selector with substring that contains brackets - bug 9193, 11189, 13084": function () {
                        assert.equal(query('input[name="data[foo][bar]"]', dom.byId("attrSpecialChars", document)).length, 1);
                        assert.equal(query('input[name="foo[0].bar"]', dom.byId("attrSpecialChars", document)).length, 1);
                        assert.equal(query('input[name="test[0]"]', dom.byId("attrSpecialChars", document)).length, 1);
                    },
                    "escaping special characters with backslashes": function () {
                        //http://www.w3.org/TR/CSS21/syndata.html#characters
                        // selector with substring that contains brackets (bug 9193, 11189, 13084)
                        // eval() converts 4 backslashes --> 1 by the time dojo.query() sees the string
                        assert.equal(query("input[name=data\\[foo\\]\\[bar\\]]", dom.byId("attrSpecialChars", document)).length, 1);
                        assert.equal(query("input[name=foo\\[0\\]\\.bar]", dom.byId("attrSpecialChars", document)).length, 1);
                    },
                    "crossDocumentQuery": function () {
                        var t3 = iframeElement.contentWindow.frames["t3"];
                        var doc = t3.document;

                        assert.equal(query('h3', dom.byId("st1", doc)).length, 1);
                        // use a long query to force a test of the XPath system on FF. see bug #7075
                        assert.equal(query('h3 > span > span > span', dom.byId("st1", doc)).length, 1);
                        assert.equal(query('h3 > span > span > span', doc.body.children[0]).length, 1);
                    },
                    "escaping of ':' chars inside an ID": {
                        "silly_IDs1": function () {
                            assert.isNotNull(document.getElementById("silly:id::with:colons"), "getElementById");
                            assert.equal(query("#silly\\:id\\:\\:with\\:colons").length, 1, "query(\"#silly\\:id\\:\\:with\\:colons\")");
                            assert.equal(query("#silly\\~id").length, 1, "query(\"#silly\\~id\")");
                        }
                    },
                    "xml": function () {
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

                        assert.equal(2, query("result", de).length, "all lower");

                        //assert.equal(1, query("result>nested", de).length, "nested XML");
                        assert.equal(1, query("Result", de).length, "mixed case");
                        assert.equal(1, query("RESULT", de).length, "all upper");
                        assert.equal(0, query("resulT", de).length, "no match");
                        assert.equal(0, query("rEsulT", de).length, "no match");
                    },
                    "xml_attrs": function () {
                        if (!has("ie")) {	// remove if() when #14880 is fixed
                            var doc = createDocument([
                                "<ResultSet>",
                                "<RESULT thinger='blah'>ONE</RESULT>",
                                "<RESULT thinger='gadzooks'><CHILD>Two</CHILD></RESULT>",
                                "</ResultSet>"
                            ].join(""));
                            var de = doc.documentElement;

                            assert.equal(2, query("RESULT", de).length, "result elements");
                            assert.equal(0, query("RESULT[THINGER]", de).length, "result elements with attrs (wrong)");
                            assert.equal(2, query("RESULT[thinger]", de).length, "result elements with attrs");
                            assert.equal(1, query("RESULT[thinger=blah]", de).length, "result elements with attr value");
                            assert.equal(1, query("RESULT > CHILD", de).length, "Using child operator");
                        } // remove when #14880 is fixed
                    },
                    "sort": function () {
                        var i = query("div");
                        // smoke test
                        i.sort(function (a, b) { return 1; })
                    },
                    "document_fragment": function () {
                        var detachedDom = domConstruct.toDom("<i><u><a></a><b id='b'></b></u></i>");
                        var documentFragment = domConstruct.toDom("<i></i>    <u><a></a><b id='b'></b></u>");

                        assert.equal(query("#b", detachedDom).length, 1);
                        assert.equal(query("#b", detachedDom.firstChild).length, 1);
                        assert.equal(query("#b", documentFragment).length, 1);

                        // In IE8 in quirks mode there is no text node on the document fragment
                        if (has('ie') === 8) {
                            assert.equal(query("#b", documentFragment.childNodes[1]).length, 1);
                        } else {
                            assert.equal(query("#b", documentFragment.childNodes[2]).length, 1);
                        }

                        var detachedDom2 = domConstruct.toDom("<i><u><a></a><b></b></u></i>");
                        var documentFragment2 = domConstruct.toDom("<i></i>    <u><a></a><b></b></u>");

                        assert.equal(query("#b", detachedDom2).length, 0);
                        assert.equal(query("#b", documentFragment2).length, 0);
                    }
                },
                "css2.1": function () {
                    if (/css2.1|css3|acme/.test(selectors[selectorIdx])) {
                        // first-child
                        assert.equal((query('h1:first-child')).length, 1);
                        assert.equal((query('h3:first-child')).length, 2);

                        // + sibling selector
                        assert.equal((query('.foo+ span')).length, 1);
                        assert.equal((query('.foo+span')).length, 1);
                        assert.equal((query('.foo +span')).length, 1);
                        assert.equal((query('.foo + span')).length, 1);
                    } else {
                        this.skip("out of scope for this selector engine");
                    }
                },
                "css3": (function () {
                    if (/css3|acme/.test(selectors[selectorIdx])) {
                        return {
                            "sub-selector parsing": function () {
                                assert.equal(query('#t span.foo:not(:first-child)').length, 1);
                            },
                            "~ sibling selector": function () {
                                assert.equal((query('.foo~ span')).length, 4);
                                assert.equal((query('.foo~span')).length, 4);
                                assert.equal((query('.foo ~span')).length, 4);
                                assert.equal((query('.foo ~ span')).length, 4);
                                assert.equal((query('#foo~ *')).length, 1);
                                assert.equal((query('#foo ~*')).length, 1);
                                assert.equal((query('#foo ~*')).length, 1);
                                assert.equal((query('#foo ~ *')).length, 1);
                            },
                            "nth-child tests": function () {
                                // nth-child tests
                                assert.equal(query('#t > h3:nth-child(odd)').length, 2);
                                assert.equal(query('#t h3:nth-child(odd)').length, 3);
                                assert.equal(query('#t h3:nth-child(2n+1)').length, 3);
                                assert.equal(query('#t h3:nth-child(even)').length, 1);
                                assert.equal(query('#t h3:nth-child(2n)').length, 1);
                                assert.equal(query('#t h3:nth-child(2n+3)').length, 1);
                                assert.equal(query('#t h3:nth-child(1)').length, 2);
                                assert.equal(query('#t > h3:nth-child(1)').length, 1);
                                assert.equal(query('#t :nth-child(3)').length, 3);
                                assert.equal(query('#t > div:nth-child(1)').length, 0);
                                assert.equal(query('#t span').length, 7);
                                assert.equal(query('#t > *:nth-child(n+10)').length, 3);
                                assert.equal(query('#t > *:nth-child(n+12)').length, 1);
                                assert.equal(query('#t > *:nth-child(-n+10)').length, 10);
                                assert.equal(query('#t > *:nth-child(-2n+10)').length, 5);
                                assert.equal(query('#t > *:nth-child(2n+2)').length, 6);
                                assert.equal(query('#t > *:nth-child(2n+4)').length, 5);
                                assert.equal(query('#t > *:nth-child(2n+4)').length, 5);
                                assert.equal(query('#t> *:nth-child(2n+4)').length, 5);
                                // TODO: uncomment these two tests when #14879 fixed
                                //assert.equal(query('#t > *:nth-child(n-5)').length, 12);
                                //assert.equal(query('#t >*:nth-child(n-5)').length, 12);
                                assert.equal(query('#t > *:nth-child(2n-5)').length, 6);
                                assert.equal(query('#t>*:nth-child(2n-5)').length, 6);
                                // TODO: uncomment when #14879 fixed
                                // function(){ doh.is(dom.byId('_foo'), query('.foo:nth-child(2)')[0]); },
                                assert.equal(query(':nth-child(2)')[0], query('body')[0]);
                            },
                            ":checked pseudo-selector": function () {
                                assert.equal(query('#t2 > :checked').length, 2);
                                assert.equal(query('#t2 > input[type=checkbox]:checked')[0], dom.byId('checkbox2', document));
                                assert.equal(query('#t2 > input[type=radio]:checked')[0], dom.byId('radio2', document));
                                // This :checked selector is only defined for elements that have the checked property, option elements are not specified by the spec (http://www.w3.org/TR/css3-selectors/#checked) and not universally supported 
                                //assert.equal(2, query('#t2select option:checked').length);

                                assert.equal(query('#radio1:disabled').length, 1);
                                assert.equal(query('#radio1:enabled').length, 0);
                                assert.equal(query('#radio2:disabled').length, 0);
                                assert.equal(query('#radio2:enabled').length, 1);
                            },
                            ":empty pseudo-selector": function () {
                                assert.equal(query('#t > span:empty').length, 4);
                                assert.equal(query('#t span:empty').length, 6);
                                assert.equal(query('h3 span:empty').length, 0);
                                assert.equal(query('h3 :not(:empty)').length, 1);
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
                                assert.equal(query('.fooBar').length, 2);
                            },
                            "sub-selector parsing": function () {
                                // TODO: move this test to CSS3 section when #14875 is fixed
                                assert.equal(query('#t span.foo:not(span:first-child)').length, 1);
                            },
                            "special characters in attribute values without backslashes": function () {
                                // supported by acme but apparently not standard, see http://www.w3.org/TR/CSS21/syndata.html#characters
                                function attrSpecialCharsNoEscape() {
                                    // bug 10651
                                    assert.equal(query('option[value=a+b]', 'attrSpecialChars').length, 1, "value=a+b");
                                    assert.equal(query('option[value=a~b]', 'attrSpecialChars').length, 1, "value=a~b");
                                    assert.equal(query('option[value=a^b]', 'attrSpecialChars').length, 1, "value=a^b");
                                }
                            },
                            "implied * after > (non-standard syntax)": function () {
                                assert.equal((query('#t >')).length, 12);
                                assert.equal((query('.foo >')).length, 3);
                                assert.equal(query('>', 'container').length, 3);
                                assert.equal(query('> .not-there').length, 0);
                                assert.equal((query('#foo ~')).length, 1);
                                assert.equal((query('#foo~')).length, 1);
                            },
                            "implied * before and after + and ~ (non-standard syntax)": function () {
                                assert.equal(query('+', 'container').length, 1);
                                assert.equal(query('~', 'container').length, 3);
                            },
                            "check for correct document order": {
                                // not sure if this is guaranteed by css3, so putting in acme section
                                domOrder: function () {
                                    var inputs = query(".upperclass .lowerclass input");
                                    assert.equal(inputs[0].id, "notbug");
                                    assert.equal(inputs[1].id, "bug");
                                    assert.equal(inputs[2].id, "checkbox1");
                                    assert.equal(inputs[3].id, "checkbox2");
                                    assert.equal(inputs[4].id, "radio1");
                                    assert.equal(inputs[5].id, "radio2");
                                    assert.equal(inputs[6].id, "radio3");
                                },

                                // TODO: move to css2 section after #7869 fixed for lite engine (on IE)
                                xml_nthchild: function () {
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
                                    assert.equal(query("result:nth-child(4)", de)[0].firstChild.data, "Four", "fourth child");
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
        });
    }

});
