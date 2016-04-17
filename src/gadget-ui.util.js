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
		
		getRelativeParentOffset: function( selector ){
			var i,
				parents = selector.parentsUntil( "body" ),
				relativeOffsetLeft = 0,
				relativeOffsetTop = 0;

			for( i = 0; i < parents.length; i++ ){
				if( parents[ i ].style.position === "relative" ){
					var offset = gadgetui.util.getOffset( parents[ i ] );
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
			if( selector.getAttribute ){
				var bindVar = selector.getAttribute( "gadgetui-bind" );
			}
			else{
				var bindVar = selector[0].getAttribute( "gadgetui-bind" );
			}
			// if binding was specified, make it so
			if( bindVar !== undefined && model !== undefined ){
				model.bind( bindVar, selector[0] );
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
			var rect = selector[0].getBoundingClientRect();
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
		}
		
	};
} ());	