define([
    'intern!object',
    'intern/chai!assert',
    'sinon',
    '../../../_base/NodeList',
    'dojo',
    '../../../query',
    '../../../on'
], function (registerSuite, assert, sinon, NodeList, dojo, query, on) {
    registerSuite({
        name: 'dojo/_base/NodeList',

        "connect()": (function () {
            return {
                "delegates to dojo.connect for each node": function () {
                    //arrange
                    var nodes =
                        [
                            document.createElement("div"),
                            document.createElement("div")
                        ],
                        nodeList = new NodeList(nodes),
                        origDojoConnect = dojo.connect,
                        callback = function () { },
                        event = "onClick",
                        capturedArguments = [],
                        capturedThis = [];

                    dojo.connect = function () {
                        capturedArguments.push(arguments);
                        capturedThis = this;
                    }

                    //act
                    nodeList.connect(event, callback);

                    //assert
                    for (var i in nodes) {
                        assert.propertyVal(capturedArguments,
                            { 0: event, 1: callback });
                        assert.propertyVal(capturedThis, nodes[i]);
                    }

                    dojo.connect = origDojoConnect;

                }
            };
        })(),
        "coords()": (function () {
            var coords =
                [
                    {
                        l: 1,
                        t: 2,
                        w: 3,
                        h: 4
                    }, {
                        l: 10,
                        t: 11,
                        w: 12,
                        h: 13
                    }
                ],
                nodes,
                nodeList,
                container;

            return {
                setup: function () {
                    nodes = [];

                    container = document.createElement("div");
                    for (var i in coords) {
                        var node = document.createElement("div");
                        nodes.push(node);
                        container.appendChild(node);
                        node.style.position = "absolute";
                        node.style.left = coords[i].l + "px";
                        node.style.top = coords[i].t + "px";
                        node.style.width = coords[i].w + "px";
                        node.style.height = coords[i].h + "px";
                    }

                    nodeList = new NodeList(nodes);

                    document.body.appendChild(container);
                },
                teardown: function() {
                    document.body.removeChild(container);
                },
                "returns array of the nodelist's nodes' coordinates": function () {
                    //arrange


                    //act
                    var result = nodeList.coords();

                    //assert
                    for (var i in coords) {
                        for (var j in coords[i]) {
                            assert.propertyVal(result[i], coords[i][j]);
                        }
                    }

                }
            };
        })(),
        "events": (function () {
            var events = [
                "blur", "focus", "change", "click", "error", "keydown", "keypress",
                "keyup", "load", "mousedown", "mouseenter", "mouseleave", "mousemove",
                "mouseout", "mouseover", "mouseup", "submit"
            ];
            return {
                "delegates wiring of event handlers for each to NodeList::connect with correct arguments": function () {

                    //arrange
                    var nodes =
                        [
                            document.createElement("input"),
                            document.createElement("div")
                        ],
                        nodeList = new NodeList(nodes),
                        capturedArgs = [],
                        mock = sinon.stub(nodeList, "connect"),
                        results = [];

                    for (var i in events) {
                        mock.withArgs("on" + events[i], events[i] + "0", events[i] + "1")
                            .returns(events[i] + "return");
                    }

                    //act
                    for (var i in events) {
                        results.push(nodeList["on" + events[i]](events[i] + "0", events[i] + "1"));
                    }
                    
                    //assert
                    for (var i in events) {
                        assert.isTrue(mock.calledWith("on" + events[i], events[i] + "0", events[i] + "1"));
                        assert.include(results, events[i] + "return");
                    }
                    
                }
            };
        })(),
        "validation tests": (function () {
            var container,
                idIndex = 0,
                baseId = "_base/NodeList",
                sq100Id = baseId + idIndex++

            return {
                setup: function() {
                    container = document.createElement("div");
                    var sq100 = document.createElement("div");
                    container.appendChild(sq100);
                    sq100.id = sq100Id;
                    sq100.style.width= "120px";
                    sq100.style.height= "130px";

                    document.body.appendChild(container);
                },
                teardown: function() {
                    document.body.removeChild(container);
                },
                "connect": function(){
                    var ih = "<div>" +
                            "    <span></span>" +
                            "</div>" +
                            "<span class='thud'>" +
                            "    <button>blah</button>" +
                            "</span>";

                    tn = document.createElement("div");
                    tn.innerHTML = ih;
                    document.body.appendChild(tn);

                    var ctr = 0;
                    var nl = query("button", tn).connect("onclick", function(){
                        ctr++;
                    });
                    nl[0].click();
                    assert.equal(1, ctr);
                    nl[0].click();
                    nl[0].click();
                    assert.equal(3, ctr);
                },
                "coords": function () {
                    var tnl = new NodeList(dojo.byId(sq100Id));
                    assert.isTrue(dojo.isArray(tnl));
                    assert.equal(120, tnl.coords()[0].w, 120);
                    assert.equal(130, tnl.coords()[0].h, 130);
                    assert.equal(query("body *").coords().length, document.body.getElementsByTagName("*").length);
                    assert.equal(query("body *").position().length, document.body.getElementsByTagName("*").length);
                }
            };
        })()
    });
});
