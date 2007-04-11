dojo.provide("dojo.fx");
dojo.require("dojo._base.connect");
dojo.require("dojo._base.declare");
dojo.require("dojo._base.fx");

dojo.declare("dojo.fx.Combine", dojo._IAnimation, 
function(/*dojo.lfx.IAnimation...*/ animations){
	// summary: An animation object to play animations passed to it at the same time.
	dojo._IAnimation.call(this);
	this._anims = [];
	this._animsEnded = 0;
	
	var anims = arguments;
	if(anims.length == 1 && (dojo.isArray(anims[0]) || dojo.isArrayLike(anims[0]))){
		/* animations: dojo._IAnimation[]
		   pId: a */
		anims = anims[0];
	}
	
	dojo.forEach(anims, function(anim){
		this._anims.push(anim);
		dojo.connect(anim, "onEnd", anim, dojo.hitch(this, "_onAnimsEnded"));
	}, this);
}, {
	// private members
	_animsEnded: 0,
	
	// public methods
	play: function(/*int?*/ delay, /*boolean?*/ gotoStart){
		// summary: Start the animations.
		// delay: How many milliseconds to delay before starting.
		// gotoStart: If true, starts the animations from the beginning; otherwise,
		//            starts them from their current position.
		if( !this._anims.length ){ return this; /*dojo.fx.Combine*/}

		this.fire("beforeBegin");

		if(delay > 0){
			setTimeout(dojo.hitch(this, function(){ this.play(null, gotoStart); }), delay);
			return this; // dojo.fx.Combine
		}
		
		if(gotoStart || this._anims[0].percent == 0){
			this.fire("onBegin");
		}
		this.fire("onPlay");
		this._animsCall("play", null, gotoStart);
		return this; // dojo.fx.Combine
	},
	
	pause: function(){
		// summary: Pauses the running animations.
		this.fire("onPause");
		this._animsCall("pause"); 
		return this; // dojo.fx.Combine
	},
	
	stop: function(/*boolean?*/ gotoEnd){
		// summary: Stops the running animations.
		// gotoEnd: If true, the animations will end.
		this.fire("onStop");
		this._animsCall("stop", gotoEnd);
		return this; // dojo.fx.Combine
	},
	
	// private methods
	_onAnimsEnded: function(){
		this._animsEnded++;
		if(this._animsEnded >= this._anims.length){
			this.fire("onEnd");
		}
		return this; // dojo.fx.Combine
	},
	
	_animsCall: function(/*String*/ funcName){
		var args = [];
		if(arguments.length > 1){
			for(var i = 1 ; i < arguments.length ; i++){
				args.push(arguments[i]);
			}
		}
		var _this = this;
		dojo.forEach(this._anims, function(anim){
			anim[funcName](args);
		}, _this);
		return this; // dojo.fx.Combine
	}
});

dojo.declare("dojo.fx.Chain", dojo._IAnimation,
function(/*dojo._IAnimation...*/ animations) {
	// summary: An animation object to play animations passed to it
	//			one after another.
	dojo._IAnimation.call(this);
	this._anims = [];
	this._currAnim = -1;
	
	var anims = arguments;
	if(anims.length == 1 && (dojo.isArray(anims[0]) || dojo.isArrayLike(anims[0]))){
		/* animations: dojo._IAnimation[]
		   pId: a */
		anims = anims[0];
	}
	
	var _this = this;
	dojo.forEach(anims, function(anim, i, anims_arr){
		this._anims.push(anim);
		if(i < anims_arr.length - 1){
			dojo.connect(anim, "onEnd", anim, dojo.hitch(this,
				(i < anims_arr.length - 1) ?
					"_playNext": function(){ this.fire("onEnd"); }) );
		}
	}, this);
},
{
	// private members
	_currAnim: -1,
	
	// public methods
	play: function(/*int?*/ delay, /*bool?*/ gotoStart){
		// summary: Start the animation sequence.
		// delay: How many milliseconds to delay before starting.
		// gotoStart: If true, starts the sequence from the beginning; otherwise,
		//            starts it from its current position.
		if( !this._anims.length ) { return this; /*dojo.fx.Chain*/}
		if( gotoStart || !this._anims[this._currAnim] ) {
			this._currAnim = 0;
		}

		var currentAnimation = this._anims[this._currAnim];

		this.fire("beforeBegin");
		if(delay > 0){
			setTimeout(dojo.hitch(this, function(){ this.play(null, gotoStart); }), delay);
			return this; // dojo.fx.Chain
		}
		
		if(currentAnimation){
			if(this._currAnim == 0){
				this.fire("onBegin", [this._currAnim]);
			}
			this.fire("onPlay", [this._currAnim]);
			currentAnimation.play(null, gotoStart);
		}
		return this; // dojo.fx.Chain
	},
	
	pause: function(){
		// summary: Pauses the running animation sequence.
		if( this._anims[this._currAnim] ) {
			this._anims[this._currAnim].pause();
			this.fire("onPause", [this._currAnim]);
		}
		return this; // dojo.fx.Chain
	},
	
	playPause: function(){
		// summary: If the animation sequence is playing, pause it; otherwise,
		//			play it.
		if(this._anims.length == 0){ return this; }
		if(this._currAnim == -1){ this._currAnim = 0; }
		var currAnim = this._anims[this._currAnim];
		if( currAnim ) {
			if( !currAnim._active || currAnim._paused ) {
				this.play();
			} else {
				this.pause();
			}
		}
		return this; // dojo.fx.Chain
	},
	
	stop: function(){
		// summary: Stops the running animations.
		var currAnim = this._anims[this._currAnim];
		if(currAnim){
			currAnim.stop();
			this.fire("onStop", [this._currAnim]);
		}
		return currAnim; // dojo._IAnimation
	},
	
	// private methods
	_playNext: function(){
		if(this._currAnim == -1 || this._anims.length == 0){ return this; }
		this._currAnim++;
		if(this._anims[this._currAnim]){
			this._anims[this._currAnim].play(null, true);
		}
		return this; // dojo.fx.Chain
	}
});

dojo.fx.combine = function(/*dojo._IAnimation...*/ animations){
	// summary: Convenience function.  Returns a dojo.fx.Combine created
	//			using the animations passed in.
	var anims = arguments;
	if(dojo.isArray(arguments[0])){
		/* animations: dojo._IAnimation[]
		   pId: a */
		anims = arguments[0];
	}
	if(anims.length == 1){ return anims[0]; }
	return new dojo.fx.Combine(anims); // dojo.fx.Combine
}

dojo.fx.chain = function(/*dojo._IAnimation...*/ animations){
	// summary: Convenience function.  Returns a dojo.fx.Chain created
	//			using the animations passed in.
	var anims = arguments;
	if(dojo.isArray(arguments[0])){
		/* animations: dojo._IAnimation[]
		   pId: a */
		anims = arguments[0];
	}
	if(anims.length == 1){ return anims[0]; }
	return new dojo.fx.Chain(anims); // dojo.fx.Chain
}

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
	}

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
	
	return dojo.fx.combine(anims); // dojo.fx.Combine
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

	return dojo.fx.combine(anims); // dojo.fx.Combine
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
	
	return dojo.fx.combine(anims); // dojo.fx.Combine
}
