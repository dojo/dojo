<?php

include "common.php";

if($method === "POST" and $path === "/query?sort(+id)"){
	// materialize(null, {sort: [{attribute: "id"}]})
	render(array(
		"querySubscriptionId" => "sub0",
		"length" => count($objects)
	));
}elseif($method === "POST" and $path === "/query/sub0?start=2&count=5"){
	// page(2, 5)
	render(array(
		"pageId" => "page0",
		"results" => array_slice($objects, 2, 5),
		"revision" => 42
	));
}elseif($method === "GET" and $path === "/query/sub0?start=2&count=5"){
	// refresh()
	// act as if rows 0-2 have been removed
	render(array(
		"results" => array_slice($objects, 5, 5),
		"revision" => 45
	));
}elseif($method === "GET" and $path === "/updates/sub0?sinceRevision=42"){
	// fetch() for page0
	render(array(
		array(
			"revision" => 43,
			"object" => array("id" => -1, "value" => "fit"),
			"removedFrom" => -1,
			"insertedInto" => 0,
			"supplementaryData" => array(
				"2" => array("id" => 1, "value" => "bar"),
				"length" => 11
			)
		),
		array(
			"revision" => 44,
			"object" => array("id" => 3, "value" => "bat"),
			"removedFrom" => 4,
			"insertedInto" => -1,
			"supplementaryData" => array(
				"6" => array("id" => 6, "value" => "cat"),
				"length" => 10
			)
		),
		array(
			"revision" => 45,
			"object" => array("id" => 4, "value" => "fiz"),
			"removedFrom" => 4,
			"insertedInto" => -1,
			"supplementaryData" => array(
				"6" => array("id" => 7, "value" => "dil"),
				"length" => 9
			)
		)
	));
}elseif($method === "GET" and $path === "/updates/sub0?sinceRevision=45"){
	// another fetch() for page0
	render(array(
		array(
			"revision" => 46,
			"object" => array("id" => 4, "value" => "fiz"),
			"removedFrom" => -1,
			"insertedInto" => 4,
			"supplementaryData" => array(
				"length" => 10
			)
		)
	));
}
