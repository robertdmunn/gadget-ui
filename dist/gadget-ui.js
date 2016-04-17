"use strict";

/*
 * author: Robert Munn <robert.d.munn@gmail.com>
 * 
 * Copyright (C) 2016 Robert Munn
 * 
 * This is free software licensed under the Mozilla Public License 2.0
 * 
 * https://www.mozilla.org/en-US/MPL/2.0/
 * 
 * 
 */

var gadgetui = {};
gadgetui.model = ( function() {
	"use strict";

	var _model = {};
	function BindableObject( data, element ) {
		this.data = data;
		this.elements = [ ];
		if ( element !== undefined ) {
			this.bind( element );
		}
	}

	BindableObject.prototype.handleEvent = function( ev ) {
		var ix, obj;
		switch ( ev.type ) {
			case "change":
				for( ix = 0; ix < this.elements.length; ix++ ){
					obj = this.elements[ ix ];
					if( ev.target.name === obj.prop && ev.originalSource !== 'updateDomElement' ){
						//select box binding
						if( ev.target.type.match( /select/ ) ){
							this.change( { 	value : ev.target.value, 
									key : ev.target.options[ev.target.selectedIndex].innerHTML 
								}, ev, obj.prop );
						}
						else{
						// text input binding
						this.change( ev.target.value, ev, obj.prop );
						}
					}
				}
				
		}
	};

	// for each bound control, update the value
	BindableObject.prototype.change = function( value, event, property ) {
		var ix, obj;

		// this code changes the value of the BinableObject to the incoming value
		if ( property === undefined ) {
			// Directive is to replace the entire value stored in the BindableObject
			// update the BindableObject value with the incoming value
			// value could be anything, simple value or object, does not matter
			this.data = value;
		}
		else if ( typeof this.data === 'object' ) {
			//Directive is to replace a property of the value stored in the BindableObject
			// verifies that "data" is an object and not a simple value
			// update the BindableObject's specified property with the incoming value
			// value could be anything, simple value or object, does not matter
			
			if( this.data[ property ] === undefined ){
				throw( "Property '" + property + "' of object is undefined." );
			}
			else{
				this.data[ property ] = value;
			}			
			// check if we are updating only a single property or the entire object
		
		}
		else {
			throw "Attempt to treat a simple value as an object with properties. Change fails.";
		}

		// check if there are other dom elements linked to the property
		for( ix = 0; ix < this.elements.length; ix++ ){
			obj = this.elements[ ix ];
			if( ( property === undefined || property === obj.prop ) && ( event.target !== undefined && obj.elem != event.target ) ){
				this.updateDomElement( event,  obj.elem, value );
			}
		}
	};
	
	BindableObject.prototype.updateDom = function( event, value, property ){
		var ix, obj;
		// this code changes the value of the DOM element to the incoming value
		for( ix = 0; ix < this.elements.length; ix++ ){
			obj = this.elements[ ix ];

			if ( property === undefined  || ( property !== undefined && obj.prop === property ) ){

				// this code sets the value of each control bound to the BindableObject
				// to the correspondingly bound property of the incoming value

				this.updateDomElement( event, obj.elem, value );
				//break;
			}
		}
	};
	
	BindableObject.prototype.updateDomElement = function( event, selector, value ){
		if( typeof value === 'object' ){
			// select box objects are populated with { key: key, value: value } 
			if( selector.tagName === "DIV" ){
				selector.innerText = value.text;
			}else{
				selector.value = value.id;
			}
		}else{
			if( selector.tagName === "DIV" ){
				selector.innerText = value;
			}else{
				selector.value = value;
			}
		}
		console.log( "updated Dom element: " + selector );
		// don't generate a change event on the selector if the change came from model.set method
		if( event.originalSource !== 'model.set' ){
			var ev = new Event( "change" );
			ev.originalSource = 'updateDomElement';
			selector.dispatchEvent( ev );
		}
	};

	// bind an object to an HTML element
	BindableObject.prototype.bind = function( element, property ) {
		var e, self = this;

		if ( property === undefined ) {
			// BindableObject holds a simple value
			// set the DOM element value to the value of the Bindable object
			element.value = this.data;
			e = {
				elem : element,
				prop : ""
			};
		}
		else {
			// Bindable object holds an object with properties
			// set the DOM element value to the value of the specified property in the
			// Bindable object
			element.value = this.data[ property ];
			e = {
				elem : element,
				prop : property
			};
		}
		//add an event listener so we get notified when the value of the DOM element
		// changes
		//element[ 0 ].addEventListener( "change", this, false );
		//IE 8 support
		if (element.addEventListener) {
			element.addEventListener( "change", this, false);
		}
		else {
			// IE8
			element.attachEvent("onpropertychange", function( ev ){
				if( ev.propertyName === 'value'){
					var el = ev.srcElement, val = ( el.nodeName === 'SELECT' ) ? { value: el.value, key: el.options[el.selectedIndex].innerHTML } : el.value;
					self.change( val, { target: el }, el.name );
				}
			});
		}
		this.elements.push( e );
	};

	return {
		BindableObject : BindableObject,

		create : function( name, value, element ) {
			if ( element !== undefined ) {
				_model[ name ] = new BindableObject( value, element );
			}
			else {
				_model[ name ] = new BindableObject( value );
			}
		},

		destroy : function( name ) {
			delete _model[ name ];
		},

		bind : function( name, element ) {
			var n = name.split( "." );
			if ( n.length === 1 ) {
				_model[ name ].bind( element );
			}
			else {
				_model[ n[ 0 ] ].bind( element, n[ 1 ] );
			}
		},

		exists : function( name ) {
			if ( _model.hasOwnProperty( name ) ) {
				return true;
			}

			return false;
		},
		// getter - if the name of the object to get has a period, we are
		// getting a property of the object, e.g. user.firstname
		get : function( name ) {
			var n = name.split( "." );
			try{
				if ( n.length === 1 ) {
					if( _model[name] === undefined ){
						throw "Key '" + name + "' does not exist in the model.";
					}else{
						return _model[ name ].data;
					}
				}
				if( _model[n[0]] === undefined ){
					throw "Key '" + n[0] + "' does not exist in the model.";
				}
				return _model[n[0]].data[ n[ 1 ] ];

			}catch( e ){
				console.log( e );
				return undefined;
			}
		},

		// setter - if the name of the object to set has a period, we are
		// setting a property of the object, e.g. user.firstname
		set : function( name, value ) {
			var n = name.split( "." ), event = { originalSource : 'model.set'};
			if ( this.exists( n[ 0 ] ) === false ) {
				if ( n.length === 1 ) {
					this.create( name, value );
				}
				else {
					// don't create complex objects, only simple values
					throw "Object " + n[ 0 ] + "is not yet initialized.";
				}
			}
			else {
				if ( n.length === 1 ) {
					_model[ name ].change( value, event );
					_model[ name ].updateDom( event, value );
				}
				else {
					_model[ n[ 0 ] ].change( value, event, n[1] );
					_model[ n[ 0 ] ].updateDom( event, value, n[1] );	
				}
			}
			console.log( "model value set: name: " + name + ", value: " + value );
		}
	};

}() );

if (!String.prototype.trim) {
  String.prototype.trim = function () {
    return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
  };
}

if (!Array.prototype.forEach) {
    Array.prototype.forEach = function (callbackfn, thisArg) {
        var O = Object(this),
            lenValue = O.length,
            len = lenValue >>> 0,
            T,
            k,
            Pk,
            kPresent,
            kValue;
 
        if (typeof callbackfn !== 'function') {
            throw new TypeError();
        }
 
        T = thisArg ? thisArg : undefined;
 
        k = 0;
        while (k < len) {
            Pk = k.toString();
            kPresent = O.hasOwnProperty(Pk);
            if (kPresent) {
                kValue = O[Pk];
                callbackfn.call(T, kValue, k, O);
            }
            k += 1;
        }
        return undefined;
    };
}
gadgetui.display = (function() {
	
	function getStyleRuleValue(style, selector, sheet) {
	    var sheets = typeof sheet !== 'undefined' ? [sheet] : document.styleSheets;
	    for (var i = 0, l = sheets.length; i < l; i++) {
	        var sheet = sheets[i];
	        if( !sheet.cssRules ) { continue; }
	        for (var j = 0, k = sheet.cssRules.length; j < k; j++) {
	            var rule = sheet.cssRules[j];
	            if (rule.selectorText && rule.selectorText.split(',').indexOf(selector) !== -1) {
	                return rule.style[style];
	            }
	        }
	    }
	    return null;
	}
function Bubble( selector, message, options ){
	this.selector = selector;
	this.message = message;
	this.config( options );
	this.render();
	this.setStyles();
	this.setBehaviors();
	this.show();
}

Bubble.prototype.render = function(){
	var span,
		arrowOutside,
		arrowInside,
		bubbleDiv = document.createElement( "div" );
	gadgetui.util.addClass( bubbleDiv, "gadgetui-bubble" );
	gadgetui.util.addClass( bubbleDiv, "gadgetui-bubble-" + this.bubbleType );
	bubbleDiv.setAttribute( "id", this.id );
	bubbleDiv.innerHTML = this.message;
	
	if( this.closable ){
		span = document.createElement( "span" );
		gadgetui.util.addClass( span, "oi" );
		span.setAttribute( 'data-glyph', "circle-x" );
		
	}
	arrowOutside = document.createElement( "div" );
	gadgetui.util.addClass( arrowOutside, "gadgetui-bubble-arrow-outside" );

	this.selector.parentNode.insertBefore( bubbleDiv, this.selector.nextSibling );
	this.bubbleSelector = document.getElementById( this.id );
	if( this.closable ){
		this.bubbleSelector.appendChild( span );
	}
	this.bubbleSelector.appendChild( arrowOutside );
	arrowInside = document.createElement( "div" );
	gadgetui.util.addClass( arrowInside, "gadgetui-bubble-arrow-inside" );	
	this.bubbleSelector.appendChild( arrowInside );
};

Bubble.prototype.show = function(){
	this.bubbleSelector.style.display = "block";
};

Bubble.prototype.setStyles = function(){

	//console.log( "top: " + this.top + ", left: " + this.left );
	this.setBubbleStyles();
	//console.log( "this.setBubbleStyles();" );
	//console.log( "top: " + this.top + ", left: " + this.left );
	this.calculateArrowPosition();
	//console.log( "this.calculateArrowPosition();" );
	//console.log( "top: " + this.top + ", left: " + this.left );
	this.calculateArrowStyle();
	//console.log( "this.calculateArrowStyle();" );
	//console.log( "top: " + this.top + ", left: " + this.left );
	this.setBeforeRules();
	//console.log( "this.setBeforeRules();" );
	//console.log( "top: " + this.top + ", left: " + this.left );
	this.setAfterRules();
	//console.log( "this.setAfterRules();" );
	//console.log( "top: " + this.top + ", left: " + this.left );
	this.calculatePosition();
	//console.log( "this.calculatePosition();" );
	//console.log( "top: " + this.top + ", left: " + this.left );

	this.bubbleSelector.style.top = this.top + "px";
	this.bubbleSelector.style.left = this.left + "px";

	this.spanElement = this.bubbleSelector.getElementsByTagName( "span" );
	var spanLeft = this.bubbleWidth - 6 - this.closeIconSize - this.borderWidth * 2,
		css = gadgetui.util.setStyle;
	css( this.spanElement[0], "left", spanLeft + "px" );
	css( this.spanElement[0], "position", "absolute" );
	css( this.spanElement[0], "cursor", "pointer"  );
	css( this.spanElement[0], "top", 6 + "px" );
	css( this.spanElement[0], "color", this.borderColor );
};

Bubble.prototype.setBubbleStyles = function(){
	var css = gadgetui.util.setStyle;
	css( this.bubbleSelector, "margin", 0 );
	css( this.bubbleSelector, "padding", this.padding + "px" );
	css( this.bubbleSelector, "width", this.width + "px" );
	css( this.bubbleSelector, "height", this.height + "px" );
	css( this.bubbleSelector, "line-height", this.lineHeight + "px" );
	css( this.bubbleSelector, "border-radius", this.borderRadius + "px" );
	
	css( this.bubbleSelector, "-moz-border-radius", this.borderRadius + "px" );
	css( this.bubbleSelector, "-webkit-border-radius", this.borderRadius + "px" );

	css( this.bubbleSelector, "-webkit-box-shadow", this.shadowSize + "px " + this.shadowSize + "px 4px " + this.boxShadowColor );
	css( this.bubbleSelector, "-moz-box-shadow", this.shadowSize + "px " + this.shadowSize + "px 4px " + this.boxShadowColor );
	css( this.bubbleSelector, "box-shadow", this.shadowSize + "px " + this.shadowSize + "px 4px " + this.boxShadowColor );

	css( this.bubbleSelector, "border", this.borderWidth + "px solid " + this.borderColor );
	css( this.bubbleSelector, "background-color", this.backgroundColor );
	css( this.bubbleSelector, "position", "absolute" );
	css( this.bubbleSelector, "text-align", "left" );
	css( this.bubbleSelector, "opacity", this.opacity );
	css( this.bubbleSelector, "font", this.font );
	css( this.bubbleSelector, "z-index", this.zIndex );
};

Bubble.prototype.setBeforeRules = function(){
	// set rules on paragraph :before pseudo-selector
	var css = gadgetui.util.setStyle,
		outside = this.bubbleSelector.getElementsByClassName( "gadgetui-bubble-arrow-outside" );
	css( outside[0], "content", " " );
	css( outside[0], "position", "absolute" );
	css( outside[0], "width", 0 );
	css( outside[0], "height", 0 );
	css( outside[0], "left", this.beforeArrowLeft + "px" );
	css( outside[0], "top", this.arrowTop + "px" );
	css( outside[0], "border", this.arrowSize + "px solid" );
	css( outside[0], "border-color", this.beforeBorderColor );
};

Bubble.prototype.setAfterRules = function(){
		var css = gadgetui.util.setStyle,
			inside = this.bubbleSelector.getElementsByClassName( "gadgetui-bubble-arrow-inside" );

		css( inside[0], "content", " " );
		css( inside[0], "position", "absolute" );
		css( inside[0], "width", 0 );
		css( inside[0], "height", 0 );
		css( inside[0], "left", this.afterArrowLeft + "px" );
		css( inside[0], "top", this.afterArrowTop + "px" );
		css( inside[0], "border", this.afterArrowSize + "px solid" );
		css( inside[0], "border-color", this.afterBorderColor );
};

Bubble.prototype.calculatePosition = function(){
	var self = this;
	// Here we must walk up the DOM to the ancestors of the selector to see whether they are set to position: relative. If that is the case,
	// we must add the offset values of the ancestor to the position values for the control or it will not be correctly placed.
	this.relativeOffset = gadgetui.util.getRelativeParentOffset( this.selector );

	//$.each(  this.position.split( " " ), function( ix, ele ){
	this.position.split( " " ).forEach( function( ele ){
		switch( ele ){
			case "top":
				self.top =  self.top - self.relativeOffset.top;
				break;
			case "bottom":
				self.top =  self.top + self.selector.offsetHeight - self.relativeOffset.top;
				//console.log( "self.top + self.selector.outerHeight() " + self.selector.outerHeight() );
				break;
			case "left":

				break;
			case "right":
				self.left = self.left + self.selector.offsetWidth - self.relativeOffset.left;
				//console.log( "self.left + self.selector.outerWidth() - self.relativeOffset.left " + self.selector.outerWidth() );
				break;
			case "center":
				self.left = self.left + self.selector.offsetWidth / 2  - self.relativeOffset.left;
				//console.log( "self.left + self.selector.outerWidth() / 2 - self.relativeOffset.left  " + self.selector.outerWidth() / 2);
				break;
			}
	});	
};

Bubble.prototype.calculateArrowPosition = function(){
	var doubleArrow = this.arrowSize * 2, 
		afterArrowCenter,
		doublePadding = this.padding * 2,
		arrowOffset = this.borderWidth + this.borderRadius + this.arrowSize,
		afterArrowOffset =  Math.floor( Math.sqrt( Math.pow( this.borderWidth, 2 ) + Math.pow( this.borderWidth, 2 ) ) ) - 1;
		
		this.afterArrowSize = this.arrowSize - afterArrowOffset;
		afterArrowCenter = ( doubleArrow - this.afterArrowSize * 2) / 2;
	switch( this.arrowPositionArray[0] ){
		case "left":
			this.beforeArrowLeft = -doubleArrow;
			this.afterArrowLeft = -this.afterArrowSize * 2;
			this.left = this.left + this.arrowSize - this.borderWidth;
			//console.log( "this.left + this.arrowSize - this.borderWidth" );
			break;
		case "right":
			this.beforeArrowLeft = this.width + doublePadding;
			this.afterArrowLeft = this.beforeArrowLeft;
			this.left = this.left - this.bubbleWidth - this.arrowSize + this.borderWidth;
			//console.log( "this.left - this.bubbleWidth - this.arrowSize + this.borderWidth" );
			break;
		case "top":
			this.arrowTop = -( doubleArrow );
			this.afterArrowTop = -( this.afterArrowSize * 2 );			
			this.top = this.top + this.arrowSize - this.borderWidth;
			//console.log( "this.top + this.arrowSize - this.borderWidth" );
			break;
		case "bottom":

			this.arrowTop = this.height + doublePadding;
			this.afterArrowTop = this.arrowTop;
			this.top = this.top - this.bubbleHeight - this.arrowSize + this.borderWidth;
			//console.log( "this.top - this.bubbleHeight - this.arrowSize + this.borderWidth" );
			break;
	}

	switch( this.arrowPositionArray[1] ){
		case "top":
			this.arrowTop = this.borderRadius;
			this.afterArrowTop = this.arrowTop + afterArrowCenter;
			this.top = this.top - arrowOffset;
			//console.log( "this.top - arrowOffset" );
			break;
		case "bottom":

			this.arrowTop = this.bubbleHeight - this.borderWidth * 2 - doubleArrow - this.borderRadius;
			this.afterArrowTop = this.arrowTop + afterArrowCenter;
			this.top = this.top - this.bubbleHeight + arrowOffset;
			//console.log( "this.top - this.bubbleHeight + arrowOffset" );
			break;
		case "right":
			this.beforeArrowLeft = this.bubbleWidth - this.borderWidth * 2 - doubleArrow - this.borderRadius;
			this.afterArrowLeft = this.beforeArrowLeft + afterArrowOffset;
			this.left = this.left - this.bubbleWidth + arrowOffset;
			//console.log( "this.left - this.bubbleWidth + arrowOffset" );
			break;
		case "left":
			this.beforeArrowLeft = this.borderRadius;
			this.afterArrowLeft = this.beforeArrowLeft + afterArrowOffset;
			this.left = this.left - arrowOffset;
			//console.log( "this.left - arrowOffset" );
			break;
	}

};

Bubble.prototype.calculateArrowStyle = function(){
	var colorArray = [], arrowStart = this.arrowPositionArray[0], arrowEnd = this.arrowPositionArray[1] + " " + this.arrowDirection;

	
	if( this.arrowDirection === 'middle' ){
		switch( this.arrowPositionArray[0] ){
		case "top":
			this.beforeBorderColor = "transparent transparent " + this.borderColor + " transparent";
			this.afterBorderColor = "transparent transparent #fff transparent";	
			break;
		case "bottom":
			this.beforeBorderColor = this.borderColor + " transparent transparent transparent";
			this.afterBorderColor = "#fff transparent transparent transparent";
			break;
		case "right":
			this.beforeBorderColor = "transparent transparent transparent " + this.borderColor;
			this.afterBorderColor = "transparent transparent transparent #fff";			
			break;
		case "left":
			this.beforeBorderColor = "transparent " + this.borderColor + " transparent transparent";
			this.afterBorderColor = "transparent #fff transparent transparent";			
			break;
		}
	}else{
		if( arrowStart === 'top' || arrowEnd === 'bottom corner' || arrowEnd === 'top center' ){
			colorArray[0] = 'transparent';
			colorArray[2] =  this.borderColor;
		}else if( arrowStart === 'bottom' || arrowEnd === 'bottom center' || arrowEnd === 'top corner' ){
			colorArray[0] = this.borderColor;
			colorArray[2] =  'transparent';
		}
	
		if( arrowStart === 'right' || arrowEnd === 'left corner' || arrowEnd === 'right center' ){
			colorArray[1] = 'transparent';
			colorArray[3] =  this.borderColor;
		}else if( arrowStart === 'left' || arrowEnd === 'left center' || arrowEnd === 'right corner' ){
			colorArray[1] =  this.borderColor;
			colorArray[3] = 'transparent';
		}

		this.beforeBorderColor = colorArray.toString().replace( /\),/gi, ") " ).replace( /,transparent/gi, " transparent" ).replace( /transparent,/gi, "transparent " );
		this.afterBorderColor = this.beforeBorderColor.replace( this.borderColor, "#fff", "g" );
		//console.log( this.beforeBorderColor );
		//console.log( this.afterBorderColor );
	}
	
};

Bubble.prototype.setBehaviors = function(){
	var self = this,
		css = gadgetui.util.setStyle;
	//$( "span", this.bubbleSelector )
	this.spanElement[0]
		.addEventListener( "click", function(){
				css( self.bubbleSelector, "display", 'none' );
				self.bubbleSelector.parentNode.removeChild( self.bubbleSelector );
			});

	if( this.autoClose ){
		closeBubble = function(){
			css( self.bubbleSelector, "display", 'none' );
			self.bubbleSelector.parentNode.removeChild( self.bubbleSelector );
		};
		setTimeout( closeBubble, this.autoCloseDelay );
	}
};

Bubble.prototype.config = function( options ){
	options = ( options === undefined ? {} : options );
	//var baseUIColor = getStyleRuleValue( "color", ".ui-state-active" );
	var baseUIColor = "silver";
	this.bubbleType = ( options.bubbleType === undefined ? "speech" : options.bubbleType );
	this.id = "gadgetui-bubble-" + gadgetui.util.Id();
	this.height = ( options.height === undefined ? 100 : options.height );
	this.position = ( options.position === undefined ? "top right" : options.position ); // position of arrow tip on selector - top right | bottom right | top center | bottom center | top left | bottom left
	this.width = ( options.width === undefined ? 200 : options.width ); // width of bubble
	this.padding = ( options.padding === undefined ? 20 : options.padding ); // interior padding of bubble
	this.opacity = ( options.opacity === undefined ? 1 : options.opacity ); // interior padding of bubble
	// baseline position
	this.top = gadgetui.util.getOffset( this.selector ).top;
	//console.log( "initial top: " + this.top );
	this.left = gadgetui.util.getOffset( this.selector ).left;
	//console.log( "initial left: " + this.left );
	this.shadowColor = ( options.shadowColor === undefined ? baseUIColor : options.shadowColor );
	this.shadowSize = 2; // shadow 
	this.borderColor = ( options.borderColor === undefined ? baseUIColor : options.borderColor );
	this.borderWidth = ( options.borderWidth === undefined ? 8 : options.borderWidth ); //	border: 8px solid #CC4B4B; // width of bubble border
	this.arrowPosition = ( options.arrowPosition === undefined ? "bottom left" : options.arrowPosition ); // location of arrow on bubble - top left | top right | top center | right top | right center | right bottom | bottom right | bottom center | bottom right | left bottom | left center | left top 
	this.arrowDirection =  ( options.arrowDirection === undefined ? "middle" : options.arrowDirection ); // direction arrow points - center | corner | middle
	this.arrowPositionArray = this.arrowPosition.split( " " );
	this.bubbleWidth = this.width + (this.padding * 2) + (this.borderWidth * 2); // full width of visible bubble
	this.bubbleHeight = this.height + (this.padding * 2) + (this.borderWidth * 2); // full height of visible bubble
	//this.setArrowDirection();

	this.closeIconSize = 13; // ui-icon css
	this.arrowSize = ( options.arrowSize === undefined ? 25 : options.arrowSize ); // half size of arrow 
	this.backgroundColor = ( options.backgroundColor === undefined ? "#FFFFFF" : options.backgroundColor );
	this.lineHeight = ( options.lineHeight === undefined ? "1.2em" : options.lineHeight ); // line height of text in bubble
	this.borderRadius = ( options.borderRadius === undefined ? 30 : options.borderRadius );	//border-radius
	this.boxShadowColor = ( options.boxShadowColor === undefined ? baseUIColor : options.boxShadowColor );
	this.font = ( options.font === undefined ? "1em Arial sans" : options.font );
	this.zIndex = ( options.zIndex === undefined ? 100 : options.zIndex );
	this.closable = ( options.closable === undefined ? false : options.closable );
	this.autoClose = ( options.autoClose === undefined ? false : options.autoClose );
	this.autoCloseDelay = ( options.autoCloseDelay === undefined ? 5000 : options.autoCloseDelay );
	this.relativeOffset = { left: 0, top: 0 };
};

function CollapsiblePane( selector, options ){

	this.selector = selector;
	this.config( options );
	
	this.addControl();

	this.addCSS();
	this.addHeader();
	
	this.icon = this.wrapper.querySelector( "div.oi" );
	
	this.addBindings();
	this.height = this.wrapper.offsetHeight;
	this.headerHeight = this.header.offsetHeight;
	this.selectorHeight = this.selector.offsetHeight;
	if( this.collapse === true ){
		this.toggle();
	}		
}
	

CollapsiblePane.prototype.addControl = function(){
	var pane = document.createElement( "div" );
	
	gadgetui.util.addClass( pane, "gadget-ui-collapsiblePane" );
	this.selector.parentNode.insertBefore( pane, this.selector );
	this.wrapper = this.selector.previousSibling;
	this.selector.parentNode.removeChild( this.selector );
	pane.appendChild( this.selector );
	
	//$( this.selector ).wrap( '<div class="gadget-ui-collapsiblePane ui-corner-all ui-widget-content"></div>' );
};

CollapsiblePane.prototype.addHeader = function(){
	var div,
		header = document.createElement( "div" );
	header.setAttribute( "style", "padding: 2px 0px 2px .5em; text-align: left; border-radius: " + this.borderRadius + "px; border: 1px solid "  + this.borderColor + "; background: " + this.headerBackgroundColor + "; color: " + this.headerColor + "; font-weight: bold; font: " + this.font );
	gadgetui.util.addClass( header, "gadget-ui-collapsiblePane-header" );
	header.innerHTML = this.title;
	this.wrapper.insertBefore( header, this.selector );
	this.header = this.wrapper.querySelector( "div.gadget-ui-collapsiblePane-header" );
	div = document.createElement( "div" );
	gadgetui.util.addClass( div, "oi" );
	div.setAttribute( 'data-glyph', "caret-top" );
	this.header.appendChild( div );
	//this.wrapper.prepend( '<div class="ui-widget-header ui-corner-all gadget-ui-collapsiblePane-header">' + this.title + '<div class="ui-icon ui-icon-triangle-1-n"></div></div>');
};

CollapsiblePane.prototype.addCSS = function(){
	var theWidth = this.width;
/*		if( parseInt( this.width, 10 ) > 0 ){
		theWidth = theWidth;
	}	*/
	//copy width from selector
	//if( !this.wrapper.style ){
		this.wrapper.setAttribute( "style", "width: " + theWidth + "; border: 1px solid "  + this.borderColor + "; border-radius: " + this.borderRadius + "px; overflow: hidden;");
	//}else{
	//	this.wrapper.style.width = this.width + "px";
	//}
	
	//now make the width of the selector to fill the wrapper
	if( !this.selector.style ){
		this.selector.setAttribute( "style", "padding: " + this.padding + "px;" );
	}
	
};

CollapsiblePane.prototype.addBindings = function(){
	var self = this, header = this.wrapper.querySelector(  "div.gadget-ui-collapsiblePane-header" );
	header
		.addEventListener( "click", function(){
			self.toggle();
		});

};


CollapsiblePane.prototype.toggle = function(){
	var self = this, 
		icon,
		myHeight,
		display,
		border,
		selectorHeight,
		expandClass = "caret-bottom", 
		collapseClass = "caret-top";
	if( this.collapsed === true ){
		icon = collapseClass;
		display = "block";
		myHeight = this.height;
		selectorHeight = this.selectorHeight;
		border = "1px solid " + this.borderColor;
		this.collapsed = false;
	}else{
		icon = expandClass;
		display = "none";
		myHeight = this.headerHeight;
		selectorHeight = 0;
		border = "1px solid transparent";
		this.collapsed = true;
	}
	
	self.eventName = ( ( self.eventName === "collapse" ) ? "expand" : "collapse" );
	self.selector.style.padding = self.padding + "px";
	self.selector.style.paddingTop = self.paddingTop + "px";

	var ev = new Event( self.eventName );
	self.selector.dispatchEvent( ev );
	
	if( typeof Velocity != 'undefined' ){
		if( display === "block" ){
			self.wrapper.style.border = border;
		}
		Velocity( this.wrapper, {
			height: myHeight
		},{ queue: false, duration: 500, complete: function() {
			//self.selector.style.display = display;
			//self.wrapper.style.border = border;
			self.icon.setAttribute( "data-glyph", icon );
			} 
		});
		Velocity( this.selector, {
			height: selectorHeight
		},{ queue: false, duration: 500, complete: function() {

			} 
		});			
	}else{
		self.selector.style.display = display;
		self.icon.setAttribute( "data-glyph", icon );
	}
	/*		.toggle( 'blind', {}, 200, function(  ) {
			$( self.icon ).addClass( add )
						.removeClass( remove );
			$( this ).css( "padding", self.padding );
			self.selector.trigger( self.eventName );
		});	*/
};

CollapsiblePane.prototype.config = function( options ){
	options = ( options === undefined ? {} : options );
	this.title = ( options.title === undefined ? "": options.title );
	this.path = ( options.path === undefined ? "/bower_components/gadget-ui/dist/": options.path );
	this.padding = ( options.padding === undefined ? ".5em": options.padding );
	this.paddingTop = ( options.paddingTop === undefined ? ".3em": options.paddingTop );
	this.width = ( options.width === undefined ? gadgetui.util.getStyle( this.selector, "width" ) : options.width );
	this.interiorWidth = ( options.interiorWidth === undefined ? "": options.interiorWidth );
	this.collapse = ( ( options.collapse === undefined || options.collapse === false ? false : true ) );
	this.borderColor = ( options.borderColor === undefined ? "silver": options.borderColor );
	this.headerColor = ( options.headerColor === undefined ? "black": options.headerColor );
	this.headerBackgroundColor = ( options.headerBackgroundColor === undefined ? "silver": options.headerBackgroundColor );
	this.borderRadius = ( options.borderRadius === undefined ? 6 : options.borderRadius );
};

	function FloatingPane( selector, options ){

	this.selector = selector;
	if( options !== undefined ){
		this.config( options );
	}
	
	this.addControl();
	this.addHeader();
	this.maxmin = this.wrapper.querySelector( "div.oi" );
	
	this.addCSS();

	// now set height to computed height of control that has been created
	this.height = gadgetui.util.getStyle( this.wrapper, "height" );

	this.relativeOffsetLeft = gadgetui.util.getRelativeParentOffset( this.selector ).left;
	this.addBindings();
}

FloatingPane.prototype.addBindings = function(){
	var self = this;
	// jquery-ui draggable
	//this.wrapper.draggable( {addClasses: false } );
	gadgetui.util.draggable( this.wrapper );
	
	this.maxmin.addEventListener( "click", function(){
		if( self.minimized ){
			self.expand();
		}else{
			self.minimize();
		}
	});
};

FloatingPane.prototype.addHeader = function(){
	this.header = document.createElement( "div" );
	this.header.innerHTML = this.title;
	gadgetui.util.addClass( this.header, 'gadget-ui-floatingPane-header' );
	this.header.setAttribute( "style", "padding: 2px 0px 2px .5em; text-align: left; border-radius: " + this.borderRadius + "px; border: 1px solid "  + this.borderColor + "; background: " + this.headerBackgroundColor + "; color: " + this.headerColor + "; font-weight: bold; font: " + this.font );
	this.icon = document.createElement( "div" );
	gadgetui.util.addClass( this.icon, "oi" );
	this.header.insertBefore( this.icon, undefined );
	this.wrapper.insertBefore( this.header, this.selector );
	this.icon.setAttribute( 'data-glyph', "fullscreen-exit" );
	this.header.appendChild( this.icon );	
	//this.wrapper.prepend( '<div class="ui-widget-header ui-corner-all gadget-ui-floatingPane-header">' + this.title + '<div class="ui-icon ui-icon-arrow-4"></div></div>');
};

FloatingPane.prototype.addCSS = function(){
	//copy width from selector
	this.wrapper.setAttribute( "style", "width: " + this.width + "; border: 1px solid "  + this.borderColor + "; border-radius: " + this.borderRadius + "px;");
	//.css( "width", this.width )
	this.wrapper.style.minWidth = this.minWidth;
	this.wrapper.style.opacity = this.opacity;
	this.wrapper.style.zIndex = this.zIndex;
	
	//now make the width of the selector to fill the wrapper
	this.selector.setAttribute( "style", "width: " + this.interiorWidth + "px; padding: " + this.padding + "px;" );
/*			.css( "width", this.interiorWidth )
		.css( "padding", this.padding );	*/
	
	this.maxmin.setAttribute( "style", "float: right; display: inline;" );
	/*		.css( "float", "right" )
		.css( "display", "inline" );	*/
};

FloatingPane.prototype.addControl = function(){
	var fp = document.createElement( "div" );
	gadgetui.util.addClass( fp, "gadget-ui-floatingPane" );
	
	this.selector.parentNode.insertBefore( fp, this.selector );
	this.wrapper = this.selector.previousSibling;
	this.selector.parentNode.removeChild( this.selector );
	fp.appendChild( this.selector );
	
};

FloatingPane.prototype.expand = function(){
	// when minimizing and expanding, we must look up the ancestor chain to see if there are position: relative elements.
	// if so, we must subtract the offset left of the ancestor to get the pane back to its original position
	
	var self = this, 
		offset = gadgetui.util.getOffset( this.wrapper ),
		lx =  parseInt( new Number( offset.left ), 10 ) - this.relativeOffsetLeft,
		width = parseInt( this.width.substr( 0,this.width.length - 2), 10 );
	
	if( typeof Velocity != 'undefined' ){
		
		Velocity( this.wrapper, {
			left: lx - width + self.minWidth
		},{queue: false, duration: 500}, function() {
			// Animation complete.
		});
	
		Velocity( this.wrapper, {
			width: this.width
		},{queue: false, duration: 500}, function() {
			// Animation complete.
		});
	
		Velocity( this.wrapper, {
			height: this.height
		},{queue: false, duration: 500, complete: function() {
			self.icon.setAttribute( "data-glyph", "fullscreen-exit" );
		}
		});
	}else{
		this.wrapper.style.left = ( lx - width + this.minWidth ) + "px";
		this.wrapper.style.width = this.width;
		this.wrapper.style.height = this.height;
		this.icon.setAttribute( "data-glyph", "fullscreen-exit" );
	}
	this.minimized = false;
};

FloatingPane.prototype.minimize = function(){
	// when minimizing and maximizing, we must look up the ancestor chain to see if there are position: relative elements.
	// if so, we must subtract the offset left of the ancestor to get the pane back to its original position
	
	var self = this, offset = gadgetui.util.getOffset( this.wrapper ),
		lx =  parseInt( new Number( offset.left ), 10 ) - this.relativeOffsetLeft,
		width = parseInt( this.width.substr( 0,this.width.length - 2), 10 );

	if( typeof Velocity != 'undefined' ){
			
		Velocity( this.wrapper, {
			left: lx + width - self.minWidth
		},{queue: false, duration: 500}, function() {
	
		});
	
		Velocity( this.wrapper, {
			width: self.minWidth
		},{queue: false, duration: 500, complete: function() {
			self.icon.setAttribute( "data-glyph", "fullscreen-enter" );
			}
		});
	
		Velocity( this.wrapper, {
			height: "50px"
		},{queue: false, duration: 500}, function() {
			// Animation complete.
		});
	}else{
		this.wrapper.style.left = ( lx + width - this.minWidth ) + "px";
		this.wrapper.style.width = this.minWidth + "px";
		this.wrapper.style.height = "50px";
		this.icon.setAttribute( "data-glyph", "fullscreen-enter" );
	}
	this.minimized = true;
};

FloatingPane.prototype.config = function( options ){
	options = ( options === undefined ? {} : options );
	this.title = ( options.title === undefined ? "": options.title );
	this.path = ( options.path === undefined ? "/bower_components/gadget-ui/dist/": options.path );
	this.position = ( options.position === undefined ? { my: "right top", at: "right top", of: window } : options.position );
	this.padding = ( options.padding === undefined ? "15px": options.padding );
	this.paddingTop = ( options.paddingTop === undefined ? ".3em": options.paddingTop );
	this.width = ( options.width === undefined ? gadgetui.util.getStyle( this.selector, "width" ) : options.width );
	this.minWidth = ( this.title.length > 0 ? Math.max( 100, this.title.length * 10 ) + 20 : 100 );

	this.height = ( options.height === undefined ? gadgetui.util.getNumberValue( gadgetui.util.getStyle( this.selector, "height" ) ) + ( gadgetui.util.getNumberValue( this.padding ) * 2 ) : options.height );
	this.interiorWidth = ( options.interiorWidth === undefined ? "": options.interiorWidth );
	this.opacity = ( ( options.opacity === undefined ? 1 : options.opacity ) );
	this.zIndex = ( ( options.zIndex === undefined ? 100000 : options.zIndex ) );
	this.minimized = false;
	this.relativeOffsetLeft = 0;
	this.borderColor = ( options.borderColor === undefined ? "silver": options.borderColor );
	this.headerColor = ( options.headerColor === undefined ? "black": options.headerColor );
	this.headerBackgroundColor = ( options.headerBackgroundColor === undefined ? "silver": options.headerBackgroundColor );
	this.borderRadius = ( options.borderRadius === undefined ? 6 : options.borderRadius );	
};



	return{
		Bubble : Bubble,
		CollapsiblePane: CollapsiblePane,
		FloatingPane: FloatingPane
	};
}());
gadgetui.input = (function() {
	
	
function ComboBox( selector, options ){

	this.emitEvents = true;
	this.model = gadgetui.model;
	this.func;

	this.selector = selector;
	this.config( options );
	this.setSaveFunc();
	this.setDataProviderRefresh();
	// bind to the model if binding is specified
	gadgetui.util.bind( this.selector, this.model );
	this.addControl();
	this.setCSS();
	this.addBehaviors();
	this.setStartingValues();
}

ComboBox.prototype.addControl = function(){
	var css = gadgetui.util.setStyle;
	this.comboBox = gadgetui.util.createElement( "div" );
	this.input = gadgetui.util.createElement( "input" );
	this.label = gadgetui.util.createElement( "div" );
	this.inputWrapper = gadgetui.util.createElement( "div" );
	this.selectWrapper = gadgetui.util.createElement( "div" );

	gadgetui.util.addClass( this.comboBox, "gadgetui-combobox" );	
	gadgetui.util.addClass( this.input, "gadgetui-combobox-input" );
	gadgetui.util.addClass( this.label, "gadgetui-combobox-label" );
	gadgetui.util.addClass( this.inputWrapper, "gadgetui-combobox-inputwrapper" );
	gadgetui.util.addClass( this.selectWrapper,"gadgetui-combobox-selectwrapper" );

	this.selector.parentNode.insertBefore( this.comboBox, this.selector );
	this.selector.parentNode.removeChild( this.selector );
	this.comboBox.appendChild( this.label );
	
	this.selectWrapper.appendChild( this.selector );
	this.comboBox.appendChild( this.selectWrapper );
	this.inputWrapper.appendChild( this.input );
	this.comboBox.appendChild( this.inputWrapper );
	this.label.setAttribute( "data-id", this.id );
	this.label.innerHTML = this.text;
	this.input.setAttribute( "placeholder", this.newOption.text );
	this.input.setAttribute( "type", "text" );
	this.input.setAttribute( "name", "custom" );
	
	css( this.comboBox, "opacity", ".0" );
};

ComboBox.prototype.setCSS = function(){
	var self = this,

	promise = new Promise(
		function( resolve, reject ){
			self.getArrowWidth( resolve, reject );
		});
	promise
		.then( function(){
			self.addCSS();
		});
	promise['catch']( function( message ){
			// use width of default icon
			self.arrowWidth = 22;
			console.log( message );
			self.addCSS();
		});
};

ComboBox.prototype.getArrowWidth = function( resolve, reject ){
	var self = this, 
		img = new Image();
		img.onload = function() {
			self.arrowWidth = this.width;
			resolve();
		};
		img.onerror = function(){
			reject( "Icon was not loaded." );
		};
		img.src = this.arrowIcon;
};

ComboBox.prototype.addCSS = function(){
	var css = gadgetui.util.setStyle;
	gadgetui.util.addClass( this.selector, "gadgetui-combobox-select" );
	css( this.selector, "width", this.width + "px" ); 
	css( this.selector, "border",  0 ); 
	css( this.selector, "display",  "inline" ); 
	css( this.comboBox, "position",  "relative" ); 

	var styles = gadgetui.util.getStyle( this.selector ),
		inputWidth = this.selector.clientWidth,
		inputWidthAdjusted,
		inputLeftOffset = 0,
		selectMarginTop = 0,
		selectLeftPadding = 0,
		leftOffset = 0,
		inputWrapperTop = this.borderWidth,
		inputLeftMargin,
		leftPosition;
  
	leftPosition = this.borderWidth + 4;

	if( this.borderRadius > 5 ){
		selectLeftPadding = this.borderRadius - 5;
		leftPosition = leftPosition + selectLeftPadding;
	}
	inputLeftMargin = leftPosition;
	inputWidthAdjusted = inputWidth - this.arrowWidth - this.borderRadius - 4;
	console.log( navigator.userAgent );
	if( navigator.userAgent.match( /(Safari)/ ) && !navigator.userAgent.match( /(Chrome)/ )){
		inputWrapperTop = this.borderWidth - 2;
		selectLeftPadding = (selectLeftPadding < 4 ) ? 4 : this.borderRadius - 1;
		selectMarginTop = 1;
	}else if( navigator.userAgent.match( /Edge/ ) ){
		selectLeftPadding = (selectLeftPadding < 1 ) ? 1 : this.borderRadius - 4;
		inputLeftMargin--;
	}else if( navigator.userAgent.match( /MSIE/) ){
		selectLeftPadding = (selectLeftPadding < 1 ) ? 1 : this.borderRadius - 4;
	}else if( navigator.userAgent.match( /Trident/ ) ){
		selectLeftPadding = (selectLeftPadding < 2 ) ? 2 : this.borderRadius - 3;
	}else if( navigator.userAgent.match( /Chrome/ ) ){
		selectLeftPadding = (selectLeftPadding < 4 ) ? 4 : this.borderRadius - 1;
		selectMarginTop = 1;
	}

	// positioning 
	css( this.selector, "margin-top", selectMarginTop + "px" ); 
	css( this.selector, "padding-left", selectLeftPadding + "px" ); 
	
	
	css( this.inputWrapper, "position",  "absolute" ); 
	css( this.inputWrapper, "top", inputWrapperTop + "px" );
	css( this.inputWrapper,"left",leftOffset + "px" );

	css( this.input, "display",  "inline" ); 
	css( this.input,"padding-left",inputLeftOffset + "px" );
	css( this.input,"margin-left",inputLeftMargin + "px" );
	css( this.input, "width", inputWidthAdjusted + "px" ); 

	css( this.label, "position",  "absolute" ); 
	css( this.label,"left",leftPosition + "px" );
	css( this.label,"top",( this.borderWidth + 1 ) + "px" );
	css( this.label, "margin-left", 0 );

	css( this.selectWrapper, "display",  "inline" ); 
	css( this.selectWrapper, "position",  "absolute" ); 
	css( this.selectWrapper, "padding-bottom",  "1px" ); 
	css( this.selectWrapper, "left", 0 );

	//appearance 
	css( this.comboBox, "font-size", styles.fontSize );	

	css( this.selectWrapper, "background-color", this.backgroundColor );
	css( this.selectWrapper, "border-color", this.borderColor ); 
	css( this.selectWrapper, "border-style", this.borderStyle ); 
	css( this.selectWrapper, "border-width", this.borderWidth ); 
	css( this.selectWrapper, "border-radius", this.borderRadius + "px" ); 

	css( this.input, "border", 0 );
	css( this.input, "font-size", styles.fontSize );
	css( this.input, "background-color", this.inputBackground );


	css( this.label, "font-family", styles.fontFamily );
	css( this.label, "font-size", styles.fontSize );
	css( this.label, "font-weight", styles.fontWeight );
	// add rules for arrow Icon
	//we're doing this programmatically so we can skin our arrow icon
	if( navigator.userAgent.match( /Firefox/) ){
		
		css( this.selectWrapper, "background-image",  "url('" + this.arrowIcon + "')" ); 
		css( this.selectWrapper, "background-repeat",  "no-repeat" ); 
		css( this.selectWrapper, "background-position",  "right center" ); 

		if( this.scaleIconHeight === true ){
			css( this.selectWrapper, background-size,  this.arrowWidth + "px " + inputHeight + "px" ); 
		}
	}
	css( this.selector, "-webkit-appearance",  "none" ); 
	css( this.selector, "-moz-appearance",  "window" ); 
	css( this.selector, "background-image",  "url('" + this.arrowIcon + "')" ); 
	css( this.selector, "background-repeat",  "no-repeat" ); 
	css( this.selector, "background-position",  "right center" ); 

	if( this.scaleIconHeight === true ){
		css( this.selector, "background-size",  this.arrowWidth + "px " + inputHeight + "px" ); 
	}

	css( this.inputWrapper, "display", 'none' );
	css( this.selectWrapper, "display", 'none' );
	css( this.comboBox, "opacity",  1 ); 
};

ComboBox.prototype.setSelectOptions = function(){
	var self = this, id, text, option;

	
	while (self.selector.options.length > 0) {                
		self.selector.remove(0);
    }      
	//console.log( "append new option" );
	option = gadgetui.util.createElement( "option" );
	option.value = self.newOption.id;
	option.text = self.newOption.text;
	self.selector.add( option );

	this.dataProvider.data.forEach( function( obj ){
		id = obj.id;
		text = obj.text;
		if( text === undefined ){ 
			text = id; 
		}
		option = gadgetui.util.createElement( "option" );
		option.value = id;
		option.text = text;

		self.selector.add( option );
	});
};

ComboBox.prototype.find = function( text ){
	var ix;
	for( ix = 0; ix < this.dataProvider.data.length; ix++ ){
		if( this.dataProvider.data[ix].text === text ){
			return this.dataProvider.data[ix].id;
		}
	}
	return;
};

ComboBox.prototype.getText = function( id ){
	var ix, 
		compId = parseInt( id, 10 );
	if( isNaN( compId ) === true ){
		compId = id;
	}
	for( ix = 0; ix < this.dataProvider.data.length; ix++ ){
		if( this.dataProvider.data[ix].id === compId ){
			return this.dataProvider.data[ix].text;
		}
	}
	return;
};
ComboBox.prototype.showLabel = function(){
	var css = gadgetui.util.setStyle;
	css( this.label, "display", "inline-block" );
	css( this.selectWrapper, "display", 'none' );
	css( this.inputWrapper, "display", 'none' );
};

ComboBox.prototype.addBehaviors = function( obj ) {
	var self = this;
	// setup mousePosition
	if( gadgetui.mousePosition === undefined ){
		document
			.addEventListener( "mousemove", function(ev){ 
				ev = ev || window.event; 
				gadgetui.mousePosition = gadgetui.util.mouseCoords(ev); 
			});
	}

	this.comboBox
		.addEventListener( this.activate, function( ) {
			setTimeout( function( ) {
				if( self.label.style.display != "none" ){
					console.log( "combo mouseenter ");
					//self.label.style.display = "none" );
					self.selectWrapper.style.display = "inline";
					self.label.style.display = "none";
					if( self.selector.selectedIndex <= 0 ) {
						self.inputWrapper.style.display = "inline";
					}
				}
			}, self.delay );
		});
	this.comboBox
		.addEventListener( "mouseleave", function( ) {
			console.log( "combo mouseleave ");
			if ( self.selector != document.activeElement && self.input != document.activeElement ) {
				self.showLabel();
			}
		});

	self.input
		.addEventListener( "click", function( e ){
			console.log( "input click ");
		});
	self.input
		.addEventListener( "keyup", function( event ) {
			console.log( "input keyup");
			if ( event.which === 13 ) {
				var inputText =  gadgetui.util.encode( self.input.value );
				self.handleInput( inputText );
			}
		});
	self.input
		.addEventListener( "blur", function( ) {
			console.log( "input blur" );

			if( gadgetui.util.mouseWithin( self.selector, gadgetui.mousePosition ) === true ){
				self.inputWrapper.style.display = 'none';
				self.selector.focus();
			}else{
				self.showLabel();
			}
		});

	this.selector
		.addEventListener( "mouseenter", function( ev ){
			self.selector.style.display = "inline";
		});
	this.selector
		.addEventListener( "click", function( ev ){
			console.log( "select click");
			ev.stopPropagation();
		});
	this.selector
		.addEventListener( "change", function( event ) {
			if( parseInt( event.target[ event.target.selectedIndex ].value, 10 ) !== parseInt(self.id, 10 ) ){
				console.log( "select change");
				if( event.target.selectedIndex > 0 ){
					self.inputWrapper.style.display = 'none';
					self.setValue( event.target[ event.target.selectedIndex ].value );
				}else{
					self.inputWrapper.style.display = 'block';
					self.setValue( self.newOption.value );
					self.input.focus();
				}
				gadgetui.util.trigger( self.selector, "gadgetui-combobox-change", { id: event.target[ event.target.selectedIndex ].value, text: event.target[ event.target.selectedIndex ].innerHTML } );
			}
		});
	this.selector
		.addEventListener( "blur", function( event ) {
			console.log( "select blur ");
			event.stopPropagation();
			setTimeout( function( ) {
				//if( self.emitEvents === true ){

				if( self.input !== document.activeElement ){
					self.showLabel();
				}
			}, 200 );
		});
	
/*		$( "option", this.selector
		.on( "mouseenter", function( ev ){
			console.log( "option mouseenter" );
			if( self.selector.css( "display" ) !== "inline" ){
				self.selector.style.display = "inline";
			}
		});	*/
};

ComboBox.prototype.handleInput = function( inputText ){
	var id = this.find( inputText ),
		css = gadgetui.util.setStyle;
	if( id !== undefined ){
		this.selector.value = id;
		this.label.innerText = inputText;
		this.selector.focus();
		this.input.value = '';
		css( this.inputWrapper, "display", 'none' );
	}
	else if ( id === undefined && inputText.length > 0 ) {
		this.save( inputText );
	}
};

ComboBox.prototype.triggerSelectChange = function(){
	console.log("select change");
	var ev = new Event( "change", {
	    view: window,
	    bubbles: true,
	    cancelable: true
	  });
	this.selector.dispatchEvent( ev );
};

ComboBox.prototype.setSaveFunc = function(){
	var self = this;

	if( this.save !== undefined ){
		var save = this.save;
		this.save = function( text ) {
			var that = this,
				func,  
				promise, 
				args = [ text ],
				value = this.find( text );
			if( value === undefined ){	
				console.log( "save: " + text );

				promise = new Promise(
						function( resolve, reject ){
							args.push( resolve );
							args.push( reject );
							func = save.apply(that, args);
							console.log( func );
						});
				promise.then(
						function( value ){
							function callback(){
								// trigger save event if we're triggering events 
								//if( self.emitEvents === true ){
								gadgetui.util.trigger( self.selector, "gadgetui-combobox-save", { id: value, text: text } );
									//self.selector.dispatchEvent( new Event( "gadgetui-combobox-save" ), { id: value, text: text } );
								//}
								self.input.value = '';
								self.inputWrapper.style.display = 'none';
								self.id = value;
								self.dataProvider.refresh();
							}
							if( self.animate === true && typeof Velocity !== "undefined" ){
								Velocity( self.selectWrapper, {
									boxShadow: '0 0 5px ' + self.glowColor,
									borderColor: self.glowColor
								  }, self.animateDelay / 2, function(){
									 self.selectWrapper.style.borderColor = self.glowColor;
								  } );							
								Velocity( self.selectWrapper, {
									boxShadow: 0,
									borderColor: self.borderColor
								  }, self.animateDelay / 2, callback );
							}else{
								callback();
							}
						});
				promise['catch']( function( message ){
					self.input.value= '';
					self.inputWrapper.hide();
					console.log( message );
					self.dataProvider.refresh();

				});
			}
		    return func;
		};
	}
};

ComboBox.prototype.setStartingValues = function(){
	( this.dataProvider.data === undefined ) ? this.dataProvider.refresh() : this.setControls();
};

ComboBox.prototype.setControls = function(){
	console.log( this );
	this.setSelectOptions();
	this.setValue( this.id );	
	this.triggerSelectChange();
};

ComboBox.prototype.setValue = function( id ){
	var text = this.getText( id );
	console.log( "setting id:" + id );
	// value and text can only be set to current values in this.dataProvider.data, or to "New" value
	this.id = ( text === undefined ? this.newOption.id : id );
	text = ( text === undefined ? this.newOption.text : text );

	this.text = text;
	this.label.innerText = this.text;
	this.selector.value = this.id;
};

ComboBox.prototype.setDataProviderRefresh = function(){
	var self = this,
		promise,
		refresh = this.dataProvider.refresh,
		func;
	this.dataProvider.refresh = function(){
		var scope = this;
		if( refresh !== undefined ){
			promise = new Promise(
					function( resolve, reject ){
						var args = [ scope, resolve, reject ];
						func = refresh.apply( this, args );
					});
			promise
				.then( function(){
					gadgetui.util.trigger( self.selector, "gadgetui-combobox-refresh" );
					//self.selector.dispatchEvent( new Event( "gadgetui-combobox-refresh" ) );
					self.setControls();
				});
			promise['catch']( function( message ){
					console.log( "message" );
					self.setControls();
				});
		}
		return func;
	};
};

ComboBox.prototype.config = function( options ){
	options = ( options === undefined ? {} : options );
	this.model =  (( options.model === undefined) ? this.model : options.model );
	this.emitEvents = (( options.emitEvents === undefined) ? true : options.emitEvents );
	this.dataProvider = (( options.dataProvider === undefined) ? undefined : options.dataProvider );
	this.save = (( options.save === undefined) ? undefined : options.save );
	this.activate = (( options.activate === undefined) ? "mouseenter" : options.activate );
	this.delay = (( options.delay === undefined) ? 10 : options.delay );
	this.inputBackground = (( options.inputBackground === undefined) ? "#ffffff" : options.inputBackground );
	this.borderWidth = (( options.borderWidth === undefined) ? 1 : options.borderWidth );
	this.borderColor = (( options.borderColor === undefined) ? "#d0d0d0" : options.borderColor );
	this.borderStyle = (( options.borderStyle === undefined) ? "solid" : options.borderStyle );
	this.borderRadius = (( options.borderRadius === undefined) ? 5 : options.borderRadius );
	this.width = (( options.width === undefined) ? 150 : options.width );
	this.newOption = (( options.newOption === undefined) ? { text: "...", id: 0 } : options.newOption );
	this.id = (( options.id === undefined) ? this.newOption.id : options.id );
	this.arrowIcon = (( options.arrowIcon === undefined) ? "/bower_components/gadget-ui/dist/img/arrow.png" : options.arrowIcon );
	this.scaleIconHeight = (( options.scaleIconHeight === undefined) ? false : options.scaleIconHeight );
	this.animate = (( options.animate === undefined) ? true : options.animate );
	this.glowColor = (( options.glowColor === undefined ) ? 'rgb(82, 168, 236)' : options.glowColor );
	this.animateDelay = (( options.animateDelay === undefined ) ? 500 : options.animateDelay );
	this.border = this.borderWidth + "px " + this.borderStyle + " " + this.borderColor;
	this.saveBorder = this.borderWidth + "px " + this.borderStyle + " " + this.glowColor;
};
/*	
function LookupListInput( selector, options ){
	function _renderLabel( item ){
		return item.label;
	};
	this.itemRenderer = _renderLabel;
	this.menuItemRenderer = _renderLabel;
	this.emitEvents = true;
	
	this.selector = selector;
	
	if( options !== undefined ){
		this.config( options );
	}
	
	//gadgetui.util.bind( this.selector, this.model );
	$( this.selector ).wrap( '<div class="gadgetui-lookuplistinput-div ui-widget-content ui-corner-all"></div>' );
	this.addBindings();
}

LookupListInput.prototype.addBindings = function(){
	var self = this;
	
	this.selector.parentNode
		.on( "click", function(){
			$( self ).focus();
		})
		.on( "click", "div[class~='gadgetui-lookuplist-input-cancel']", function(e){
			self.remove( self.selector, $( e.target ).attr( "gadgetui-lookuplist-input-value" ) );
		});
	
	$( this.selector )
		.autocomplete( {
			minLength : self.minLength,
			source : function( request, response ) {
				response( $.ui.autocomplete.filter( self.datasource, gadgetui.util.extractLast( request.term ) ) );
			},

			focus : function( ) {
				// prevent value inserted on
				// focus
				return false;
			},
			select : function( event, ui ) {
				var terms = gadgetui.util.split( this.value );
				// remove the current input
				terms.pop( );

				self.add( self.selector, ui.item );
				this.value = '';
				this.focus( );
				return false;
			}
		} ).on( "keydown", function( event ) {
			$( this )
				.css( "width", Math.round( ( $( this ).val( ).length * 0.66 ) + 3 ) + "em" );
	
			if ( event.keyCode === $.ui.keyCode.TAB && $( this ).data( "ui-autocomplete" ).menu.active ) {
				event.preventDefault( );
			}
			if ( event.keyCode === $.ui.keyCode.BACKSPACE && $( this ).val( ).length === 0 ) {
				event.preventDefault();
				var elem = $( this ).prev( "div[class~='gadgetui-lookuplist-input-item-wrapper']" );

				elem.remove( );
			}
		});
	
	$.ui.autocomplete.prototype._renderItem = function( ul, item){
		if( typeof self.menuItemRenderer === "function"){
			return $( "<li>" )
			.attr( "data-value", item.value )
			.append( $( "<a>" ).text( self.menuItemRenderer( item ) ) )
			.appendTo( ul );
		}else{
			//default jquery-ui implementation
			return $( "<li>" )
			.append( $( "<a>" ).text( item.label ) )
			.appendTo( ul );
		}
	};	
};

LookupListInput.prototype.add = function( el, item ){
	var prop, list;
	$( "<div class='gadgetui-lookuplist-input-item-wrapper'><div class='gadgetui-lookuplist-input-cancel ui-corner-all ui-widget-content' gadgetui-lookuplist-input-value='" + item.value + "'><div class='gadgetui-lookuplist-input-item'>" + this.itemRenderer( item ) + "</div></div></div>" )
		.insertBefore( el );
	$( el ).val('');
	if( item.title !== undefined ){
		$( "div[class~='gadgetui-lookuplist-input-cancel']", $( el ).parentNode ).last().attr( "title", item.title );
	}
	if( this.emitEvents === true ){
		$( el ).trigger( "gadgetui-lookuplistinput-add", [ item ] );
	}
	if( this.func !== undefined ){
		this.func( item, 'add' );
	}
	if( this.model !== undefined ){
		//update the model 
		prop = $( el ).attr( "gadgetui-bind" );
		list = this.model.get( prop );
		if( $.isArray( list ) === false ){
			list = [];
		}
		list.push( item );
		this.model.set( prop, list );
	}
};

LookupListInput.prototype.remove = function( el, value ){
	$( "div[gadgetui-lookuplist-input-value='" + value + "']", $( el ).parentNode ).parentNode.remove();

	var self = this, prop, list;

	if( this.model !== undefined ){
		prop = $( el ).attr( "gadgetui-bind" );
		list = this.model.get( prop );
		$.each( list, function( i, obj ){
			if( obj.value === value ){
				list.splice( i, 1 );
				if( self.func !== undefined ){
					self.func( obj, 'remove' );
				}
				if( self.emitEvents === true ){
					$( el ).trigger( "gadgetui-lookuplistinput-remove", [ obj ] );
				}
				self.model.set( prop, list );
				return false;
			}
		});
	}
};

LookupListInput.prototype.reset = function(){
	$( ".gadgetui-lookuplist-input-item-wrapper", $(  this.el ).parentNode ).empty();

	if( this.model !== undefined ){
		prop = $( this.el ).attr( "gadget-ui-bind" );
		list = this.model.get( prop );
		list.length = 0;
	}
};

LookupListInput.prototype.config = function( args ){
	// if binding but no model was specified, use gadgetui model
	if( $( this.selector ).attr( "gadgetui-bind" ) !== undefined ){
		this.model = (( args.model === undefined) ? gadgetui.model : args.model );
	}
	this.func = (( args.func === undefined) ? undefined : args.func );
	this.itemRenderer = (( args.itemRenderer === undefined) ? this.itemRenderer : args.itemRenderer );
	this.menuItemRenderer = (( args.menuItemRenderer === undefined) ? this.menuItemRenderer : args.menuItemRenderer );
	this.emitEvents = (( args.emitEvents === undefined) ? true : args.emitEvents );
	this.datasource = (( args.datasource === undefined) ? (( args.lookupList !== undefined ) ? args.lookupList : true ) : args.datasource );
	this.minLength = (( args.minLength === undefined) ? 0 : args.minLength );
	return this;
};	
	*/

function SelectInput( selector, options ){
	this.selector = selector;

	this.config( options );
	this.setInitialValue();

	// bind to the model if binding is specified
	gadgetui.util.bind( this.selector, this.model );

	this.addControl();
	this.addCSS();
	this.selector.style.display = 'none';
	
	this.addBindings();
}

SelectInput.prototype.setInitialValue = function(){
	// this.value set in config()
	this.selector.value = this.value.id;
};

SelectInput.prototype.addControl = function(){
	this.wrapper = document.createElement( "div" );
	this.label = document.createElement( "div" );
	gadgetui.util.addClass( this.wrapper, "gadgetui-selectinput-div" );
	gadgetui.util.addClass( this.label, "gadgetui-selectinput-label" );
	this.label.innerHTML = this.value.text;
	this.selector.parentNode.insertBefore( this.wrapper, this.selector );
	this.wrapper = this.selector.previousSibling;
	this.selector.parentNode.removeChild( this.selector );
	this.wrapper.appendChild( this.selector );
	this.selector.parentNode.insertBefore( this.label, this.selector );
};

SelectInput.prototype.addCSS = function(){
	var height, 
		parentstyle,
		css = gadgetui.util.setStyle,
		style = gadgetui.util.getStyle( this.selector );

	css( this.selector, "min-width", "100px" );
	css( this.selector, "font-size", style.fontSize );

	parentstyle = gadgetui.util.getStyle( this.selector.parentNode );
	height = gadgetui.util.getNumberValue( parentstyle.height ) - 2;
	this.label.setAttribute( "style", "" );
	css( this.label, "padding-top", "2px" );
	css( this.label, "height", height + "px" );
	css( this.label, "margin-left", "9px" );	

	if( navigator.userAgent.match( /Edge/ ) ){
		css( this.selector, "margin-left", "5px" );
	}else if( navigator.userAgent.match( /MSIE/ ) ){
		css( this.selector, "margin-top", "0px" );
		css( this.selector, "margin-left", "5px" );
	}
};

SelectInput.prototype.addBindings = function() {
	var self = this,
		css = gadgetui.util.setStyle;

	this.label
		.addEventListener( this.activate, function( event ) {
			css( self.label, "display", 'none' );
			css( self.selector, "display", "inline-block" );
			event.preventDefault();
		});

	this.selector
		.addEventListener( "blur", function( ev ) {
			//setTimeout( function() {
				css( self.label, "display", "inline-block" );
				css( self.selector, "display", 'none' );
			//}, 100 );
		});

	this.selector
		.addEventListener( "change", function( ev ) {
			setTimeout( function() {
				var value = ev.target.value,
					label = ev.target[ ev.target.selectedIndex ].innerHTML;
				
				if( value.trim().length === 0 ){
					value = 0;
				}
	
				self.label.innerText = label;
				if( self.model !== undefined && self.selector.getAttribute( "gadgetui-bind" ) === undefined ){	
					// if we have specified a model but no data binding, change the model value
					self.model.set( this.name, { id: value, text: label } );
				}
	
				if( self.emitEvents === true ){
					gadgetui.util.trigger( self.selector, "gadgetui-input-change", { id: value, text: label } );
				}
				if( self.func !== undefined ){
					self.func( { id: value, text: label } );
				}
				self.value = { id: value, text: label };
			}, 200 );
		});

	this.wrapper
		.addEventListener( "mouseleave", function( ) {
			if ( self.selector !== document.activeElement ) {
				css( self.label, "display", 'inline-block' );
				css( self.selector, "display", 'none' );
			}
		});
	

/*		function detectLeftButton(evt) {
	    evt = evt || window.event;
	    var button = evt.which || evt.button;
	    return button == 1;
	}
	
	document.onmouseup = function( event ){
		var isLeftClick = detectLeftButton( event );
		if( isLeftClick === true ){
			if ( $( self.selector ).is( ":focus" ) === false ) {
				label
					.css( "display", "inline-block" );
				$( self.selector )
					.hide( );
			}			
		}
	};	*/
};

SelectInput.prototype.config = function( options ){
	options = ( options === undefined ? {} : options );
	this.model =  (( options.model === undefined) ? undefined : options.model );
	this.func = (( options.func === undefined) ? undefined : options.func );
	this.emitEvents = (( options.emitEvents === undefined) ? true : options.emitEvents );
	this.activate = (( options.activate === undefined) ? "mouseenter" : options.activate );
	this.value = (( options.value === undefined) ? { id: this.selector[ this.selector.selectedIndex ].value, text : this.selector[ this.selector.selectedIndex ].innerHTML } : options.value );
};

function TextInput( selector, options ){
	this.emitEvents = true;
	this.model = gadgetui.model;
	this.func;

	this.selector = selector;

	this.config( options );

	// bind to the model if binding is specified
	gadgetui.util.bind( this.selector, this.model );

	this.setInitialValue();
	//this.addClass();
	this.addControl();
	this.setLineHeight();
	this.setFont();
	this.setMaxWidth();
	this.setWidth();
	this.addCSS();

	this.addBindings();
}

TextInput.prototype.addControl = function(){
	this.wrapper = document.createElement( "div" );
	this.labelDiv = document.createElement( "div" );
	this.inputDiv = document.createElement( "div" );
	this.label = document.createElement( "input" );
	
	this.label.setAttribute( "type", "text" );
	this.label.setAttribute( "data-active", "false" );
	this.label.setAttribute( "readonly", "true" );
	this.label.setAttribute( "value", this.value );
	this.labelDiv.appendChild( this.label );
	
	this.selector.parentNode.insertBefore( this.wrapper, this.selector );
	this.selector.parentNode.removeChild( this.selector );
	
	this.inputDiv.appendChild( this.selector );
	this.wrapper.appendChild( this.inputDiv );
	this.selector.parentNode.parentNode.insertBefore( this.labelDiv, this.inputDiv );

	this.wrapper = this.selector.parentNode.parentNode;
	this.labelDiv = this.wrapper.childNodes[0];
	this.label = this.labelDiv.childNodes[0];
	this.inputDiv = this.wrapper.childNodes[1];
	
};

TextInput.prototype.setInitialValue = function(){
	var val = this.selector.value,
		ph = this.selector.getAttribute( "placeholder" );

	if( val.length === 0 ){
		if( ph !== null && ph!== undefined && ph.length > 0 ){
			val = ph;
		}else{
			val = " ... ";
		}
	}
	this.value = val;
};

TextInput.prototype.setLineHeight = function(){
	var lineHeight = this.selector.offsetHeight;
	// minimum height
	this.lineHeight = lineHeight;
};

TextInput.prototype.setFont = function(){
	var style = gadgetui.util.getStyle( this.selector ),
		font = style.fontFamily + " " + style.fontSize + " " + style.fontWeight + " " + style.fontVariant;
		this.font = font;
};

TextInput.prototype.setWidth = function(){
	var style = gadgetui.util.getStyle( this.selector );
	this.width = gadgetui.util.textWidth( this.selector.value, style ) + 10;
	if( this.width === 10 ){
		this.width = this.minWidth;
	}
};

TextInput.prototype.setMaxWidth = function(){
	var parentStyle = gadgetui.util.getStyle( this.selector.parentNode.parentNode );
	this.maxWidth = gadgetui.util.getNumberValue( parentStyle.width );
};

TextInput.prototype.addCSS = function(){
	var style = gadgetui.util.getStyle( this.selector ),
		css = gadgetui.util.setStyle;
	// add CSS classes
	gadgetui.util.addClass( this.selector, "gadgetui-textinput" );
	gadgetui.util.addClass( this.wrapper, "gadgetui-textinput-div" );
	gadgetui.util.addClass( this.labelDiv, "gadgetui-inputlabel" );
	gadgetui.util.addClass( this.label, "gadgetui-inputlabelinput" );
	gadgetui.util.addClass( this.inputDiv, "gadgetui-inputdiv" );
	css( this.label, "background", "none" );
	css( this.label, "padding-left", "4px" );
	css( this.label, "border", " 1px solid transparent" );
	css( this.label, "width", this.width + "px" );
	css( this.label, "font-family", style.fontFamily );
	css( this.label, "font-size", style.fontSize );
	css( this.label, "font-weight", style.fontWeight );
	css( this.label, "font-variant", style.fontVariant );
	
	css( this.label, "max-width", "" );
	css( this.label, "min-width", this.minWidth + "px" );
	
	if( this.lineHeight > 20 ){
		// add min height to label div as well so label/input isn't offset vertically
		css( this.wrapper, "min-height", this.lineHeight + "px" );
		css( this.labelDiv, "min-height", this.lineHeight + "px" );
		css( this.inputDiv, "min-height", this.lineHeight + "px" );
	}	
	
	css( this.labelDiv, "height", this.lineHeight + "px" );
	css( this.labelDiv, "font-size", style.fontSize );
	css( this.labelDiv, "display", "block" );
	
	css( this.inputDiv, "height", this.lineHeight + "px" );
	css( this.inputDiv, "font-size", style.fontSize );
	css( this.inputDiv, "display", "block" );	
	

	css( this.selector, "padding-left", "4px" );
	css( this.selector, "border", "1px solid " + this.borderColor );
	css( this.selector, "font-family", style.fontFamily );
	css( this.selector, "font-size", style.fontSize );
	css( this.selector, "font-weight", style.fontWeight );
	css( this.selector, "font-variant", style.fontVariant );
	
	css( this.selector, "width", this.width + "px" );
	css( this.selector, "min-width", this.minWidth + "px" );	

	this.selector.setAttribute( "placeholder", this.value );
	css( this.inputDiv, "display", 'none' );

	if( this.maxWidth > 10 && this.enforceMaxWidth === true ){
		css( this.label, "max-width", this.maxWidth );
		css( this.selector, "max-width", this.maxWidth );

		if( this.maxWidth < this.width ){
			this.label.value = gadgetui.util.fitText( this.value, this.font, this.maxWidth );
		}
	}
};

TextInput.prototype.setControlWidth = function( text ){
	
	var style = gadgetui.util.getStyle( this.selector ),
		textWidth = parseInt( gadgetui.util.textWidth(text, style ), 10 ),
		css = gadgetui.util.setStyle;
	if( textWidth < this.minWidth ){
		textWidth = this.minWidth;
	}
	css( this.selector, "width", ( textWidth + 30 ) + "px" );
	css( this.label, "width", ( textWidth + 30 ) + "px" );	
};

TextInput.prototype.addBindings = function(){
	var self = this;

	// setup mousePosition
	if( gadgetui.mousePosition === undefined ){
		document
			.addEventListener( "mousemove", function(ev){ 
				ev = ev || window.event; 
				gadgetui.mousePosition = gadgetui.util.mouseCoords(ev); 
			});
	}

	this.selector
		.addEventListener( "focus", function(e){
			e.preventDefault();
		});

	this.selector
		.addEventListener( "keyup", function( event ) {
			if ( parseInt( event.keyCode, 10 ) === 13 ) {
				this.blur();
			}
			self.setControlWidth( this.value );
		});

	this.selector
		.addEventListener( "change", function( event ) {
			setTimeout( function( ) {
				var value = event.target.value, style, txtWidth;
				if( value.length === 0 && self.selector.getAttribute( "placeholder" ) !== undefined ){
					value = self.selector.getAttribute( "placeholder" );
				}

				style = gadgetui.util.getStyle( self.selector );
				txtWidth = gadgetui.util.textWidth( value, style );

				if( self.maxWidth < txtWidth ){
					value = gadgetui.util.fitText( value, self.font, self.maxWidth );
				}
				self.label.value = value;
				if( self.model !== undefined && self.selector.getAttribute( "gadgetui-bind" ) === undefined ){	
					// if we have specified a model but no data binding, change the model value
					self.model.set( self.selector.name, event.target.value );
				}

				if( self.emitEvents === true ){
					gadgetui.util.trigger( self.selector, "gadgetui-input-change", { text: event.target.value } );
				}

				if( self.func !== undefined ){
					self.func( { text: event.target.value } );
				}				
			}, 200 );
		});
	
	this.selector
		//.removeEventListener( "mouseleave" )
		.addEventListener( "mouseleave", function( ) {
			var css = gadgetui.util.setStyle;
			if( this !== document.activeElement ){
				css( self.labelDiv, "display", "block" );
				css( self.inputDiv, "display", "none" );
				css( self.label, "maxWidth", self.maxWidth );				
			}
		});

	this.selector
		.addEventListener( "blur", function( ) {
			var css = gadgetui.util.setStyle;
			css( self.inputDiv, "display", 'none' );
			css( self.labelDiv, "display", 'block' );
			self.label.setAttribute( "data-active", "false" );
			css( self.selector, "maxWidth", self.maxWidth );
			css( self.label, "maxWidth", self.maxWidth );
		});

	this.label
		//.off( self.activate )
		.addEventListener( self.activate, function( ) {
			if( self.useActive && ( self.label.getAttribute( "data-active" ) === "false" || self.label.getAttribute( "data-active" ) === undefined ) ){
				self.label.setAttribute( "data-active", "true" );
			}else{
				setTimeout( 
					function(){
					var event, css = gadgetui.util.setStyle;
					if( gadgetui.util.mouseWithin( self.label, gadgetui.mousePosition ) === true ){
						// both input and label
						css( self.labelDiv, "display", 'none' );
						css( self.inputDiv, "display", 'block' );
						self.setControlWidth( self.selector.value );

						// if we are only showing the input on click, focus on the element immediately
						if( self.activate === "click" ){
							self.selector.focus();
						}
						if( self.emitEvents === true ){
							// raise an event that the input is active
							
							event = new Event( "gadgetui-input-show" );
							self.selector.dispatchEvent( event );
						}
					}}, self.delay );
			}
		});

};

TextInput.prototype.config = function( options ){
	options = ( options === undefined ? {} : options );
	this.borderColor =  (( options.borderColor === undefined) ? "#d0d0d0" : options.borderColor );
	this.useActive =  (( options.useActive === undefined) ? false : options.useActive );
	this.model =  (( options.model === undefined) ? this.model : options.model );
	this.object = (( options.object === undefined) ? undefined : options.object );
	this.func = (( options.func === undefined) ? undefined : options.func );
	this.emitEvents = (( options.emitEvents === undefined) ? true : options.emitEvents );
	this.activate = (( options.activate === undefined) ? "mouseenter" : options.activate );
	this.delay = (( options.delay === undefined) ? 10 : options.delay );
	this.minWidth = (( options.minWidth === undefined) ? 100 : options.minWidth );
	this.enforceMaxWidth = ( options.enforceMaxWidth === undefined ? false : options.enforceMaxWidth );
};

	return{
		TextInput: TextInput,
		SelectInput: SelectInput,
		ComboBox: ComboBox
		/*	
		
		
		LookupListInput: LookupListInput	*/
	};
}());
gadgetui.util = ( function(){

	return{
		split: function( val ) {
			return val.split( /,\s*/ );
		},
		extractLast: function( term ) {
			return this.split( term ).pop();
		},
		getNumberValue: function( pixelValue ){
			return Number( pixelValue.substring( 0, pixelValue.length - 2 ) );
		},

		addClass: function( sel, className ){
			if (sel.classList){
				sel.classList.add(className);
			}else{
				sel.className += ' ' + className;
			}
		},
		
		getOffset: function( selector ){
			var rect =  selector.getBoundingClientRect();

			return {
			  top: rect.top + document.body.scrollTop,
			  left: rect.left + document.body.scrollLeft
			};
		},
		//http://gomakethings.com/climbing-up-and-down-the-dom-tree-with-vanilla-javascript/
		//getParentsUntil - MIT License
		getParentsUntil : function (elem, parent, selector) {

		    var parents = [];
		    if ( parent ) {
		        var parentType = parent.charAt(0);
		    }
		    if ( selector ) {
		        var selectorType = selector.charAt(0);
		    }

		    // Get matches
		    for ( ; elem && elem !== document; elem = elem.parentNode ) {

		        // Check if parent has been reached
		        if ( parent ) {

		            // If parent is a class
		            if ( parentType === '.' ) {
		                if ( elem.classList.contains( parent.substr(1) ) ) {
		                    break;
		                }
		            }

		            // If parent is an ID
		            if ( parentType === '#' ) {
		                if ( elem.id === parent.substr(1) ) {
		                    break;
		                }
		            }

		            // If parent is a data attribute
		            if ( parentType === '[' ) {
		                if ( elem.hasAttribute( parent.substr(1, parent.length - 1) ) ) {
		                    break;
		                }
		            }

		            // If parent is a tag
		            if ( elem.tagName.toLowerCase() === parent ) {
		                break;
		            }

		        }

		        if ( selector ) {

		            // If selector is a class
		            if ( selectorType === '.' ) {
		                if ( elem.classList.contains( selector.substr(1) ) ) {
		                    parents.push( elem );
		                }
		            }

		            // If selector is an ID
		            if ( selectorType === '#' ) {
		                if ( elem.id === selector.substr(1) ) {
		                    parents.push( elem );
		                }
		            }

		            // If selector is a data attribute
		            if ( selectorType === '[' ) {
		                if ( elem.hasAttribute( selector.substr(1, selector.length - 1) ) ) {
		                    parents.push( elem );
		                }
		            }

		            // If selector is a tag
		            if ( elem.tagName.toLowerCase() === selector ) {
		                parents.push( elem );
		            }

		        } else {
		            parents.push( elem );
		        }

		    }

		    // Return parents if any exist
		    if ( parents.length === 0 ) {
		        return null;
		    } else {
		        return parents;
		    }

		},
		getRelativeParentOffset: function( selector ){
			var i,
				offset,
				parents = gadgetui.util.getParentsUntil( selector, "body" ),
				relativeOffsetLeft = 0,
				relativeOffsetTop = 0;

			for( i = 0; i < parents.length; i++ ){
				if( parents[ i ].style.position === "relative" ){
					offset = gadgetui.util.getOffset( parents[ i ] );
					// set the largest offset values of the ancestors
					if( offset.left > relativeOffsetLeft ){
						relativeOffsetLeft = offset.left;
					}
					
					if( offset.top > relativeOffsetTop ){
						relativeOffsetTop = offset.top;
					}
				}
			}
			return { left: relativeOffsetLeft, top: relativeOffsetTop };
		},
		Id: function(){
			return ( (Math.random() * 100).toString() ).replace(  /\./g, "" );
		},
		bind : function( selector, model ){
			var bindVar = selector.getAttribute( "gadgetui-bind" );

			// if binding was specified, make it so
			if( bindVar !== undefined && model !== undefined ){
				model.bind( bindVar, selector );
			}
		},
		/*	encode : function( input, options ){
			var result, canon = true, encode = true, encodeType = 'html';
			if( options !== undefined ){
				canon = ( options.canon === undefined ? true : options.canon );
				encode = ( options.encode === undefined ? true : options.encode );
				//enum (html|css|attr|js|url)
				encodeType = ( options.encodeType === undefined ? "html" : options.encodeType );
			}
			if( canon ){
				result = $.encoder.canonicalize( input );
			}
			if( encode ){
				switch( encodeType ){
					case "html":
						result = $.encoder.encodeForHTML( result );
						break;
					case "css":
						result = $.encoder.encodeForCSS( result );
						break;
					case "attr":
						result = $.encoder.encodeForHTMLAttribute( result );
						break;
					case "js":
						result = $.encoder.encodeForJavascript( result );
						break;
					case "url":
						result = $.encoder.encodeForURL( result );
						break;				
				}
				
			}
			return result;
		},	*/
		mouseCoords : function(ev){
			// from http://www.webreference.com/programming/javascript/mk/column2/
			if(ev.pageX || ev.pageY){
				return {x:ev.pageX, y:ev.pageY};
			}
			return {
				x:ev.clientX + document.body.scrollLeft - document.body.clientLeft,
				y:ev.clientY + document.body.scrollTop  - document.body.clientTop
			};
		},
		mouseWithin : function( selector, coords ){
			var rect = selector.getBoundingClientRect();
			return ( coords.x >= rect.left && coords.x <= rect.right && coords.y >= rect.top && coords.y <= rect.bottom ) ? true : false;
		},
		getStyle : function (el, prop) {
		    if ( window.getComputedStyle !== undefined ) {
		    	if( prop !== undefined ){
		    		return window.getComputedStyle(el, null).getPropertyValue(prop);
		    	}else{
		    		return window.getComputedStyle(el, null);
		    	}
		    } else {
		    	if( prop !== undefined ){
		    		return el.currentStyle[prop];
		    	}else{
		    		return el.currentStyle;
		    	}
		    }
		},
		//https://jsfiddle.net/tovic/Xcb8d/
		//author: Taufik Nurrohman
		// code belongs to author
		// no license enforced
		draggable : function( selector ){
			var selected = null, // Object of the element to be moved
		    x_pos = 0, y_pos = 0, // Stores x & y coordinates of the mouse pointer
		    x_elem = 0, y_elem = 0; // Stores top, left values (edge) of the element
	
			// Will be called when user starts dragging an element
			function _drag_init(elem) {
			    // Store the object of the element which needs to be moved
			    selected = elem;
			    x_elem = x_pos - selected.offsetLeft;
			    y_elem = y_pos - selected.offsetTop;
			}
	
			// Will be called when user dragging an element
			function _move_elem(e) {
			    x_pos = document.all ? window.event.clientX : e.pageX;
			    y_pos = document.all ? window.event.clientY : e.pageY;
			    if (selected !== null) {
			        selected.style.left = (x_pos - x_elem) + 'px';
			        selected.style.top = (y_pos - y_elem) + 'px';
			    }
			}
	
			// Destroy the object when we are done
			function _destroy() {
			    selected = null;
			}
	
			// Bind the functions...
			selector.onmousedown = function () {
			    _drag_init(this);
			    return false;
			};
	
			document.onmousemove = _move_elem;
			document.onmouseup = _destroy;			
		},

		textWidth : function( text, style ) {
			// http://stackoverflow.com/questions/1582534/calculating-text-width-with-jquery
			// based on edsioufi's solution
			if( !gadgetui.util.textWidthEl ){
				gadgetui.util.textWidthEl = document.createElement( "div" );
				gadgetui.util.textWidthEl.setAttribute( "id", "gadgetui-textWidth" );
				gadgetui.util.textWidthEl.setAttribute( "style", "display: none;" );
				document.body.appendChild( gadgetui.util.textWidthEl );
			}
				//gadgetui.util.fakeEl = $('<span id="gadgetui-textWidth">').appendTo(document.body);
		    
		    //var width, htmlText = text || selector.value || selector.innerHTML;
			var width, htmlText = text;
		    if( htmlText.length > 0 ){
		    	//htmlText =  gadgetui.util.TextWidth.fakeEl.text(htmlText).html(); //encode to Html
		    	gadgetui.util.textWidthEl.innerText = htmlText;
		    	if( htmlText === undefined ){
		    		htmlText = "";
		    	}else{
		    		htmlText = htmlText.replace(/\s/g, "&nbsp;"); //replace trailing and leading spaces
		    	}
		    }
		    gadgetui.util.textWidthEl.innertText=htmlText;
		    //gadgetui.util.textWidthEl.style.font = font;
		   // gadgetui.util.textWidthEl.html( htmlText ).style.font = font;
		   // gadgetui.util.textWidthEl.html(htmlText).css('font', font || $.fn.css('font'));
		    gadgetui.util.textWidthEl.style.fontFamily = style.fontFamily;
		    gadgetui.util.textWidthEl.style.fontSize = style.fontSize;
		    gadgetui.util.textWidthEl.style.fontWeight = style.fontWeight;
		    gadgetui.util.textWidthEl.style.fontVariant = style.fontVariant;
		    gadgetui.util.textWidthEl.style.display = "inline";

		    width = gadgetui.util.textWidthEl.offsetWidth;
		    gadgetui.util.textWidthEl.style.display = "none";
		    return width;
		},

		fitText :function( text, style, width ){
			var midpoint, txtWidth = gadgetui.util.TextWidth( text, style ), ellipsisWidth = gadgetui.util.TextWidth( "...", style );
			if( txtWidth < width ){
				return text;
			}else{
				midpoint = Math.floor( text.length / 2 ) - 1;
				while( txtWidth + ellipsisWidth >= width ){
					text = text.slice( 0, midpoint ) + text.slice( midpoint + 1, text.length );
			
					midpoint = Math.floor( text.length / 2 ) - 1;
					txtWidth = gadgetui.util.TextWidth( text, font );

				}
				midpoint = Math.floor( text.length / 2 ) - 1;
				text = text.slice( 0, midpoint ) + "..." + text.slice( midpoint, text.length );
				
				//remove spaces around the ellipsis
				while( text.substring( midpoint - 1, midpoint ) === " " ){
					text = text.slice( 0, midpoint - 1 ) + text.slice( midpoint, text.length );
					midpoint = midpoint - 1;
				}
				
				while( text.substring( midpoint + 3, midpoint + 4 ) === " " ){
					text = text.slice( 0, midpoint + 3 ) + text.slice( midpoint + 4, text.length );
					midpoint = midpoint - 1;
				}		
				return text;
			}
		},
		
		createElement : function( tagName ){
			var el = document.createElement( tagName );
			el.setAttribute( "style", "" );
			return el;	
		},
		
		addStyle : function( element, style ){
			var estyles = element.getAttribute( "style" ),
				currentStyles = ( estyles !== null ? estyles : "" );
			element.setAttribute( "style", currentStyles + " " + style + ";" );
		},
		setStyle : function( element, style, value ){
			var newStyles,
				estyles = element.getAttribute( "style" ),
				currentStyles = ( estyles !== null ? estyles : "" ),
				str = '(' + style + ')+ *\\:[^\\;]*\\;',
				re = new RegExp( str , "g" );
			//find styles in the style string
			//([\w\-]+)+ *\:[^\;]*\;
			if( currentStyles.search( re ) >= 0 ){
				newStyles = currentStyles.replace( re, style + ": " + value + ";" ); 
			}else{
				newStyles = currentStyles + " " + style + ": " + value + ";";
			}
			element.setAttribute( "style", newStyles );
		},		
		encode : function( str ){
			return str;
		},
		
		trigger : function( selector, eventType, data ){
			
			selector.dispatchEvent( new CustomEvent( eventType, { detail: data } ) );
			
		}
		
	};
} ());	
//# sourceMappingURL=gadget-ui.js.map