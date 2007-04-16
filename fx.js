dojo.provide("dojo.fx");
dojo.require("dojo._base.connect");
dojo.require("dojo._base.declare");
dojo.require("dojo._base.fx");

//FIXME: duplicate of local routine in _base.fx
dojo.fx._byId = function(nodes){
	if(!nodes){ return []; }
	if(dojo.isArrayLike(nodes)){
		if(!nodes._alreadyChecked){
			var n = [];
			dojo.forEach(nodes, function(node){
				n.push(dojo.byId(node));
			});
			n._alreadyChecked = true;
			return n;
		}else{
			return nodes;
		}
	}else{
		var n = [];
		n.push(dojo.byId(nodes));
		n._alreadyChecked = true;
		return n;
	}
};

(function(){
	var _fixArguments = function(origArgs){
		if (origArgs.length == 1 && dojo.isArray(origArgs[0])){
			return origArgs[0]
		}else{
			return dojo._toArray(origArgs);
		}
	}

	dojo.fx.chain = function(){
		var args = _fixArguments(arguments);
		var first = args.shift();
		return first.chain(args);
	}

	dojo.fx.combine = function(){
		var args = _fixArguments(arguments);
		var first = args.shift();
		return first.combine(args);
	}
})();

dojo.fx.slideIn = function(/*DOMNode[]*/ nodes, /*int?*/ duration, /*Function?*/ easing, /*Function?*/ callback){
	// summary: Returns an animation that will show and wipe in "nodes".
	// nodes: An array of DOMNodes or one DOMNode.
	// duration: Duration of the animation in milliseconds.
	// easing: An easing function.
	// callback: Function to run at the end of the animation.
	nodes = dojo.fx._byId(nodes);
	var anims = [];

	dojo.forEach(nodes, function(node){
		var oprop = {};	// old properties of node (before we mucked w/them)

		// get node height, either it's natural height or it's height specified via style or class attributes
		// (for FF, the node has to be (temporarily) rendered to measure height)
		var s=node.style;
		s.visibility="hidden";
		s.display="";

//		var nodeHeight = dojo.html.getBorderBox(node).height;
//FIXME: ok to use contentbox?
		var nodeHeight = dojo.contentBox(node).h;

		s.visibility="";
		s.display="none";

		var anim = dojo.animateProperty(node, [
				{
					property: 'height',
					start: 1, // 0 causes IE to display the whole panel
					end: function(){ return nodeHeight; } 
				}
			], 
			duration, 
			easing);
	
		dojo.connect(anim, "beforeBegin", anim, function(){
			oprop.overflow = s.overflow;
			oprop.height = s.height;
			s.overflow = "hidden";
			s.height = "1px"; // 0 causes IE to display the whole panel
			dojo.style(node, 'display', '');
		});
		
		dojo.connect(anim, "onEnd", anim, function(){ 
			s.overflow = oprop.overflow;
			s.height = oprop.height;
			if(callback){ callback(node, anim); }
		});
		anims.push(anim);
	});

	return dojo.fx.combine(anims); // dojo._Animation
}

dojo.fx.slideOut = function(/*DOMNode[]*/ nodes, /*int?*/ duration, /*Function?*/ easing, /*Function?*/ callback){
	// summary: Returns an animation that will wipe out and hide "nodes".
	// nodes: An array of DOMNodes or one DOMNode.
	// duration: Duration of the animation in milliseconds.
	// easing: An easing function.
	// callback: Function to run at the end of the animation.
	nodes = dojo.fx._byId(nodes);
	var anims = [];

	dojo.forEach(nodes, function(node){
		var oprop = {  };	// old properties of node (before we mucked w/them)
		var anim = dojo.animateProperty(node, [
				{
					property: 'height',
					start: function(){ return dojo.contentBox(node).h; },
					end: 1 // 0 causes IE to display the whole panel
				} 
			],
			duration,
			easing,
			{
				"beforeBegin": function(){
					var s=node.style;
					oprop.overflow = s.overflow;
					oprop.height = s.height;
					s.overflow = "hidden";
					dojo.style(node, 'display', '');
				},

				"onEnd": function(){
					dojo.style(node, 'display', 'none');
					var s=node.style;
					s.overflow = oprop.overflow;
					s.height = oprop.height;
					if(callback){ callback(node, anim); }
				}
			}
		);
		anims.push(anim);
	});

	return dojo.fx.combine(anims); // dojo._Animation
}

dojo.fx.slideTo = function(	/*DOMNode*/ nodes,
							/*Object*/ coords,
							/*int?*/ duration,
							/*Function?*/ easing,
							/*Function?*/ callback){
	// summary: Returns an animation that will slide "nodes" from its current position to
	//			the position defined in "coords".
	// nodes: An array of DOMNodes or one DOMNode.
	// coords: { top: Decimal?, left: Decimal? }
	// duration: Duration of the animation in milliseconds.
	// easing: An easing function.
	// callback: Function to run at the end of the animation.
	nodes = dojo.fx._byId(nodes);
	var anims = [];
	var compute = dojo.getComputedStyle;
	
	dojo.forEach(nodes, function(node){
		var top = null;
		var left = null;
		
		var init = (function(){
			var innerNode = node;
			return function(){
				var pos = compute(innerNode).position;
				top = (pos == 'absolute' ? node.offsetTop : parseInt(compute(node).top) || 0);
				left = (pos == 'absolute' ? node.offsetLeft : parseInt(compute(node).left) || 0);

				if (pos != 'absolute' && pos != 'relative') {
					var ret = dojo.html.abs(innerNode, true); //FIXME: finish port
					top = ret.y;
					left = ret.x;
					innerNode.style.position="absolute";
					innerNode.style.top=top+"px";
					innerNode.style.left=left+"px";
				}
			}
		})();
		init();

		var anim = dojo.animateProperty(node, [
				{ property: "top", start: top, end: coords.top||0 },
				{ property: "left", start: left, end: coords.left||0 }
			],
			duration,
			easing,
			{ "beforeBegin": init }
		);

		if(callback){
			dojo.connect(anim, "onEnd", anim, function(){ callback(nodes, anim); });
		}

		anims.push(anim);
	});

	return dojo.fx.combine(anims); // dojo._Animation
}

dojo.fx.wipeIn = function(/*DOMNode[]*/ nodes, /*int?*/ duration, /*Function?*/ easing, /*Function?*/ callback){
	// summary: Returns an animation that will show and wipe in "nodes".
	// nodes: An array of DOMNodes or one DOMNode.
	// duration: Duration of the animation in milliseconds.
	// easing: An easing function.
	// callback: Function to run at the end of the animation.
	nodes = dojo.fx._byId(nodes);
	var anims = [];

	dojo.forEach(nodes, function(node){
		var oprop = {};	// old properties of node (before we mucked w/them)
		
		// get node height, either it's natural height or it's height specified via style or class attributes
		// (for FF, the node has to be (temporarily) rendered to measure height)
		dojo.style(node, "visibility", "hidden");
		dojo.style(node, "display", "");
		var nodeHeight = dojo.borderBox(node).h;
		dojo.style(node, "visibility", "");
		dojo.style(node, "display", "none");

		var anim = dojo.animateProperty(node, [
				{
					property: "height",
					start: 1, // 0 causes IE to display the whole panel
					end: function(){ return nodeHeight; }
				}
			],
			duration, 
			easing);
	
		anim.connect("beforeBegin", function(){
			oprop.overflow = dojo.style(node, "overflow");
			oprop.height = dojo.style(node, "height");
			dojo.style(node, "overflow", "hidden");
			dojo.style(node, "height", "1px");
			dojo.style(node, "display", "");
		});
		
		anim.connect("onEnd", function(){ 
			dojo.style(node, "overflow", oprop.overflow);
			dojo.style(node, "height", oprop.height);
			if(callback){ callback(node, anim); }
		});
		anims.push(anim);
	});
	
	return dojo.fx.combine(anims); // dojo._Animation
}

dojo.fx.wipeOut = function(/*DOMNode[]*/ nodes, /*int?*/ duration, /*Function?*/ easing, /*Function?*/ callback){
	// summary: Returns an animation that will wipe out and hide "nodes".
	// nodes: An array of DOMNodes or one DOMNode.
	// duration: Duration of the animation in milliseconds.
	// easing: An easing function.
	// callback: Function to run at the end of the animation.
	nodes = dojo.fx._byId(nodes);
	var anims = [];
	
	dojo.forEach(nodes, function(node){
		var oprop = {};	// old properties of node (before we mucked w/them)
		var anim = dojo.animateProperty(node, [
				{
					property: "height",
					start: function(){ return dojo.html.getContentBox(node).height; },
					end: 1 // 0 causes IE to display the whole panel
				} 
			],
			duration,
			easing,
			{
				"beforeBegin": function(){
					oprop.overflow = dojo.style(node, "overflow");
					oprop.height = dojo.style(node, "height");
					dojo.style(node, "overflow", "hidden");
					dojo.style(node, "display", "");
				},
				
				"onEnd": function(){
					dojo.style(node, "display", "none");
					dojo.style(node, "overflow", oprop.overflow);
					dojo.style(node, "height", oprop.height);
					if(callback){ callback(node, anim); }
				}
			}
		);
		anims.push(anim);
	});

	return dojo.fx.combine(anims); // dojo._Animation
}
