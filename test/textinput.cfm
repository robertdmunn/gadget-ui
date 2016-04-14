<!doctype html>
<html>
	<head>
		<title>gadget-ui TextInput Test</title>
		 <script src='../bower_components/lazyloader/dist/lazy.1.0.0.min.js'></script>
		 <script>
		 	lazy.load(['textinput.js < ../dist/gadget-ui.js', "/bower_components/velocity/velocity.js", '../dist/gadget-ui.css', "/bower_components/open-iconic/font/css/open-iconic.css" ], function(){
  				console.log('All files have been loaded');
			});
		 </script>

		<style>
			body {font-size: 1em;}
			input, select, select option{ font-size: 1em;}
		</style>

	</head>

	<body>
		<p>Test the TextInput control.</p>
		<div>
			<p>First Name - bound to user.firstname</p>

			<input name="firstname" type="text" class="gadgetui-textinput" gadgetui-textinput="true" gadgetui-bind="user.firstname" value=""/>
		</div>
		<div>
			<p>Last Name	- bound to user.lastname</p>
			<input name="lastname" type="text" class="gadgetui-textinput" gadgetui-textinput="true" gadgetui-bind="user.lastname" placeholder="" value=""/>
		</div>

	</body>
</html>