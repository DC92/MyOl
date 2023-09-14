/**
 * Geocoder
 * From https://github.com/jonataswalker/ol-geocoder
 * Corrected https://github.com/kirtan-desai/ol-geocoder
 * Corrected https://github.com/Dominique92/ol-geocoder
 */

// Geocoder
import Geocoder from '@myol/geocoder/src/base';
import '@myol/geocoder/dist/ol-geocoder.css';
import './myGeocoder.css'; // After ol-geocoder.css

//TODO BUG n'ouvre pas au survol
//TODO BUG n'affiche pas le picto envoi
export default class MyGeocoder extends Geocoder {
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

    //TODO necessary ?
    this.on('addresschosen', evt =>
      evt.target.getMap().getView().fit(evt.bbox)
    );

    // Close other opened buttons when hover with a mouse
    this.element.addEventListener('pointerover', () => {
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