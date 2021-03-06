function Modal( selector, options ){
  this.selector = selector;
  this.config( options );

  this.addControl();
  this.addBindings();
}

Modal.prototype.events = ['opened','closed'];

Modal.prototype.addControl = function(){
  this.wrapper = document.createElement( "div" );
  if( this.class ){
    gadgetui.util.addClass( this.wrapper, this.class );
  }
  gadgetui.util.addClass( this.wrapper, "gadgetui-modal" );

  this.selector.parentNode.insertBefore( this.wrapper, this.selector );
  //this.wrapper = this.selector.previousSibling;
  this.selector.parentNode.removeChild( this.selector );
  this.wrapper.appendChild( this.selector );
  gadgetui.util.addClass( this.selector, "gadgetui-modalWindow" );
  this.selector.innerHTML = `<span name="close" class="gadgetui-right-align">
              <a name="close">
              <svg class="feather">
                <use xlink:href="${this.featherPath}/dist/feather-sprite.svg#x-circle"/>
              </svg>
              </a>
              </span>` + this.selector.innerHTML;
  if( this.autoOpen ){
    this.open();
  }
};

Modal.prototype.addBindings = function(){
  let self = this;
  let close = this.selector.querySelector( " a[name='close']" );
  close.addEventListener( "click", function( event ){
    self.close();
  });
};

Modal.prototype.open = function(){
  gadgetui.util.addClass( this.wrapper, "gadgetui-showModal" );
  if( typeof this.fireEvent === 'function' ){
    this.fireEvent( 'opened');
  }
};

Modal.prototype.close = function(){
  gadgetui.util.removeClass( this.wrapper, "gadgetui-showModal" );
  if( typeof this.fireEvent === 'function' ){
    this.fireEvent( 'closed');
  }
};

Modal.prototype.config = function( options ){
  this.class = ( ( options.class === undefined ? false : options.class ) );
	this.featherPath = options.featherPath || "/node_modules/feather-icons";
  this.autoOpen = ( options.autoOpen === false ? false : true );
};
