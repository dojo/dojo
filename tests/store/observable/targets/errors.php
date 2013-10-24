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
}elseif($method === "POST" and $path === "/query/sub0?start=4&count=5"){
	// page(4, 5)
	render(array(
		"pageId" => "page1",
		"results" => array_slice($objects, 4, 5),
		"revision" => 64
	));
}elseif($method === "GET" and $path === "/updates/sub0?sinceRevision=42"){
	// fetch() for page0
	header("HTTP/1.0 410 Gone");
}elseif($method === "POST" and $path === "/query/sub0?start=3&count=5"){
	// page(3, 5)
	render(array(
		"pageId" => "page0",
		"results" => array_slice($objects, 3, 5),
		"revision" => 35
	));
}elseif($method === "POST" and $path === "/query/sub0?start=5&count=5"){
	// page(5, 5)
	render(array(
		"pageId" => "page0",
		"results" => array_slice($objects, 5, 5),
		"revision" => 35
	));
}elseif($method === "GET" and $path === "/updates/sub0?sinceRevision=35"){
	// fetch() for page0
	header("HTTP/1.0 404 Not Found");
}elseif($method === "GET" and $path === "/query/sub0?start=3&count=5"){
	// page(3, 5)
	render(array(
		"results" => array_slice($objects, 3, 5),
		"revision" => 35
	));
}elseif($method === "GET" and $path === "/query/sub0?start=5&count=5"){
	// page(5, 5)
	render(array(
		"results" => array_slice($objects, 5, 5),
		"revision" => 38
	));
}
