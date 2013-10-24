<?php

$method = strtoupper($_SERVER["REQUEST_METHOD"]);
$path = $_SERVER["PATH_INFO"] . "?" . $_SERVER["QUERY_STRING"];

$data = null;

$objects = array(
	array("id" => 0, "value" => "foo"),
	array("id" => 1, "value" => "bar"),
	array("id" => 2, "value" => "baz"),
	array("id" => 3, "value" => "bat"),
	array("id" => 4, "value" => "fiz"),
	array("id" => 5, "value" => "foz"),
	array("id" => 6, "value" => "cat"),
	array("id" => 7, "value" => "dil"),
	array("id" => 8, "value" => "daz"),
	array("id" => 9, "value" => "fet")
);

if($method === "POST" and $path === "/query?sort(+id)"){
	// materialize(null, {sort: [{attribute: "id"}]})
	$data = array(
		"querySubscriptionId" => "sub0",
		"length" => count($objects)
	);
}elseif($method === "POST" and $path === "/query/sub0?start=2&count=5"){
	// page(2, 5)
	$data = array(
		"pageId" => "page0",
		"results" => array_slice($objects, 2, 5),
		"revision" => 42
	);
}elseif($method === "GET" and $path === "/query/sub0?start=2&count=5"){
	// refresh()
	// act as if rows 0-2 have been removed
	$data = array(
		"results" => array_slice($objects, 5, 5),
		"revision" => 45
	);
}elseif($method === "GET" and $path === "/updates/sub0?sinceRevision=42"){
	// fetch() for page0
	$data = array(
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
	);
}elseif($method === "GET" and $path === "/updates/sub0?sinceRevision=45"){
	// another fetch() for page0
	$data = array(
		array(
			"revision" => 46,
			"object" => array("id" => 4, "value" => "fiz"),
			"removedFrom" => -1,
			"insertedInto" => 4,
			"supplementaryData" => array(
				"length" => 10
			)
		)
	);
}elseif($method === "POST" and $path === "/query/sub0?start=0&count=5"){
	// page(0, 5)
	$data = array(
		"pageId" => "page1",
		"results" => array_slice($objects, 0, 5),
		"revision" => 20
	);
}elseif($method === "POST" and $path === "/query/sub0?start=5&count=5"){
	// page(5, 5) at 2 revisions ahead of page1
	$data = array(
		"pageId" => "page2",
		"results" => array(
			array("id" => 3, "value" => "bat"),
			array("id" => 4, "value" => "fiz"),
			array("id" => 5, "value" => "foz"),
			array("id" => 6, "value" => "cat"),
			array("id" => 7, "value" => "dil"),
		),
		"revision" => 22
	);
}elseif($method === "GET" and $path === "/updates/sub0?sinceRevision=20"){
	// fetch() for page1 and page2
	$data = array(
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
	);
}elseif($method === "POST" and $path === "/query/sub0?start=1&count=7"){
	$data = array(
		"pageId" => "page3",
		"results" => array_slice($objects, 1, 7),
		"revision" => 14
	);
}elseif($method === "GET" and $path === "/updates/sub0?sinceRevision=14"){
	// Incomplete supplementary data (missing index 7)
	$data = array(
		array(
			"revision" => 15,
			"object" => array("id" => 5, "value" => "foz"),
			"removedFrom" => 5,
			"insertedInto" => -1,
			"supplementaryData" => array(
				"length" => 9
			)
		)
	);
}
	

if($data !== null){
	header("Content-Type: application/json");
	header("Cache-Control: no-cache");
	echo json_encode($data);
}
