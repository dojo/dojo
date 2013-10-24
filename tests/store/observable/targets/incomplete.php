<?php

include "common.php";

if($method === "POST" and $path === "/query?sort(+id)"){
	// materialize(null, {sort: [{attribute: "id"}]})
	render(array(
		"querySubscriptionId" => "sub0",
		"length" => count($objects)
	));
}elseif($method === "POST" and $path === "/query/sub0?start=1&count=7"){
	render(array(
		"pageId" => "page3",
		"results" => array_slice($objects, 1, 7),
		"revision" => 14
	));
}elseif($method === "GET" and $path === "/updates/sub0?sinceRevision=14"){
	// Incomplete supplementary data (missing index 7)
	render(array(
		array(
			"revision" => 15,
			"object" => array("id" => 5, "value" => "foz"),
			"removedFrom" => 5,
			"insertedInto" => -1,
			"supplementaryData" => array(
				"length" => 9
			)
		)
	));
}

