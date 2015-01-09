define([
    'intern!object',
    'intern/chai!assert',
    'require',
    '../../../query'
], function (registerSuite, assert, require, query) {

    var node,
        nodeId,
        baseId = "dojo/query/xml",
        uniqueId = 0;

    function getId() {
        return baseId + uniqueId++;
    }

    registerSuite({
        name: "dojo/query with xml documents",
        setup: function () {
            node = document.createElement("p");
            node.id = nodeId;
            document.body.appendChild(node);

        },
        teardown: function () {
            document.body.removeChild(node);
        },
        "matched nodes": function () {
            assert.equal(query("p#" + nodeId).length, 1, "matched nodes");
        }
    });

});
