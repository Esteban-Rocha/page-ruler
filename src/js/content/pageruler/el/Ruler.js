/**
 * Ruler element
 */

(function(pr) {

pr.el.Ruler = pr.cls(

	/**
	 * Class constructor
	 *
	 * @param {PageRuler.el.Toolbar} toolbar
	 * @param {PageRuler.el.Guides} guides
	 */
	function(toolbar, guides) {

		// reference to this for callbacks
		var _this = this;

		// set toolbar reference and back reference in the toolbar
		this.toolbar = toolbar;
		this.toolbar.ruler = this;

		// set guides reference
		this.guides = guides;

		// create dom
		this.createDom();

		// set up initial config
		this.reset();

		// mousedown listener on ruler - enables dragging
		pr.El.registerListener(this.ruler, 'mousedown', function(e) {
			
			// we don't want to interact with any other elements
			e.stopPropagation();
			e.preventDefault();

			// blur all focused elements
			document.activeElement.blur();
			
			// set moving attributes
			_this.movingLeft	= true;
			_this.movingTop		= true;
			
		});
		
		// mouseup listener on ruler - disables dragging
		pr.El.registerListener(this.ruler, 'mouseup', function(e) {
			
			// reset attributes
			_this.movingLeft		= false;
			_this.gapLeft			= null;
			_this.resizingLeft		= false;
			
			_this.movingTop			= false;
			_this.gapTop			= null;
			_this.resizingTop		= false;
			
			_this.resizingRight		= false;
			_this.resizingBottom	= false;
			
		});

		// mousedown listener on document - resets ruler and enables resizing
        pr.El.registerListener(document, 'mousedown', function(e) {

            // if not in element tracking mode or html (scroll bars) are not mousedowned
            if (!_this.toolbar.elementToolbar.tracking && e.target.tagName.toLowerCase() !== 'html') {

				pr.elements.guides.hide();

                // get mouse positions
				var mouseXY	= pr.Mouse.getXY(e);

                var mouseX	= mouseXY.x;
                var mouseY	= mouseXY.y;

                // cancel default events
                e.preventDefault();
                e.stopPropagation();

                _this.reset({
                    left:   mouseX,
                    top:    mouseY,
                    width:  2,
                    height: 2
                });

                _this.resizingRight     = true;
                _this.resizingBottom    = true;

				_this.show();

            }

        });

		// mouseup listener on document - disables resizing
		pr.El.registerListener(document, 'mouseup', function(e) {

			_this.movingLeft		= false;
			_this.movingTop			= false;
			_this.movingRight		= false;
			_this.movingDown		= false;
			_this.resizingLeft		= false;
			_this.resizingTop		= false;
			_this.resizingRight		= false;
			_this.resizingBottom	= false;

		});

		// mousemove listener on document - attempts to move or resize depending
		pr.El.registerListener(document, 'mousemove', function(e) {

			// if we are tracking in element mode
			if (_this.toolbar.elementToolbar.tracking && !pr.El.inElement(e.target, _this.toolbar.dom)) {

				e.preventDefault();
				e.stopPropagation();

				// get mouse positions
				var mouseXY	= pr.Mouse.getClientXY(e, true);
				var mouseX	= mouseXY.x;
				var mouseY	= mouseXY.y;

				// hide mask, ruler and guides so we can get the correct element underneath
				pr.elements.mask.dom.style.setProperty('display', 'none', 'important');
				_this.ruler.style.setProperty('display', 'none', 'important');
				if (_this.guides.visible) {
					_this.guides.hide();
				}

				// set the mouseover element
				_this.toolbar.elementToolbar.setElement(document.elementFromPoint(mouseX, mouseY));

				// show the mask, ruler and element again
				pr.elements.mask.dom.style.removeProperty('display');
				_this.ruler.style.removeProperty('display');
				if (_this.guides.visible) {
					_this.guides.show();
				}

			}
			else {

				_this.move(e);
				_this.resize(e);

			}

		});

	},
	{

		/**
		 * Reference to the toolbar class
		 * @type {PageRuler.el.Toolbar}
		 */
		toolbar:	null,

		/**
		 * Ruler dom element
		 * @type {HTMLElement}
		 */
        ruler:      null,

		/**
		 * Reference to the guides object
		 * @type {PageRuler.el.Guides}
		 */
		guides:		null,

		/**
		 * Container for the resize elements
		 */
        resizeElements: {
            top:            null,
            bottom:         null,
            left:           null,
            right:          null,
            topLeft:        null,
            topRight:       null,
            bottomLeft:     null,
            bottomRight:    null
        },

		borderSearchElements: {
			udLeftTop:		null,
			udRightTop:		null,
			lrLeftTop:		null,
			lrRightTop:		null,
			lrLeftBottom: 	null,
			lrRightBottom:	null,
			udLeftBottom:		null,
			udRightBottom:	null
		},

		/**
		 * The current ruler width
		 * @type {number}
		 */
		width:		0,

		/**
		 * The current ruler height
		 * @type {number}
		 */
		height:		0,

		/**
		 * The current ruler left position
		 * @type {number}
		 */
		left:		0,

		/**
		 * Flag to indicate whether the ruler is currently being resized to the left
		 * @type {boolean}
		 */
		resizingLeft:	false,

		/**
		 * Amount of offset to apply when resizing left. This is so when selecting a resize edge the ruler will not
		 * snap to the mouse position
		 * @type {number}
		 */
		resizingOffsetLeft: 0,

		/**
		 * The current ruler top position
		 * @type {number}
		 */
		top:		0,

		/**
		 * Flag to indicate whether the ruler is currently being resized to the top
		 * @type {boolean}
		 */
		resizingTop:	false,

		/**
		 * Amount of offset to apply when resizing top. This is so when selecting a resize edge the ruler will not
		 * snap to the mouse position
		 * @type {number}
		 */
		resizingOffsetTop: 0,

		/**
		 * The current ruler right position
		 * @type {number}
		 */
		right:		0,

		/**
		 * Flag to indicate whether the ruler is currently being resized to the right
		 * @type {boolean}
		 */
		resizingRight:	false,

		/**
		 * Amount of offset to apply when resizing right. This is so when selecting a resize edge the ruler will not
		 * snap to the mouse position
		 * @type {number}
		 */
		resizingOffsetRight: 0,

		/**
		 * The current ruler bottom position
		 * @type {number}
		 */
		bottom:		0,

		/**
		 * Flag to indicate whether the ruler is currently being resized to the bottom
		 * @type {boolean}
		 */
		resizingBottom:	false,

		/**
		 * Amount of offset to apply when resizing bottom. This is so when selecting a resize edge the ruler will not
		 * snap to the mouse position
		 * @type {number}
		 */
		resizingOffsetBottom: 0,

		/**
		 * Flag to indicate whether the left position of the ruler is currently being moved
		 * @type {boolean}
		 */
		movingLeft:	false,

		/**
		 * Flag to indicate whether the top position of the ruler is currently being moved
		 * @type {boolean}
		 */
		movingTop:	false,

		/**
		 * The current gap in pixels between the left position of the ruler and the mouse
		 * This is used to calculate the correct position to move the ruler to based on the position of the mouse
		 * @type {number}
		 */
		gapLeft:	null,

		/**
		 * The current gap in pixels between the top position of the ruler and the mouse
		 * This is used to calculate the correct position to move the ruler to based on the position of the mouse
		 * @type {number}
		 */
		gapTop:		null,

		/**
		 * Flag to indicate if we are accepting key movements
		 * When the number inputs are focused we will let them do their own thing
		 */
		keyMoving:	true,

		/**
		 * Creates the ruler dom elements
		 */
        createDom:  function() {

			var _this = this;

			// create ruler element
			this.ruler = pr.El.createEl('div');

			// create container
			var container = pr.El.createEl('div', {
				'id':		'container',
				'class':	'container'
			});

			// create resize elements
			this.resizeElements.top			= new pr.el.Resize(this,	'top',		'edge');
			this.resizeElements.bottom		= new pr.el.Resize(this,	'bottom',	'edge');
			this.resizeElements.left		= new pr.el.Resize(this,	'left',		'edge');
			this.resizeElements.right		= new pr.el.Resize(this,	'right',	'edge');

			this.resizeElements.topLeft		= new pr.el.Resize(this,	'top-left',		'corner');
			this.resizeElements.topRight	= new pr.el.Resize(this,	'top-right',	'corner');
			this.resizeElements.bottomLeft	= new pr.el.Resize(this,	'bottom-left',	'corner');
			this.resizeElements.bottomRight	= new pr.el.Resize(this,	'bottom-right',	'corner');

			// add resize elements to the container
			pr.El.appendEl(container, [
				this.resizeElements.top.dom,
				this.resizeElements.bottom.dom,
				this.resizeElements.left.dom,
				this.resizeElements.right.dom,
				this.resizeElements.topLeft.dom,
				this.resizeElements.topRight.dom,
				this.resizeElements.bottomLeft.dom,
				this.resizeElements.bottomRight.dom
			]);

			// add the color-jump elements to the container
			this.borderSearchElements.udLeftTop		= new pr.el.BorderSearch(this, 'ud', 'left', 'top', 'corner page-ruler-bordersearch');
			this.borderSearchElements.udRightTop		= new pr.el.BorderSearch(this, 'ud', 'right', 'top', 'corner page-ruler-bordersearch');
			this.borderSearchElements.lrLeftTop		= new pr.el.BorderSearch(this, 'lr', 'left', 'top', 'corner page-ruler-bordersearch');
			this.borderSearchElements.lrRightTop		= new pr.el.BorderSearch(this, 'lr', 'right', 'top', 'corner page-ruler-bordersearch');
			this.borderSearchElements.lrLeftBottom		= new pr.el.BorderSearch(this, 'lr', 'left', 'bottom', 'corner page-ruler-bordersearch');
			this.borderSearchElements.lrRightBottom	= new pr.el.BorderSearch(this, 'lr', 'right', 'bottom', 'corner page-ruler-bordersearch');
			this.borderSearchElements.udLeftBottom		= new pr.el.BorderSearch(this, 'ud', 'left', 'bottom', 'corner page-ruler-bordersearch');
			this.borderSearchElements.udRightBottom	= new pr.el.BorderSearch(this, 'ud', 'right', 'bottom', 'corner page-ruler-bordersearch');

			pr.El.appendEl(container, [
				this.borderSearchElements.udLeftTop.dom,
				this.borderSearchElements.udRightTop.dom,
				this.borderSearchElements.lrLeftTop.dom,
				this.borderSearchElements.lrRightTop.dom,
				this.borderSearchElements.lrLeftBottom.dom,
				this.borderSearchElements.lrRightBottom.dom,
				this.borderSearchElements.udLeftBottom.dom,
				this.borderSearchElements.udRightBottom.dom
			]);

			// add the container to the ruler
			pr.El.appendEl(this.ruler, container);

			// add the ruler to the body
			pr.El.appendEl(document.body, this.ruler);

			// set the ruler color
			chrome.runtime.sendMessage(
				{
					action:	'getColor'
				},
				function(color) {
					_this.setColor(color, false);
				}
			);
        },

		/**
		 * Shows the ruler
		 */
		show: function() {

			this.ruler.style.removeProperty('display');

		},

		/**
		 * Hides the ruler
		 */
		hide: function() {

			this.ruler.style.setProperty('display', 'none', 'important');

		},

		/**
		 * Search in a direction for a color change (border) to move the ruler to.
		 */
		borderSearch: function(positionDir, leftOrRight, topOrBottom) {
			var _this = this;
			var x = leftOrRight === 'left' ? _this.left : _this.right;
			var y = topOrBottom === 'top' ? _this.top : _this.bottom;
			var xDir = 0;
			var yDir = 0;

			if (positionDir === 'lr') {
				xDir = leftOrRight === 'left' ? -1 : 1;
			} else {
				yDir = topOrBottom === 'top' ? -1 : 1;
			}

			// hide mask, ruler and guides so we can get the correct screenshot
			pr.elements.mask.dom.style.setProperty('display', 'none', 'important');
			_this.ruler.style.setProperty('display', 'none', 'important');
			if (_this.guides.visible) {
				_this.guides.hide();
			}

			setTimeout(function() {
				// Send a message because Chrome's screenshot function is only available
				// to the background page.
				chrome.runtime.sendMessage({
					action:	'borderSearch',
					x: x,
					y: y,
					xDir: xDir,
					yDir: yDir,
					yOffset: _this.toolbar.height - window.pageYOffset,
					devicePixelRatio: window.devicePixelRatio
				}, function(response) {
					if (leftOrRight === 'left') {
						var newWidth = _this.width + (_this.left - response.x);
						_this.setLeft(response.x);
						_this.setWidth(newWidth);
					} else {
						_this.setWidth(_this.width + (response.x - _this.right));
					}

					if (topOrBottom === 'top') {
						var newHeight = _this.height + (_this.top - response.y);
						_this.setTop(response.y);
						_this.setHeight(newHeight);
						
					} else {
						_this.setHeight(_this.height + (response.y - _this.bottom));
					}

					// show the mask, ruler and element again
					pr.elements.mask.dom.style.removeProperty('display');
					_this.ruler.style.removeProperty('display');
					if (_this.guides.visible) {
						_this.guides.show();
					}
				});
			}, 1);
		},

		/**
		 * Sets the color of the ruler
		 * @param {string} hex		The hex color value
		 * @param {booleab} save	Whether to save the color for next time
		 */
		setColor: function(hex, save) {

			// set the border color
			this.ruler.style.setProperty('border-color', hex, 'important');

			// set the background color with transparency
			this.ruler.style.setProperty('background-color', pr.Util.hexToRGB(hex, 0.2), 'important');

			// set border colour on the edge resize elements
			this.resizeElements.topLeft.setColor(hex);
			this.resizeElements.topRight.setColor(hex);
			this.resizeElements.bottomLeft.setColor(hex);
			this.resizeElements.bottomRight.setColor(hex);

			this.borderSearchElements.udLeftTop.setColor(hex);
			this.borderSearchElements.udRightTop.setColor(hex);
			this.borderSearchElements.lrLeftTop.setColor(hex);
			this.borderSearchElements.lrLeftBottom.setColor(hex);
			this.borderSearchElements.lrRightTop.setColor(hex);
			this.borderSearchElements.lrRightBottom.setColor(hex);
			this.borderSearchElements.udLeftBottom.setColor(hex);
			this.borderSearchElements.udRightBottom.setColor(hex);

			// set the border colour on the guides
			this.guides.setColor(hex);

			// set the color input value on the toolbar
			this.toolbar.setColor(hex);

			// save color
			if (!!save) {
				chrome.runtime.sendMessage({
					action:	'setColor',
					color:	hex
				});
			}

		},

		/**
		 * Resets the ruler back to default values
		 * @param {object} config
		 */
		reset:	function(config) {

			config = config || {};

			// set dimensions
			this.width			= config.width || 0;
			this.toolbar.setWidth(this.width);
			
			this.height			= config.height || 0;
			this.toolbar.setHeight(this.height);
			
			// set attributes
			this.left				= config.left || 0;
			this.resizingLeft		= false;
			this.resizingOffsetLeft	= 0;
			this.toolbar.setLeft(this.left);
			
			this.top				= config.top || 0;
			this.resizingTop		= false;
			this.resizingOffsetTop	= 0;
			this.toolbar.setTop(this.top);
			
			this.right					= this.left + this.width;
			this.resizingRight			= false;
			this.resizingOffsetRight	= 0;
			this.toolbar.setRight(this.right);
				
			this.bottom					= this.top + this.height;
			this.resizingBottom			= false;
			this.resizingOffsetBottom	= 0;
			this.toolbar.setBottom(this.bottom);
			
			this.movingLeft		= false;
			this.movingTop		= false;
			
			this.gapLeft		= null;
			this.gapTop			= null;
			
			this.ruler.style.width		= pr.Util.px(this.width);
			this.ruler.style.height		= pr.Util.px(this.height);
			this.ruler.style.top		= pr.Util.px(this.top);
			this.ruler.style.left		= pr.Util.px(this.left);

			this.hide();

		},

		/**
		 * Sets the left position of the ruler
		 * @param {Number}	left
		 * @param {Boolean}	updateRight
		 */
		setLeft: function(left, updateRight) {

			left = parseInt(left, 10);

			// validate

			// not valid
			if (isNaN(left)) {
				left = this.left;
			}
			// too small
			else if (left < 0) {
				left = 0;
			}
			// too large
			else if (left > pr.Dimensions.pageRight - this.width) {
				left = pr.Dimensions.pageRight - this.width;
			}
			// don't allow ruler outside of left of page
			else if (left < pr.Dimensions.pageLeft) {
				left = pr.Dimensions.pageLeft;
			}
			
			// update left
			this.left = left;
			this.ruler.style.setProperty('left', pr.Util.px(left), '');

			// update right
			if (true === updateRight) {
				this.setRight(left + this.width);
			}
			
			// update toolbar
			this.toolbar.setLeft(left);

			// update the guides
			this.guides.setSizes();

		},

		/**
		 * Sets the top position of the ruler
		 * @param {Number} top
		 * @param {Booleab} updateBottom
		 */
		setTop: function(top, updateBottom) {

			top = parseInt(top, 10);

			// validate

			// not valid
			if (isNaN(top)) {
				top = this.top;
			}
			// too small
			else if (top < 0) {
				top = 0;
			}
			// too large
			else if (top > pr.Dimensions.pageBottom + this.height) {
				top = pr.Dimensions.pageBottom - this.height;
			}
			// don't allow ruler outside of top of page
			else if (top < pr.Dimensions.pageTop) {
				top = pr.Dimensions.pageTop;
			}
			
			// update top
			this.top = top;
			this.ruler.style.setProperty('top', pr.Util.px(top), '');
			
			// update bottom
			if (true === updateBottom) {
				this.setBottom(top + this.height);
			}
			
			// update toolbar
			this.toolbar.setTop(top);

			// update the guides
			this.guides.setSizes();

		},

		/**
		 * Sets the right position of the ruler
		 * @param {Number} right
		 * @param {Booleab} updateLeft
		 */
		setRight: function(right, updateLeft) {

			right = parseInt(right, 10);

			// validate

			// invalid
			if (isNaN(right)) {
				right = this.right;
			}
			// too small
			else if (right < pr.Dimensions.pageLeft + this.width) {
				right = pr.Dimensions.pageLeft + this.width;
			}
			// too large
			else if (right > pr.Dimensions.pageRight) {
				right = pr.Dimensions.pageRight;
			}
			// don't allow ruler outside of right of page
			else if (right > pr.Dimensions.pageRight) {
				right = pr.Dimensions.pageRight;
				this.setLeft(right - this.width, false);
			}
			
			this.right = right;
			
			if (true === updateLeft) {
				this.setLeft(right - this.width, false);
			}
			
			// update toolbar
			this.toolbar.setRight(right);

			// update the guides
			this.guides.setSizes();

		},

		/**
		 * Sets the bottom position of the ruler
		 * @param {Number} bottom
		 * @param {Boolean} updateTop
		 */
		setBottom: function(bottom, updateTop) {

			bottom = parseInt(bottom, 10);

			// validate

			// not valid
			if (isNaN(bottom)) {
				bottom = this.bottom;
			}
			// too small
			else if (bottom < pr.Dimensions.pageTop + this.height) {
				bottom = pr.Dimensions.pageTop + this.height;
			}
			// too large
			else if (bottom > pr.Dimensions.pageBottom) {
				bottom = pr.Dimensions.pageBottom;
				this.setTop(bottom - this.height);
			}
			
			this.bottom = bottom;
			
			if (true === updateTop) {
				this.setTop(bottom - this.height, false);
			}
			
			// update toolbar
			this.toolbar.setBottom(bottom);

			// update the guides
			this.guides.setSizes();

		},

		/**
		 * Sets the gap left value
		 * @param {number} mouseX		Mouse x position
		 * @param {boolean} onlyIfNull	Only sets the gap if it's value is null
		 */
		setGapLeft: function(mouseX, onlyIfNull) {

			if (true !== onlyIfNull || (this.gapLeft === null && true === onlyIfNull)) {
				
				this.gapLeft = mouseX - this.left;
				
			}

		},

		/**
		 * Sets the gap top value
		 * @param {number} mouseX		Mouse y position
		 * @param {boolean} onlyIfNull	Only sets the gap if it's value is null
		 */
		setGapTop: function(mouseY, onlyIfNull) {
	
			if (true !== onlyIfNull || (this.gapTop === null && true === onlyIfNull)) {
				
				this.gapTop = mouseY - this.top;
				
			}

		},

		/**
		 * Move the ruler to the left
		 * @param {Event} e
		 */
		moveLeft: function(e) {

			// if left move is enabled
			if (this.movingLeft) {
				
				// get mouse x position
				var mouseX	= pr.Mouse.getX(e);
				
				// set gap between left and mouse if not already set
				this.setGapLeft(mouseX, true);
				
				// if ruler is going below left of page
				if (mouseX - this.gapLeft < pr.Dimensions.pageLeft) {
					
					// don't let it
					mouseX = pr.Dimensions.pageLeft + this.gapLeft;
					
				}
				// if ruler is going below right of page
				else if (mouseX - this.gapLeft + this.width > pr.Dimensions.pageRight) {
					
					// don't let it
					mouseX = pr.Dimensions.pageRight - this.width + this.gapLeft;
					
				}
				
				// update left position
				this.setLeft(mouseX - this.gapLeft, true);
				
			}

		},

		/**
		 * Move the ruler to the top
		 * @param {Event} e
		 */
		moveTop: function(e) {

			// if top move is enabled
			if (this.movingTop) {
				
				// get mouse y position
				var mouseY	= pr.Mouse.getY(e);
				
				// set gap between top and mouse if not already set	
				this.setGapTop(mouseY, true);
				
				// if ruler is going above top of page
				if (mouseY - this.gapTop < pr.Dimensions.pageTop) {
					
					// don't let it
					mouseY = pr.Dimensions.pageTop + this.gapTop;
					
				}
				// if ruler is going below bottom of page
				else if (mouseY - this.gapTop + this.height > pr.Dimensions.pageBottom) {
					
					// don't let it
					mouseY = pr.Dimensions.pageBottom - this.height + this.gapTop;
					
				}
				
				// update top coords	
				this.setTop(mouseY - this.gapTop, true);
				
			}

		},

		/**
		 * Move the ruler
		 * @param {Event} e
		 */
		move: function(e) {
	
			// move left position		
			this.moveLeft(e);
			
			// move top position		 
			this.moveTop(e);

		},

		/**
		 * Resize the ruler from the left
		 * @param {Event} e
		 */
		resizeLeft: function(e) {

			// if left resize is enabled
			if (this.resizingLeft) {
				
				// get mouse x
				var mouseX = pr.Mouse.getX(e);
				
				if (mouseX <= this.right) {
					
					// don't allow resizing below left of page
					if (mouseX < pr.Dimensions.pageLeft) {
						
						mouseX = pr.Dimensions.pageLeft;
						
					}

					// apply resizing offset
					mouseX -= this.resizingOffsetLeft;
							
					// update left
					this.setLeft(mouseX);
					
					// update width
					this.setWidth(this.right - mouseX);
				
				}
				// passed over the right side so start resizing right instead
				else {
					
					this.resizingLeft	= false;
					this.resizingRight	= true;
					
					// set left to the same value as right
					this.setLeft(this.right);
								
				}		
				
			}

		},

		/**
		 * Resize the ruler from the right
		 * @param {Event} e
		 */
		resizeRight: function(e) {

			// if right resize is enabled
			if (this.resizingRight) {
				
				// get mouse x
				var mouseX = pr.Mouse.getX(e);
				
				if (mouseX >= this.left) {
					
					// don't allow resizing above right of page
					if (mouseX > pr.Dimensions.pageRight) {
						
						mouseX = pr.Dimensions.pageRight;
						
					}

					// apply resizing offset
					mouseX += this.resizingOffsetRight;
					
					// update right
					this.setRight(mouseX);
					
					// update width
					this.setWidth(mouseX - this.left);
				
				}
				// passed over the left side so start resizing left instead
				else {
					
					this.resizingLeft	= true;
					this.resizingRight	= false;
					
					// set right to the same value as left
					this.setRight(this.left);
					
				}

			}

		},

		/**
		 * Resize the ruler from the top
		 * @param {Event} e
		 */
		resizeTop: function(e) {

			// if top resize is enabled
			if (this.resizingTop) {
				
				// get mouse y
				var mouseY = pr.Mouse.getY(e);
				
				// if mouse is above the bottom
				if (mouseY <= this.bottom) {
					
					// don't allow resizing above top of page
					if (mouseY < pr.Dimensions.pageTop) {
						
						mouseY = pr.Dimensions.pageTop;
						
					}

					// apply resizing offset
					mouseY -= this.resizingOffsetTop;
					
					// update top
					this.setTop(mouseY);
					
					// update height
					this.setHeight(this.bottom - mouseY);
				
				}
				// passed over the bottom side so start resizing bottom instead
				else {
					
					this.resizingTop	= false;
					this.resizingBottom	= true;
					
					// set top to the same value as bottom
					this.setTop(this.bottom);
					
				}

			}

		},

		/**
		 * Resize the ruler from the bottom
		 * @param {Event} e
		 */
		resizeBottom: function(e) {

			// if bottom resize is enabled
			if (this.resizingBottom) {
				
				// get mouse y
				var mouseY = pr.Mouse.getY(e);
				
				if (mouseY >= this.top) {
					
					// don't allow resizing below bottom of page
					if (mouseY > pr.Dimensions.pageBottom) {
						
						mouseY = pr.Dimensions.pageBottom;
						
					}

					// apply resizing offset
					mouseY += this.resizingOffsetBottom;
					
					// update bottom
					this.setBottom(mouseY);
					
					// update height
					this.setHeight(mouseY - this.top);
					
				}
				else {
					
					this.resizingTop	= true;
					this.resizingBottom	= false;
					
					// set bottom to the same value as top
					this.setBottom(this.top);
					
				}
				
			}

		},

		/**
		 * Resize the ruler
		 * @param {Event} e
		 */
		resize: function(e) {
	
			this.resizeLeft(e);
			this.resizeRight(e);
			this.resizeTop(e);
			this.resizeBottom(e);

		},

		/**
		 * Sets the width of the ruler
		 * @param {Number} width
		 */
		setWidth: function(width) {

			width = parseInt(width, 10);

			// validate

			// not valid number
			if (isNaN(width)) {
				width = this.width;
			}
			// too small
			else if (width < 0) {
				width = 0
			}
			// too large
			else if (width + this.left > pr.Dimensions.pageRight) {
				width = pr.Dimensions.pageRight - this.left;
			}

			this.width = width;
			this.ruler.style.setProperty('width', pr.Util.px(width), '');

			// update right value
			this.setRight(this.left + width);
			
			// update toolbar
			this.toolbar.setWidth(width);

			// update the guides
			this.guides.setSizes();

		},

		/**
		 * Sets the height of the ruler
		 * @param {Number} height
		 */
		setHeight: function(height) {

			height = parseInt(height, 10);

			// validate

			// not valid number
			if (isNaN(height)) {
				height = this.height
			}
			// too small
			else if (height < 0) {
				height = 0;
			}
			// too large
			else if (height + this.top > pr.Dimensions.pageBottom) {
				height = pr.Dimensions.pageBottom - this.top;
			}
	
			this.height				= height;
			this.ruler.style.setProperty('height', pr.Util.px(height), '');

			// update bottom value
			this.setBottom(this.top + height);
			
			// update toolbar
			this.toolbar.setHeight(height);

			// update the guides
			this.guides.setSizes();

		},

		setBorderSearchVisibility: function(visible, save) {
			
			this.setElementVisibility(this.borderSearchElements.udLeftTop, visible);
			this.setElementVisibility(this.borderSearchElements.udRightTop, visible);
			this.setElementVisibility(this.borderSearchElements.lrLeftTop, visible);
			this.setElementVisibility(this.borderSearchElements.lrRightTop, visible);
			this.setElementVisibility(this.borderSearchElements.lrLeftBottom, visible);
			this.setElementVisibility(this.borderSearchElements.lrRightBottom, visible);
			this.setElementVisibility(this.borderSearchElements.udLeftBottom, visible);
			this.setElementVisibility(this.borderSearchElements.udRightBottom, visible);

			if (save) {
				chrome.runtime.sendMessage({
					action:		'setBorderSearch',
					visible:	visible
				});
			}
		},

		setElementVisibility: function(element, visible) {
			if (visible) {
				element.dom.style.removeProperty('display');
			} else {
				element.dom.style.setProperty('display', 'none', 'important');
			}
		}
	}
);

})(__PageRuler);