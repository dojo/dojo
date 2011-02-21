// AMD module id = dojo
//
// This is a package main module for the dojo package implemented so that the *absolute minimal*
// changes are made to the dojo 1.x code. It is by no means optimal and should/will be replaced with
// a less naive design--particularly as dojo v2.0 evolves.
//
// There are a few key design weaknesses in this implementation:
//
//	 * generally, v1.x bootstrap, tests, and apps assume dojo is global
//
//	 * the v1.x dojo/_base modules assume dojo is defined before they are defined
//     and their factory functions go about populating dojo--which is really part of defining
//     dojo. This leads to the appearance of a circular dependency and is a somewhat obtuse
//     design since the dojo object must be delivered to them under a different module
//     name (dojo/lib/kernel).
//
//   * bootstrap modules tend to incorporate unrelated features (e.g., hostenv_browser includes
//     DOMContentLoad detection, thereby making it impossible to build out this feature if a
//     particular app does not need it).
//
//   * The back compatibility layer requires/contains some non-optimal code that needs to be improved.
//
// As 1.7 and 2.0 evolve, these items will be addressed with more robust implementation.
//
// The boot sequence is as follows:
//
// dojo (this module) depends on...
// dojo/lib/kernel which depends on...
// dojo/_base/_loader/hostenv_browser which depends on...
// dojo/lib/backCompat which depends on...
// dojo/_base/_loader/bootstrap which depends on nothing
//
// This module further depends on the fairly ordinary modules in dojo/_base; each of these
// modules depends on dojo/lib/kernel (at least) which provide the dojo object for them to augment.

define("dojo", [
	"dojo/lib/kernel",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/_base/declare",
	"dojo/_base/connect",
	"dojo/_base/Deferred",
	"dojo/_base/json",
	"dojo/_base/Color",
	"dojo/_base/window",
	"dojo/_base/event",
	"dojo/_base/html",
	"dojo/_base/NodeList",
	"dojo/_base/query",
	"dojo/_base/xhr",
	"dojo/_base/fx"
], function(dojo){
	return dojo;
});
