
var fp1 = gadgetui.objects.Constructor( gadgetui.display.Dialog,
	[ document.querySelector("#dlg1"),
		{
			top: 200,
			left: 200,
			title : "Some Dialog",
			path : "/dist/",
			enableShrink : false,
			overflow: "hidden",
			buttons: [
				{ label: 'Save', click: function(){ console.log( 'Saved')}},
				{ label: 'Cancel', click: function(){ console.log( 'Cancelled' )}}
			]
		}], true );

fp1.on( "closed", function( obj ){
	console.log( "closed" );
	console.log( obj );
});
