dojo.provide("dojo.fx");

dojo.fx.chain = function(/*dojo._Animation[]*/ animations){
	// summary: Chain a list of _Animations to run in sequence
	var first = animations.shift();
	var previous = first;
	dojo.forEach(animations, function(current){
		dojo.connect(previous, "onEnd", current, "play");
		previous = current;
	});
	return first; // dojo._Animation
};

dojo.fx.combine = function(/*dojo._Animation[]*/ animations){
	// summary: Combine a list of _Animations to run in parallel

	var first = animations.shift();
	dojo.forEach(animations, function(current){
		dojo.forEach([
//FIXME: onEnd gets fired multiple times for each animation, not once for the combined animation
//	should we return to a "container" with its own unique events?
			"play", "pause", "stop"
		], function(event){
			if(current[event]){
				dojo.connect(first, event, current, event);
			}
		}, this);
	});
	return first; // dojo._Animation
};

dojo.fx.slideIn = function(/*Object*/ args){
	// summary: Returns an animation that will show and wipe in 
	// node defined in 'args' object. 
	args.node = dojo.byId(args.node);

	// get node height, either it's natural height or it's height specified via style or class attributes
	// (for FF, the node has to be (temporarily) rendered to measure height)
	var anim = dojo.animateProperty(dojo.mixin({
		properties: {
			height: {
				start: 1 // 0 causes IE to display the whole panel
			}
		},
		oprop: {}
	}, args));
	dojo.connect(anim, "beforeBegin", anim, function(){
		var node = this.node;
		var s = this.node.style;
		s.visibility="hidden";
		s.display="";

		//		var nodeHeight = dojo.html.getBorderBox(node).height;
		//FIXME: ok to use contentbox?
		var nodeHeight = dojo.contentBox(node).h;

		s.visibility="";
		s.display="none";
		this.properties.height.end = nodeHeight;

		var oprop = this.oprop;
		oprop.overflow = s.overflow;
		oprop.height = s.height;
		s.overflow = "hidden";
		s.height = "1px"; // 0 causes IE to display the whole panel
		dojo.style(this.node, 'display', '');
	});
	
	dojo.connect(anim, "onEnd", anim, function(){ 
		var s = this.node.style;
		var oprop = this.oprop;
		s.overflow = oprop.overflow;
		s.height = oprop.height;
	});

	return anim; // dojo._Animation
}

dojo.fx.slideOut = function(/*Object*/ args){
	// summary: Returns an animation that will wipe out and hide 
	// node defined in args Object
	var node = args.node = dojo.byId(args.node);

	var oprop = {};	// old properties of node (before we mucked w/them)
	var anim = dojo.animateProperty(dojo.mixin({
		properties: {
			height: {
				start: function(){ return dojo.contentBox(node).h; }, //FIXME: why a closure here?
				end: 1 // 0 causes IE to display the whole panel
			}
		},
		oprop: oprop
	}, args));
	dojo.connect(anim, "beforeBegin", anim, function(){
		var s=node.style;
		oprop.overflow = s.overflow;
		oprop.height = s.height;
		s.overflow = "hidden";
		dojo.style(node, 'display', '');
	});
	dojo.connect(anim, "onEnd", anim, function(){
		dojo.style(this.node, 'display', 'none');
		var s=this.node.style;
		s.overflow = oprop.overflow;
		s.height = oprop.height;
	});

	return anim; // dojo._Animation
}

dojo.fx.slideTo = function(/*Object?*/ args){
	// summary: Returns an animation that will slide "node" 
	// defined in args Object from its current position to
	// the position defined in args.coords.
	// 
	// addition mixin args needed: 
	// coords: { top: Decimal?, left: Decimal? }

	var node = args.node = dojo.byId(args.node);
	var compute = dojo.getComputedStyle;
	
	var top = null;
	var left = null;
	
	var init = (function(){
		var innerNode = node;
		return function(){
			var pos = compute(innerNode).position;
			top = (pos == 'absolute' ? node.offsetTop : parseInt(compute(node).top) || 0);
			left = (pos == 'absolute' ? node.offsetLeft : parseInt(compute(node).left) || 0);

			if(pos != 'absolute' && pos != 'relative'){
				var ret = dojo.coords(innerNode, true);
				top = ret.y;
				left = ret.x;
				innerNode.style.position="absolute";
				innerNode.style.top=top+"px";
				innerNode.style.left=left+"px";
			}
		}
	})();
	init();

	var anim = dojo.animateProperty(dojo.mixin({
		properties: {
			top: { start: top, end: args.top||0 },
			left: { start: left, end: args.left||0 }
		}
	}, args));
	dojo.connect(anim, "beforeBegin", anim, init);

	return anim; // dojo._Animation
}

