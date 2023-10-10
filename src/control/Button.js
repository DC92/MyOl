/**
 * Button.js
 * Add some usefull controls with buttons
 */

import ol from '../ol';
import './Button.css';
//TODO revoir click, touch, coloration & hover subMenuHTML
//TODO button unicode as append in CSS

/**
 * Control button
 * Abstract class to be used by other control buttons definitions
 */
export class Button extends ol.control.Control {
  constructor(options) {
    options = {
      label: '?', // An ascii or unicode character to decorate the button
      className: '', // To be added to the control.element
      // subMenuId : 'id', // Id of an existing html containing the scrolling menu
      subMenuHTML: '', // html code of the scrolling menu
      // subMenuAction() {}, // (evt) To run when the button is clicked / hovered, ...
      // buttonAction() {}, // (evt) To run when an <input> ot <a> of the subMenu is clicked / hovered, ...

      // All ol.control.Control options

      ...options,
    };

    super({
      element: document.createElement('div'),
      ...options,
    });

    this.options = options;

    if (options.buttonAction) this.buttonAction = options.buttonAction;
    if (options.subMenuAction) this.subMenuAction = options.subMenuAction;

    // Create a button
    this.buttonEl = document.createElement('button');
    this.buttonEl.setAttribute('type', 'button');
    this.buttonEl.innerHTML = options.label;

    // Add submenu below the button
    this.subMenuEl = document.getElementById(options.subMenuId);
    this.subMenuEl ||= document.createElement('div');
    this.subMenuEl.innerHTML ||= options.subMenuHTML;

    // Populate the control
    this.element.className = 'ol-control myol-button ' + options.className;
    this.element.appendChild(this.buttonEl); // Add the button
    this.element.appendChild(this.subMenuEl); // Add the submenu
  }

  setMap(map) {
    super.setMap(map);

    // Register action listeners when html is fully loaded
    this.buttonEl.addEventListener('click', evt => this.buttonListener(evt));
    /*
    this.buttonEl.addEventListener('click', evt => this.buttonListener(evt));
    this.buttonEl.addEventListener('mouseover', evt => this.buttonListener(evt));
    this.buttonEl.addEventListener('mouseout', evt => this.buttonListener(evt));
    this.buttonEl.addEventListener('mouseenter', evt => this.buttonListener(evt));
    this.buttonEl.addEventListener('mouseleave', evt => this.buttonListener(evt));
    this.buttonEl.addEventListener('mousedown', evt => this.buttonListener(evt));
    this.buttonEl.addEventListener('mouseup', evt => this.buttonListener(evt));
    this.buttonEl.addEventListener('mousemove', evt => this.buttonListener(evt));
    this.buttonEl.addEventListener('contextmenu', evt => this.buttonListener(evt));

    this.buttonEl.addEventListener('touchcancel', evt => this.buttonListener(evt));
    this.buttonEl.addEventListener('touchend', evt => this.buttonListener(evt));
    this.buttonEl.addEventListener('touchmove', evt => this.buttonListener(evt));
    this.buttonEl.addEventListener('touch', evt => this.buttonListener(evt));
	*/
    this.element.addEventListener('mouseover', evt => this.buttonListener(evt));
    this.element.addEventListener('mouseout', evt => this.buttonListener(evt));

    // Close the submenu when click or touch on the map
    document.addEventListener('click', evt => {
      const el = document.elementFromPoint(evt.x, evt.y);

      if (el && el.tagName == 'CANVAS')
        this.element.classList.remove('myol-button-selected');
    });

    this.subMenuEl.querySelectorAll('a, input')
      .forEach(el => ['click', 'change'].forEach(tag =>
        el.addEventListener(tag, evt =>
          this.subMenuAction(evt)
        )));
  }

  buttonListener(evt) {
    this.buttonAction(evt);

    if (evt.type == 'mouseover')
      this.element.classList.add('myol-button-hover');
    else // mouseout | click
      this.element.classList.remove('myol-button-hover');

    if (evt.type == 'click') // Mouse click & touch
      this.element.classList.toggle('myol-button-selected');

    // Close other open buttons
    for (let el of document.getElementsByClassName('myol-button'))
      if (el != this.element)
        el.classList.remove('myol-button-selected');
  }

  buttonAction() {}

  subMenuAction() {}
}

/**
 * No button
 * To be used to replace an unused button
 */
export class NoButton extends ol.control.Control {
  constructor() {
    super({
      element: document.createElement('div'),
    });
  }
}

export default Button;