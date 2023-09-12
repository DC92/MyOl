<?php
error_reporting(E_ALL);
ini_set("display_errors", "on");

header("Content-Type: application/javascript");
header("Cache-Control: no-cache");
header("Pragma: no-cache");

$script_name = array_keys($_GET)[0] . ".js";

// Display the last modified filetime to trigger the reload
preg_match_all(
    '/(href|src)="([^"]*)/',
    file_get_contents("index.html"),
    $index_includes
);
$dependencies = glob(
    "{*,*/*," . join(",", $index_includes[2]) . "}",
    GLOB_BRACE
);
date_default_timezone_set("Europe/Paris");
$last_change_time = 0;
foreach ($dependencies as $f) {
    $last_change_time = max($last_change_time, filemtime($f));
}

// List .gpx files included in the gpx directory
$gpx_files = glob("gpx/*.gpx", GLOB_BRACE);
$gpx_files_list = str_replace(["[", "]"], PHP_EOL, json_encode($gpx_files));

$replace = [
    "LAST_CHANGE_TIME" => date("Y-m-d H:i:s", $last_change_time),
    "/*GPXFILES*/" => str_replace(",", "," . PHP_EOL, $gpx_files_list),
];
echo str_replace(
    array_keys($replace),
    array_values($replace),
    file_get_contents($script_name)
);
