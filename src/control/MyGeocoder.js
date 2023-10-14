/**
 * Geocoder
 * From https://github.com/jonataswalker/ol-geocoder
 * Corrected https://github.com/kirtan-desai/ol-geocoder
 * Corrected https://github.com/Dominique92/ol-geocoder
 */

// Geocoder
//BEST click on button keep input open
import Geocoder from '@myol/geocoder/src/base';
import '@myol/geocoder/dist/ol-geocoder.css';
import './myGeocoder.css'; // After ol-geocoder.css

export class MyGeocoder extends Geocoder {
  constructor(options) {
    super('nominatim', {
      // See https://github.com/kirtan-desai/ol-geocoder#user-content-api
      placeholder: 'Recherche par nom sur la carte', // Initialization of the input field
      ...options,
    });

    // Avoid submit of a form including the map
    this.element.getElementsByTagName('input')[0]
      .addEventListener('keypress', evt =>
        evt.stopImmediatePropagation()
      );

    this.element.addEventListener('pointerover', () => {
      // Open the control
      this.element.querySelector('.gcd-gl-control')
        .classList.add('gcd-gl-expanded');

      // Close other opened buttons when hover with a mouse
      for (let el of document.getElementsByClassName('myol-button-selected'))
        el.classList.remove('myol-button-selected');
    });

    // Close submenu when hover another button
    document.addEventListener('pointerout', evt => {
      const hoveredEl = document.elementFromPoint(evt.x, evt.y),
        controlEl = this.element.firstElementChild;

      if (hoveredEl && hoveredEl.tagName == 'BUTTON')
        controlEl.classList.remove('gcd-gl-expanded');
    });
  }
}

export default MyGeocoder;