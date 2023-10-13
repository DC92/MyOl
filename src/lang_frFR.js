window.wwwmyolbuttonprint_frFR = '\
<div id="myol-button-print">\
  <p>Pour imprimer la carte:</p>\
  <p>-Choisir portrait ou paysage,</p>\
  <p>-zoomer et déplacer la carte dans le format,</p>\
  <p>-imprimer.</p>\
  <label><input type="radio" value="0">Portrait A4</label>\
  <label><input type="radio" value="1">Paysage A4</label>\
  <label><a id="print">Imprimer</a></label>\
  <label><a onclick="location.reload()">Annuler</a></label>\
</div>';

window.myolbuttondownload_frFR = '\
<div id="myol-button-download">\
  <p>Cliquer sur un format ci-dessous pour obtenir un fichier\
    contenant les éléments visibles dans la fenêtre:</p>\
  <label><a mime="application/gpx+xml">GPX</a></label>\
  <label><a mime="vnd.google-earth.kml+xml">KML</a></label>\
  <label><a mime="application/json">GeoJSON</a></label>\
</div>';

window.myolbuttonload_frFR = '\
<div id="myol-button-load">\
  <p>Importer un fichier de points ou de traces</p>\
  <input type="file" accept=".gpx,.kml,.geojson"></p>\
</div>';

window.myolbuttongeolocation_frFR = '\
 <div id="myol-button-geolocation">\
  <p>Localisation GPS:</p>\
  <label>\
    <input type="radio" name="myol-gps-source" value="0" checked="checked">\
    Inactif</label><label>\
    <input type="radio" name="myol-gps-source" value="1">\
    Position GPS <span>(1) extérieur</span></label><label>\
    <input type="radio" name="myol-gps-source" value="2">\
    Position GPS ou IP <span>(2) intérieur</span></label>\
  <hr><label>\
    <input type="radio" name="myol-gps-display" value="0" checked="checked">\
    Graticule, carte libre</label><label>\
    <input type="radio" name="myol-gps-display" value="1">\
    Centre la carte, nord en haut</label><label>\
    <input type="radio" name="myol-gps-display" value="2">\
    Centre et oriente la carte <span>(3)</span></label>\
  <hr>\
  <p>(1) plus précis en extérieur mais plus lent à initialiser,\
    nécessite un capteur et une réception GPS.</p>\
  <p>(2) plus précis et rapide en intérieur ou en zone urbaine\
    mais peut être très erroné en extérieur à l\'initialisation.\
    Utilise les position des points WiFi proches en plus du GPS dont il peut se passer.</p>\
  <p>(3) nécessite un capteur magnétique et un explorateur le supportant.</p>\
</div>';

window.myoledithelpmodify_frFR = '\
<div id="myol-edit-help-modify">\
  <p><u>Déplacer un sommet:</u> cliquer sur le sommet et le déplacer</p>\
  <p><u>Ajouter un sommet au milieu d\'un segment:</u> cliquer le long du segment puis déplacer</p>\
  <p><u>Supprimer un sommet:</u> Alt+cliquer sur le sommet</p>\
  <p><u>Couper une ligne en deux:</u> Alt+cliquer sur le segment à supprimer</p>\
  <p><u>Inverser la direction d\'une ligne:</u> Shift+cliquer sur le segment à inverser</p>\
  <p><u>Transformer un polygone en ligne:</u> Alt+cliquer sur un côté</p>\
  <p><u>Fusionner deux lignes:</u> déplacer l\'extrémité d\'une ligne pour rejoindre l\'autre</p>\
  <p><u>Transformer une ligne en polygone:</u> déplacer une extrémité pour rejoindre l\'autre</p>\
  <p><u>Scinder un polygone:</u> joindre 2 sommets du polygone puis Alt+cliquer sur le sommet commun</p>\
  <p><u>Fusionner 2 polygones:</u> superposer un côté (entre 2 sommets consécutifs)\
    de chaque polygone puis Alt+cliquer dessus</p>\
  <p><u>Supprimer une ligne ou un polygone:</u> Ctrl+Alt+cliquer sur un segment</p>\
</div>';

window.myoledithelpline_frFR = '\
<div id="myol-edit-help-line">\
  <p><u>Pour créer une ligne:</u></p>\
  <p>Cliquer sur <a>le bouton &#128397;</a></p>\
  <p>Cliquer sur l\'emplacement du début</p>\
  <p>Puis sur chaque sommet</p>\
  <p>Double cliquer sur le dernier sommet pour terminer</p>\
  <hr>\
  <p>Cliquer sur une extrémité d\'une ligne existante pour l\'étendre</p>\
</div>';

window.myoledithelppoly_frFR = '\
<div id="myol-edit-help-poly">\
  <p><u>Pour créer un polygone:</u></p>\
  <p>Cliquer sur <a>le bouton &#9186;</a></p>\
  <p>Cliquer sur l\'emplacement du premier sommet</p>\
  <p>Puis sur chaque sommet</p>\
  <p>Double cliquer sur le dernier sommet pour terminer</p>\
  <hr>\
  <p>Un polygone entièrement compris dans un autre crée un "trou"</p>\
</div>';