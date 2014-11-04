(function() {
	var method;
	var noop = function () {};
	var methods = [
		'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
		'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
		'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
		'timeStamp', 'trace', 'warn'
	];
	var length = methods.length;
	var console = (window.console = window.console || {});

	while (length--) {
		method = methods[length];

		// Only stub undefined methods.
		if (!console[method]) {
			console[method] = noop;
		}
	}
}());
(function($){
	if(!$){
		throw 'jQuery is not defined';
	}
	function definePlugin(name, pluginPrototypeDefinition, skipValidation) {
		'use strict';
				
		var Plugin = (new Function('return ' + definePlugin.tpl.replace(/\$\$\$/gm, name)))();
		Plugin.prototype = pluginPrototypeDefinition($);
		
		if(!skipValidation){
			definePlugin.validate(Plugin, name);
		}
		
		definePlugin.installMandatoryFunctions(Plugin, name);		
		definePlugin.registerAsJqueryPlugin(Plugin, name);
        definePlugin.save(Plugin, name);
		return Plugin;
	}

	definePlugin.validate = function(Plugin, name){

		var reservedFunctions = [
			'triggerChangeEvent', 
			'destroy', 
			'whenDestroy', 
			'getParamKey',
			'getModelKey',
			'UI'
		].filter(function (key) {
			return Plugin.prototype.hasOwnProperty(key);
		});
		
		if (reservedFunctions.length) {
			throw new Error('Plugin: ' + name + ' must NOT implement: "' + reservedFunctions.join(', ') + '"');
		}
		
		var missingFunction = [
			'getValue', 
			'setValue', 
			'init', 
			'getDefaults', 
			'bindEvents', 
			'markup'
		].filter(function (key) {
			return typeof Plugin.prototype[key] !== 'function';
		});

		if (missingFunction.length) {
			throw new Error('Plugin: ' + name + ' must implement: "' + missingFunction.join(', ') + '"');
		}
	}
	
	definePlugin.registerAsJqueryPlugin = function (Plugin, name) {
		if (window.jQuery && window.jQuery.fn) {
			window.jQuery.fn[name] = function (options, argument) {
				if(typeof options === 'string'){
					var plugin = $(this).data('plugin_' + name);
					if(plugin && typeof plugin[options] === 'function'){
						return plugin[options].apply(plugin, Array.prototype.slice.call(arguments, 1));
					}
				}
				return this.each(function () {
					if (!$.data(this, 'plugin_' + name)) {
						$.data(this, 'plugin_' + name, new Plugin(this, options));
					}
				});
			};
		}
	}
	
	definePlugin.installMandatoryFunctions = function (Plugin, name){
		if (!Plugin.name) {
			Plugin.name = name;
		}
		Plugin.prototype.constructor = Plugin;
		Plugin.unique_id_counter = 0;
		
		Plugin.prototype.UI = function(data){
			return window.Wix.UI || window.UI;
		};		
		Plugin.prototype.triggerChangeEvent = function(data){
			this.$el.trigger(name + '.change', data);
		};
				
		Plugin.prototype.getParamKey = function(data){
			return this.$el.attr('wix-param') || this.$el.attr('data-wix-param');
		};
						
		Plugin.prototype.getModelKey = function(data){
			return this.$el.attr('wix-model') || this.$el.attr('data-wix-model');
		};
				
		Plugin.prototype.destroy = function(){
			this.$el.off();
			this.$el.find('*').off();
			this.destroyHandlers.forEach(function(fn){
				try{
					fn.call(this);
				} catch(err){
					setTimeout(function(){
					 throw name + ':' + err.message;
					},0);
				}
			}, this);
			this.$el.remove();
		};
		
		Plugin.prototype.whenDestroy = function(fn){
			if(typeof fn !== 'function'){ throw new Error('Destroy handler must be a function');}
			this.destroyHandlers.push(fn);
		};
	
	}

    definePlugin.save = function(Plugin, name){
        definePlugin.store = definePlugin.store || {};
        definePlugin.store[name] = Plugin;
    }

	definePlugin.tpl = "function $$$(el, options) { "+ 
		"'use strict';" +
		"if (!(this instanceof $$$)) {" +
			"throw new Error('Plugin: $$$ must called with the \"new\" keyword');" + 
		"}" +
		"this.$el = window.jQuery(el);" + 
		"this.options = window.jQuery.extend({}, this.getDefaults(), options);" + 
		"this.pluginName = '$$$';" + 
		"el.$uiLibPluginName = '$$$';" + 
		"this.destroyHandlers = [];" + 
		"this.GUID = '$$$_' + ($$$.unique_id_counter++);" + 
		"this.init();" +
		"return this;" +
	"}";

	
	
	$.fn.definePlugin = definePlugin;
	$.fn.getCtrl = function(){
		if(!this[0]){return null;}
		return this.data('plugin_' + this[0].$uiLibPluginName);
	};
	
}(jQuery))


var createColorBox = (function (){
	var ColorPicker = (function () {
		"use strict";
		var useHex = true;
		/////////////////////////////////////////////////////////////////////
		//                                                                 //
		// this chank of code is for ie9                                   //
		// you can not include this chank if you are not tageting ie9      //
		// it is also works in all browsers that support svg img url       //
		//                                                                 //
		/////////////////////////////////////////////////////////////////////
		
		'use strict';
		var ieG = (function (dir, stops) {
			//{offset:'0%',color:'black', opacity:'1'}
			var grd = {
				open:'<?xml version="1.0" ?><svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" version="1.0" width="100%" height="100%" xmlns:xlink="http://www.w3.org/1999/xlink"><defs>',
				close:'</linearGradient></defs><rect width="100%" height="100%" style="fill:url(#g);" /></svg>',
				dirs : {
					left: 'x1="0%" y1="0%" x2="100%" y2="0%"',
					right: 'x1="100%" y1="0%" x2="0%" y2="0%"',
					top: 'x1="0%" y1="0%" x2="0%" y2="100%"',
					bottom: 'x1="0%" y1="100%" x2="0%" y2="0%"'
				}
			};
			return function(dir, stops){
				var r = '<linearGradient id="g" '+ grd.dirs[dir] +' spreadMethod="pad">';
				stops.forEach(function(stop) {
					r += '<stop offset="'+stop.offset+'" stop-color="'+stop.color+'" stop-opacity="'+stop.opacity+'"/>';
				});
				r = 'data:image/svg+xml;base64,' + btoa(grd.open + r + grd.close);
				return r;
			};
		})();
		
		//atob btoa polyfill
		;(function () {
			var
			object = typeof window != 'undefined' ? window : exports,
			chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
			INVALID_CHARACTER_ERR = (function () {
				// fabricate a suitable error object
				try {
					document.createElement('$');
				} catch (error) {
					return error;
				}
			}());

			object.btoa || (
				object.btoa = function (input) {
				for (
					// initialize result and counter
					var block, charCode, idx = 0, map = chars, output = '';
					// if the next input index does not exist:
					//   change the mapping table to "="
					//   check if d has no fractional digits
					input.charAt(idx | 0) || (map = '=', idx % 1);
					// "8 - idx % 1 * 8" generates the sequence 2, 4, 6, 8
					output += map.charAt(63 & block >> 8 - idx % 1 * 8)) {
					charCode = input.charCodeAt(idx += 3 / 4);
					if (charCode > 0xFF)
						throw INVALID_CHARACTER_ERR;
					block = block << 8 | charCode;
				}
				return output;
			});

			object.atob || (
				object.atob = function (input) {
				input = input.replace(/=+$/, '')
					if (input.length % 4 == 1)
						throw INVALID_CHARACTER_ERR;
					for (
						// initialize result and counters
						var bc = 0, bs, buffer, idx = 0, output = '';
						// get next character
						buffer = input.charAt(idx++);
						// character found in table? initialize bit storage and add its ascii value;
						~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
							// and if not first of each 4 characters,
							// convert the first 8 bits to one ascii character
							bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
						// try to find character in table (0-63, not found => -1)
						buffer = chars.indexOf(buffer);
					}
					return output;
			});
		}());
	
		var photoshopG1 = ieG('bottom',[
			{offset:'0%',color:'black', opacity:'1'},
			{offset:'100%',color:'black', opacity:'0'}
		]);
		var normalG2 = ieG('top',[
			{offset:'0%',color:'black', opacity:'1'},
			{offset:'100%',color:'white', opacity:'1'}
		]);
		var hslGrad = ieG('top',[
			{offset:'0%',color:'#FF0000', opacity:'1'},
			{offset:'16.666666666666668%',color:'#FFFF00', opacity:'1'},
			{offset:'33.333333333333336%',color:'#00FF00', opacity:'1'},
			{offset:'50%',color:'#00FFFF', opacity:'1'},
			{offset:'66.66666666666667%',color:'#0000FF', opacity:'1'},
			{offset:'83.33333333333334%',color:'#FF00FF', opacity:'1'},
			{offset:'100%',color:'#FF0000', opacity:'1'}
		]);
			//ieG=0
		//////////////////////////////////////////////////////////////////////
		/////////////////////// color convertion tolls ////////////////////////
		//////////////////////////////////////////////////////////////////////

		function rgbToHex(r, g, b) {
			return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
		}

		function hexToRgba(hex) {
			var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
			var opacity = parseInt(result[4], 16);
			opacity = isNaN(opacity) ? 1 : (opacity / 255);
			return result ? [
				parseInt(result[1], 16),
				parseInt(result[2], 16),
				parseInt(result[3], 16),
				opacity
			] : null;
		}

		function rgbToHsl(r, g, b, a){
			r /= 255, g /= 255, b /= 255;
			var max = Math.max(r, g, b), min = Math.min(r, g, b);
			var h, s, l = (max + min) / 2;

			if(max === min){
				h = s = 0; // achromatic
			}else{
				var d = max - min;
				s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
				switch(max){
					case r: h = (g - b) / d + (g < b ? 6 : 0); break;
					case g: h = (b - r) / d + 2; break;
					case b: h = (r - g) / d + 4; break;
				}
				h /= 6;
			}
			a = isNaN(+a) ? 1 : (+a);
			return [h, s, l, a];
		}

		function hue2rgb(p, q, t){
			if(t < 0) t += 1;
			if(t > 1) t -= 1;
			if(t < 1/6) return p + (q - p) * 6 * t;
			if(t < 1/2) return q;
			if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
			return p;
		}

		function hslToRgb(h, s, l, a){
			var r, g, b;

			if(s === 0){
				r = g = b = l; // achromatic
			}else{
				var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
				var p = 2 * l - q;
				r = hue2rgb(p, q, h + 1/3);
				g = hue2rgb(p, q, h);
				b = hue2rgb(p, q, h - 1/3);
			}
			a = a === undefined ? 1 : a
			return [r * 255, g * 255, b * 255,  a];
		}

		function rgbaParts(rgba){
			var parts = rgba.match(/\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,?([^)]+)?\s*/);
			if(parts){
				return parts.slice(1,5);
			}
		}

		function hslaParts(hsla){
			var parts = hsla.match(/hsla?\(([^,]+)\s*,\s*([^%]+)%\s*,\s*([^%]+)%\s*,?\s*([^)]+)?\s*/);
			if(parts){
				parts = parts.slice(1,5);
				parts[0] = parts[0]/360;
				parts[1] = parts[1]/100;
				parts[2] = parts[2]/100;
				parts[3] = isNaN(+parts[3]) ? 1 : +parts[3];
				return parts;
			}else{
				return [0,0,0,0];
			}
		}
		
		function colorToHex(color){
			var hsla = cssColorToHsl(color);
			var rgba = hslToRgb.apply(null, hsla);
			rgba[0] = rgba[0] << 0;
			rgba[1] = rgba[1] << 0;
			rgba[2] = rgba[2] << 0;
			var hex = rgbToHex.apply(null, rgba);
			return hex;			
		}
		
		function cssColorToHsl(color){
			var hsl;
			if(color.charAt(2)==='l'){
				return  hslaParts(color)
			}
			var process = rgbaParts(color);

			if(process){
				hsl = rgbToHsl.apply(null, process);
			}else{
				if(color.length === 3 || color.length === 6 && color.charAt(0) !== '#'){
					color = '#' + color;
				}
				if(color.length === 4){
					var colorPart = color.split('#').pop();
					color += colorPart;
				}
				hsl = rgbToHsl.apply(null, hexToRgba(color));
			}
			return hsl;
		}

		//////////////////////////////////////////////////////////////////////
		///////////////////////////// helpers  ///////////////////////////////
		//////////////////////////////////////////////////////////////////////

		function createColorPickerMarkup(element){
			var html = 
				'<div class="colorpicker-wrapper">' + 
					'<div class="colorpicker-pickers">'+
					  '<div class="colorpicker-lightsat-palete"></div>'+
					  '<div class="colorpicker-color-palete"></div>'+
					  '<div class="colorpicker-opacity-palete colorpicker-opacity-back" style="display:none"></div>'+
					'</div>'+
					'<div class="colorpicker-picker-inputs">'+
						'<label>H</label>'+ '<label class="deg-label">&deg;</label>'+
						'<input type="text" class="colorpicker-hue"/>'+
						'<label>S</label>'+ '<label>%</label>' +
						'<input type="text" class="colorpicker-saturation"/>'+
						'<label>L</label>'+ '<label>%</label>' +
						'<input type="text" class="colorpicker-lightness"/>'+
						'<label style="display:none">Opacity</label>'+
						'<input style="display:none" type="text" class="colorpicker-opacity"/>'+
					'</div>'+
					'<div class="colorpicker-picker-inputs-extra">' + 
						'<label>#</label>'+
						'<input type="text" class="colorpicker-color"/>'+
						'<div class="change-picker-label">Site colors</div>'+
					'</div>' + 
				'</div>'+
				'<div class="colorpicker-picker-selected">'+
				  '<div class="colorpicker-priveuse colorpicker-opacity-back"></div>'+
				  '<div class="colorpicker-current colorpicker-opacity-back"></div>' + 
				'</div>';
			if(element.className.indexOf('uilib-colorpicker') === -1){
				if(element.className.length===0){
					element.className = 'uilib-colorpicker';
				} else{
					element.className += ' uilib-colorpicker';
				}
			}
			
			element.innerHTML = html;
		}
		
		function SimpleEvents(ctx, events){
			events = events || {};
			events.call = function(eventName){
				var args = Array.prototype.slice.call(arguments,1);
				events[eventName].forEach(function(handler){
					handler.apply(ctx, args);
				});
			};
			events.on = function(eventName, handler) {
				events[eventName].push(handler);
				return function remove() {
					var i = events[eventName].indexOf(handler);
					if (~i) {
						events[eventName].splice(i, 1);
					}
				}
			};	
			return events;
		}
		
		function getOffset( el ) {
			var _x = 0;
			var _y = 0;
			while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
				_x += el.offsetLeft - el.scrollLeft;
				_y += el.offsetTop - el.scrollTop;
				el = el.offsetParent;
			}
			return { top: _y, left: _x };
		}

		function offsetPosFromEvent(e, target) {
			var offset = getOffset(target);
			var posX = (e.clientX - offset.left) / (target.clientWidth - 1);
			var posY = (e.clientY - offset.top) / (target.clientHeight - 1);
			return {
				x : Math.min(Math.max(posX,0), 1),
				y : Math.min(Math.max(posY,0), 1)
			};
		}

		function createElement(width, height, appendTo) {
			var el = document.createElement('div');
			el.style.cssText = 'width:' + width + ';height:' + height + ';';
			appendTo && appendTo.appendChild(el);
			return el;
		}	
		
		//////////////////////////////////////////////////////////////////////
		/////////////// this chank of code is the real thing /////////////////
		//////////////////////////////////////////////////////////////////////

		var paletes = {
			photoshop : {
				pickerBoxHeight: 148, //TODO get this from the style since the new popup is not in dom when calc
				setElement : function (elm, palete, initColor) {
					this.elm = elm;
					this.elm.className += ' ColorPickerPicker ColorPickerPhotoshop';
					this.posIndecator = document.createElement('div');
					this.posIndecator.style.cssText = 'position:absolute;border-radius:50%;width:9px;height:9px;background:transparent;border:2px solid #eee;pointer-events:none;position:relative;'
					this.elm.appendChild(this.posIndecator);
					this.photoshoptIEGradSetup = [{
						offset : '0%',
						color : initColor,
						opacity : '1'
					}, {
						offset : '100%',
						color : 'white',
						opacity : '1'
					}];
					this.render(initColor);
				},
				render : function (color, skipSet) {
					if (!skipSet){
						var pos = this.posFromColor(color);
						this.setPos(pos);
						var hsl = [pos.hue];
						hsl[0] *= 360;
						hsl[1] = 100+'%';
						hsl[2] = 50+'%';
						color = 'hsl(' + hsl.join() + ')';
					}

					if (ieG) {
						this.photoshoptIEGradSetup[0].color = color;
						var photoshopG2 = ieG('left', this.photoshoptIEGradSetup);
						this.elm.style.backgroundImage = 'url("' + photoshopG1 + '"),url("' + photoshopG2 + '")';
					} else {
						this.elm.style.backgroundImage = '-webkit-linear-gradient(bottom, black, rgba(0,0,0,0)),-webkit-linear-gradient(left, ' + color + ', white)';
						this.elm.style.backgroundImage = '-moz-linear-gradient(bottom, black, rgba(0,0,0,0)),-moz-linear-gradient(left, ' + color + ', white)';
					}
				},
				setPos:function(pos){
					this.pos = pos;
					setTimeout(function() {
						var h = parseFloat( getComputedStyle(this.elm).height || this.pickerBoxHeight);
						var w = parseFloat( getComputedStyle(this.elm).width ||  this.pickerBoxHeight);
						this.posIndecator.style.left = (-6) + pos.x * w  + 'px';
						this.posIndecator.style.top = (-6) + pos.y * h  + 'px';
					}.bind(this),0);
				},
				posFromColor:function(color){
					var hsla = cssColorToHsl(color);
					var x, y, t;
					x = 1 - hsla[1];
					t = ((hsla[2] * 100) + (50 * x) + 50)/50;
					y = t / (x + 1);
					y = 1 - (y-1);				
					if(y < 0){
						x -= y;
						y=0;
					}
					return {x:x,y:y,hue:hsla[0]};
				},
				colorFromPos : function (pos, paletePosY, opacity) {
					this.setPos(pos);
					var h = paletePosY * 360;
					var s = 100 - pos.x * 100;
					var l = (pos.y * -50) + (50 * pos.x) + 50 - (pos.y * pos.x * 50);
					return 'hsla(' + h + ', ' + s + '% , ' + l + '%, '+ opacity +')';
				}
			},
			////////////////////////////////////////////
			single : {
				setElement : function (elm, initColor) {
					this.elm = elm;
					this.elm.className += ' ColorPickerPicker ColorPickerSingle';
					this.render(initColor);
				},
				render : function (color) {
					this.elm.style.backgroundColor = color;
				},
				colorFromPos : function () {
					return this.elm.style.backgroundColor.replace(/\s/g,'');
				}
			},
			////////////////////////////////////////////
			palete : {
				setElement : function (elm, initColor) {
					this.elm = elm;
					this.elm.className += ' ColorPickerPicker ColorPickerPalete';
					this.elm.style.position = 'relative';
					this.posIndecator = document.createElement('div');
					this.posIndecator.style.cssText = 'position:absolute;width:19px;height:12px;top:0;background:url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAMCAYAAAH317YUAAABXUlEQVQokY2SPUiCURSGn2sukqRBSwb9EEU/hF9OESQ1RSH9LK06NgS5WYgYktXW0g+0fC7tBtISmAZBkwoNEg1ORU0mTU23wU/5flR84XDgnPe89773HqijCkgBEClIiQ7SBlQjBYkAEItBeXqZaraFnqrltABcZ0X50+gczAvsQK1q0DaOw8SSLOczmDHtcSGAOBD2Z6TbwtDwFBAmRahGS9aBpGKmwbnmQB8VPU09ybyGtn3DhqmL7FvzyOLOg1R8A9Z7ZT/BDsQnw6ry9Qf3H60NNJS860dqaW4j1JLUo+Xv99xdun9odNczpWATGMLqT2eEwZnQfuwYt9PRgQa5lwL5mwR2U90FpFE2l/eS16yM9XYUaaDsmIWraP0htNqW0x9UVmMpRpz1wnOtKy1+nX2A0aYXyC0cqu7xtVB3Kjrc+q2r0xQNJFS3t81vtEKr9TKLVrCuW7t4/Ac4FWWuJ2UyAAAAAABJRU5ErkJggg==");border:0;left:1px;pointer-events:none;';
					this.elm.appendChild(this.posIndecator);

					var hsla = cssColorToHsl(initColor);
					this.setPos(hsla[0]);
					this.render(initColor);
				},
				setPos:function(pos){
					this.paletePosY = pos;
					setTimeout(function() {
						var h = parseFloat( getComputedStyle(this.elm).height );
						this.posIndecator.style.top = pos * (h - 1) - 6  + 'px';
					}.bind(this),0);
				},
				render : function (color) {
					if (ieG) {
						this.elm.style.backgroundImage = 'url("' + hslGrad + '")';
					} else {
						this.elm.style.backgroundImage = '-webkit-linear-gradient(top, #FF0000, #FFFF00, #00FF00, #00FFFF, #0000FF, #FF00FF, #FF0000)';
						this.elm.style.backgroundImage = '-moz-linear-gradient(top, #FF0000, #FFFF00, #00FF00, #00FFFF, #0000FF, #FF00FF, #FF0000)';
					}
				},
				posFromColor : function (color) {
					var hsl = cssColorToHsl(color);
					return hsl[0];
				},
				colorFromPos : function (pos) {
					this.setPos(pos.y);
					return 'hsla(' + pos.y * 360 + ',100%,50%, 1)';
				},
				hueFormPos : function (pos) {
					this.setPos(pos.y);
					return pos.y * 360;
				}
			},
			////////////////////////////////////////////
			opacity : {
				setElement : function (elm, initColor) {
					this.elm = elm;
					this.elm.className += ' ColorPickerPicker ColorPickerOpacityPalete';
					this.elm.style.position = 'relative';
					this.posIndecator = document.createElement('div');
					this.posIndecator.style.cssText = 'position:absolute;width:100%;height:4px;top:0;left:-1px;background:black;border:1px solid #eee;pointer-events:none;';
					this.elm.appendChild(this.posIndecator);
					this.ieGOpacityGradSetup = [
						{offset:'0%',color: initColor, opacity:'1'},
						{offset:'100%',color:initColor, opacity:'0'}
					];
					this.setColor(initColor);
				},
				setPos:function(pos){
					this.paletePosY = pos;
					setTimeout(function() {
						var h = parseFloat( getComputedStyle(this.elm).height );
						this.posIndecator.style.top = pos * (h - 1) - 3  + 'px';
					}.bind(this),0);

				},
				getOpacity:function(){
					return (1-this.paletePosY);
				},
				setColor:function(color){
					var hsla = cssColorToHsl(color);
					this.setPos(1-hsla[3]);
					this.render(hsla);
				},
				render : function (hsla) {
					var color =  'hsla(' + hsla[0]*360 + ',' + hsla[1]*100 + '%,' + hsla[2]*100 + '%,' + 1 + ')';
					var colorNoOpacity =  'hsla(' + hsla[0]*360 + ',' + hsla[1]*100 + '%,' + hsla[2]*100 + '%,' + 0 + ')';
					if (ieG) {
						this.ieGOpacityGradSetup[0].color = color;
						this.ieGOpacityGradSetup[1].color = color;
						this.elm.style.backgroundImage = 'url("' + ieG('top', this.ieGOpacityGradSetup) + '")';
					} else {
						this.elm.style.backgroundImage = '-webkit-linear-gradient(top, '+color+', '+colorNoOpacity+')';
						this.elm.style.backgroundImage = '-moz-linear-gradient(top, '+color+', '+colorNoOpacity+')';
					}
				},
				posFromColor : function (color) {
					var hsl = cssColorToHsl(color);
					return (1-hsl[3]);
				}
			}
		};
		
		return function (element, initColor, onChangePicker) {
			var drag = false;
			var onselectstart = null;
			var colorPicker = element;
			
			var events = SimpleEvents(colorPicker, {
				oncolorpickerchange: [],
				onpickerclick: [],
				onpaleteclick: [],
				onopacityclick: [],
				onpickermove: [],
				onpaletemove: [],
				onopacitymove: []
			});

			var palete = Object.create(paletes.palete);
			var picker = Object.create(paletes.photoshop);
			var preview = Object.create(paletes.single);
			var result = Object.create(paletes.single);		
			var opacity = Object.create(paletes.opacity);
			
			
			createColorPickerMarkup(colorPicker);		

			palete.setElement(colorPicker.querySelector('.colorpicker-color-palete'),  initColor);
			picker.setElement(colorPicker.querySelector('.colorpicker-lightsat-palete'), palete, initColor);
			opacity.setElement(createElement('100%', '100%', colorPicker.querySelector('.colorpicker-opacity-palete')), initColor);
			preview.setElement(createElement('100%', '100%', colorPicker.querySelector('.colorpicker-current')), initColor);
			result.setElement(createElement('100%', '100%', colorPicker.querySelector('.colorpicker-priveuse')), initColor);
		
			var updateAllInputs = bindToinputs(colorPicker.querySelector('.colorpicker-picker-inputs'), colorPicker.querySelector('.colorpicker-picker-inputs-extra'), initColor);

			colorPicker.addEventListener('mousedown', startDrag, false);
			window.addEventListener('mouseup', stopDrag, false);
			window.addEventListener('mousemove', dragMove, false);

			function updatePicker(target, offset, fireEventName){
				var color;
				if (target === palete.elm) {
					palete.hueFormPos(offset);
					color = picker.colorFromPos(picker.pos, palete.paletePosY, opacity.getOpacity());
					opacity.setColor(color);
					picker.render(palete.colorFromPos(offset), true);
					events.call('onpalete' + fireEventName, color);
				}
				if (target === opacity.elm) {
					//palete.hueFormPos(offset);
					opacity.setPos(offset.y);
					color = picker.colorFromPos(picker.pos, palete.paletePosY, opacity.getOpacity());                
					events.call('onopacity' + fireEventName, color);
				}
				if (target === picker.elm) {
					color = picker.colorFromPos(offset, palete.paletePosY, opacity.getOpacity());
					opacity.setColor(color);
					events.call('onpicker' + fireEventName, color);
				}
				color && events.call('oncolorpickerchange', useHex ? colorToHex(color) : color);
				return color;
			}

			function renderColorPicker(color){
				//picker
				picker.render(color);
				palete.setPos(picker.pos.hue);
				result.render(color);
				preview.render(color);
				opacity.setColor(color);
			}
			
			function bindToinputs(inputs, extra, initColor){
							
				var hueEl = inputs.querySelector('.colorpicker-hue');
				var saturationEl = inputs.querySelector('.colorpicker-saturation');
				var lightnessEl = inputs.querySelector('.colorpicker-lightness');
				var opacityEl = inputs.querySelector('.colorpicker-opacity');
				var colorEl = colorPicker.querySelector('.colorpicker-color');
							
				colorPicker.querySelector('.change-picker-label').onclick = function(){
					onChangePicker && onChangePicker(null);
				};

				updateInputs(initColor);
				
				events.on('oncolorpickerchange', updateInputs);
								
				inputs.addEventListener('change', validateInputs, false);			
				inputs.addEventListener('change', setColorFromInputs, false);
				
				extra.addEventListener('change', validateInputs, false);			
				extra.addEventListener('change', setColorFromInputs, false);
				
				function updateColorElm(rgba){
					if(useHex){
						colorEl.value = rgbToHex(rgba[0], rgba[1], rgba[2]).substr(1);
					} else {
						colorEl.value = 'rgba(' + rgba[0] +',' + rgba[1] +','+ rgba[2] +','+ rgba[3] +')';
					}
				}
				function getColorElValue(){
					return useHex ? '#'+colorEl.value : colorEl.value;
				}
				
				function setColorFromInputs(evt){
					if(evt.target === colorEl){
						try{
							renderColorPicker(colorEl.value);
							result.render(getColorElValue());
							preview.render(getColorElValue());
							return events.call('oncolorpickerchange', getColorElValue());//updateInputs(colorEl.value);
						}catch(err){}
					}
				
					var color =  'hsla(' + hueEl.value + ',' + saturationEl.value + '%,' +  lightnessEl.value + '%,' +  opacityEl.value + ')';
					var rgba = hslToRgb.apply(null, [hueEl.value/360, saturationEl.value/100, lightnessEl.value/100, opacityEl.value]);
					rgba[0] = rgba[0] << 0;
					rgba[1] = rgba[1] << 0;
					rgba[2] = rgba[2] << 0;
					
					updateColorElm(rgba);
					renderColorPicker(colorEl.value);
					result.render(getColorElValue());
					preview.render(getColorElValue());
					events.call('oncolorpickerchange', getColorElValue());
				}
				
				function validateInputs (evt){
					if(evt.target === hueEl){
						evt.target.value = Math.max(Math.min(evt.target.value, 360), 0) || 0;
					}
					if(evt.target === saturationEl || evt.target === lightnessEl){
						evt.target.value = Math.max(Math.min(evt.target.value, 100), 0) || 0
					}
					if(evt.target === opacityEl){
						evt.target.value = Math.max(Math.min(evt.target.value, 1), 0) || 1
					}
				}
				
				function updateInputs(color){
					var hsla = cssColorToHsl(color);
					hueEl.value = (hsla[0] * 360)<<0;
					saturationEl.value = (hsla[1] * 100)<<0 ;
					lightnessEl.value = (hsla[2] * 100)<<0;
					opacityEl.value = Number.prototype.toFixed.call(+hsla[3], 4);
					
					var rgba = hslToRgb.apply(null, hsla);
					rgba[0] = rgba[0] << 0;
					rgba[1] = rgba[1] << 0;
					rgba[2] = rgba[2] << 0;
					//rgbToHex.apply(null, rgba);
					updateColorElm(rgba);
					//colorEl.value = 'rgba(' + rgba[0] +',' + rgba[1] +','+ rgba[2] +','+ rgba[3] +')';
				}	
				
				return updateInputs;
				
			}

			function dragMove(e){
				if(!drag){return;}
				preview.render(updatePicker(drag, offsetPosFromEvent(e, drag), 'move'))
			}
					
			function stopDrag (e) {
				if (drag) {
					document.body.onselectstart = onselectstart;
					var el = drag;
					drag = false;
					var color = updatePicker(el, offsetPosFromEvent(e, el), 'click')
					result.render(color);
					preview.render(color);
				}
			}
			
			function startDrag (e) {
				onselectstart = document.body.onselectstart || null;
				document.body.onselectstart = function(){ return false; }//setAttribute('onselectstart' ,'return false');
				drag = e.target;
				
				var color = updatePicker(drag, offsetPosFromEvent(e, drag), 'click');
				preview.render(color);
			}

			return {
				on: events.on,
				elm : colorPicker,
				setColor : function(color){
					renderColorPicker(color);
					updateAllInputs(color);
					return this;
				},			
				getColor : function () {
					return result.colorFromPos();
				},            
				isVisible: function(){
					return colorPicker.style.display !== 'none';
				},
				hide : function () {
					colorPicker.style.display = 'none';
					return this;
				},
				show : function (parent) {
					colorPicker.style.display = 'block';
					parent && parent.appendChild(colorPicker);
					return this;
				}
			};
		};
	})();

	//////////////////////////////////////////////////////////////////////
	////////////////////// this is how to use it /////////////////////////
	//////////////////////////////////////////////////////////////////////
	//var colorPicker2 = ColorPicker(colorBoxPicker/*document.querySelector('.colorpicker')*/, '#888888');	

	function createColorPalete(options){
		
		var selectedColorNode = {};
		
		var colorPaleteInstance = {
			elm: colorPalete,
			hide: function(){
				colorPalete.style.display = 'none';
			},
			show: function(){
				colorPalete.style.display = 'block';
			},
			getColor: getValue,
			setColor: function(color){
				var colorNode = filterColorNode(function(colorNode){
					var tname = colorNode.$dataColor.reference;
					return tname && (tname === color.reference || tname === color || color === colorNode.$dataColor.value);
				}, true);	
				colorPaleteInstance.removeSelection();
				if(colorNode){
					setColor(colorNode);
				}
			},
			removeSelection: function(){
				selectedColorNode.className = 'simple-color-node';
				selectedColorNode = {};
			}
		};
		
		var colorPaleteInnerWrapper = document.createElement('div');
		colorPaleteInnerWrapper.className = 'colorpicker-wrapper';

			
		var changePickerLabel = document.createElement('div');
		changePickerLabel.className = 'change-picker-label';
		changePickerLabel.innerHTML = 'All colors';
		
		var colorPalete = document.createElement('div');
		colorPalete.className = 'colorpicker simple-color-palete';
		colorPalete.style.width = options.width || 'auto';
		colorPalete.style.height = options.height || 'auto';
		
		var y=-1, x=0;
		for(var i = 0; i < options.paleteColors.length;i++){
			x = i % 5;
			x = x * 5;
			y += x === 0 ? 1 : 0;
			colorPaleteInnerWrapper.appendChild(createColorNode(options.paleteColors[x+y], 'simple-color-node'));		
		}
		
		options.primColors.forEach(function(color){
			colorPaleteInnerWrapper.appendChild(createColorNode(color, 'simple-color-node prim-color'));		
		});
		
		colorPaleteInnerWrapper.appendChild(changePickerLabel);
		colorPalete.appendChild(colorPaleteInnerWrapper);
		options.parent.appendChild(colorPalete);
		
		colorPalete.onclick = function(evt){
			if(evt.target === colorPalete){ return }
			if(evt.target.className.indexOf('simple-color-node') !== -1 && evt.target.className.indexOf('color-node-selected') === -1){
				setColor(evt.target);
				options.onchange && options.onchange.call(null,getValue());
			}
		};
		
		if(options.selected){
			colorPaleteInstance.setColor(options.selected);
		}
		
		function setColor(colorNode){
			selectedColorNode.className = 'simple-color-node';
			selectedColorNode = colorNode;//evt.target;
			selectedColorNode.className += ' color-node-selected';
		}
		
		changePickerLabel.onclick = function(){
			options.onchangepicker && options.onchangepicker.call();
		}
		
		function createColorNode(color, className){
			var colorNode = document.createElement('div');
			colorNode.className = className;
			colorNode.style.background = color.value;
			colorNode.$dataColor = color;
			return colorNode;
		}
		
		
		function getValue(){
			return selectedColorNode.$dataColor;
		}
		
		function filterColorNode(fn, isOneRes){
			var child;
			var f = [];
			for(var i = 0; i < colorPaleteInnerWrapper.children.length; i++){
				child = colorPaleteInnerWrapper.children[i];
				if(child.className.indexOf('simple-color-node') !== -1){
					if(fn(child)){
						if(isOneRes){
							return child;
						}
						f.push(child);
					}
				}
			}
			return isOneRes ? null : f;
		}
		
		
		
		return colorPaleteInstance;
	}

	function createColorBox(options){
		var cb = {};
		var pickerInstance = {
			showSimplePicker:showSimplePicker,
			showAdvancePicker:showAdvancePicker,
			hidePickers:hidePickers,
			showPickers:showPickers,
			setColor: function(color){
				var colorFromTheme = findReferanceName(color);
				if(colorFromTheme){
					cb.colorPalete.setColor(colorFromTheme.reference);	
					cb.colorPicker.setColor(colorFromTheme.value);
					setBoxInnerColor(colorFromTheme.value, colorFromTheme);
				} else {
					cb.colorPalete.setColor(color);	
					cb.colorPicker.setColor(color);
					setBoxInnerColor(color, false);					
				}
			},
			getColor: function(){
				return cb.colorPicker.getColor();
			},
			getColorObject: function(){
				return cb.colorObject;
			}
		}
		
		function initialize(){

			markup();
			var ref = findReferanceName(options.color);

			cb.colorPicker = ColorPicker(cb.colorBoxPicker, ref ? ref.value : options.color, showSimplePicker);
			
			cb.colorPicker.on('oncolorpickerchange', function(color){
				cb.colorPalete.removeSelection();
				setBoxInnerColor(color, false);
				options.onchange && options.onchange(color);
			});
				
			cb.colorPalete = createColorPalete({
				width: '182px',
				parent: cb.popup.content,
				selected: ref,
				onchangepicker: function(){
					showAdvancePicker();
				},
				onchange: function(color){
					cb.colorPicker.setColor(color.value);
					setBoxInnerColor(color.value, color);
					options.onchange && options.onchange(color);
				},
				paleteColors: options.paleteColors || [],
				primColors: options.primColors || []
			});
			
			showSimplePicker();
			
			ref ? setBoxInnerColor(ref.value, ref) : setBoxInnerColor(options.color, false);
			
			hidePickers();	
			bindEvents();

			return pickerInstance;
		}

		function markup(){
			
			cb.colorBox = options.element || document.createElement('div');
			
			cb.popup = $('<div>').Popup({
				appendTo: cb.colorBox,
				title : 'ColorPicker',
				buttonSet: 'okCancel',
				height : 'auto',
				width : 'auto',
                fixed: true,
                maxPopupWidth: 265,
				onclose : function () {
					pickerInstance.hidePickers();
				},
				oncancel: function() {
					if(pickerInstance.getColorObject() || pickerInstance.getColor() !== cb.openedColor){
						pickerInstance.setColor(cb.openedColor);
						options.onchange && options.onchange(cb.openedColor);	
					}
					pickerInstance.hidePickers();				
				},
				onopen: function(){
					cb.colorBox.appendChild(this.arrow);
				},
				onposition: function(){}	
			}).getCtrl();
			
			cb.popup.setRelativeElement(cb.colorBox)
			
			
			cb.colorBoxPicker = document.createElement('div');
			cb.colorBoxInner = document.createElement('div');
			cb.colorBoxInnerArrow = document.createElement('div');

			cb.colorBoxPicker.className = 'colorpicker';
			cb.colorBox.className = 'uilib-color-box';
			cb.colorBoxInner.className = 'color-box-inner';
			cb.colorBoxInnerArrow.className = 'color-box-inner-arrow';
			
			cb.popup.content.appendChild(cb.colorBoxPicker);
			
			cb.colorBox.appendChild(cb.colorBoxInner);
			cb.colorBox.appendChild(cb.colorBoxInnerArrow);
			
			options.parent && options.parent.appendChild(cb.colorBox);
		}
		
		function findReferanceName(ref){
			if(!ref){
				return false
			}
			if(ref.reference){return ref;}
			for(var i =0; i < options.primColors.length;i++){
				if(options.primColors[i].reference === ref){
					return options.primColors[i];
				}
			}
			for(var i =0; i < options.paleteColors.length;i++){
				if(options.paleteColors[i].reference === ref){
					return options.paleteColors[i];
				}
			}
			return false;
		}
		
		function bindEvents(){
			cb.colorBox.onclick = function(evt){
				evt.stopPropagation && evt.stopPropagation();
				evt.prevetDefault && evt.prevetDefault();		
		
				if(evt.target === cb.colorBox || evt.target === cb.colorBoxInner || evt.target === cb.colorBoxInnerArrow){
                    if(!cb.popup.isOpen()){
                        showPickers();
                    }
				}
				return false;
			}
		
		}

		function saveOpendColor(){			
			cb.openedColor = options.isParamConected ? (pickerInstance.getColorObject() || pickerInstance.getColor()) : pickerInstance.getColor();
		}
		
		function showSimplePicker(){
			cb.popup.setTitle('Site Colors');
			cb.colorPicker.hide();
			cb.colorPalete.show();
		}
		
		function showAdvancePicker(){
			cb.popup.setTitle('All Colors');
			cb.colorPalete.hide();
			cb.colorPicker.show();
		}
		
		function hidePickers(){
			enableTextSelection();
			cb.popup.close();
		}
		
		function showPickers(){
			saveOpendColor();
			disableTextSelection();
			cb.popup.open();
		}

		function setBoxInnerColor(color, colorObject){
			if(color.indexOf('rgba') !== -1){
				color = color.replace(/,\s*\d+\.?\d*\s*\)/,')').replace('rgba','rgb');
			}
			cb.colorBoxInner.style.background = color;
			if(options.isParamConected){
				colorObject ? showSimplePicker() : showAdvancePicker();
			}
			cb.colorObject = colorObject;
		}

		function disableTextSelection(){
			disableTextSelection.onselectstart = document.onselectstart || null;
			disableTextSelection.onmousedown = document.onmousedown || null;
			document.onmousedown = document.onselectstart = function(evt) { 
				if((evt.target.tagName && (evt.target.tagName.toLowerCase() === 'textarea' || evt.target.tagName.toLowerCase() === 'input')) || evt.ctrlKey){
					return true;
				}
				return false; 
			}
		}
		
		function enableTextSelection(){
			document.onselectstart = disableTextSelection.onselectstart || null;
			document.onmousedown = disableTextSelection.onmousedown || null;
			disableTextSelection.onselectstart = null;
			disableTextSelection.onmousedown = null;
		}
		
		return initialize();
		
	}

	return createColorBox;

}());
(function (exports){

	holdJQueryDOMReady(exports.__disableStandaloneError__);
	
	var model = createModel();
	var styleModel = createModel();
	
	exports.UI = {
		initialize         : initialize,
		initializePlugin   : initializePlugin,
		create       	   : createPlugin,
        destroy            : destroyPlugin,
		initStyleMigration : initStyleMigration,
		set                : model.setAndReport,
		get                : model.get,
		toJSON             : model.toJSON,
		onChange           : model.onChange
		/*,
		Styles             : {
			set: styleModel.set,
			get: styleModel.get,
			onChange: styleModel.onChange,
			toJSON: styleModel.toJSON
		}*/
	};
	
	function createPlugin(setup) {
		var $el = $('<div>');
		setup.id && $el.prop('id', setup.id);
		$el.attr('wix-ctrl', setup.ctrl);
		setup.model && $el.attr('wix-model', setup.model);
		setup.param && $el.attr('wix-param', setup.param);
		//setup.options && $el.attr('wix-options', JSON.stringify(setup.options));
		setup.html && $el.html(setup.html);
		setup.appendTo && $el.appendTo(setup.appendTo);
		$el[setup.ctrl](setup.options||{});
		Wix.UI.initializePlugin($el);
		return $el;
	}

	function log(){
		var args = ['<ui-lib>'];
		args.push.apply(args,arguments);
		false && console.log.apply(console, args);
	}

	function initialize(initialValues, onModelChange) {
		if(initialize.isInitialized){return;}
		initialize.isInitialized = true;
		initialize.retry = ++initialize.retry || 1;

		var $rootEl = $('body'); //$('[wix-uilib],[data-wix-uilib]');
		if ($rootEl.length > 1) {
			throw new Error('You have more then one wix-uilib element in the DOM.');
		}
		applyPremiumItems($rootEl);

		model.setInitialValues(initialValues);
		onModelChange && model.onChange('*', onModelChange);

		initStyleModelHandling();

		var elements = $rootEl.andSelf().find('[data-wix-controller], [wix-controller], [wix-ctrl], [data-wix-ctrl], [wix-tooltip], [wix-scroll]');
		for (var i = 0; i < elements.length; i++) {
			try {
				initializePlugin(elements[i]);
			} catch (err) {
				if(console.log){
					console.log('Plugin Initialization Error');
				}
			}
		}

		if(styleModel.applyStyleMigration){
			styleModel.applyStyleMigration();
		}

		$rootEl.fadeIn(140, function(){
			$(document.body).trigger('uilib-update-scroll-bars');
		});

	}

	function holdJQueryDOMReady(){
		var timeoutTicket;
		if(window.Wix){
			if(Wix.Utils.getViewMode() === 'standalone'){
				setTimeout(function(){
					if(!exports.__disableStandaloneError__ ){
						throw new Error('Standalone mode: Wix style params are not available outside of the "wix editor"');
					}
				},0);
			} else {
				holdReady(true);
				timeoutTicket = setTimeout(function(){
					holdReady(false);
					if(!exports.__disableStandaloneError__ ){
						throw new Error('Style params are not available outside of the "wix editor", if you are in the editor ');		
					}
				}, 3333);
				(Wix.Styles || Wix).getStyleParams(function(){
					clearTimeout(timeoutTicket);
					holdReady(false);
				});				
			}
		}

		function holdReady(hold){
			window.jQuery && window.jQuery.holdReady && window.jQuery.holdReady( hold );
		}
	}
	
	function getVendorProductId() {
		try {
			var inst = window.location.search.match(/instance=([^&]+)/);
			return JSON.parse(atob(inst[1].split('.')[1])).vendorProductId || null;
		} catch (err) {
			return null;
		}
	}
	
	function applyPremiumItems($rootEl){
		var $premium = $rootEl.find('[wix-premium],[data-wix-premium]');
		var $notPremium = $rootEl.find('[wix-not-premium], [data-wix-not-premium]');
		var isPremium = getVendorProductId();
		if(isPremium){
			$premium.show();
			$notPremium.remove();
		} else {
			$premium.remove();
			$notPremium.show();
		}
	}
	
	function getAttribute(element, attr) {
		var val = element.getAttribute(attr);
		if (!val) {
			val = element.getAttribute('data-' + attr);
		}
		return val;
	}
		
    function initializePlugin(element, overrideOptions) {
		if(element instanceof jQuery){
			return element.each(function(){
				initializePlugin(this, overrideOptions);
			});
		}
		var ctrl = getCtrl(element);
		if (ctrl) {
			var ctrlName = getCtrlName(ctrl);
			var options = getOptions(element, ctrl);
			applyPlugin(element, ctrlName, overrideOptions || options);
		}

		var tooltipVal = getAttribute(element, 'wix-tooltip');
		if (tooltipVal) {
			applyPlugin(element, 'Tooltip', evalOptions(tooltipVal) || {});
		}

		var scrollbarVal = getAttribute(element, 'wix-scroll');
		if (scrollbarVal) {
			applyPlugin(element, 'Scrollbar', evalOptions(scrollbarVal) || {});
		}
    }

    function getCtrl(element){
        return getAttribute(element, 'wix-controller') || getAttribute(element, 'wix-ctrl');
    }
    
    function destroyPlugin(element, removeModel) {
        if(element instanceof jQuery){
            return element.each(function(){
                destroyPlugin(this, removeModel);
            });
        }
        var ctrl = getCtrl(element);
        var pluginName = getCtrlName(ctrl);
        var wixModel = getAttribute(element, 'wix-model');
		var $el = $(element);
		var plugin = $el.data('plugin_'+pluginName);

        if(plugin && plugin.destroy){
            plugin.destroy();
        } else {
            $el.off();
            $el.find('*').off();
            $el.remove();
        }
        if(removeModel){
            model.removeKey(wixModel);
        }
    }
	
	function applyPlugin(element, pluginName, options) {
		pluginName = fixPluginName(pluginName);
		if ($.fn[pluginName]) {
			log('initializing ' + pluginName, options);
			$(element)[pluginName](options);
		} else {
			console.error('Plugin ' + pluginName + ' does not exist');
		}
		var param = setUpStyleParams(element, pluginName);
		var model = setUpModel(element, pluginName);
		if(param && model){
			throw new Error('You cannot use wix-param in conjunction with wix-model, only one of them can be used per component.');
		}
	}

	function setUpStyleParams(element, pluginName){
		var wixStyleParam = getAttribute(element, 'wix-param');
		if(wixStyleParam){
			styleModel.bindKeyToPlugin(element, pluginName, wixStyleParam);
		}
		return wixStyleParam;
	}

	function setUpModel(element, pluginName){
		var wixModel = getAttribute(element, 'wix-model');
		if(wixModel){
			model.bindKeyToPlugin(element, pluginName, wixModel);
		}
		return wixModel;
	}

	function evalOptions(options){
		 try{
			return (new Function('return '+ options + ';'))()
		 }catch(e){
			throw new Error('Options for plugin are not valid: ' + options);
		 }
	}

	function fixPluginName(pluginName){
		return pluginName;
	}

	function getOptions(element, ctrl){
		var options = getOptionsFormCtrl(ctrl);
		if (!options) {
			options = getAttribute(element, 'wix-options');
		}
		return evalOptions(options) || {};
	}

	function getOptionsFormCtrl(ctrl) {
		var index = ctrl.indexOf(':');
		if (index !== -1) {
			return ctrl.substr(index + 1);
		}
		return false;
	}

	function getCtrlName(ctrl) {
		var index = ctrl.indexOf(':');
        if (index !== -1) {
            return $.trim(ctrl.substr(0, index));
        }
		return $.trim(ctrl);
    }
	
	function createModel() {
		var model = {
			props : {},
			handlers : [],
			reporters : {},
			isReporting : true,
			get : function (modelKey) {
				if (!model.props.hasOwnProperty(modelKey)) {
					throw new Error('There is no "' + modelKey + '" in this model. try to define "wix-model" in your markup.');
				}
				return model.props[modelKey];
			},
			set : function (modelKey, value, silent, report, plugin) {
				var ignoreSet = false;
				if (!model.props.hasOwnProperty(modelKey)) {
					throw new Error('There is no "' + modelKey + '" in this model. try to define "wix-model" in your markup.');
				}
				if(value && value._model_ignore_set_){
					delete value._model_ignore_set_;
					ignoreSet = true;
				}
				var oldValue = model.props[modelKey];
				if (oldValue !== value) {
					model.props[modelKey] = value;
					if (!silent) {
						model.trigger(modelKey, value);
					}
					if(ignoreSet){return}
									//if(report){
					model.triggerReporters(modelKey, value, plugin);
									//}
				}
			},
			removeKey: function(key){
				model.handlers = model.handlers.filter(function(handler){
					return handler.key !== key;
				});
				delete model.reporters[key];
				delete model.props[key];
			},
			setAndReport : function (modelKey, value, isSilent) {
				model.set(modelKey, value, !!isSilent || false, true);
			},
			setInitialValues : function (initialValues) {
				$.extend(model.props, initialValues);
			},
			bindKeyToPlugin : function (element, pluginName, modelKey) {
				var $el = $(element);
				var plugin = $el.data('plugin_' + pluginName);
				if (!plugin) {
					throw new Error('wix-model is not supported in this plugin "' + pluginName + '"')
				}
				var initValue = model.props[modelKey];
				if (initValue !== undefined) {
					plugin.setValue && plugin.setValue(initValue);
					model.props[modelKey] = plugin.getValue ? plugin.getValue() : initValue;
				} else {
					initValue = plugin.getValue ? plugin.getValue() : undefined;
					model.props[modelKey] = initValue;
				}
				$el.on(pluginName + '.change', function (e, data) {
					model.set(modelKey, data, false, false, plugin);
				});
				model.reporters[modelKey] = model.reporters[modelKey] || [];
				function setValueFromReport(value) {
					plugin.setValue && plugin.setValue(value);
				}
				setValueFromReport.plugin = plugin;
				model.reporters[modelKey].push(setValueFromReport);
			},
			onChange : function (key, fn) {
				if (typeof fn !== 'function') {
					throw new Error(key + ': You must provide fn as handler to the Model change event.');
				}
				model.handlers.push({
					fn : fn,
					key : key
				});
			},
			trigger : function (modelKey, value) {
				for (var i = 0; i < model.handlers.length; i++) {
					try {
						var handler = model.handlers[i];
						if (handler.key === '*' || handler.key === modelKey) {
							handler.fn.call(model, value, modelKey);
						}
					} catch (err) {
						setTimeout(function () {
							throw err;
						}, 0);
					}
				}
			},
			triggerReporters : function (modelKey, value, plugin) {
				if (!model.isReporting) {
					return;
				}
				var reportes = this.reporters[modelKey];
				for (var i = 0; i < reportes.length; i++) {
					var reporter = reportes[i];
					if(reporter.plugin === plugin){
						continue;
					}
					try {
						reporter.call(model, value, modelKey);
					} catch (err) {
						setTimeout(function () {
							throw err;
						}, 0);
					}
				}
			},
			toJSON : function () {
				return $.extend({}, model.props);
			}
		};

		return model;

	}

	/////////////////////////////////////////////////
	/////////////////////STYLE///////////////////////
	/////////////////////////////////////////////////

	function initStyleModelHandling(){
		if(window.Wix){

			var style = (Wix.Styles || Wix).getStyleParams();

			if(!styleModel.applyStyleMigration){
				var styles;
				try{
					styles = flattenStyles(style);
				}catch(err){
					setTimeout(function(){
						throw err
					},0)
					styles = {};
				}
				styleModel.setInitialValues(styles);

			}

			styleModel.onChange('*', function(value, name){
				//order matters font is like number.
				var sdk = (Wix.Styles || Wix.Settings);
				if(isFontParam(value) || isFontStyleParam(value)){
					Wix.Styles.setFontParam(name, {value: value});
				} else if(isNumberParam(value)){
					sdk.setNumberParam(name, {value:getNumberParamValue(value)});
				} else if(Object.prototype.toString.call(value).match('Boolean')){
					sdk.setBooleanParam(name, {value:value});
				} else if(value && (value.hasOwnProperty('color') || value.cssColor || value.rgba)) {
					sdk.setColorParam(name, {value:value});
				}
			});

			
		}
		
		function isFontStyleParam(value){
			return value.fontStyleParam === true ? true : false
		}

		function isFontParam(value){
			return isNumberParam(value) && value.fontParam === true ? true : false
		}

		function isNumberParam(value){
			if(value instanceof Number || typeof value === 'number' || (!isNaN(+value.index) && value.value)){
				return true;
			}
			return false;
		}

		function getNumberParamValue(value){
			return ( value.index || value.index === 0 ) ? value.index : value;
		}

	}

	function initStyleMigration(initValues){
		styleModel.applyStyleMigration = function(){
			for(var key in initValues){
				if(initValues.hasOwnProperty(key)){
					styleModel.set(key, initValues[key]);
				}
			}		
		}
	}

	function flattenStyles(style){
		style = style || {};
		var mergedStyle = {};
		//when there will be more types we should merge them
		for(var prop in style.colors){
			if(style.colors.hasOwnProperty(prop)){
				if(style.colors[prop].themeName && style.colors[prop].value.indexOf('rgba')===0){

					var opacity = style.colors[prop].value.match(/,([^),]+)\)/);
					opacity = (opacity ? (+opacity[1]) : 1);

					mergedStyle[prop] = {
						color : {
							reference : style.colors[prop].themeName,
							value : style.colors[prop].value
						},
						rgba : style.colors[prop].value,
						opacity : opacity
					};
				}else{
					mergedStyle[prop] = style.colors[prop].themeName || style.colors[prop].value;
				}
			}
		}
		for(var prop in style.numbers){
			if(style.numbers.hasOwnProperty(prop)){
				mergedStyle[prop] = style.numbers[prop];
			}
		}
		for(var prop in style.booleans){
			if(style.booleans.hasOwnProperty(prop)){
				mergedStyle[prop] = style.booleans[prop];
			}
		}
		for(var prop in style.fonts){
			if(style.fonts.hasOwnProperty(prop)){
				mergedStyle[prop] = style.fonts[prop];
			}
		}
		return mergedStyle;
	}
	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	/////////////////////////////////////////////////


})(window.Wix || window);


jQuery.fn.definePlugin('Accordion', function($){
	
	return {
		init: function(){
			this.markup();
			this.showFirst();
			this.bindEvents();
			this.applyCSS();
		},
		markup:function(){
			if(!this.$el.hasClass('accordion')){
				this.$el.addClass('accordion');
			}
            if(this.options.border){
                this.$el.find('.' + this.options.triggerClass).addClass(this.options.borderClass);
                this.$el.find('.' + this.options.triggerClass).find('li:nth-last-child(1)').addClass('last-child');
            }

		},
		getDefaults: function(){
			return {
				triggerClass : "acc-pane",
				triggerCSS : {},
                borderClass: 'border',
				contentClass : "acc-content",
				contentCSS : {},
				animationTime : 150,
				activeClass : 'acc-active',
				ease : 'linear',
				openByDeafult:'acc-open',
				value : 0,
				toggleOpen: true,
                border: true
			};
		},
		showFirst: function () {
			var opt = this.options;
			this.$el.find('.' + opt.contentClass).hide();
			var $panels = this.$el.find('.' + opt.triggerClass);
			var $toOpen;
			if(typeof this.options.value === 'string'){
				$toOpen = $panels.filter(this.options.value);
			} else {
				$toOpen = $panels.eq(this.options.value || 0);
			}
			
			var $openByDefault = this.$el.find('.'+opt.triggerClass+'.' + opt.openByDeafult)
			$toOpen = $toOpen.add($openByDefault);
			
			$toOpen.addClass(opt.activeClass + ' ' + opt.openByDeafult)
				.find('.'+opt.contentClass)
				.css('display','block');
		},
		getValue: function () {
			var triggers = this.$el.find('.' + this.options.triggerClass);
			for(var i = 0; i < triggers.length; i++){
				if(triggers.eq(i).hasClass(this.options.activeClass)){
					return i;
				}
			}
			return -1;
		},
		setValue: function ($el) {
			var opt = this.options;
			if(typeof $el === 'number'){
				$el = this.$el.find('.' + opt.triggerClass).eq($el); 
			}
			if ($el.find('.' + opt.contentClass).is(':hidden')) {
				this.openElementContent($el);
			} else if (opt.toggleOpen){
				this.closeElementContent($el);
			}
		},
		closeElementContent: function ($el) {
			var opt = this.options;
			this.$el.find('.' + opt.triggerClass)
				.removeClass(opt.openByDeafult)
				.removeClass(opt.activeClass)
				.find('.' + opt.contentClass)
				.slideUp(opt.animationTime, opt.ease, function(){
                    $(document.body).trigger('uilib-update-scroll-bars');
                });
        },
		openElementContent: function ($el) {
			var opt = this.options;
			this.closeElementContent($el);
			
			var $active = $el.toggleClass(opt.activeClass).find('.'+opt.contentClass);
			$active.slideDown(opt.animationTime, opt.ease, function(){
				$active.css('overflow', 'visible');			
				$(document.body).trigger('uilib-update-scroll-bars');
			});
		},
        applyCSS: function () {
			this.$el.find('.' + this.options.contentClass).css(this.options.contentCSS);
			this.$el.find('.' + this.options.triggerClass).css(this.options.triggerCSS);
		},
		bindEvents: function () {
			var that = this;
			this.$el.on('click', '.' + this.options.triggerClass, function (e) {
				if($(e.target).parents('.'+that.options.contentClass).length === 0){
					e.preventDefault();
					that.setValue($(this));
					that.triggerChangeEvent(that.getValue());
				}
			});
		}
	};

});
jQuery.fn.definePlugin('ButtonGroup', function($){
	'use strict';
	
	var names = {
		btnGroupClass : 'btn-group',
		valueAttrName : 'data-value',
		indexAttrName : 'data-index',
		selectedClass : 'btn-selected',
		btnBaseClass : 'uilib-btn',
		btnClass : 'uilib-btn btn-secondary btn-small',
		btnClassToDeprecate : 'btn',
		btnSelectedClassToDeprecate : 'active',
		types:{
			single: 'single',
			toggle: 'toggle'
		}
	};
	
	return {
		init: function(){
			this.$selected = null;
			this.markup();
			this.setValue(this.options.value);
			this.bindEvents();
		},
		getDefaults: function(){
			return {
				value : 0,
				mode: 'single'
			};
		},
		markup: function () {
			this.$el.addClass(names.btnGroupClass);
			this.getOptionsButtons().addClass(names.btnClass + ' ' + names.btnClassToDeprecate);
		},
		getOptionsButtons: function () {
			return this.$el.find('button');
		},
		setValueSingleMode:function(value){
			var $option;
			var $options = this.getOptionsButtons();
			if (typeof value === 'number') {
				$option = $options.eq(value);
			} else if (typeof value === 'string') {
				$option = $options.filter('[value="' + value + '"], ['+names.valueAttrName+'="' + value + '"]').eq(0);
			} else if ($(value).hasClass(names.btnClass)) {
				$option = value;
			} else if(value && typeof value === 'object'){
				$option = $options.eq(value.index);
			}
			if ($option.length) {
				$options.removeClass(names.selectedClass + ' ' + names.btnSelectedClassToDeprecate);
				$option.addClass(names.selectedClass + ' ' + names.btnSelectedClassToDeprecate);
				this.$selected = $option;
			}
		},
		toggleActiveClass:function($el){
			$el.toggleClass(names.selectedClass + ' ' + names.btnSelectedClassToDeprecate);
		},
		setValueToggleMode:function(value){
			var $options = this.getOptionsButtons();
			var className = names.selectedClass + ' ' + names.btnSelectedClassToDeprecate;
			for(var k in value){
				if(value.hasOwnProperty(k)){
					var $option = $options.filter('[value="' + k + '"], ['+names.valueAttrName+'="' + k + '"]').eq(0);
					value[k] ? $option.addClass(className) : $option.removeClass(className);
				}
			}
		},
		setValue: function (value) {
			this.isSingleMode() ? this.setValueSingleMode(value) : this.setValueToggleMode(value);
		},
		getValueFromEl: function($el){
			return $el.attr(names.valueAttrName) || $el.val();
		},
		getValue: function () {
			if(this.isSingleMode()){
				return {
					index: this.getIndex(this.$selected),
					value: this.getValueFromEl(this.$selected)
				};
			} else {
				var obj = {};
				var $options = this.getOptionsButtons();
				var btnGroup = this;
				$options.each(function(){
					var $this = $(this);
					obj[btnGroup.getValueFromEl($this)] = $this.hasClass(names.selectedClass + ' ' + names.btnSelectedClassToDeprecate);
				});
				return obj;
			}
		},
		getIndex: function ($el) {
			return +this.getOptionsButtons().index($el);
		},
		isSingleMode: function(){
			return this.options.mode === names.types.single;
		},
		bindEvents: function () {
			var btnGroup = this;
			
			this.$el.on('click', '.' + names.btnBaseClass, function () {
				btnGroup.isSingleMode() ? handleClickSingle($(this)) : handleClickToggle($(this));
			});
			
			function handleClickToggle($el){
				btnGroup.toggleActiveClass($el);
				btnGroup.triggerChangeEvent(btnGroup.getValue());
			}
			
			function handleClickSingle($el){
				var value = btnGroup.getValueFromEl($el);
				if (btnGroup.getValueFromEl(btnGroup.$selected) !== value) {
					btnGroup.setValue(value);
					btnGroup.triggerChangeEvent(btnGroup.getValue());
				}
			}
		}
	};
	
});

jQuery.fn.definePlugin('ToggleButtonGroup', function($){
	'use strict';
	
	return {
		init: function(){
			this.options.mode = 'toggle';
			this.buttonGroup = this.$el.ButtonGroup(this.options).getCtrl();
		},
		getDefaults: function(){
			return {
				value:0
			}
		},		
		setValue: function (value) {
			return this.buttonGroup.setValue(value);
		},
		getValue: function () {
			return this.buttonGroup.getValue();
		},
		bindEvents: function () {},
		markup: function () {}
	};
	
});

jQuery.fn.definePlugin('Checkbox', function($){
	'use strict';
	
	var names = {
		checkboxClass: 'uilib-checkbox',
		checkedClass: 'checked'
	};
	
	return {
		init:function(){
			this.options.value = this.options.value !== undefined ? this.options.value : this.options.checked;
			this.markup();
			this.bindEvents();	
			this.setValue(this.options.checked);
		},
		getDefaults: function(){
			return {
				checked : false,
				preLabel: '',
				postLabel: '',
				value: undefined
			};
		},
		markup: function() {
			
			if(!this.$el.hasClass(names.checkboxClass)){
				this.$el.addClass(names.checkboxClass);
			}
			
			this.$el.append('<span class="uilib-checkbox-check"></span>');

			if(this.options.preLabel){
				this.$el.prepend('<span class="uilib-text uilib-checkbox-preLabel">' + this.options.preLabel + '</span>');
			}
			
			if(this.options.postLabel){
				this.$el.append('<span class="uilib-text uilib-checkbox-postLabel">' + this.options.postLabel + '</span>');
			}
		},
		bindEvents: function() {
			this.$el.on('click', this.toggleChecked.bind(this));
		},
		getValue: function() {
			return this.$el.hasClass(names.checkedClass);
		},
		setValue: function(value) {
			value ? this.$el.addClass(names.checkedClass) : this.$el.removeClass(names.checkedClass);
		},
		toggleChecked: function() {
			this.$el.toggleClass(names.checkedClass);		
			this.triggerChangeEvent(this.getValue());
		}		
	};
	
});

jQuery.fn.definePlugin('ColorPicker', function ($) {
	'use strict';
	
	var defaultColors = [
			'#50FAFE', '#FFFFFF', '#0088CB', '#ED1C24', '#FFCB05',
            '#CECECE', '#9C9C9C', '#6C6C6C', '#484848', '#242424', '#C4EEF6', '#A5E1ED',
            '#59CEE5', '#3B8999', '#1D444C', '#FFFDFD', '#999999', '#666666', '#444444', '#000000', '#E4A3B8',
            '#CA748F', '#AF1A49', '#751131', '#3A0818', '#D5E7A6', '#B8CF78', '#8EB71D', '#5E7A13', '#2F3D09'
		].map(function(o,i){
			return {value:o, reference:'color-'+i};
		});
	
	return {
		init: function(){
			this.options.value = this.options.value !== undefined ? this.options.value : this.options.startWithColor;
			this.isParamConected = this.options.isParamConected || (this.$el.attr('wix-param') || this.$el.attr('data-wix-param'));
			//TODO test this.
			this.siteColors = /*this.isParamConected ? */ true ? ((Wix.Styles || Wix.Settings).getSiteColors() || defaultColors) : defaultColors;
			this.markup();		
		},
		getDefaults: function(){
			return {
				startWithColor : "color-1",
				value:undefined
			};
		},
		markup: function(){
			var that = this;
			this.picker = createColorBox({
				element: this.$el[0],
				color: this.options.value,
				isParamConected: this.isParamConected,
				primColors: this.siteColors.slice(0,5),
				paleteColors: this.siteColors.slice(5),
				onchange: this.changeEventHandler.bind(this)
			});
		
		},
		getValue: function () {
			return this.picker.getColor();
		},
		setValue: function(color){
			var colorFromTheme;
			try{
				if(this.isParamConected && typeof color==='string'){
					colorFromTheme = (Wix.Styles || Wix.Settings).getColorByRefrence(color);
				} else if(this.isParamConected && color.color.reference){
					colorFromTheme = color.color;
				}
				colorFromTheme = colorFromTheme.reference;
			}catch(err){}
			this.picker.setColor(colorFromTheme || color.cssColor || color.rgba || color);
		},
		changeEventHandler: function(color){
			var that = this;
			clearTimeout(this.$timeoutTicket);
			this.$timeoutTicket = setTimeout(function(){					
				var data = {
					cssColor: color
				};
				if(typeof color === 'string'){
					
				} else if (color && typeof color === 'object'){
					data.color = color;
					data.cssColor = color.value;
					if(!that.isParamConected){
						delete data.color;
					}
				}
				that.triggerChangeEvent(data)
			},10);
		},
		getColorObject: function(){
			return this.picker.getColorObject();
		},
		bindEvents: function () {}
	};
	
});

jQuery.fn.definePlugin('ColorPickerWithOpacity', function ($) {
	'use strict';

	return {
		init: function(){
			this.options.value = this.options.value !== undefined ? this.options.value : this.options.startWithColor;
			this.options.isParamConected = (this.$el.attr('wix-param') || this.$el.attr('data-wix-param'));
			this.markup();
			this.setValue(this.options.value);
			this.setOpacity(this.options.startWithOpacity);
			this.bindEvents();
		},
		markup: function(){
			this.$el.addClass('picker-with-opacity');
			this.$ColorPicker = $('<div>').ColorPicker(this.options);
			this.$Slider = $('<div>').Slider({
				preLabel: '0',
				postLabel: '100',
				value: this.options.startWithOpacity,
				toolTip: false
			});
			if(this.options.divider){
				this.$el.append(this.$ColorPicker, $('<span class="uilib-text" style="margin: 0 0 0 10px">').text(this.options.divider),this.$Slider);
			} else{
				this.$el.append(this.$ColorPicker, this.$Slider);
			}
		},
		bindEvents: function () {
			this.$ColorPicker.on('ColorPicker.change', this.colorChangedInInnerPlugins.bind(this, 'color'));
			this.$Slider.on('Slider.change', this.colorChangedInInnerPlugins.bind(this, 'opacity'));
		},
		getValue: function () {
			var plugs = this.getPlugins();
			
			var rgbString = plugs.colorPicker.getValue();
			var sliderValue = plugs.slider.getValue() / 100;
			
			if(rgbString.indexOf('rgba') === 0 || rgbString.indexOf('hsla') === 0){
				return rgbString.replace(/,\s*([\d\.]+)\s*\)/, ','+ sliderValue + ')');
			} else {
				return rgbString.replace(/rgb/, 'rgba').replace(')', ',' + sliderValue + ')');
			}
		},
		setValue: function (value) {
			var opacity = 100;
			var color = '#000';
			var plugs = this.getPlugins();
			if(value && typeof value === 'object'){
				//if(plugs.colorPicker.isParamConected){
					color = (value.color && value.color.reference) ? value.color.reference : (value.rgba || value.cssColor);
					opacity = (value.opacity || extractOpacityFromColor(color)) * 100;
				//}else {
				//	color = (value.cssColor || value.rgba);
				//	opacity = (value.opacity || extractOpacityFromColor(color)) * 100;
				//}
			} else if(typeof value === 'string'){
				color = extractColorFromValue(value);
				opacity = extractOpacityFromColor(value) * 100;
			}
			
			plugs.slider.setValue(opacity);
			plugs.colorPicker.setValue(color);
			
		},
		setOpacity: function (opacity) {
			if(!opacity && opacity!==0){return;}
			this.getPlugins().slider.setValue(opacity);
		},
		getPlugins: function () {
			return {
				colorPicker: this.$ColorPicker.data('plugin_ColorPicker'),
				slider: this.$Slider.data('plugin_Slider')
			};
		},
		colorChangedInInnerPlugins: function (whatChanged, event, value) {
			event.stopPropagation();
			this.triggerChangeEvent({
				color: this.getPlugins().colorPicker.getColorObject(),
				opacity: this.getPlugins().slider.getValue() / 100,
				rgba: this.getValue()
			});
		},
		getDefaults: function(){
			return {
				startWithColor: 'rgba(255,0,0,1)'
			    //value:'rgba(255,0,0,1)'
			}
		}
	};
	
	
	function extractOpacityFromColor(value){
		var opacity =1;
		value = $.trim(value);
		if(value.charAt(0) === '#'){
			opacity = 1;
		} else if(value.indexOf('rgba') === 0 || value.indexOf('hsla')===0){
			opacity = value.match(/,([^),]+)\)/);
			opacity = (opacity ? (+opacity[1]) : 1);
		} else if(value.indexOf('rgb') === 0){
			opacity = 1;
		}
		return opacity;
	}
	
	function extractColorFromValue(value){
		var color;
		value = $.trim(value);
		if(value.charAt(0) === '#'){
			color = value;
		} else if(value.indexOf('rgba') === 0){
			color = value.replace('rgba','rgb').replace(/,([^),]+)\)/,')');
		} else if(value.indexOf('rgb') === 0){
			color = value;
		}else{
			color = value;
		}
		return color;
	}
	
	
});

jQuery.fn.definePlugin('Dropdown', function($){
	'use strict';

	var names = {
		extendedValueName: 'data-value-extended',
		valueAttrName : 'data-value',
		indexAttrName : 'data-index',
		dropDownClassName : 'dropdown',
		activeClassName : 'focus-active',
		optionInitValueAttrName : 'value',
		optionClassName : 'option',
		optionsClassName : 'options',
		selectedClassName : 'selected',
		selectedOptionsClassName : 'option-selected',
		highlightClassName : 'dropdown-highlight',
		iconClassName: 'dropdown-icon',
		hideTextClass: 'dropdown-hideText',
        appendChildren:'data-append-children'
	};

	var optionsCSS = {
		width : '100%',
		position : 'absolute',
		top : '100%',
		zIndex : '999999'
	};

	var dropdownCSS = {
		position : 'relative'
	};
	
	var arrows = {
		down  : '<span class="dropdown-arrow dropdown-arrow-down"></span>',
		up    : '<span class="dropdown-arrow dropdown-arrow-up"></span>',
		left  : '<span class="dropdown-arrow dropdown-arrow-left"></span>',
		right : '<span class="dropdown-arrow dropdown-arrow-right"></span>'
	}
	
	return {
		init: function(){
			this.options.value = this.options.value !== undefined ? this.options.value : this.options.selected;
			this.$selected = null;
			this.$options = null;
			this.isParamMode = this.$el.attr('wix-param') || this.$el.attr('data-wix-param');
			this.isOpen = false;
			this.isActive = false;
			this.markup();
			this.setValue(this.options.value);
			this.bindEvents();
			this.hideOptions(0);
		},
		getDefaults: function(){
			return {
				slideTime : 150,
				selected: 0,
				value: undefined,
				autoCloseTime : 50000,
				optionSelector : '[value]',
				spriteMap: '',
				hideText: false,
				width:'',
				optionsWidth:'',
				height:'',
				//arrow:'down',
				style: 'dropdown-style-1',
                modifier: function($clone, $original){return $clone;}
			};
		},
		markup: function () {
			var dd = this;
			var $el = this.$el.addClass(names.dropDownClassName + ' ' + this.options.style);//.css(dropdownCSS);
			var $options = this.$el.find(this.options.optionSelector).map(function (index) {
					var style = this.getAttribute('style');
					var extended = this.getAttribute(names.extendedValueName);
                    var appendChildren = this.getAttribute(names.appendChildren);
					var $option = $('<div>')
						.attr(names.valueAttrName, this.getAttribute(names.optionInitValueAttrName))
						.attr(names.indexAttrName, index)
						.addClass(names.optionClassName)
						.addClass(this.className)

					
					if(appendChildren){
                        $option.append(this.children);
                    } else {
                        $option.text(this.textContent);
                    }

					if(extended){
						$option.attr(names.extendedValueName, extended);
					}
					if(style){
						$option.attr('style', style);
					}
					if(dd.options.hideText){
						$option.addClass(names.hideTextClass);
					}
					var iconUrl = this.getAttribute('data-icon');
					
					if(iconUrl){
						$option.prepend('<img src="'+iconUrl+'" class="'+names.iconClassName+'"/>');
					}		
					if(dd.options.spriteMap){
						$option.addClass(dd.options.spriteMap+index);
					}
					return $option;
				}).toArray();

			this.$selected = $('<div>').addClass(names.selectedClassName);
			this.$options = $('<div>').addClass(names.optionsClassName).append($options).css(optionsCSS);
			if(this.options.width){
				this.$options.css('width', this.options.width);
				$el.css('width', this.options.width);
			}
			if(this.options.optionsWidth){
				this.$options.css('width', this.options.optionsWidth);
			}
			if(this.options.height){
				this.$options.css('height', this.options.height);
			}

			this.$options.addClass('uilib-scrollbar');
			this.$el.empty();
			this.$el.append(arrows[/*this.options.arrow*/'down'], this.$selected, this.$options);
		},		
		setValue: function (value) {
			var $option;
			if(value && typeof value === 'object' && value.hasOwnProperty('value')/*&& value.hasOwnProperty('index') */){
				value = value.value;
			}
			if (typeof value === 'number') {
				$option = this.$options.find('[' + names.indexAttrName + '="' + value + '"]').eq(0);
			} else if (typeof value === 'string') {
				$option = this.$options.find('[' + names.valueAttrName + '="' + value + '"]').eq(0);
			} else if (value instanceof jQuery) {
				$option = value;
			}
			if ($option.length && this.getIndex() !== $option.attr(names.indexAttrName)) {
				this.$options.find('.'+names.selectedOptionsClassName).removeClass(names.selectedOptionsClassName);
				this.$selected.empty();
                this.$selected.append(this.options.modifier($option.clone(true).addClass('current-item').removeClass(names.highlightClassName), $option));
				$option.addClass(names.selectedOptionsClassName);
				return true;
			}
			return false;
		},
		setValueFromEl: function ($el) {
			var index = +$el.attr(names.indexAttrName);
			if(this.setValue(index)){
				//var value = this.isParamMode ? this.getFullValue() : this.getValue();
				this.triggerChangeEvent(this.getValue());
			}
		},
		setActiveMode: function (isActive) {
			this.isActive = isActive;
			if (isActive) {
				this.$el.addClass(names.activeClassName);
			} else {
				this.$el.removeClass(names.activeClassName);
			}
		},
		getIndex: function () {
			return +this.$selected.find('.' + names.optionClassName).attr(names.indexAttrName);
		},
		getVal: function(){
			return this.$selected.find('.' + names.optionClassName).attr(names.valueAttrName);
		},
		getValue: function () {
			return this.getFullValue();
		},
		getExtendedValue: function () {
			return this.$selected.find('.' + names.optionClassName).attr(names.extendedValueName);
		},
		getFullValue: function () {
			return {
				value: this.getVal(),
				index: this.getIndex()
			};
		},
		hideOptions: function (time) {
			this.$el.trigger('uilib-dropdown-close', this);
			this.isOpen = false;
			this.$options.slideUp(time !== undefined ? time : this.options.slideTime);
		},
		showOptions: function (time) {
			var $options = this.$options;
			var $el = $options.find('[' + names.indexAttrName + '="' + this.getIndex() + '"]').eq(0);
			this.isOpen = true;
			this.highlightOption($el);
			$options.slideDown(time !== undefined ? time : this.options.slideTime, function(){
				$options.css('overflow', 'auto');
			});
			this.$el.trigger('uilib-dropdown-open', this);
		},
		toggleOptions: function (time) {
			return this.isOpen ? this.hideOptions(time) : this.showOptions(time);
		},
		highlightOption: function ($el) {
			if ($el.length) {
				this.$options.find('.' + names.highlightClassName).removeClass(names.highlightClassName);
				$el.addClass(names.highlightClassName);
			}
		},
		bindAutoClose: function (closeDelay) {
			var fold;
			var dropdown = this;

			this.$el.hover(function () {
				clearTimeout(fold);
			}, function () {
				clearTimeout(fold);
				if (dropdown.isOpen) {
					fold = setTimeout(function () {
							if (dropdown.isOpen) {
								dropdown.setActiveMode(false);
								dropdown.hideOptions();
							}
						}, closeDelay);
				}
			});
		},
		bindEvents: function () {
			var dropdown = this;

			if (this.options.autoCloseTime) {
				this.bindAutoClose(this.options.autoCloseTime);
			}

			function uilibDropdownOpen(evt, _dropdown){
				if(_dropdown !== dropdown && _dropdown.isOpen){
					dropdown.hideOptions();
					dropdown.setActiveMode(false);				
				}
			}
			function winMousedown(evt) {
				dropdown.hideOptions();
				dropdown.setActiveMode(false);
			}
			
			$(document).on('uilib-dropdown-open', uilibDropdownOpen);
			
			$(window).on('mousedown', winMousedown);
			
			this.whenDestroy(function(){
				$(document).off('uilib-dropdown-open',uilibDropdownOpen);
				$(window).off('mousedown', winMousedown);
			});

			this.$options.mousewheel && this.$options.mousewheel(function(evt){
				evt.stopPropagation();
			});
			
			this.$options.on('mouseenter', '.' + names.optionClassName, function () {
				dropdown.highlightOption($(this));
			});

			this.$options.on('click', '.' + names.optionClassName, function () {
				dropdown.setValueFromEl($(this));
			});
			
			this.$el.on('click', function (evt) {
				evt.stopPropagation();
				dropdown.setActiveMode(true);
				dropdown.toggleOptions();
			});
			
			this.$el.on('mousedown', function (evt) {
				evt.stopPropagation();
			});

			
			var ENTER = 13,
				SPACE = 32,
				ESC = 27,
				TAB = 9,
				UP = 38,
				DOWN = 40,
				PAGE_UP = 33,
				PAGE_DOWN = 34,
				PAGE_MOVE_ITEMS = 5,
				ARROW_MOVE_ITEMS = 1
			
			$(window).on('keydown', function (evt) {
				var $el, dir, items;
				if (dropdown.isActive) {
					//add Tab & Space
					if (evt.which === ENTER || evt.which === SPACE) {
						dropdown.toggleOptions();
						evt.preventDefault();
					}

					if (evt.which === ESC || evt.which === TAB) {
						dropdown.hideOptions();
						dropdown.setActiveMode(false);
						evt.preventDefault();
					}
					
					//up/down/pageup/pagedown
					if (evt.which === UP || evt.which === DOWN || evt.which === PAGE_UP || evt.which === PAGE_DOWN) {
						$el = dropdown.$options
							.find('[' + names.indexAttrName + '="' + dropdown.getIndex() + '"]')
							.eq(0);
						
						dir = (evt.which === UP || evt.which === PAGE_UP) ? 'prev' : 'next';
						items = (evt.which === UP || evt.which === DOWN) ? ARROW_MOVE_ITEMS : ((dropdown.$options.height() / $el.height())<<0 || PAGE_MOVE_ITEMS);
						
						var _$el;
						while (items--) {
							_$el = $el;
							$el = $el[dir]('.' + names.optionClassName);
							if($el.length ===0){
								$el  = _$el;
							}
						}
						
						dropdown.highlightOption($el);
						dropdown.setValueFromEl($el);
						
						if($el.length){
							dropdown.$options.clearQueue().animate({
								scrollTop: dropdown.$options.scrollTop() + $el.position().top
							}, 200);
						}
						evt.preventDefault();
					}

				}
			});
		}
	};
	
});

jQuery.fn.definePlugin('FixedPositionControl', function ($) {
	'use strict';

	return {
		init: function(element, options) {
			options = this.options;
			element = this.$el[0];
			this.state = {
				horizontalMargin : 0,
				verticalMargin : 0,
				placement : 'TOP_LEFT'
			};
			
			var defaults = _getDefaults();

			this.$el = $(element);
			this.createControlHTML();
			if(Wix && Wix.Utils && Wix.Utils.getViewMode() === 'standalone'){
				options.bindToWidget = false;
			}
			if (options.bindToWidget) {
				this.initWithBinding(defaults, options);
			} else {
				this._init(defaults, options);
			}
			
			
		},
		_init: function (defaults, options) {
			_setUserEvents(defaults, options);

			this.options = $.extend({}, defaults, options);
			this.slider = this.createSlider(this.options.slider);
			this.dropdown = this.createDropDown(this.options.dropdown);
		},

		initWithBinding: function (defaults, options) {
			var plugin = this;
			getPlacement(function (state) {		
				$.extend(plugin.state, state);
				$.extend(defaults.slider, _getSliderEvents(plugin.state));
				plugin.options = $.extend({}, defaults, options);			
				plugin.slider = plugin.createSlider(plugin.options.slider);

				$.extend(plugin.options.dropdown, _getDropdownEvents(plugin.state, plugin.slider));
				plugin.dropdown = plugin.createDropDown(plugin.options.dropdown);			
			});
		},

		createSlider: function(options){
			options.value = this.state[getPlacementOrientation(this.state)] || 0;
			this.$slider = this.$el.find('.glued-slider');
			return this.$slider.Slider(options).data('plugin_Slider');
		},
		
		getDefaults: function(){
			return {bindToWidget:true};
		},
		
		markup: function () {},
		setValue: function () {},
		getValue: function () {},
		bindEvents: function () {},
		
		createDropDown: function(options){
			var plugin = this;
			var $div = $('<div>');
			var $options = this.$el.find(".glued-dropdown")
				.html(this.dropdownHTML())
				.find('select').replaceWith($div).find('option');				
			
			$options.attr('data-icon', 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');		
			
			if(this.options.bindToWidget){
				this.$el.on('Dropdown.change', function(evt, data){
					updateSliderPlacement(plugin.state, plugin.slider, data.value);
					setPlacement(plugin.state);			
				});
			}

			options.width = 180;
			options.value = plugin.state.placement;
			return $div.append($options).Dropdown(options).getCtrl();

		},

		createControlHTML: function () {
			this.$el.append('<div class="glued-dropdown"></div>' +
				'<div class="divider gluedDivider"></div>' +
				'<div class="slider-wrapper"><div class="glued-slider"></div></div>');
		},

		dropdownHTML: function () {

			var placements = this.options.placements;
			if (placements.length === 0) {
				placements = ['TOP_LEFT', 'TOP_CENTER', 'TOP_RIGHT', 'CENTER_LEFT', 'CENTER_RIGHT', 'BOTTOM_LEFT', 'BOTTOM_CENTER', 'BOTTOM_RIGHT'];
			}

			function getOption(value, imageSpriteData, title) {
				return '<option value="' + value + '" data-image="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" data-imagecss="positionIcons ' + imageSpriteData + '" selected="selected">' + title + '</option>';
			}

			var options = placements.map(function (value) {
					var imageSpriteData,
					text;

					switch (value) {
					case 'TOP_LEFT':
						imageSpriteData = 'topLeft';
						text = 'Top Left';
						break;
					case 'TOP_RIGHT':
						imageSpriteData = 'topRight';
						text = 'Top Right';
						break;
					case 'BOTTOM_RIGHT':
						imageSpriteData = 'bottomRight';
						text = 'Bottom Right';
						break;
					case 'BOTTOM_LEFT':
						imageSpriteData = 'bottomLeft';
						text = 'Bottom Left';
						break;
					case 'TOP_CENTER':
						imageSpriteData = 'top';
						text = 'Top';
						break;
					case 'CENTER_RIGHT':
						imageSpriteData = 'right';
						text = 'Right';
						break;
					case 'BOTTOM_CENTER':
						imageSpriteData = 'bottom';
						text = 'Bottom';
						break;
					case 'CENTER_LEFT':
						imageSpriteData = 'left';
						text = 'Left';
						break;
					}

					return getOption(value, imageSpriteData, text);
				}).join('\n');

			return '<p>Select the position for your widget</p><select name="positionSelection" class="positionSelection">' + options + '</select>';
		}
	}
		

	function setPlacement(state) {
		Wix.Settings.setWindowPlacement(
			Wix.Utils.getOrigCompId(),
			state.placement,
			state.verticalMargin,
			state.horizontalMargin);
	}

	function updateSliderPlacement(state, sliderPlugin, placement) {
		sliderPlugin.enable();
		sliderPlugin.$el.removeClass(getPlacementOrientation(state));
		state.placement = placement
		sliderPlugin.setValue(0, true);
		if (getPlacementOrientation(state) === 'other') {
			sliderPlugin.disable();
		} else {
			sliderPlugin.$el.addClass(getPlacementOrientation(state));
		}

	}

	function getPlacementOrientation(state) {
		if (state.placement === 'TOP_CENTER' || state.placement === 'BOTTOM_CENTER') {
			return 'horizontalMargin';
		} else if (state.placement === 'CENTER_RIGHT' || state.placement === 'CENTER_LEFT') {
			return 'verticalMargin';
		} else {
			return 'other';
		}
	}

	function getPlacement(cb) {
		Wix.Settings.getWindowPlacement(Wix.Utils.getOrigCompId(), cb);
	}

    function _getDefaults() {
        return {
            placements: ['TOP_LEFT', 'TOP_CENTER', 'TOP_RIGHT', 'CENTER_LEFT', 'CENTER_RIGHT', 'BOTTOM_LEFT', 'BOTTOM_CENTER', 'BOTTOM_RIGHT'],
            slider : {
				width:158,
				className:'',
                minValue: -2,
                maxValue: 2,
				value: 0,
				supportClick: false
            },
            dropdown : {
				visibleRows:8,
				on:{}
			}
        };
    }

    function _getDropdownEvents(state, slider) {
        return {
			on:{
				create : function() {
					this.setIndexByValue(state.placement);
				},
				change : function(evt) {
					updateSliderPlacement(state, slider, evt.value);
                    setPlacement(state);
				}
			}
        };
    }
	
	//Ribbon for Glued 
	function createRibbon(slider){
		
		var elWidth = slider.$el.width();

		slider.$center = $('<div class="uilib-slider-back">');
		slider.$leftLine = $('<div class="uilib-slider-back">');
		slider.$rightLine = $('<div class="uilib-slider-back">');

		slider.$leftLine.css({
			left:elWidth/4,
			background:'rgba(0,0,0,0.13)',
			width:1
		}).prependTo(slider.$el);

		slider.$center.css({
			left:elWidth/2 - 1,
			background:'rgba(0,0,0,0.2)'
		}).prependTo(slider.$el);

		slider.$rightLine.css({
			left:(elWidth/4)*3,
			background:'rgba(0,0,0,0.13)',
			width:1
		}).prependTo(slider.$el);

		slider.$ribbon = $('<div class="uilib-slider-back">').prependTo(slider.$el);
	}
	
	function updateRibbon(slider, val){
		var pinWidth = slider.$pin.width() / 2;
		var elWidth = slider.$el.width() / 4;
		var w, range;
		
		if(val > 1){
			range = (val - 1);
			w = elWidth * range;
			slider.$ribbon.css({
				width:elWidth - w + range * pinWidth,
				right:0,
				left:'auto',
				borderRadius: '0 8px 8px 0'
			});
		}

		if(val >= 0 && val <= 1){
			w = elWidth * (val);
			slider.$ribbon.css({
				width:w,
				right:'auto',
				left:elWidth * 2,
				borderRadius:0
			});
		}

		if(val < -1){
			range = ((val * -1) - 1);
			w = elWidth * range;
			slider.$ribbon.css({
				width: (elWidth - w) + range * pinWidth,
				left:0,
				right:'auto',
				borderRadius: '8px 0 0 8px'
			});
		}

		if(val < 0 && val >= -1){
			w = elWidth * ((val * -1));
			slider.$ribbon.css({
				width: w,
				right:elWidth * 2,
				left:'auto',
				borderRadius:0
			});
		}


	}
	
    function _getSliderEvents(state) {
        return {
            create : function () {
                createRibbon(this);
				
                if (getPlacementOrientation(state) === 'other') {
                    this.$el.addClass('disabled');
                } else {
                    this.$el.addClass(getPlacementOrientation(state));
                }
            },
            slide : function(val) {
				state[getPlacementOrientation(state)] = val;
				setPlacement(state);
				updateRibbon(this, val);
            }
        };
    }

    function _setUserEvents(defaults, options) {
       
		defaults.slider.create = function(){
			createRibbon(this);
			if (typeof options.sliderCreate === 'function') {
				options.sliderCreate.apply(this, arguments);
			}
		}

		defaults.slider.slide = function(val){
			updateRibbon(this, val);	
			if (typeof options.sliderChange === 'function') {
				options.sliderChange.apply(this, arguments);
			}
		}

        if (typeof options.dropDownChange === 'function') {
            defaults.dropdown.on.change = options.dropDownChange;
        }
        if (typeof options.dropDownCreate === 'function') {
            defaults.dropdown.on.create = options.dropDownCreate;
        }
    }
});



jQuery.fn.definePlugin('FontPicker', function () {
	'use strict';
	var imageMock = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
	
	return {
		init : function () {
			this.isParamMode = this.getParamKey();//this.$el.attr('wix-param') || this.$el.attr('data-wix-param');
			this.markup();
			this.bindEvents();
			this.setValue(this.options.value);
		},
		markup : function () {
			var $dropEl = $('<div>');
			appendSpriteMap(this.options.spriteUrl, $dropEl);
			this.$el.append($dropEl);
			
			this.dropdown = $dropEl.Dropdown({
					hideText : this.options.spriteUrl !== imageMock,
					width : 265,
					height : 200,
					value: this.options.value
				}).data('plugin_Dropdown');
		},
		bindEvents : function () {
			var fontPicker = this;
			this.$el.on('Dropdown.change', function (evt, data) {
				evt.stopPropagation();
				fontPicker.triggerChangeEvent(fontPicker.extendedValue(data));
			});
		},
		extendedValue: function(data){
			if(this.isParamMode){
				data.fontParam = true;
			}
			return $.extend(data, {cssFontFamily: this.dropdown.getExtendedValue(), family: data.value});
		},
		getDefaults : function () {
			return {
				value: 'arial',
				spriteUrl : getFontsSpriteUrl()
			};
		},
		getValue : function () {
			return this.extendedValue(this.dropdown.getFullValue());
		},
		setValue : function (value) {
			if(value && value.fontParam){
				value = value.family || value.value;
			}
			return this.dropdown.setValue(value);
		}
	};

	function getFontsSpriteUrl(){
		return window.Wix && Wix.Styles && Wix.Styles.getFontsSpriteUrl() || imageMock;
	}
	
	function getEditorFonts(){
		return window.Wix && Wix.Styles && Wix.Styles.getEditorFonts() || [{lang:'', fonts:[{"displayName":"Arial","fontFamily":"arial","cdnName":"","genericFamily":"sans-serif","provider":"system","characterSets":["latin","latin-ext","cyrillic"],"permissions":"all","fallbacks":"helvetica","spriteIndex":5,"cssFontFamily":"'arial','helvetica','sans-serif'"},{"displayName":"Arial Black","fontFamily":"arial black","cdnName":"","genericFamily":"sans-serif","provider":"system","characterSets":["latin","cyrillic"],"permissions":"all","fallbacks":"gadget","spriteIndex":8,"cssFontFamily":"'arial black','gadget','sans-serif'"},{"displayName":"Comic Sans MS","fontFamily":"comic sans ms","cdnName":"","genericFamily":"cursive","provider":"system","characterSets":["latin","latin-ext","cyrillic"],"permissions":"all","fallbacks":"comic-sans-w01-regular,comic-sans-w02-regular,comic-sans-w10-regular","spriteIndex":22,"cssFontFamily":"'comic sans ms','comic-sans-w01-regular','comic-sans-w02-regular','comic-sans-w10-regular','cursive'"},{"displayName":"Courier New","fontFamily":"courier new","cdnName":"","genericFamily":"monospace","provider":"system","characterSets":["latin","latin-ext","cyrillic"],"permissions":"all","fallbacks":"courier-ps-w01,courier-ps-w02,courier-ps-w10","spriteIndex":30,"cssFontFamily":"'courier new','courier-ps-w01','courier-ps-w02','courier-ps-w10','monospace'"},{"displayName":"Georgia","fontFamily":"georgia","cdnName":"","genericFamily":"serif","provider":"system","characterSets":["latin","latin-ext","cyrillic"],"permissions":"all","fallbacks":"palatino,book antiqua,palatino linotype","spriteIndex":48,"cssFontFamily":"'georgia','palatino','book antiqua','palatino linotype','serif'"},{"displayName":"Impact","fontFamily":"impact","cdnName":"","genericFamily":"sans-serif","provider":"system","characterSets":["latin","latin-ext","cyrillic"],"permissions":"all","fallbacks":"impact-w01-2010,impact-w02-2010,impact-w10-2010","spriteIndex":79,"cssFontFamily":"'impact','impact-w01-2010','impact-w02-2010','impact-w10-2010','sans-serif'"},{"displayName":"Lucida Console","fontFamily":"lucida console","cdnName":"","genericFamily":"monospace","provider":"system","characterSets":["latin","latin-ext"],"permissions":"all","fallbacks":"lucida-console-w01","spriteIndex":94,"cssFontFamily":"'lucida console','lucida-console-w01','monospace'"},{"displayName":"Lucida Sans Unicode","fontFamily":"lucida sans unicode","cdnName":"","genericFamily":"sans-serif","provider":"system","characterSets":["latin"],"permissions":"all","fallbacks":"lucida grande","spriteIndex":96,"cssFontFamily":"'lucida sans unicode','lucida grande','sans-serif'"},{"displayName":"Palatino Linotype","fontFamily":"palatino linotype","cdnName":"","genericFamily":"serif","provider":"system","characterSets":["latin","latin-ext"],"permissions":"all","fallbacks":"","spriteIndex":119,"cssFontFamily":"'palatino linotype','serif'"},{"displayName":"Tahoma","fontFamily":"tahoma","cdnName":"","genericFamily":"sans-serif","provider":"system","characterSets":["latin","latin-ext"],"permissions":"all","fallbacks":"tahoma-w01-regular,tahoma-w02-regular,tahoma-w10-regular,tahoma-w15--regular,tahoma-w99-regular","spriteIndex":141,"cssFontFamily":"'tahoma','tahoma-w01-regular','tahoma-w02-regular','tahoma-w10-regular','tahoma-w15--regular','tahoma-w99-regular','sans-serif'"},{"displayName":"Times New Roman","fontFamily":"times new roman","cdnName":"","genericFamily":"serif","provider":"system","characterSets":["latin","latin-ext","cyrillic"],"permissions":"all","fallbacks":"times","spriteIndex":143,"cssFontFamily":"'times new roman','times','serif'"},{"displayName":"Verdana","fontFamily":"verdana","cdnName":"","genericFamily":"sans-serif","provider":"system","characterSets":["latin","latin-ext","cyrillic"],"permissions":"all","fallbacks":"geneva","spriteIndex":146,"cssFontFamily":"'verdana','geneva','sans-serif'"}]}]
	}

    function addCommasIfNeededToFontFamilies(cssFontFamily){
        var fontFamilyArr = cssFontFamily.split(',');

        for (var fontFamily in fontFamilyArr) {
            if (fontFamilyArr[fontFamily].indexOf('"') < 0) {
                fontFamilyArr[fontFamily]  = '"' + fontFamilyArr[fontFamily]  + '"';
            }
        }

        return fontFamilyArr.toString();
    }

	function appendSpriteMap(spriteUrl, $el) {
		if (!spriteUrl) {
			throw new Error('Could not found sprite map url');
		}
		var allFontsMeta = getEditorFonts();
		var frag = document.createDocumentFragment();
		allFontsMeta.forEach(function (fontsMetaLang) {
			var fontsMeta = fontsMetaLang.fonts;
			for (var f in fontsMeta) {
				var font = fontsMeta[f];
				var offsetIndex = font.characterSets.indexOf(fontsMetaLang.lang);
				var spriteIndex = font.spriteIndex + offsetIndex;

                // Add commas for each font family if needed
                font.cssFontFamily = addCommasIfNeededToFontFamilies(font.cssFontFamily);

                // Convert " to '
                font.cssFontFamily = font.cssFontFamily.replace(/\"/g, '\'');

				var el = $('<div data-value-extended="'+font.cssFontFamily+'" value="' + font.fontFamily + '">' + font.displayName + '</div>').css({
					backgroundImage: 'url("'+spriteUrl+'")',
					backgroundRepeat: 'no-repeat',
					backgroundPosition: '4px ' + (spriteIndex * -24 + 3) + 'px'
				})[0];
				frag.appendChild(el);
			}
		});
		$el.html('');
		$el.append(frag);
	}

	function createSpriteMap(spriteUrl, selector, length, offsetY, offsetX, hoverSelector) {

		var tpl = "background-image:url('$image');" +
			"background-repeat:no-repeat;" +
			"background-position: $leftpx $toppx;";

		tpl = tpl.replace('$image', spriteUrl);

		offsetY = offsetY || 0;
		offsetX = offsetX || 0;
		hoverSelector = hoverSelector || ''
		var index = length + 1;
		var style = new Array(length * 2);
		var pos;
		var out;
		while (index--) {
			pos = (index * -24 + offsetY);
			out = tpl.replace('$top', pos).replace('$left', offsetX);
			style[index] = (selector + index) + '{' + out + '}';
			style[index + length + 1] = (selector + index + hoverSelector) + '{' + out + ' }';
		}
		return style.join('\n');
	}

	function appendStyle(cssText, id, attr) {
		var style = document.createElement('style');
		style.id = id;
		attr && style.setAttribute(attr.key, attr.val);
		style.appendChild(document.createTextNode(cssText));
		var head = document.getElementsByTagName('head')[0];
		head.appendChild(style);
	}

});


jQuery.fn.definePlugin('FontStylePicker', function () {
	'use strict';

	var names = {
		fontStylePickerClass: 'font-style-picker',
		presetSelectClass:'font-style-picker-preset-select',
		fontPickerClass: 'font-style-picker-font-picker',
		fontSizeClass: 'font-style-picker-font-size',
		textStyleClass: 'font-style-picker-text-style' 
	};

    var defaultFontDisplayName = 'Arial';
    var defaultFont = 'arial';
    var customFont= 'Custom';

    var boxLikeDrop = '<div class="box-like-drop"><span class="box-like-drop-content">Font Picker</span><span class="box-like-arrow box-like-arrow-down"></span></div>';


    var contentMarkup = '<div class="uilib-divider-row"><span class="font-picker-label">Style:</span><span class="style-place-holder"></span></div>';
        contentMarkup += '<div class="uilib-divider-row"><span class="font-picker-label">Font:</span><span class="font-place-holder"></span></div>';
        contentMarkup += '<div class="uilib-divider-row"><span class="font-picker-label"> </span><span class="props-place-holder"></span></div>';

    var textStyleHtml = '';
    textStyleHtml += '<button value="bold" class="grad-1" style="font-family: serif;font-weight: bold;">B</button>';
    textStyleHtml += '<button value="italic" class="grad-1" style="font-family: serif;font-style: italic;">I</button>';
    textStyleHtml += '<button value="underline" class="grad-1" style="font-family: serif;text-decoration: underline;">U</button>';

    return {
		init : function () {
			this.isParamMode = this.getParamKey();
			this.currentValue = null;
			this.popup = null;
			this.fontSizePicker = null;
			this.textStylePicker = null;
			this.fontPicker = null;
			this.presetSelectPicker = null;
            this.customVal = {};
			this.markup();
            this.setValue(this.options.value);
			this.bindEvents();
		},
		getDefaults : function () {
			return {
				value: 'Body-L'
			};
		},
		markup : function () {
			this.$el.html(boxLikeDrop);
			this.$el.addClass(names.fontStylePickerClass);
			
			this.createPopup();
			this.createFontPicker();
			this.createTextStylePicker();
			this.createFontSizePicker();
            this.createPresetPicker();

			this.popup.content.innerHTML = contentMarkup;
			
			$(this.popup.content).find('.style-place-holder').append(
				this.presetSelectPicker.$el.addClass(names.presetSelectClass)
			);
			
			$(this.popup.content).find('.font-place-holder').append(
				this.fontPicker.$el.addClass(names.fontPickerClass)
			);
			
			$(this.popup.content).find('.props-place-holder').append(
				this.fontSizePicker.$el.addClass(names.fontSizeClass),
				this.textStylePicker.$el.addClass(names.textStyleClass)
			);
			
			//this.popup.open();			
		},
		createFontSizePicker: function(){
			this.fontSizePicker = this.UI().create({
				ctrl: 'Spinner',
				options: {
					size : 'medium'
				},
				appendTo: this.$el
			}).getCtrl();
		},
		createTextStylePicker: function(){
			this.textStylePicker = this.UI().create({
				ctrl: 'ToggleButtonGroup',
				html: textStyleHtml,
				appendTo: this.$el
			}).getCtrl();
		},
		createFontPicker: function(){
			this.fontPicker = this.UI().create({
				ctrl: 'FontPicker',
				appendTo: this.$el
			}).getCtrl();
		},
		createPresetPicker: function(){
			var html = '';
			var that = this;
			var presets = this.getSiteTextPresets();

            Object.keys(presets).sort().forEach(function(presetName){

                var styleFont = that.getStyleFontByReference(presetName) ;
                var font = (styleFont && styleFont.fontFamily) || defaultFont;
                var fontSize = (styleFont && styleFont.size) || '12px';
                var styleCss = ' style="font-family:' + font +'"';
                html += that.createStyleHtmlMarkup(presetName, presetName.replace(/-/g,' '), font, fontSize, styleCss, "");
			});

            // Add the custom font
            html += this.createCustomMarkup();

			this.presetSelectPicker = this.UI().create({
				ctrl: 'Dropdown',
				appendTo: this.$el,
				html: html,
				options:{
					width : 265,
					height : 260,
					value: 1,
					modifier: function($el, $original){

                        // Remove the description of the font style
                        var modifierHtml = that.createSelectedStyleHtmlMarkup($el);
                        $el.html(modifierHtml);
						return $el;
					}
				}
			}).getCtrl();		
			
		},
        createCustomMarkup: function(){
            var fontFamily = (this.fontPicker && this.fontPicker.getValue() && this.fontPicker.getValue().value) || defaultFont;
            var textStyle = (this.textStylePicker && this.textStylePicker.getValue() && this.textStylePicker.getValue()) || {bold : false, italic : false, underline: false};
            var fontSize = (this.fontSizePicker && this.fontSizePicker.getValue()) || 12;

            var textStyleCss = textStyle.bold ? '; font-weight: bold': "";
            textStyleCss += textStyle.italic ? '; font-style: italic': "";
            textStyleCss += textStyle.underline ? '; text-decoration: underline' : "";

            var customStyleCss = ' style="font-family: ' + fontFamily + textStyleCss + '"';

            this.customVal = { size: fontSize, family: fontFamily, preset: customFont, style: textStyle};

            return this.createStyleHtmlMarkup(customFont, customFont, fontFamily, fontSize, customStyleCss, " custom");
        },
        createStyleHtmlMarkup: function(styleName, styleDisplayName, fontFamily, fontSize, styleCss, customClass){
            var fontDisplayName = this.getFontDisplayName(fontFamily) || defaultFontDisplayName;

            return  ('<div data-append-children="true" value="'+ styleName + '" class="font-style-option' + customClass +'" >' +
                        '<div' + styleCss + ' class="font">'+styleDisplayName+'</div>' +
                        '<div class="description">' +
                            '<div class="font-description">' + fontDisplayName + '</div>' +
                            '<div> , ' + fontSize + '</div>' +
                        '</div>' +
                    '</div>');
        },
        createSelectedStyleHtmlMarkup: function(el){
            var value = el.attr('data-value');
            var displayName = (value == customFont? customFont : value.replace(/-/g,' '));
            return  ('<div value="' + value + '">' + displayName + '</div>');
        },
		createPopup: function(){
			var that = this;
			this.popup = this.UI().create({
				ctrl: 'Popup',
				options: {
					appendTo: this.$el,
					title : 'Font Settings',
					content : '',
					footer:'',
					buttonSet: 'okCancel',
					modal : false,
					modalBackground : 'rgba(0,0,0,0.5)',
					height : 'auto',
					width : 287,
                    fixed: true,
					onopen: function(){
						that.$el.append(this.arrow);
						that.currentValue = that.getValue();
					},
					onclose : function (evt) {
						that.updateText();
					},
					oncancel: function(evt) {
						that.setValue(that.currentValue);
						that.triggerChangeEvent(that.getValue());
					},
					onposition: function(){}
				}
			}).getCtrl();
			
			this.popup.setRelativeElement(that.$el.find('.box-like-drop')[0]);
		
		},
		hideArrow:function(){
			$(this.popup.arrow).hide(50);
		},
		showArrow: function(){
			$(this.popup.arrow).show(50);
		},
		bindEvents : function () {
			var that = this;
			this.$el.on('click', '.box-like-drop',function(evt){
				evt.stopPropagation();
				that.popup.toggle();
			});
			this.registerToChangeEventAndDelegate(this.fontSizePicker, this);
			this.registerToChangeEventAndDelegate(this.textStylePicker, this);
			this.registerToChangeEventAndDelegate(this.fontPicker, this);
			this.registerToChangeEventAndDelegate(this.presetSelectPicker, this);
			
			this.$el.on('uilib-dropdown-close', function(evt, plugin){
				if(plugin.isOpen && $(that.popup.arrow).hasClass('popup-arrow-top')){
                    setTimeout(function(){
					    that.showArrow();
                    },50);
				}
			});
			this.$el.on('uilib-dropdown-open', function(evt, plugin){
				if($(that.popup.arrow).hasClass('popup-arrow-top')){
					that.hideArrow();
				}
			});
			
			this.whenDestroy(function(){
				this.fontSizePicker.destroy();
				this.textStylePicker.destroy();
				this.fontPicker.destroy();
				this.presetSelectPicker.destroy();
			});
		},
        getSiteTextPresets: function(){
            var defaultTextPresets = {"Title":{"editorKey":"font_0","lineHeight":"1.1em","style":"normal","weight":"bold","size":"35px","fontFamily":"arial black","value":"font: normal normal bold 35px/1.1em arial black,gadget,sans-serif ; color: #333333;"},"Menu":{"editorKey":"font_1","lineHeight":"1.2em","style":"normal","weight":"bold","size":"17px","fontFamily":"arial","value":"font: normal normal bold 17px/1.2em arial,helvetica,sans-serif ; color: #FFE899;"},"Page-title":{"editorKey":"font_2","lineHeight":"1.2em","style":"normal","weight":"bold","size":"50px","fontFamily":"arial","value":"font: normal normal bold 50px/1.2em arial,helvetica,sans-serif ; color: #133C2A;"},"Heading-XL":{"editorKey":"font_3","lineHeight":"1.2em","style":"normal","weight":"bold","size":"80px","fontFamily":"arial","value":"font: normal normal bold 80px/1.2em arial,helvetica,sans-serif ; color: #133C2A;"},"Heading-L":{"editorKey":"font_4","lineHeight":"1.2em","style":"normal","weight":"bold","size":"50px","fontFamily":"arial","value":"font: normal normal bold 50px/1.2em arial,helvetica,sans-serif ; color: #FFE899;"},"Heading-M":{"editorKey":"font_5","lineHeight":"1.3em","style":"normal","weight":"normal","size":"25px","fontFamily":"arial","value":"font: normal normal normal 25px/1.3em arial,helvetica,sans-serif ; color: #EF6C6C;"},"Heading-S":{"editorKey":"font_6","lineHeight":"1.2em","style":"normal","weight":"normal","size":"18px","fontFamily":"arial","value":"font: normal normal normal 18px/1.2em arial,helvetica,sans-serif ; color: #EF6C6C;"},"Body-L":{"editorKey":"font_7","lineHeight":"1.2em","style":"normal","weight":"normal","size":"16px","fontFamily":"arial","value":"font: normal normal normal 16px/1.2em arial,helvetica,sans-serif ; color: #4D3613;"},"Body-M":{"editorKey":"font_8","lineHeight":"1.2em","style":"normal","weight":"normal","size":"14px","fontFamily":"arial","value":"font: normal normal normal 14px/1.2em arial,helvetica,sans-serif ; color: #4D3613;"},"Body-S":{"editorKey":"font_9","lineHeight":"1.2em","style":"normal","weight":"normal","size":"12px","fontFamily":"arial","value":"font: normal small-caps normal 12px/1.2em arial,helvetica,sans-serif ; color: #4D3613;"},"Body-XS":{"editorKey":"font_10","lineHeight":"1.2em","style":"normal","weight":"normal","size":"10px","fontFamily":"arial","value":"font: normal small-caps normal 10px/1.2em arial,helvetica,sans-serif ; color: #4D3613;"}};
            return ((Wix && Wix.Styles)? Wix.Styles.getSiteTextPresets() : defaultTextPresets) || defaultTextPresets;
        },

        // Get font display name
        getFontDisplayName: function(fontFamily){
            var textPresets = Wix.Styles && Wix.Styles.getSiteTextPresets();
            var editorFonts = Wix.Styles && Wix.Styles.getEditorFonts();

            if (Wix.Styles && textPresets && editorFonts){
                // Go over all editor fonts nad find the correct display name
                for (var index = 0; index < editorFonts.length; ++index){
                    var fonts = editorFonts[index].fonts;
                    for (var index2 = 0; index2 < fonts.length; ++index2) {
                        var findIndex = fonts[index2].cssFontFamily.indexOf(fontFamily);
                        if (findIndex >= 0){
                            return fonts[index2].displayName;
                        }
                    }
                }
            }

            return defaultFontDisplayName;
        },

        getTextPreset:function(presetName){
            var presets = this.getSiteTextPresets();
            var preset = presets[presetName];
            return preset;
        },
        getStyleFontByReference: function(fontReference){
            return (Wix && Wix.Styles)? Wix.Styles.getStyleFontByReference(fontReference) : {};
        },
		handlePluginPresetSelectChange: function(plugin, evt){
			var presets = this.getSiteTextPresets();
			var presetName = this.presetSelectPicker.getValue().value;
			var preset = presets[presetName];
			if(!preset){
                this.setValueFromCustom();
            } else {
                this.setValueFromPreset(presetName, preset);
            }
		},
		checkPresetAgainstState: function(preset, currentState){
			if(currentState.style.underline){
				return false;
			}
			var weight = currentState.style.bold ? 'bold' : 'normal';
			if(weight !== preset.weight){
				return false;
			}
			var style = currentState.style.italic ? 'italic' : 'normal';
			if(style !== preset.style){
				return false;
			}
			if(currentState.family !== preset.fontFamily){
				return false;
			}
			if(currentState.size !== parseInt(preset.size, 10)){
				return false;
			}
			return true;
		},
		getSimilarPresetName: function(){
			var presets = this.getSiteTextPresets();
			var currentState = this.getValue();
			for(var presetName in presets){
				if(presets.hasOwnProperty(presetName)){
					if(this.checkPresetAgainstState(presets[presetName], currentState)){
						return presetName;
					}
				}
			}
			return null;
		},
		handleNonPluginPresetSelectChange: function(plugin, evt){
			var presetName = this.getSimilarPresetName();
			if(presetName){
				this.presetSelectPicker.setValue(presetName);
			} else {

                // Update custom option in the dropdown list with the new selection of size, font family and text style
                this.updateCustomOption();
				this.presetSelectPicker.setValue(customFont);
			}
            this.updateText();
		},
        updateCustomOption : function() {
            if (this.presetSelectPicker){
                var dropdown = this.presetSelectPicker.$el;
                var dropdownOption = dropdown && this.presetSelectPicker.$el.find('.options');
                var customOption = dropdownOption  && dropdownOption.find('.custom');
                if (customOption){
                    customOption.html(this.createCustomMarkup());
                }
            }
        },
		innerChangeHandler: function(plugin, evt){
			if(plugin.$el.hasClass(names.presetSelectClass)){
				this.handlePluginPresetSelectChange(plugin, evt);
			} else {
				this.handleNonPluginPresetSelectChange(plugin, evt);
			}			
			this.triggerChangeEvent(this.getValue());
		},
		registerToChangeEventAndDelegate: function(plugin, ctx){
			plugin.$el.on(plugin.pluginName + '.change', function(evt){
				evt.stopPropagation();
				ctx.innerChangeHandler(plugin, evt);
			});
		},
		updateText: function(){
			var text = this.presetSelectPicker.getValue().value;
			this.$el.find('.box-like-drop-content').text(text);
		},
		getValue : function () {
			var family = this.fontPicker.getValue();
			var val = {
				size:   this.fontSizePicker.getValue(),
				style:  this.textStylePicker.getValue(),
				family: family.value,
				cssFontFamily : family.cssFontFamily,
				preset: this.presetSelectPicker.getValue().value
			};
			if(this.getParamKey()){
				val.fontStyleParam = true;
			}
			return val;
		},
        setValueFromPreset:function(presetName, preset){
            this.setValueWithKnownPreset({
                size: parseInt(preset.size, 10),
                family: preset.fontFamily,
                preset: presetName,
                style:  {
                    bold : preset.weight === 'bold',
                    italic : preset.style === 'italic',
                    underline: false
                }
            });
        },
        setValueFromCustom: function(){

            if(this.validateValue(this.customVal)){
                this.fontSizePicker.setValue(this.customVal.size);
                this.textStylePicker.setValue(this.customVal.style);
                this.fontPicker.setValue(this.customVal.family);
                this.updateText();
            }
        },
		validateValue: function(value){
			if(value && typeof value === 'object'){
				var isSizeValid = typeof value.size === 'number' || value.size instanceof Number;
				var isStyleValid = value.style && typeof value.style === 'object';
				var isFontFamilyValid = value.family && typeof value.family === 'string';
				var isPresetValid = value.preset && typeof value.preset === 'string';
				if(isSizeValid && isStyleValid && isFontFamilyValid && isPresetValid){
					return true;
				}
			}
			return false;
		},
        setValueWithKnownPreset:function(value){
			if(this.validateValue(value)){
				this.fontSizePicker.setValue(value.size);
				this.textStylePicker.setValue(value.style);
				this.fontPicker.setValue(value.family);
				this.presetSelectPicker.setValue(value.preset);
				this.updateText();
			} else {
				throw new Error('Unknown Preset ' + JSON.stringify(value,null,4));
			}
        },
		setValue : function (value) {
			if(typeof value === 'string'){ value = {preset: value}; }
            var preset = this.getTextPreset(value.preset);
            preset ? this.setValueFromPreset(value.preset, preset) : this.setValueWithKnownPreset(value);
		}
	};

});


jQuery.fn.definePlugin('Input', function ($) {
    'use strict';

    var classNames = {
        inputClass: 'uilib-input',
        validInputClass: 'valid-input',
        invalidInputClass: 'invalid-input',
        disabledClass:'disabled',
        largeClass: 'large',
        mediumClass: 'medium',
        xLargeClass: 'x-large',
        bigClass: 'big'

    };

    return {
        init: function(){
            this.markup();
            this.setValue(this.options.value);
            this.bindEvents();
        },
        setValidationFunction:function(validationFunction){
            if(typeof validationFunction === 'function'){
                this.options.validate = true;
                this.options.validation = validationFunction;
            } else {
                throw new Error('You must provide a valid validation function.');
            }
        },
        getDefaults: function(){
            return {
                value:'',
                validate: false,
                required: false,
                type: 'text',
                placeholder: 'Text input',
                disabled : false,
                size: 'default',
                validation: function(){
                    return true;
                }
            };
        },
        markup: function () {
            this.$input = $('<input>').attr('type', this.options.type).attr('placeholder', this.options.placeholder).addClass(classNames.inputClass);
            if (this.options.disabled){
                this.disable();
            }
            switch (this.options.size) {
                case 'large':
                    this.$input.addClass(classNames.largeClass);
                    break;
                case 'medium':
                    this.$input.addClass(classNames.mediumClass);
                    break;
                case 'x-large':
                    this.$input.addClass(classNames.xLargeClass);
                    break;
                case 'big':
                    this.$input.addClass(classNames.bigClass);
                    break;
            }

            this.$el.append(this.$input);
        },
        bindEvents: function () {
            var input = this;
            input.$input.on('blur', function(){
                input.setValue(input.$input.val());
                input.triggerChangeEvent(input.getValue());
            });
            input.$input.on('keyup',function(){
                input.setValue(input.$input.val());
            });
        },
        getValue: function () {
            return this.value;
        },
        setValue: function (value) {
            var isPassRequiredValidation = this.options.required ? !!value.length : true;
            var isDifferentValue = (this.$input.val() !== this.value || value !== this.value);
            if(isPassRequiredValidation && this.options.validation(value) && isDifferentValue && this.$input[0].checkValidity()){
                if(this.options.type == 'number' && !isNaN(parseFloat(value)) && isFinite(value)){
                    value = Math.round(value);
                }
                this.lastValue = this.getValue();
                if (value !== this.$input.val()) {
                    this.$input.val(value);
                }
                this.value = value;
                if(this.options.validate || this.options.validation(value)){
                    this.$input.removeClass(classNames.invalidInputClass).addClass(classNames.validInputClass);
                }
            } else if(this.$input.val() !== this.value || this.options.type == 'number'){
                this.value = '';
                if((this.options.validate && (this.$input.val() !== '')) || !this.$input[0].checkValidity()){
                    this.$input.removeClass(classNames.validInputClass).addClass(classNames.invalidInputClass);
                }
                else {
                    this.$input.removeClass(classNames.invalidInputClass);
                }
            }
            else if (this.$input.val() === '' && this.$input[0].checkValidity()){
                this.$input.removeClass(classNames.invalidInputClass);
            }

        },
        disable: function () {
            this.$input.addClass(classNames.disabledClass);
            this.$input.attr('disabled', 'disabled');
        },
        enable: function () {
            this.$input.removeClass(classNames.disabledClass);
            this.$input.removeAttr('disabled', 'disabled');
        },
        isDisabled: function () {
            return this.$input.hasClass(classNames.disabledClass);
        }
    };

});

jQuery.fn.definePlugin('LanguagePicker', function () {
    'use strict';

    var styles = {
        className : 'uilib-languagePicker'
    };
	
	var symbToName = {
		'En': 'English',
		'De': 'Deutsch',
		'Es': 'Español',
		'Fr': 'Français',
		'It': 'Italiano', 
		'Po': 'Polski', 
		'Pt': 'Português', 
		'Ru': 'Русский', 
		'Ja': '日本語', 
		'Ko': '한국어', 
		'Tr': 'Türkçe'
	};
	
	return {
		init : function () {
			this.markup();
            this.bindEvents();
		},
		markup : function () {
            var $options = _optionsHtml(this.options.languages);
            this.$el.append($options);
			var height = this.options.height;
			if(this.options.height === 'auto'){
				var m = $options.length % 2;
				height = $options.length <= 4 ? $options.length * 26 : ($options.length - m)/2 * 26;
			}
			this.dropdown = this.$el.Dropdown({
					   width: 62,
				      height: height,
                optionsWidth: 105,
                    modifier: function($el){
                        var $globe = $("<span class='globe'></span>");
                        $el.text($el.attr('data-value'));
                        $el.prepend($globe);
                        return $el;
                    }
				}).data('plugin_Dropdown');
            if(!this.$el.hasClass(styles.className)){
                this.$el.addClass(styles.className);
            }
		},
		bindEvents : function () {
			var languagePicker = this;
			this.$el.on('Dropdown.change', function (evt, data) {
				evt.stopPropagation();
                languagePicker.triggerChangeEvent(languagePicker.getValue());
			});
		},
        getDefaults: function(){
            return {
				languages: ['En', 'De', 'Es', 'Fr', 'It', 'Po', 'Pt', 'Ru', 'Ja', 'Ko', 'Tr'],
				height: 'auto'
			};
        },
		getValue : function () {
			return this.dropdown.getFullValue();
		},
		setValue : function (value) {
            return this.dropdown.setValue(value);
		}
	};

	
    function _optionsHtml(langs) {	
		return $(langs.map(function(symb){
			return '<div value="'+symb+'">'+symbToName[symb]+'</div>';
		}).join(''));
    }
});

jQuery.fn.definePlugin('Popup', function ($) {
    'use strict';

    var names = {};

    var buttonSet = {
        okCancel: '<button class="uilib-btn btn-secondary btn-small x-close-popup">Cancel</button><button style="float:right" class="uilib-btn btn-small close-popup">OK</button>',
        none: ''
    };

    return {
        init: function(){
            // TODO: get rid of this.popup
            this.state = 'open';
            this.popup = this.$el[0];
            this.transclude();
            this.markup();
            this.close();
            this.setContent(this.options.content);
            this.setFooter(this.options.footer);
            this.setTitle(this.options.title);
            this.setPosition();
            this.bindEvents();
        },
        getDefaults: function(){
            return {
                appendTo: 'body',
                title : 'Popup',
                content : '',
                footer : '',
                modal : false,
                modalBackground : 'rgba(0,0,0,0.5)',
                height : 'auto',
                width : 300,
                buttonSet: '',
                fixed: false,
                maxPopupWidth: 0,
                onclose : function () {},
                oncancel: function() {},
                onopen: function(){},
                onposition: function(){}
            };
        },
        markup: function () {
            this.modal = document.createElement('div');
            this.header = document.createElement('header');
            this.headerTitle = document.createElement('span');
            this.closeBtn = document.createElement('div');

            this.content = document.createElement('div');

            this.footer = document.createElement('div');

            this.modal.className = 'popup-modal';

            this.closeBtn.className = 'popup-close-btn x-close-popup';
            this.popup.className = 'uilib-popup';
            this.header.className = 'popup-header';
            this.content.className = 'popup-content';
            this.footer.className = 'popup-footer';

            this.popup.appendChild(this.header);
            this.popup.appendChild(this.content);
            this.popup.appendChild(this.footer);
            this.header.appendChild(this.headerTitle);
            this.header.appendChild(this.closeBtn);

            this.arrow = this.createArrowElement();
        },
        transclude: function () {
            var $el = this.$el;
            $el.remove();
            var headerContent = $el.find('.popup-header').text();
            var contentContent = $el.find('.popup-content').html();
            var footerContent = $el.find('.popup-footer').html();
            if($.trim(headerContent)){
                this.options.title = headerContent;
            }
            if($.trim(contentContent)){
                this.options.content = contentContent;
            }
            if($.trim(footerContent)){
                this.options.footer = footerContent;
            }
            $el.empty();
        },
        bindEvents: function () {
            var popup = this;
            var closeHandler = function (type) {
                popup.setValue('close');
                var onType = popup.options['on' + type];
                if(typeof onType === 'string' && typeof window[onType] === 'function'){
                    window[onType].call(popup, {type: type});
                } else if(typeof onType === 'function'){
                    onType.call(popup, {type: type});
                }
            }
            var globalCloseHandler = function(evt){
                var popupEl = $(evt.target).parents('.' + popup.popup.className)[0];
                if(popupEl && popupEl === popup.popup || !popup.isOpen()){
                    return ;
                }else if(!popup.options.modal){
                    popup.setValue('close');
                    closeHandler('cancel');
                }
            }

            function keyHandler(evt){
                if(evt.which === 27){
                    if(popup.isOpen() && !popup.options.modal){
                        closeHandler('cancel');
                    }
                }
            }

            $(window).on('keyup', keyHandler);

            $(this.popup).on('click', '.close-popup', closeHandler.bind(null, 'close'));
            $(this.popup).on('click', '.x-close-popup', closeHandler.bind(null, 'cancel'));
            $(window).on('click', globalCloseHandler);

            this.whenDestroy(function(){
                $(window).off('click', globalCloseHandler);
                $(window).off('keyup', keyHandler);
            });

        },
        getValue: function () {
            return this.isOpen();
        },
        setValue: function (value) {
            if(value === 'open'){
                this.open();
            } else {
                this.close();
            }
            this.triggerChangeEvent('close');
        },
        setRelativeElement: function(selectorOrElement){
            this.relativeElement = $(selectorOrElement)[0];
        },
        setPosition: function () {
            this.$el.css({
                position : this.options.fixed ? 'fixed':'absolute',
                width : this.options.width,
                height : this.options.height,
                left : '50%',
                top : '50%',
                marginLeft : 0 - this.options.width / 2,
                marginTop : 0 - this.$el.height() / 2
            });
            if(this.relativeElement){
                this.setBestPosition(this.relativeElement);
            }
            if(typeof this.options.onposition === 'function'){
                return this.options.onposition.call(this);
            }
        },
        setBestPosition: function(relativeTo){
            if(relativeTo instanceof jQuery){
                relativeTo = relativeTo[0];
            }
            var dir;
            if (this.options.fixed){
                dir = setFixedPosition(this.$el[0], relativeTo, this.options.maxPopupWidth);
            }else{
                dir = setAbsolutePosition(this.$el[0], relativeTo);
            }
            this.setArrowDir(dir);
            return dir;
        },
        createArrowElement: function(){
            return createArrowElement();
        },
        setArrowDir: function(side){
            side = side||'left';
            return this.arrow.className = 'popup-arrow popup-arrow-' + side;
        },
        setContent: function (content) {
            $(this.content).empty().append(content);
        },
        setFooter: function (footerContent) {
            $(this.footer).empty().append(buttonSet[this.options.buttonSet], footerContent);
        },
        setTitle: function (title) {
            $(this.headerTitle).text(title);
        },
        isOpen: function (title) {
            return this.state === 'open';
        },
        toggle: function(){
            this.isOpen() ? this.close() : this.open();
        },
        open: function () {
            if(this.isOpen()){return;}
            this.closeAllPopups();
            this.state = 'open';
            setTimeout(function(){
                if(this.options.modal){
                    document.body.appendChild(this.modal);
                }
                $(this.options.appendTo).append(this.popup);
                this.popup.style.display = 'block';
                this.modal.style.display = 'block';
                this.arrow.style.display = 'block';
                this.modal.style.backgroundColor = this.options.modalBackground;
                this.setPosition();
                if(this.options.onopen){
                    return this.options.onopen.call(this);
                }
            }.bind(this),0);
        },
        close: function () {
            if(!this.isOpen()){return;}
            this.state = 'close';
            setTimeout(function(){
                this.modal.style.display = 'none';
                this.popup.style.display = 'none';
                this.arrow.style.display = 'none';
            }.bind(this),0);
        },
        closeAllPopups: function(){
            var $popups = $("." + this.popup.className);
            $popups.each(function(index, popup){
                var ctrl = $(popup).getCtrl();
                if(ctrl) {
                    ctrl.close();
                }
            });
        }
    };

    function createArrowElement(side){
        side = side || 'left';
        var wrapperArrow = document.createElement('div');
        var a1 = document.createElement('div');
        var a2 = document.createElement('div');
        wrapperArrow.className = 'popup-arrow popup-arrow-' + side;
        a1.className = 'popup-arrow-one';
        a2.className = 'popup-arrow-two';
        wrapperArrow.appendChild(a1);
        wrapperArrow.appendChild(a2);
        return wrapperArrow;
    }

    function setAbsolutePosition(targetNode, relativeTo){
        var side = 'left';
        var right = 'auto';
        var distanceFromBox = 15;
        var topMoveTranslate = 0;

        targetNode.style.top = '0px';
        targetNode.style.bottom = 'auto';
        targetNode.style.left = '0px';
        targetNode.style.right = 'auto';
        targetNode.style.margin = '0';

        var targetNodeWidth = targetNode.clientWidth;
        var targetNodeHeight = targetNode.clientHeight;
        var halfTargetNodeHeight = targetNodeHeight/2;

        var elmWidth = relativeTo.clientWidth;
        var elmHeight = relativeTo.clientHeight;

        var top = (elmHeight/2 - halfTargetNodeHeight);
        var left = elmWidth + distanceFromBox;


        var offset = getOffset(relativeTo);

        if((elmWidth + targetNodeWidth + offset.left + distanceFromBox + 1) > window.innerWidth){
            right = elmWidth + distanceFromBox + 1;
            side = 'right';
        }

        var rightOver = (offset.left - (targetNodeWidth + distanceFromBox + 1));
        if(side === 'right' && rightOver < 0){
            top = 0 - (targetNodeHeight + distanceFromBox);
            right = elmWidth/2 - targetNodeWidth/2;
            side = 'top';
        }


        if((offset.top - halfTargetNodeHeight) < 0){
            top -= offset.top - halfTargetNodeHeight - topMoveTranslate;
        }

        if(side !== 'top' && (elmHeight + offset.top + halfTargetNodeHeight) > window.innerHeight){
            top -= (elmHeight + offset.top + halfTargetNodeHeight) - window.innerHeight;
        }

        targetNode.style.top = top + 'px';
        targetNode.style.left = (side === 'right' || side === 'top') ? 'auto' : left + 'px';
        targetNode.style.right = (side === 'right' || side === 'top') ? right + 'px' : 'auto';
        targetNode.style.margin = '';
        return side;

    }

    function setFixedPosition(popup, relativeTo, maxPopupWidth){
        var side = 'left';
        var right = 'auto';
        var arrowWidth = 15;
        var containerWidth = window.innerWidth;

        popup.style.top = '0px';
        popup.style.bottom = 'auto';
        popup.style.left = '0px';
        popup.style.right = 'auto';
        popup.style.margin = '0';

        var popupWidth = maxPopupWidth > 0? maxPopupWidth: popup.clientWidth;
        var popupHeight = popup.clientHeight;
        var halfPopupHeight = popupHeight/2;

        var relativeToWidth = relativeTo.clientWidth;
        var relativeToHeight = relativeTo.clientHeight;

        var relativeToOffset = getFixedOffset(relativeTo);

        // popup will be opened on the right side - default
        var top = relativeToOffset.top + relativeToHeight/2 - halfPopupHeight;
        var left = relativeToOffset.left + relativeToWidth + arrowWidth;

        // popup will be opened on the left side
        if((relativeToOffset.left + relativeToWidth + arrowWidth + popupWidth + 1) > containerWidth){
            right = containerWidth - relativeToOffset.left + arrowWidth + 1;
            side = 'right';
        }

        // popup will be opened on top of the control
        // If there is no enough space for the height of the popup
        var rightOver = (relativeToOffset.left - (popupWidth + arrowWidth + 1));
        if((side === 'right' && rightOver < 0) || ((popupHeight + top) > window.innerHeight) ){
            top = relativeToOffset.top - arrowWidth - popupHeight;
            left = relativeToOffset.left + relativeToWidth/2 - popupWidth/2;
            side = 'top';
        }

        // popup will be opened on the bottom of the control
		if(top  < 0){
			top = relativeToOffset.top + (relativeToHeight + arrowWidth) - 4;
            side = 'bottom';
        }

        popup.style.top = top + 'px';
        popup.style.left = (side === 'right') ? 'auto' : left + 'px';
        popup.style.right = (side === 'right') ? right + 'px' : 'auto';

        popup.style.margin = '';
        return side;
    }

    function getFixedOffset(el) {
        return { top: el.getBoundingClientRect().top,
            left: el.getBoundingClientRect().left };

    }

    function getOffset(el) {
        var _x = 0;
        var _y = 0;
        while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
            if(el === document.body){
                _x += el.offsetLeft - document.documentElement.scrollLeft;
                _y += el.offsetTop - document.documentElement.scrollTop;
            } else {
                _x += el.offsetLeft - el.scrollLeft;
                _y += el.offsetTop - el.scrollTop;
            }
            el = el.offsetParent;
        }
        return { top: _y, left: _x };
    }
});

jQuery.fn.definePlugin('Radio', function ($) {
    'use strict';

    return {
        init: function(){
            this.options.value = this.options.value !== undefined ? this.options.value : this.options.checked;
            this.markup();
            this.setValue(this.options.value);
            this.bindEvents();
        },
        getDefaults: function(){
            return {
                radioBtnGroupClassName:'rb-radio-group',
                radioBtnClassName:'rb-radio',
                checkClassName:'rb-radio-check',
                checkedClassName: 'rb-radio-checked',
                radioValueAttrName:'data-radio-value',
                inline:false,
                checked: 0,
                value:undefined
            };
        },
        markup: function(){
            if(!this.$el.hasClass(this.options.radioBtnGroupClassName)){
                this.$el.addClass(this.options.radioBtnGroupClassName);
            }
            this.radioGroup = this.$el
                .find('['+this.options.radioValueAttrName+']')
                .addClass('uilib-text')
                .addClass(this.options.radioBtnClassName)
                .addClass(this.options.inline ? 'uilib-inline' : '')
                .prepend('<span class="'+ this.options.checkClassName +'"></span>');

        },
        bindEvents: function () {
            var radio = this;
            this.$el.on('click', '.'+this.options.radioBtnClassName, function (e) {
                radio.checkRadio($(this));
            });
        },
        getValue: function () {
            var $el = this.$el.find('.' + this.options.checkedClassName);
            return {
                value : $el.attr(this.options.radioValueAttrName),
                index : this.radioGroup.index($el)
            };
        },
        setValue: function (value) {
            var $el;
            if(typeof value === 'object'){
                value = value.index;
            }
            if(typeof value === 'string'){
                $el = this.$el.find('['+ this.options.radioValueAttrName +'="'+ value +'"]').eq(0);
            } else if (+value >= 0) {
                $el = this.radioGroup.eq(+value);
            }
            $el.length && this.checkRadio($el, true);
        },
        checkRadio: function ($el, silent) {
            if ($el.hasClass(this.options.checkedClassName)) { return; }
            this.radioGroup.removeClass(this.options.checkedClassName);
            $el.addClass(this.options.checkedClassName);
            if(!silent){
				this.triggerChangeEvent(this.getValue())
            }
        }
    };

});
(function ($, window, document, undefined) {
    'use strict';
		
    var pluginName = 'Scrollbar',
    defaults = {
            // width in pixels of the visible scroll area
            width : 'auto',
            // height in pixels of the visible scroll area
            height : '250px',
            // width in pixels of the scrollbar and rail
            size : '8px',
            // corner radius 
            radius: '4px',
            // scrollbar color, accepts any hex/color value
            color: '#a4d9fc',
             // scrollbar hober color, accepts any hex/color value
            hoverColor: '#35aeff',
            // sets scrollbar opacity
            hoverOpacity : 1,
            // scrollbar position - left/right
            position : 'right',
            // distance in pixels between the side edge and the scrollbar
            distance : '4px',
            // sets scrollbar opacity
            opacity : 1,
            // sets visibility of The rail
            railVisible : true,
            // sets rail color
            railColor : '#333',
            // sets rail opacity
            railOpacity : 0,
            // defautlt CSS class of the scroll rail
            railClass : 'uilib-scrollRail',
            // defautlt CSS class of the scroll bar
            barClass : 'uilib-scrollBar',
            // defautlt CSS class of the scroll wrapper
            wrapperClass : 'uilib-scrollDiv',
            // check if mousewheel should scroll the window if we reach top/bottom
            allowPageScroll : false,
            // scroll amount applied to each mouse wheel step
            wheelStep : 20,
            // scroll amount applied when user is using gestures
            touchScrollStep : 200,
            minBarHeight: 30,
            padding: '0 0 2px 0'
    };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.$el = $(element);
        this.options = $.extend({}, defaults, options);
		this.percentScroll = 0;
		this.lastScroll = undefined;
        this.markup();
        this.registerEvents();
        this.updateDisplay();
    };

	Plugin.prototype.scrollContent = function (y, isWheel, isJump) {
		var delta = y;
		var maxTop = this.$el.outerHeight() - this.$bar.outerHeight();

		if (isWheel) {
			// move bar with mouse wheel
			delta = parseInt(this.$bar.css('top')) + y * parseInt(this.options.wheelStep) / 100 * this.$bar.outerHeight();

			// move bar, make sure it doesn't go out
			delta = Math.min(Math.max(delta, 0), maxTop);

			// if scrolling down, make sure a fractional change to the
			// scroll position isn't rounded away when the scrollbar's CSS is set
			// this flooring of delta would happened automatically when
			// bar.css is set below, but we floor here for clarity
			delta = (y > 0) ? Math.ceil(delta) : Math.floor(delta);

			// scroll the scrollbar
			this.$bar.css({
				top : delta + 'px'
			});
		}

		// calculate actual scroll amount
		this.percentScroll = parseInt(this.$bar.css('top')) / (this.$el.outerHeight() - this.$bar.outerHeight());
		delta = this.percentScroll * (this.$el[0].scrollHeight - this.$el.outerHeight());

		if (isJump) {
			delta = y;
			var offsetTop = delta / this.$el[0].scrollHeight * this.$el.outerHeight();
			offsetTop = Math.min(Math.max(offsetTop, 0), maxTop);
			this.$bar.css({
				top : offsetTop + 'px'
			});
		}

		// scroll content
		this.$el.scrollTop(delta);

		// fire scrolling event
		this.$el.trigger('slimscrolling', ~~delta);

	}
	
    Plugin.prototype.markup = function() {

        var divS = '<div></div>';

        // wrap content
        var wrapper = $(divS)
            .addClass(this.options.wrapperClass)
            .css({
                position: 'relative',
                overflow: 'hidden',
                width: this.options.width,
                height: this.options.height,
				padding: this.options.padding
            });

        // update style for the div
        this.$el.css({
            overflow: 'hidden',
            width: this.options.width,
            height: this.options.height
        });

        // create scrollbar rail
        this.$rail = $(divS)
            .addClass(this.options.railClass)
            .css({
                width: this.options.size,
                position: 'absolute',
                height: '98%',
                top: 0,
                display: 'block',
                'border-radius': this.options.radius,
                background: this.options.railColor,
                opacity: this.options.railOpacity,
                zIndex: 999998
            });

        // create scrollbar
        var $bar = this.$bar = $(divS)
            .addClass(this.options.barClass)
            .css({
                background: this.options.color,
                width: this.options.size,
                position: 'absolute',
                top: 0,
                marginTop: '4px',
                opacity: this.options.opacity,
                display: 'block',
                'border-radius' : this.options.radius,
                BorderRadius: this.options.radius,
                MozBorderRadius: this.options.radius,
                WebkitBorderRadius: this.options.radius,
                zIndex: 999999,
                transition: 'background-color 200ms '
            });

        var that = this;
        wrapper.hover(function(event) {
            $bar.css({background: that.options.hoverColor, opacity: that.options.hoverOpacity});
        },function(event) {
            $bar.css({background: that.options.color, opacity: that.options.opacity});
        });

        // set position
        var posCss = (this.options.position == 'right') ? { right: this.options.distance } : { left: this.options.distance };
        this.$rail.css(posCss);
        this.$bar.css(posCss);

        // wrap it
        this.$el.wrap(wrapper);

        // append to parent div
        this.$el.parent().append(this.$bar);
        this.$el.parent().append(this.$rail);
    };

    Plugin.prototype.updateDisplay = function() {
        var display;
        // hide scrollbar if content is not long enough
		var barHeight = Math.max((this.$el.outerHeight() / this.$el[0].scrollHeight) * this.$el.outerHeight(), this.options.minBarHeight);
		barHeight = isFinite(barHeight) ? barHeight : parseInt(this.options.height, 10);
        if (barHeight >= this.$el.outerHeight()) {
            display =  'none';
        } else {
            display =  'block';
        }

        this.$bar.css({height:barHeight, display: display});
        this.$rail.css({height:'98%', display: display})

    };

    Plugin.prototype.registerEvents = function(){

        var plugin = this;
        var timeout;
        var $bar = this.$bar;
        var $rail = this.$rail;

        function callLaterToUpdateImages(time){
            clearTimeout(timeout);
            timeout = setTimeout(function(){
                plugin.$el.trigger('stopscrolling');
            }, time);
        }

        function doNothing(){return false}
				
		$(document.body).on('uilib-update-scroll-bars', function(){
			//plugin.getBarHeight();
			plugin.updateDisplay();
		});	
		
        this.$el.mousewheel(function(evt, delta){

            if ($bar.css('display') === 'none') return;
			evt.preventDefault();
            var speed = 10;
            var initPos = $bar.position().top;
            var pos = initPos - (delta * speed);
            var rh = $rail.height();
            var bh = $bar.height();

            pos = Math.min(pos, rh - bh);
            pos = Math.max(0, pos);
            $bar.css({
                top: pos
            });
            plugin.scrollContent(0, $bar.position().top, false);
            callLaterToUpdateImages(200);

        });

        this.$rail.on('click',function(evt){
            var rh = $rail.height();
            var bh = $bar.height();
            var initPos = $bar.position().top;
            var pos;
            if (initPos > evt.offsetY) {
                pos = Math.max(0, evt.offsetY);
            } else {
                pos = Math.min(evt.offsetY - bh, rh - bh);
            }

            $bar.css({
                top: pos
            });
            plugin.scrollContent(0, $bar.position().top, false);
            callLaterToUpdateImages(200);
        });



        this.$bar.on('mousedown', function(evt){

            document.body.focus();

            $(document).on('selectstart', doNothing);

            var initY = evt.clientY;
            var initPos = $bar.position().top;
            var rh = $rail.height();
            var bh = $bar.height();

            function mousemove_handler(evt){
                var currentY = evt.clientY - initY + initPos;

                var pos = Math.min(currentY, rh - bh);
                pos = Math.max(0, pos);
                $bar.css({
                    top: pos
                });
                plugin.scrollContent(0, $bar.position().top, false);
            }

            function mouseup_handler(evt){
                $(window).off('mousemove',mousemove_handler);
                $(window).off('mouseup',mouseup_handler);
                //TODO make an addEventListener
                $(document).off('selectstart', doNothing);

                callLaterToUpdateImages(200);
            }
            $(window).on('mousemove', mousemove_handler);
            $(window).on('mouseup', mouseup_handler);

        });

        // support for mobile
        this.$el.bind('touchstart', function(e,b){
            if (e.originalEvent.touches.length)
            {
                // record where touch started
                this._touchDif = e.originalEvent.touches[0].pageY;
            }
        });

        this.$el.bind('touchmove', function(e){
            // prevent scrolling the page
            e.originalEvent.preventDefault();
            if (e.originalEvent.touches.length)
            {
                // see how far user swiped
                var diff = (this._touchDif - e.originalEvent.touches[0].pageY) / this.options.touchScrollStep;
                // scroll content
                this.scrollContent(diff, true);
            }
        });
    };

    $.fn[pluginName] = function (options) {
        return this.each(function () {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName,
                    new Plugin(this, options));
            }
        });
    };

})(jQuery, window, document);
/*! Copyright (c) 2013 Brandon Aaron (http://brandonaaron.net)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Thanks to: http://adomas.org/javascript-mouse-wheel/ for some pointers.
 * Thanks to: Mathias Bank(http://www.mathias-bank.de) for a scope bug fix.
 * Thanks to: Seamus Leahy for adding deltaX and deltaY
 *
 * Version: 3.1.3
 *
 * Requires: 1.2.2+
 */

(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        // Node/CommonJS style for Browserify
        module.exports = factory;
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function ($) {

    var toFix = ['wheel', 'mousewheel', 'DOMMouseScroll', 'MozMousePixelScroll'];
    var toBind = 'onwheel' in document || document.documentMode >= 9 ? ['wheel'] : ['mousewheel', 'DomMouseScroll', 'MozMousePixelScroll'];
    var lowestDelta, lowestDeltaXY;

    if ( $.event.fixHooks ) {
        for ( var i = toFix.length; i; ) {
            $.event.fixHooks[ toFix[--i] ] = $.event.mouseHooks;
        }
    }

    $.event.special.mousewheel = {
        setup: function() {
            if ( this.addEventListener ) {
                for ( var i = toBind.length; i; ) {
                    this.addEventListener( toBind[--i], handler, false );
                }
            } else {
                this.onmousewheel = handler;
            }
        },

        teardown: function() {
            if ( this.removeEventListener ) {
                for ( var i = toBind.length; i; ) {
                    this.removeEventListener( toBind[--i], handler, false );
                }
            } else {
                this.onmousewheel = null;
            }
        }
    };

    $.fn.extend({
        mousewheel: function(fn) {
            return fn ? this.bind("mousewheel", fn) : this.trigger("mousewheel");
        },

        unmousewheel: function(fn) {
            return this.unbind("mousewheel", fn);
        }
    });


    function handler(event) {
        var orgEvent = event || window.event,
            args = [].slice.call(arguments, 1),
            delta = 0,
            deltaX = 0,
            deltaY = 0,
            absDelta = 0,
            absDeltaXY = 0,
            fn;
        event = $.event.fix(orgEvent);
        event.type = "mousewheel";

        // Old school scrollwheel delta
        if ( orgEvent.wheelDelta ) { delta = orgEvent.wheelDelta; }
        if ( orgEvent.detail )     { delta = orgEvent.detail * -1; }

        // New school wheel delta (wheel event)
        if ( orgEvent.deltaY ) {
            deltaY = orgEvent.deltaY * -1;
            delta  = deltaY;
        }
        if ( orgEvent.deltaX ) {
            deltaX = orgEvent.deltaX;
            delta  = deltaX * -1;
        }

        // Webkit
        if ( orgEvent.wheelDeltaY !== undefined ) { deltaY = orgEvent.wheelDeltaY; }
        if ( orgEvent.wheelDeltaX !== undefined ) { deltaX = orgEvent.wheelDeltaX * -1; }

        // Look for lowest delta to normalize the delta values
        absDelta = Math.abs(delta);
        if ( !lowestDelta || absDelta < lowestDelta ) { lowestDelta = absDelta; }
        absDeltaXY = Math.max(Math.abs(deltaY), Math.abs(deltaX));
        if ( !lowestDeltaXY || absDeltaXY < lowestDeltaXY ) { lowestDeltaXY = absDeltaXY; }

        // Get a whole value for the deltas
        fn = delta > 0 ? 'floor' : 'ceil';
        delta  = Math[fn](delta / lowestDelta);
        deltaX = Math[fn](deltaX / lowestDeltaXY);
        deltaY = Math[fn](deltaY / lowestDeltaXY);

        // Add event and delta to the front of the arguments
        args.unshift(event, delta, deltaX, deltaY);

        return ($.event.dispatch || $.event.handle).apply(this, args);
    }

}));
jQuery.fn.definePlugin('Slider', function ($) {
	'use strict';
	
	var names = {
		sliderClass: 'uilib-slider',
		pinClass: 'uilib-slider-pin',
		disabledClass: 'disabled',
		textClass:'uilib-text'
	};
	
	return {
		init: function(){
			this.markup();
			this.bindEvents();
			this.options.create.call(this);
			this.setValue(this.options.value);
		},
		getDefaults: function(){
			return {
				minValue: 0,
				maxValue: 100,
				value: 0,
				width: 80,
				preLabel: '',
				postLabel: '',
				className: 'default-uilib-slider-ui',
				toolTip: false,
				supportClick: true,
				slide: function () {},
				create: function () {}
			};
		},
		markup: function () {
			var leftOffset = this.$el.css('left');
			var style = {
				width : this.options.width
			};
			
			if(!this.$el.hasClass(names.sliderClass)){
				this.$el.addClass(names.sliderClass);
			}
			
			if(this.options.preLabel){
				this.$el.prepend('<span class="uilib-text uilib-slider-preLabel">' + this.options.preLabel + '</span>');
				style.left = 14;
			}
			
			this.$pin = $('<div>');
			this.$el.append(this.$pin);
			
			if(this.options.postLabel){
				this.$el.append('<span class="uilib-text uilib-slider-postLabel">' + this.options.postLabel + '</span>');
			}
			
			
			this.$el.addClass(names.sliderClass).css(style).addClass(this.options.className);
			
			this.$pin.addClass(names.pinClass);
			this.$pin.width(19);


			if(this.options.toolTip){
				this.$toolTip = $(_toolTipHtml());
				this.$pin.append(this.$toolTip.hide());
			}
		},
		getXFromEvent: function(event){
			return event.offsetX / this.$el.width()
		},
		bindEvents: function () {
			var $body = $(window);
			var slider = this;
			if (slider.options.supportClick){
				this.$el.on('click', function(evt){
					if(evt.target === slider.$el[0]){
						var x = slider.getXFromEvent(evt);
						slider.setValue(slider.transform(x));
						slider.triggerChangeEvent(slider.getValue());
					}
				});
			}
			this.$pin.on('mousedown', function (evt) {
                if(slider.$toolTip && !slider.$toolTip.is(":visible")){
                    slider.$toolTip.show();
                }
				slider.currentPos = slider.$pin.position().left;
				slider.startDragPos = evt.pageX;
				slider.disableTextSelection(evt);
				function mousemove_handler(evt) {
					slider.setPosition(evt);
				}
				function mouseup_handler(evt) {
                    if(slider.$toolTip){
                        slider.$toolTip.hide();
                    }
					slider.enableTextSelection();
					$body.off('mousemove', mousemove_handler);
					$body.off('mouseup', mouseup_handler);
					slider.triggerChangeEvent(slider.getValue());
				}
				$body.on('mousemove', mousemove_handler);
				$body.on('mouseup', mouseup_handler);
			});
		},
		getValue: function () {
			return this.transform(this.options.value);
		},
		setValue: function (valueInRange) {
			var val;
			this.options.value = this.valueInRangeToInnerRange(valueInRange);
			if (this.options.value !== this.last_value) {
				this.last_value = this.options.value;
				val = this.getValue();
				this.$el.trigger('slide', val);
				if(this.options.toolTip){
					this.$toolTip.find('.'+names.textClass).text(Math.round(val));
				}
				this.options.slide.call(this, val);
			}
			return this.update();
		},
		transform: function (valueInRange) {
			return this.options.minValue + valueInRange * (this.options.maxValue - this.options.minValue);
		},
		valueInRangeToInnerRange: function (value) {
			value = value < this.options.minValue ? this.options.minValue : value;
			value = value > this.options.maxValue ? this.options.maxValue : value;
			return (value - this.options.minValue) / (this.options.maxValue - this.options.minValue);
		},
		disableTextSelection: function (evt) {
			document.body.focus();
			//prevent text selection in IE
			document.onselectstart = function () { return false; };
			//evt.target.ondragstart = function() { return false; };
		},
		enableTextSelection: function () {
			document.onselectstart = null;
		},
		setPosition: function (evt) {
			if (this.isDisabled()) { return; }
			var x = evt.pageX - this.startDragPos;
			var pos = this.currentPos + x;
			var width = this.$el.width() - this.$pin.width();
			if (pos < 0) { pos = 0; }
			if (pos > width) { pos = width; }
			this.options.value = this.transform(pos / width);
			this.setValue(this.options.value);
			this.startDragPos = evt.pageX;
			this.currentPos = pos;
		},
		update: function () {
			this.$pin.css({
				left : this.options.value * (this.$el.width() - this.$pin.width())
			});
			return this;
		},
		disable: function () {
			this.$el.addClass(names.disabledClass);
		},
		enable: function () {
			this.$el.removeClass(names.disabledClass);
		},
		isDisabled: function () {
			return this.$el.hasClass(names.disabledClass);
		}
	};
	
	function _toolTipHtml() {
        return '<div class="uilib-slider-tooltip uilib-slider-tooltip-wrapper">' +
            '<div class="picker-arrow-top"><div class="picker-arrow-one"></div><div class="picker-arrow-two"></div></div>' +
            '<div class="uilib-text"></div>' +
            '</div>';
    }
	
});
jQuery.fn.definePlugin('Spinner', function ($) {
	'use strict';
	
	var styles = {
        className: 'uilib-spinner',
		defaultSize: 'default',
		mediumSize: 'medium',
		largeSize: 'large',
        upArrow: 'up-arrow',
        downArrow: 'down-arrow'
    };
    var events = {
        mouseDown: 'mousedown',
        mouseUp: 'mouseup',
        mouseLeave: 'mouseleave',
        focusOut: 'focusout',
        keypress: 'keypress'
    };
	
	return {
		init: function(){
			this.markup();
			this.bindEvents();
			this.setValue(this.options.value);
		},
		getDefaults: function(){
			return {
				minValue : 0,
				maxValue : 1000,
				value : 0,
				step: 1,
				precision: 0
			}; 
		},
		markup: function () {
			this.$el
				.append("<input autocomplete='off'>")
				.append(_buttonHtml());
			if(!this.$el.hasClass(styles.className)){
				this.$el.addClass(styles.className);
			}
			switch(this.options.size){
				case styles.mediumSize:
					this.$el.addClass(styles.mediumSize)
					break;
				case styles.largeSize:
					this.$el.addClass(styles.largeSize)
					break;
				default:
					this.$el.addClass(styles.defaultSize)
					break;
			}
		},
		bindEvents: function () {
			var spinner = this;
			var dir = 0;
			var autoRollTicket;

			var startAutoRoll = function(){
				clearTimeout(autoRollTicket);
				autoRollTicket = setTimeout(function(){
					spinner.setValue(_parse(spinner.getValue()) + spinner.options.step * dir);
					startAutoRoll();
				},100);
			}
            
			this.$el.on(events.mouseUp + ' ' + events.mouseLeave, function(evt){
			   clearTimeout(autoRollTicket);
			   dir = 0;               
               if(evt.type !== 'mouseleave'){
                   spinner.triggerChangeEvent(spinner.getValue());
               }
			});

			this.$el.on(events.mouseDown, '.' + styles.upArrow, function(){
				spinner.setValue(_parse(spinner.getValue()) + spinner.options.step);
				spinner.triggerChangeEvent(spinner.getValue());

				dir = 1;
				clearTimeout(autoRollTicket);
				autoRollTicket = setTimeout(startAutoRoll, 500);
			});

			this.$el.on(events.mouseDown, '.' + styles.downArrow, function(){
				spinner.setValue(_parse(spinner.getValue()) - spinner.options.step);
				spinner.triggerChangeEvent(spinner.getValue());

				dir = -1;
				clearTimeout(autoRollTicket);
				autoRollTicket = setTimeout(startAutoRoll, 500);
			});

			this.$el.on(events.focusOut, 'input', function(){
				if(spinner.setValue(_parse(spinner.getValue()))){
                    spinner.triggerChangeEvent(spinner.getValue());
				}
			});

			this.$el.on(events.keypress, 'input', function(e){
				if (e.which == 13){
					if(spinner.setValue(_parse(spinner.getValue()))){
						spinner.triggerChangeEvent(spinner.getValue());
					}
				}
			});
		},
		getValue: function () {
			return +this.$el.find('input').val();
		},
		setValue: function (valueInRange) {
            this.options.value = this.valueInRangeToInnerRange(valueInRange);
			if (this.options.value !== this.last_value) {
                this.last_value = this.options.value;
				this.update();
				return true;
			}
		},
		update: function () {
            this.$el.find('input').val(this.options.value);
			return this;
		},
		valueInRangeToInnerRange: function (value) {
            value = +(+value).toFixed(this.options.precision);
			value = value < this.options.minValue ? this.options.minValue : value;
			value = value > this.options.maxValue ? this.options.maxValue : value;
			return value;
		}
	};
	
	
    function _buttonHtml() {
        return "" +
            "<div class=" + styles.upArrow + "></div>" +
            "<div class=" + styles.downArrow +"></span>";
    }

    function _parse(val) {
        if (typeof val === "string" && val !== "" ) {
            val = parseFloat(val);
        }
        return val === "" || isNaN(val) ? null : val;
    }
	
});


jQuery.fn.definePlugin('Tabs', function ($) {
    'use strict';

    var styles = {
        className: 'uilib-tabs',
        tabPane: '.tab-pane'
    };
    var events = {
        click: 'click'
    };

    return {
        init: function(){
            this.markup();
            this.bindEvents();
            this.selectTab($(this.tabs[this.options.value]));
        },
        getDefaults: function(){
            return {
                tabValueAttrName : 'data-tab',
                tabClassName: 'ui-lib-tab',
                selectedClassName: 'selected',
                value : 0
            };
        },
        markup: function(){
            if(!this.$el.hasClass(styles.className)){
                this.$el.addClass(styles.className);
            }
            this.tabs = this.$el.find('li['+this.options.tabValueAttrName+']')
                .addClass(this.options.tabClassName);
            this.tabsContent = this.$el.find('.tab-content > div['+this.options.tabValueAttrName+']');

            if (this.$el.find('div[wix-scroll]').length === 0){
                this.$el.find(styles.tabPane).addClass('border');
            }
        },
        bindEvents: function () {
            var tabs = this;
            this.$el.on('click', '.'+this.options.tabClassName, function (e) {
                tabs.selectTab($(this));
            });
        },
        getValue: function () {},
        setValue: function (value) {

        },
        selectTab: function ($el) {
            var tabs = this;
            if ($el.hasClass(tabs.options.selectedClassName)) { return; }
            tabs.tabsContent.hide();
            tabs.tabs.removeClass(tabs.options.selectedClassName);
            var dataTab = $el.attr(tabs.options.tabValueAttrName);
            $el.addClass(tabs.options.selectedClassName);
            $.each(tabs.tabsContent, function(index, value) {
                var $elem = $(value);
                if($elem.attr(tabs.options.tabValueAttrName) === dataTab){
                    $elem.show();
                }
            });
            this.triggerChangeEvent(this.getValue())
            $(document.body).trigger('uilib-update-scroll-bars');
        }
    };

});

jQuery.fn.definePlugin('Tooltip', function ($) {
	'use strict';

	var styles = {
		className: 'uilib-tooltip',
		textClassName: 'uilib-text',
		arrowClassName: 'arrow_box',
		arrowHeight: 12
	};
	var events = {
		mouseEnter: 'mouseenter',
		mouseLeave: 'mouseleave'
	};

	var placements = ['top', 'right', 'left', 'bottom'];

	return {
		init: function(){
			this.markup();
			this.bindEvents();
		},
		getDefaults: function(){
			return {
				placement : placements[0],
				text 	  : "", 
				html      : false,
				template  : '<div class=' + styles.className + '>' +
					'<div class=' + styles.arrowClassName + '>' +
					'<div class='+ styles.textClassName +'></div>' +
					'</div>' +
					'</div>',
				animation : true
			}
		},
		markup: function (){
		},
		bindEvents: function () {
			var tooltip = this;
			var $elm = tooltip.$el;
			$elm.on(events.mouseEnter, function (evt) {
				tooltip.remove();
				var $tooltip = $(tooltip.options.template);
				tooltip.setText($elm, $tooltip);

				$elm.after($tooltip);
				if($.inArray(tooltip.options.placement, placements) > - 1){
					switch(tooltip.options.placement){
						case 'top':
							setTopPlacement($tooltip);
							break;
						case 'right':
							setRightPlacement($tooltip);
							break;
						case 'left':
							setLeftPlacement($tooltip);
							break;
						case 'bottom':
							setBottomPlacement($tooltip);
							break;
						default :
							setTopPlacement($tooltip);
					}
				} else {
					setTopPlacement($tooltip);
				}
			});

			function setTopPlacement($tooltip){
				$tooltip.find('.' + styles.arrowClassName).addClass('down');
				$tooltip.css('left', $elm.position().left + calcOffsetLeft($tooltip));
				$tooltip.css('top', $elm.position().top - ($tooltip.outerHeight() + styles.arrowHeight));
			}

			function setBottomPlacement($tooltip){
				$tooltip.find('.' + styles.arrowClassName).addClass('up');
				$tooltip.css('left', $elm.position().left + calcOffsetLeft($tooltip));
				$tooltip.css('top', $elm.position().top + $elm.outerHeight() + styles.arrowHeight);
			}

			function setRightPlacement($tooltip){
				$tooltip.find('.' + styles.arrowClassName).addClass('left');
				$tooltip.css('left', $elm.position().left + $elm.outerWidth() + styles.arrowHeight);
				$tooltip.css('top', $elm.position().top + calcOffsetTop($tooltip));
			}

			function setLeftPlacement($tooltip){
				$tooltip.find('.' + styles.arrowClassName).addClass('right');
				$tooltip.css('left', $elm.position().left - ($tooltip.outerWidth() + styles.arrowHeight));
				$tooltip.css('top', $elm.position().top + calcOffsetTop($tooltip));
			}

			function calcOffsetLeft($tooltip){
				if($elm.outerWidth() > $tooltip.outerWidth()){
					var diff = $elm.outerWidth() - $tooltip.outerWidth();
					return diff/2;
				} else{
					var diff = $tooltip.outerWidth() - $elm.outerWidth();
					return -diff/2;
				}
			}

			function calcOffsetTop($tooltip){
				if($elm.outerHeight() > $tooltip.outerHeight()){
					var diff = $elm.outerHeight() - $tooltip.outerHeight();
					return diff/2;
				} else{
					var diff = $tooltip.outerHeight() - $elm.outerHeight();
					return -diff/2;
				}
			}

			$elm.on(events.mouseLeave, function (evt) {
				if(tooltip.options.animation){
					$("." + styles.className).fadeOut(function(){
						tooltip.remove();
					});
				} else{
					tooltip.remove();
				}
			});
		},
		getValue: function () {
			return "";
		},
		setValue: function (value) {
			"";
		},
		update: function () {
			return this;
		},
		remove: function(){
			$("." + styles.className).remove();
		},
		setText: function($elm, tooltipTpl) {
			var $toolTipTextEl = tooltipTpl.find("." + styles.textClassName);
			var toolTipValue = this.options.text || $elm.attr("wix-tooltip");
			if(this.options.html){
				$toolTipTextEl.html(toolTipValue);
			} else {
				$toolTipTextEl.text(toolTipValue);
			}
		}
	};
});


jQuery.fn.definePlugin('Upgrade', function ($) {
    'use strict';

    return {
        init: function () {
            this.markup();
            this.bindEvents();
        },
        getDefaults: function () {
            return {
                class: 'btn-upgrade',
                vendorProductId: '',
                cycle: 'MONTHLY'
            };
        },
        markup: function () {
            var className = "submit uilib-btn " + this.options.class;
            this.$el.append('<button class="' + className + '">' + this.options.text + '</button>');
        },
        bindEvents: function () {
            this.$el.find('.uilib-btn').on('click', this.upgrade.bind(this));
        },
        getValue: function () {
        },
        setValue: function (value) {
        },
        upgrade: function () {
            var vendorProductId = this.options.vendorProductId;
            Wix.Billing.openBillingPageForProduct(vendorProductId, this.options.cycle, function () {
                var popup = Wix.UI.create({ctrl: 'Popup',
                    options: {buttonSet: 'okCancel', fixed: true, title: 'Ooops something when wrong...', content: vendorProductId + ' was not found.'}});
                popup.getCtrl().open();
            });
        }
    };

});
