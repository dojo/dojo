define([
	'require',
	'../_base/array',
	'./default!platform',
	'./util'
], function(require, array, fallbackProvider, util){
	var registry = [];

	function request(url, options){
		var matchers = registry.slice(0),
			i = 0,
			matcher;

		while(matcher=matchers[i++]){
			if(matcher.apply(null, arguments)){
				return matcher.request.apply(null, arguments);
			}
		}

		return fallbackProvider.apply(null, arguments);
	}

	function createMatcher(match, provider){
		var matcher;
		if(match.test){
			// RegExp
			matcher = function(url){
				return match.test(url);
			};
		}else if(match.apply && match.call){
			matcher = function(){
				return match.apply(null, arguments);
			};
		}else{
			matcher = function(url){
				return url === match;
			};
		}

		if(provider){
			matcher.request = provider;
		}

		return matcher;
	}

	request.register = function(m, provider, first){
		var matcher = createMatcher(m, provider);
		registry[(first ? 'unshift' : 'push')](matcher);

		return {
			remove: function(){
				var idx;
				if(~(idx = array.indexOf(registry, matcher))){
					registry.splice(idx, 1);
				}
			}
		};
	};

	request.load = function(id, parentRequire, loaded, config){
		if(id){
			// if there's an id, load and set the fallback provider
			require([id], function(fallback){
				fallbackProvider = fallback;
				loaded(request);
			});
		}else{
			loaded(request);
		}
	};

	util.addCommonMethods(request);

	return request;
});
