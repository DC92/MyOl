<?php
header("Content-Type: application/javascript");

include "gps.php";
echo "var jsVars = $js_vars;" . PHP_EOL;
echo file_get_contents("service-worker.js");
