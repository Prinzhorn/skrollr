/*
 *  Test to see if skrollr is loaded properly
 *		- module support with require
 *		- global variable exposure without module
 */

/*global $:false, require:false, start:false, ok:false, QUnit:false, asyncTest:false */

 $(function(){

	'use strict';

	// a helper to load a script specified by the path argument
	// onLoaded is called once the script is loaded
	function loadScript(path, onLoaded){
		$.getScript( path, function() {
			if(typeof onLoaded === 'function'){
				onLoaded.call();
			}
		});
	}

	// remove skrollr from the global scope after each test is run 
	QUnit.testDone(function() {
		if(typeof window.skrollr !== 'undefined'){
			delete window.skrollr;
		}
	});

	//tests

	asyncTest('skrollr is available through global scope without require', function(){
		ok(typeof skrollr === 'undefined', 'skrollr is not available before the script is loaded');

		loadScript('../src/skrollr.js', function() {
			ok(typeof skrollr !== 'undefined', 'skrollr is available through global scope');
			start();
		});
	});

	asyncTest('skrollr is available as a module when require.js is present', function(){
		ok(typeof skrollr === 'undefined', 'skrollr is not available before the script is loaded');

		loadScript('require.js', function(){
			require.config({
				baseUrl: '../src',
				waitSeconds: 15
			});

			require(['skrollr'], function(skrollr){
				ok(typeof skrollr !== 'undefined', 'skrollr is available as a module');
				start();
			});
		});
	});

 });