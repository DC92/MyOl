/**
 * Controls.js
 * Add some usefull controls without buttons
 */

import MyControl from './MyControl.js';
import './myButton.css';

/**
 * Control button
 * Abstract class to be used by other control buttons definitions
 */
export default class MyButton extends MyControl {
  constructor(options) {
    // MyButton options
    // className : to be added to the control.element
    // label : one unicode character to decorate the button
    // subMenuId : id of an existing html containing the scrolling menu 
    // subMenuHTML : html code of the scrolling menu 
    super(options);

    // Add submenu below the button
    if (this.options.subMenuId)
      this.subMenuEl = document.getElementById(this.options.subMenuId);
    else {
      this.subMenuEl = document.createElement('div');
      if (this.options.subMenuHTML)
        this.subMenuEl.innerHTML = this.options.subMenuHTML;
    }

    // Display the button only if there are no label or submenu
    if (this.options.label && this.subMenuEl && this.subMenuEl.innerHTML) {
      // Create a button
      const buttonEl = document.createElement('button');
      buttonEl.setAttribute('type', 'button');
      buttonEl.innerHTML = this.options.label;
      buttonEl.addEventListener('click', evt => this.buttonAction(evt));

      // Populate the control
      this.element.className = 'ol-control myol-button' + (this.options.className ? ' ' + this.options.className : '');
      this.element.appendChild(buttonEl); // Add the button
      this.element.appendChild(this.subMenuEl); // Add the submenu
      this.element.addEventListener('mouseover', evt => this.buttonAction(evt));
      this.element.addEventListener('mouseout', evt => this.buttonAction(evt));

      // Close the submenu when click or touch on the map
      document.addEventListener('click', evt => {
        const el = document.elementFromPoint(evt.x, evt.y);

        if (el && el.tagName == 'CANVAS')
          this.element.classList.remove('myol-button-selected');
      });
    }
  }

  buttonAction(evt) {
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
}