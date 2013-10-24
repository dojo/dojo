<?php

$method = strtoupper($_SERVER["REQUEST_METHOD"]);
$path = $_SERVER["PATH_INFO"] . "?" . $_SERVER["QUERY_STRING"];

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

function render($data){
	if($data !== null){
		header("Content-Type: application/json");
		header("Cache-Control: no-cache");
		echo json_encode($data);
	}
}
