/**
 * Resize element
 */

(function(pr) {

pr.el.BorderSearch = pr.cls(

	/**
	 * Class constructor
	 * @param {PageRuler.el.Ruler} ruler	The ruler object
	 * @param {string} positionDir			Direction of the search
	 * @param {string} leftOrRight			Position on left or right side
	 * @param {string} topOrBottom			Position on top or bottom
	 * @param {string} cls					Class
	 */
	function(ruler, positionDir, leftOrRight, topOrBottom, cls) {
		var id = 'bordersearch-' + positionDir + '-' + leftOrRight + '-' + topOrBottom;
		// get positions from id
		// set attributes
		var attrs = {
			'id':	 id,
			'class': [cls, id]
		};
		
		// create dom element
		this.dom = pr.El.createEl('div', attrs);

		// add mousedown listener - this will start the search
		pr.El.registerListener(this.dom, 'click', function(e) {

			// we don't want to interact with any other elements
			e.stopPropagation();
			e.preventDefault();
				
			// Search for a border
			ruler.borderSearch(positionDir, leftOrRight, topOrBottom);
		});
	},
	{

		/**
		 * The dom element
		 * @type {HTMLElement}
		 */
		dom:	null,

		/**
		 * Sets the border color of the ColorJump element
		 * @param {string} hex
		 */
		setColor: function(hex) {

			this.dom.style.setProperty('border-color', hex, 'important');

		}
	}

);

})(__PageRuler);