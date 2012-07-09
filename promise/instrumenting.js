define([
	"../Deferred",
	"./tracer",
	"../has",
	"../_base/config",
	"../_base/lang",
	"../_base/array",
	"exports",
	"require"
], function(Deferred, tracer, has, config, lang, arrayUtil, exports, require){
	function logError(error, rejection, deferred){
		var stack = "";
		if(error && error.stack){
			stack += error.stack;
		}
		if(rejection && rejection.stack){
			stack += "\n    ----------------------------------------\n    rejected" + rejection.stack.split("\n").slice(1).join("\n").replace(/^\s+/, " ");
		}
		if(deferred && deferred.stack){
			stack += "\n    ----------------------------------------\n" + deferred.stack;
		}
		console.error(error, stack);
	}

	function reportRejections(error, handled, rejection, deferred){
		if(!handled){
			logError(error, rejection, deferred);
		}
	}

	var errors = [];
	var activeTimeout = false;
	var unhandledWait = 1000;
	function trackUnhandledRejections(error, handled, rejection, deferred){
		if(handled){
			arrayUtil.some(errors, function(obj, ix){
				if(obj.error === error){
					errors.splice(ix, 1);
					return true;
				}
			});
		}else if(!arrayUtil.some(errors, function(obj){ return obj.error === error; })){
			errors.push({
				error: error,
				rejection: rejection,
				deferred: deferred,
				timestamp: new Date().getTime()
			});
		}

		if(!activeTimeout){
			activeTimeout = setTimeout(logRejected, unhandledWait);
		}
	}

	function logRejected(){
		var now = new Date().getTime();
		var reportBefore = now - unhandledWait;
		errors = arrayUtil.filter(errors, function(obj){
			if(obj.timestamp < reportBefore){
				logError(obj.error, obj.rejection, obj.deferred);
				return false;
			}
			return true;
		});

		if(errors.length){
			activeTimeout = setTimeout(logRejected, errors[0].timestamp + unhandledWait - now);
		}
	}

	exports.load = function(id, parentRequire, load){
		var args = id.split(",");
		var option = args.shift();
		switch(option){
			case 0:
				break;
			case "report-rejections":
				Deferred.instrumentRejected = reportRejections;
				break;
			case "report-unhandled-rejections":
				Deferred.instrumentRejected = trackUnhandledRejections;
				unhandledWait = parseInt(args[0], 10) || unhandledWait;
				break;
			default:
				throw new Error("Unknown instrumenting option <" + option + ">");
		}
		load();
	};

	if(has("config-deferredInstrumentation")){
		exports.load(has("config-deferredInstrumentation"), require, function(){});

		tracer.on("resolved", lang.hitch(console, "log", "resolved"));
		tracer.on("rejected", lang.hitch(console, "log", "rejected"));
		tracer.on("progress", lang.hitch(console, "log", "progress"));
	}

	return exports;
});
