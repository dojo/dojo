<?php

include "common.php";

if($method === "POST" and $path === "/query?sort(+id)"){
	// materialize(null, {sort: [{attribute: "id"}]})
	render(array(
		"querySubscriptionId" => "sub0",
		"length" => count($objects)
	));
}elseif($method === "POST" and $path === "/query/sub0?start=0&count=5"){
	// page(0, 5)
	render(array(
		"pageId" => "page0",
		"results" => array_slice($objects, 0, 5),
		"revision" => 20
	));
}elseif($method === "POST" and $path === "/query/sub0?start=5&count=5"){
	// page(5, 5) at 2 revisions ahead of page0
	render(array(
		"pageId" => "page1",
		"results" => array($objects[3], $objects[4], $objects[5], $objects[6], $objects[7]),
		"revision" => 22
	));
}elseif($method === "GET" and $path === "/updates/sub0?sinceRevision=20"){
	// fetch() for page1 and page2
	render(array(
		array(
			"revision" => 21,
			"object" => array("id" => -1, "value" => "fit"),
			"removedFrom" => -1,
			"insertedInto" => 0,
			"supplementaryData" => array(
				"length" => 11
			)
		),
		array(
			"revision" => 22,
			"object" => array("id" => -2, "value" => "fil"),
			"removedFrom" => -1,
			"insertedInto" => 0,
			"supplementaryData" => array(
				"length" => 12
			)
		),
		array(
			"revision" => 23,
			"object" => array("id" => -3, "value" => "fot"),
			"removedFrom" => -1,
			"insertedInto" => 0,
			"supplementaryData" => array(
				"5" => array("id" => 2, "value" => "baz"),
				"length" => 13
			)
		)
	));
}
