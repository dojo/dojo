// configure the loader to load the dojo package; assume baseUrl is
// <whatever>/util/doh and dojo resides at <whatever>/dojo
require({
	packages:[{
		name:'dojo',
		location:'../../dojo',
		main:'lib/main-browser',
		lib:'.'
	}],
	paths:require.vendor=="altoviso.com" ?
		{
			i18n:"../../dojo/lib/plugins/i18n",
			text:"../../dojo/lib/plugins/text"
		} :
		{
			require:"../../../requirejs/require"
		},
	deps:[
		"dojo/tests/amd/backCompat"
	],
	callback:function(){
		require.ready(function() {
			setTimeout(function(){doh.run();}, 200);
		});
	}
});
