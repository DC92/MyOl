/**
 * Controls.js
 * Add some usefull controls with buttons
 */

import MyControl from './MyControl.js';
import './myButton.css';

/**
 * Control button
 * Abstract class to be used by other control buttons definitions
 */
export default class MyButton extends MyControl {
  constructor(options) {
    super({
      label: '?', // An ascii or unicode character to decorate the button
      className: '', // To be added to the control.element
      // subMenuId : 'id', // Id of an existing html containing the scrolling menu
      subMenuHTML: 'Unknown', // html code of the scrolling menu
      buttonChange: evt => {
        evt
      }, // To run when the button is clicked / hovered, ...
      subMenuChange: evt => {
        evt
      }, // To run when an <input> ot <a> of the subMenu is clicked / hovered, ...

      ...options,
    });

    // Create a button
    const buttonEl = document.createElement('button');
    buttonEl.setAttribute('type', 'button');
    buttonEl.innerHTML = this.options.label;
    buttonEl.addEventListener('click', evt => this.buttonAction(evt));

    // Add submenu below the button
    this.subMenuEl = document.getElementById(this.options.subMenuId);
    this.subMenuEl ||= document.createElement('div');
    this.subMenuEl.innerHTML ||= this.options.subMenuHTML;

    // Populate the control
    this.element.className = 'ol-control myol-button ' + this.options.className;
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

    if (this.options.test)
      this.test = this.options.test;
  }

  setMap(map) {
    super.setMap(map);
    this.test();

    // Register subMenu action listeners when it is complete
    this.subMenuEl.querySelectorAll('a,input')
      .forEach(el =>
        el.addEventListener(
          'change',
          evt => this.option.subMenuChange(evt)
        )
      );
  }

  buttonAction(evt) {
    this.options.buttonChange(evt);

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