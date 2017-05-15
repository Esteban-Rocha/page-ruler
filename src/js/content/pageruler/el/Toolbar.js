
/**
 * Toolbar element
 */

(function(pr) {

pr.el.Toolbar = pr.cls(

	/**
	 * Constructor
	 */
	function() {

		var _this = this;

		// create dom element
		this.dom = pr.El.createEl(
			'div',
			{
				'id':	'toolbar',
				'cls':	this.position
			},
			{
				click: function(e) {
					e.stopPropagation();
				},
				mousedown: function(e) {
					e.stopPropagation();
				}
			}
		);

		// create container
		var container = pr.El.createEl('div', {
			'id':		'toolbar-container',
			'class':	'toolbar-container'
		});

		// create contents
		var closeContainer			= this.generateCloseContainer();
		var dockContainer			= this.generateDockContainer();
		var helpContainer			= this.generateHelpContainer();
		var elementModeContainer	= this.generateElementModeToggleContainer();
		var dimensionsContainer		= this.generateDimensionsContainer();
		var positionContainer		= this.generatePositionContainer();
		var colorContainer			= this.generateColorContainer();
		var guidesContainer			= this.generateGuidesContainer();
		var borderSearchContainer	= this.generateBorderSearchContainer();

		// add contents to container
		pr.El.appendEl(container, [
			closeContainer,
			dockContainer,
			helpContainer,
			elementModeContainer,
			dimensionsContainer,
			positionContainer,
			colorContainer,
			guidesContainer,
			borderSearchContainer
		]);

		this.elementToolbar = new pr.el.ElementToolbar(this);

		// add container to toolbar
		pr.El.appendEl(this.dom, [
			container,
			this.elementToolbar.dom
		]);

		// add toolbar to the document root
		// this is so that the page shift on the body doesn't apply to the toolbar
		pr.El.appendEl(document.documentElement, this.dom);

		// set the toolbar dock position from last time
		chrome.runtime.sendMessage(
			{
				action:	'getDockPosition'
			},
			function(position) {

				_this.setDockPosition(position);

			}
		);

		// set the guides visiblity
		chrome.runtime.sendMessage(
			{
				action:	'getGuides'
			},
			function(visible) {

				// set guides visibility
				pr.elements.guides.setVisible(visible, false);

				// but still hide them until the ruler has been activated
				pr.elements.guides.hide();

				// if not visible then also change the toggle
				if (!visible) {

					_this.els.guides.checked = false;

				}

			}
		);

		// set the border search visiblity
		chrome.runtime.sendMessage(
			{
				action:	'getBorderSearch'
			},
			function(visible) {
				// set border search visibility
				pr.elements.ruler.setBorderSearchVisibility(visible, false);

				// if not visible then also change the toggle
				if (!visible) {
					_this.els.borderSearch.checked = false;
				}
			}
		);
	},
	{

		/**
		 * Toolbar position: top or bottom
		 */
		position:	'top',

		/**
		 * Toolbar height
		 */
		height:		30,

		/**
		 * Ruler element
		 * @type {PageRuler.el.Ruler}
		 */
		ruler:		null,

		/**
		 * The toolbar dom
		 * @type {HTMLElement}
		 */
		dom:		null,

		/**
		 * Container for the elements within the toolbar
		 */
		els:		{},

		/**
		 * Whether element mode is enabled
		 * @type {boolean}
		 */
		elementMode:	false,

		/**
		 * Element toolbar reference
		 * @type {PageRuler.el.ElementToolbar}
		 */
		elementToolbar:	null,

		/**
		 * Generates a pixel input field, with container and label
		 * @param {string} id				Input id
		 * @param {string} labelText		Input label text
		 * @param {function} changeListener	Value change listener
		 * @returns {HTMLElement}
		 */
		generatePixelInput: function(id, labelText, changeListener) {

			// create container
			var container = pr.El.createEl('div', {
				'id':	'toolbar-' + id + '-container',
				'cls':	'px-container'
			});

			// create label
			var label = pr.El.createEl('label', {
				'id':	'toolbar-' + id + '-label',
				'for':	'toolbar-' + id
			}, {}, labelText + ':');

			// create input
			this.els[id] = pr.El.createEl('input', {
				'id':		'toolbar-' + id,
				'type':		'number',
				'min':		0,
				'value':	0,
				'title':	labelText.toLocaleLowerCase()
			});

			// change listener
			pr.El.registerListener(this.els[id], 'change', changeListener);

			// keypress listener
			pr.El.registerListener(this.els[id], 'keydown', function(e) {

				// if shift key and up or down change value by 10
				if (e.shiftKey && (e.keyCode === 38 || e.keyCode === 40)) {

					e.preventDefault();

					// up
					if (e.keyCode === 38) {
						this.value = parseInt(this.value, 10) + 10;
					}
					// down
					else if (e.keyCode === 40) {
						this.value = parseInt(this.value, 10) - 10;
					}

					changeListener.call(this, e);

				}

				// if enter is pressed
				if (e.keyCode === 13) {

					// fire listener
					changeListener.call(this, e);

				}

			});

			// focus listener
			pr.El.registerListener(this.els[id], 'focus', function(e) {
				pr.elements.ruler.keyMoving = false;
			});

			// blur listener
			pr.El.registerListener(this.els[id], 'blur', function(e) {
				pr.elements.ruler.keyMoving = true;
			});

			// add label and input to container
			pr.El.appendEl(container, [
				label,
				this.els[id]
			]);

			// return container
			return container;

		},

		/**
		 * Shifts the page so that the toolbar does not overlap it
		 */
		shiftPage: function(height) {

			// reset any previous shifts
			this.unshiftPage();

			// auto calculate height if not specified
			height = height || this.height + (this.elementMode ? this.elementToolbar.height : 0);

			// toolbar in top dock position
			if (this.position === 'top') {

				var cssTransform = 'transform' in document.body.style ? 'transform' : '-webkit-transform';
				document.body.style.setProperty(cssTransform, 'translateY(' + pr.Util.px(height) + ')', 'important');

			}
			// toolbar in bottom dock position
			else {

				document.body.style.setProperty('margin-bottom', pr.Util.px(height), 'important');

			}

		},

		/**
		 * Resets the page shift so it goes back to it's original position once the toolbar is removed
		 */
		unshiftPage: function() {

			// remove css transform from 'top' dock
			var cssTransform = 'transform' in document.body.style ? 'transform' : '-webkit-transform';
			document.body.style.removeProperty(cssTransform);

			// remove margin-bottom from bottom dock
			document.body.style.removeProperty('margin-bottom');

		},

		/**
		 * Generates the container for the element mode toggle
		 */
		generateElementModeToggleContainer: function() {

			var _this = this;

			var label = pr.El.createEl('span', {
				'id':		'toolbar-element-toggle-label',
				'style':	'display:none !important;'
			}, {}, pr.Util.locale('toolbarEnableElementMode'));

			var img = pr.El.createEl('img', {
				'id':	'toolbar-element-toggle-img',
				'src':	chrome.extension.getURL("images/element-mode-toggle.png")
			});

			var container = pr.El.createEl('div', {
				'id':	'toolbar-element-toggle',
				'cls':	['container', 'element-toggle-container']
			}, {
				'mouseover': function(e) {
					label.style.removeProperty('display');
				},
				'mouseout': function(e) {
					if (_this.elementMode === false) {
						label.style.setProperty('display', 'none', 'important');
					}
				},
				'click': function(e) {
					e.preventDefault();
					e.stopPropagation();
					if (_this.elementMode === false) {
						_this.showElementToolbar();
					}
					else {
						_this.hideElementToolbar();
					}
				}
			});

			pr.El.appendEl(container, [
				label,
				img
			]);

			return container;

		},

		/**
		 * Generates the container for the width and height inputs
		 * @returns {HTMLElement}
		 */
		generateDimensionsContainer: function() {

			var _this = this;

			// create container
			var container	= pr.El.createEl('div', {
				'id':	'toolbar-dimensions',
				'cls':	'container'
			});

			// create width input
			var width	= this.generatePixelInput(
				'width',
				pr.Util.locale('toolbarWidth'),
				function(e) {
					_this.ruler.setWidth(this.value);

					// track event
					chrome.runtime.sendMessage(
						{
							action:	'trackEvent',
							args:	['Action', 'Ruler Change', 'Width']
						}
					);

				}
			);

			// create height input
			var height	= this.generatePixelInput(
				'height',
				pr.Util.locale('toolbarHeight'),
				function(e) {
					_this.ruler.setHeight(this.value);

					// track event
					chrome.runtime.sendMessage(
						{
							action:	'trackEvent',
							args:	['Action', 'Ruler Change', 'Height']
						}
					);
				}
			);

			// add inputs to container
			pr.El.appendEl(container, [
				width,
				height
			]);

			// return container
			return container;

		},

		/**
		 * Generates the container for the left, right, top and bottom inputs
		 * @returns {HTMLElement}
		 */
		generatePositionContainer: function() {

			var _this = this;

			// create container
			var container	= pr.El.createEl('div', {
				'id':	'toolbar-positions',
				'cls':	'container'
			});

			// create left input
			var left	= this.generatePixelInput(
				'left',
				pr.Util.locale('toolbarLeft'),
				function(e) {
					_this.ruler.setLeft(this.value, true);

					// track event
					chrome.runtime.sendMessage(
						{
							action:	'trackEvent',
							args:	['Action', 'Ruler Change', 'Left']
						}
					);
				}
			);

			// create top input
			var top		= this.generatePixelInput(
				'top',
				pr.Util.locale('toolbarTop'),
				function(e) {
					_this.ruler.setTop(this.value, true);

					// track event
					chrome.runtime.sendMessage(
						{
							action:	'trackEvent',
							args:	['Action', 'Ruler Change', 'Top']
						}
					);
				}
			);

			// create right input
			var right	= this.generatePixelInput(
				'right',
				pr.Util.locale('toolbarRight'),
				function(e) {
					_this.ruler.setRight(this.value, true);

					// track event
					chrome.runtime.sendMessage(
						{
							action:	'trackEvent',
							args:	['Action', 'Ruler Change', 'Right']
						}
					);
				}
			);

			// create bottom input
			var bottom	= this.generatePixelInput(
				'bottom',
				pr.Util.locale('toolbarBottom'),
				function(e) {
					_this.ruler.setBottom(this.value, true);

					// track event
					chrome.runtime.sendMessage(
						{
							action:	'trackEvent',
							args:	['Action', 'Ruler Change', 'Bottom']
						}
					);
				}
			);

			// add inputs to container
			pr.El.appendEl(container, [
				left,
				top,
				right,
				bottom
			]);

			// return container
			return container;

		},

		/**
		 * Generates the container for the color input
		 * @returns {HTMLElement}
		 */
		generateColorContainer: function() {

			var _this = this;

			// create container
			var container	= pr.El.createEl('div', {
				'id':		'toolbar-color-container',
				'class':	'container'
			});

			// create label
			var label = pr.El.createEl('label', {
				'id':	'toolbar-color-label',
				'for':	'toolbar-color'
			}, {}, pr.Util.locale('toolbarColor') + ':');

			// create input
			this.els.color = pr.El.createEl('input', {
				'id':		'toolbar-color',
				'type':		'color'
			});

			// set change event on the input
			pr.El.registerListener(this.els.color, 'change', function(e) {
				_this.ruler.setColor(e.target.value, true);
			});

			// add the label and input to the container
			pr.El.appendEl(container, [
				label,
				this.els.color
			]);

			// return container
			return container;

		},

		/**
		 * Generates the container for the guides toggle
		 * @returns {HTMLElement}
		 */
		generateGuidesContainer: function() {

			// create container
			var guidesContainer = pr.El.createEl('div', {
				'id':	'toolbar-guides-container',
				'cls':	'container'
			});

			// create label
			var label = pr.El.createEl('label', {
				'id':	'toolbar-guides-label',
				'for':	'toolbar-guides-input'
			}, {}, pr.Util.locale('toolbarGuides') + ':');

			var lang = (navigator.language || '').split('-')[0];
			if (!!lang) {
				lang = 'lang_' + lang;
			}

			// create toggle element
			var toggle = pr.El.createEl('div', {
				'id':	'toolbar-guides-toggle',
				'cls':	'checkbox-toggle ' + lang
			});

			// create checkbox element
			var input = pr.El.createEl('input', {
				'id':		'toolbar-guides-input',
				'type':		'checkbox',
				'checked':	true
			}, {
				'change': function(e) {

					pr.elements.guides.setVisible(this.checked, true);

				}
			});

			// set reference to checkbox
			this.els.guides = input;

			// create toggle label
			var toggleLabel = pr.El.createEl('label', {
				'id':	'toolbar-guides-toggle-label',
				'for':	'toolbar-guides-input'
			});

			// create label inner
			var labelInner = pr.El.createEl('div', {
				'id':		'toolbar-guides-label-inner',
				'class':	'inner'
			});

			// create label switch
			var labelSwitch = pr.El.createEl('div', {
				'id':		'toolbar-guides-label-switch',
				'class':	'switch ' + lang
			});

			// add label contents
			pr.El.appendEl(toggleLabel, [
				labelInner,
				labelSwitch
			]);

			// add toggle contents
			pr.El.appendEl(toggle, [
				input,
				toggleLabel
			]);

			// add container contents
			pr.El.appendEl(guidesContainer, [
				label,
				toggle
			]);

			return guidesContainer;

		},

		generateBorderSearchContainer: function() {

			// create container
			var borderSearchContainer = pr.El.createEl('div', {
				'id':	'toolbar-borderSearch-container',
				'cls':	'container'
			});

			// create label
			var label = pr.El.createEl('label', {
				'id':	'toolbar-borderSearch-label',
				'for':	'toolbar-borderSearch-input'
			}, {}, pr.Util.locale('toolbarBorderSearch') + ':');

			var lang = (navigator.language || '').split('-')[0];
			if (!!lang) {
				lang = 'lang_' + lang;
			}

			// create toggle element
			var toggle = pr.El.createEl('div', {
				'id':	'toolbar-borderSearch-toggle',
				'cls':	'checkbox-toggle ' + lang
			});

			// create checkbox element
			var input = pr.El.createEl('input', {
				'id':		'toolbar-borderSearch-input',
				'type':		'checkbox',
				'checked':	true
			}, {
				'change': function(e) {
					console.log('saving setBorderSearchVisibility');
					pr.elements.ruler.setBorderSearchVisibility(this.checked, true);
				}
			});

			// set reference to checkbox
			this.els.borderSearch = input;

			// create toggle label
			var toggleLabel = pr.El.createEl('label', {
				'id':	'toolbar-borderSearch-toggle-label',
				'for':	'toolbar-borderSearch-input'
			});

			// create label inner
			var labelInner = pr.El.createEl('div', {
				'id':		'toolbar-borderSearch-label-inner',
				'class':	'inner'
			});

			// create label switch
			var labelSwitch = pr.El.createEl('div', {
				'id':		'toolbar-borderSearch-label-switch',
				'class':	'switch ' + lang
			});

			// add label contents
			pr.El.appendEl(toggleLabel, [
				labelInner,
				labelSwitch
			]);

			// add toggle contents
			pr.El.appendEl(toggle, [
				input,
				toggleLabel
			]);

			// add container contents
			pr.El.appendEl(borderSearchContainer, [
				label,
				toggle
			]);

			return borderSearchContainer;

		},

		/**
		 * Generates the container for the element mode toggle
		 * @returns {HTMLElement}
		 */
		generateCloseContainer: function() {

			var _this = this;

			// create container
			var container	= pr.El.createEl('div', {
				'id':		'toolbar-close-container',
				'class':	['container', 'close-container']
			});

			// create close button
			var img = pr.El.createEl(
				'img',
				{
					'id':		'toolbar-close',
					'src':		chrome.extension.getURL("images/close.png"),
					'title':	pr.Util.locale('toolbarClose', 'lowercase')
				},
				{
					'click': function(e) {
						chrome.runtime.sendMessage({
							action: 'disable'
						});
					}
				}
			);

			// add the label and input to the container
			pr.El.appendEl(container, [
				img
			]);

			// return container
			return container;

		},

		/**
		 * Generates the container for the help button
		 * @returns {HTMLElement}
		 */
		generateHelpContainer: function() {

			// create container
			var container	= pr.El.createEl('div', {
				'id':		'toolbar-help-container',
				'class':	['container', 'help-container']
			});

			// create dock button
			this.els.help = pr.El.createEl(
				'img',
				{
					'id':		'toolbar-help',
					'src':		chrome.extension.getURL("images/help-white.png"),
					'title':	pr.Util.locale('toolbarHelp', 'lowercase')
				},
				{
					'click': function(e) {
						chrome.runtime.sendMessage({
							action:		'openHelp'
						});
					}
				}
			);

			// add the label and input to the container
			pr.El.appendEl(container, [
				this.els.help
			]);

			// return container
			return container;

		},

		/**
		 * Generates the container for the dock button
		 * @returns {HTMLElement}
		 */
		generateDockContainer: function() {

			var _this = this;

			// create container
			var container	= pr.El.createEl('div', {
				'id':		'toolbar-dock-container',
				'class':	['container', 'dock-container']
			});

			// create dock button
			this.els.dock = pr.El.createEl(
				'img',
				{
					'id':		'toolbar-dock',
					'src':		chrome.extension.getURL("images/dock-bottom.png"),
					'title':	pr.Util.locale('toolbarDockBottom', 'lowercase')
				},
				{
					'click': function(e) {

						_this.setDockPosition(_this.position === 'top' ? 'bottom' : 'top', true);
					}
				}
			);

			// add the label and input to the container
			pr.El.appendEl(container, [
				this.els.dock
			]);

			// return container
			return container;

		},

		setDockPosition: function(position, save) {

			// make sure position is valid
			if (position !== 'top' && position !== 'bottom') {
				return;
			}

			// save old position for convenience
			var oldPosition = position === 'top' ? 'bottom' : 'top';

			// remove old dock class
			pr.El.removeClass(this.dom, 'page-ruler-' + oldPosition);

			// set new dock position
			this.position = position;

			// add new dock class
			pr.El.addClass(this.dom, 'page-ruler-' + position);

			// change dock image
			this.els.dock.setAttribute('src', chrome.extension.getURL('images/dock-' + oldPosition + '.png'));

			// change dock image title
			this.els.dock.setAttribute('title', pr.Util.locale('toolbarDock' + (oldPosition === 'top' ? 'Top' : 'Bottom'), 'lowercase'));

			// re-shift page
			this.shiftPage();

			// save position
			if (!!save) {
				chrome.runtime.sendMessage({
					action:		'setDockPosition',
					position:	position
				});
			}

		},

		/**
		 * Sets the color on the color input
		 * @param {string} color
		 */
		setColor: function(color) {

			this.els.color.value = color;

		},

        /**
         * Sets the value of the width element
         * @param {Number} width
         */
        setWidth: function(width) {

            this.els.width.value = parseInt(width, 10);

        },

        /**
         * Sets the value of the height element
         * @param {Number} height
         */
        setHeight: function(height) {

            this.els.height.value = parseInt(height, 10);

        },

        /**
         * Sets the value of the top element
         * @param {Number} top
         */
        setTop: function(top) {

            this.els.top.value = parseInt(top, 10);

        },

        /**
         * Sets the value of the bottom element
         * @param {Number} bottom
         */
        setBottom: function(bottom) {

            this.els.bottom.value = parseInt(bottom, 10);

        },

        /**
         * Sets the value of the left element
         * @param {Number} left
         */
        setLeft: function(left) {

            this.els.left.value = parseInt(left, 10);

        },

        /**
         * Sets the value of the right element
         * @param {Number} right
         */
        setRight: function(right) {

            this.els.right.value = parseInt(right, 10);

        },

		showElementToolbar: function() {

			this.elementMode = true;

			this.elementToolbar.show();

			document.getElementById('page-ruler-toolbar-element-toggle-label').innerText = pr.Util.locale('toolbarDisableElementMode');

		},

		hideElementToolbar: function() {

			this.elementMode = false;

			this.elementToolbar.hide();

			document.getElementById('page-ruler-toolbar-element-toggle-label').innerText = pr.Util.locale('toolbarEnableElementMode');

		}

	}
);

})(__PageRuler);