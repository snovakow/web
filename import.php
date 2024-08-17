<?php
$version = 1;

if (!isset($_GET['version'])) die();
if ($_GET['version'] != $version) die();

if (!isset($_GET['puzzleClues'])) die();
if (!isset($_GET['puzzleFilled'])) die();
if (!isset($_GET['clueCount'])) die();
if (!isset($_GET['simple'])) die();
if (!isset($_GET['naked2'])) die();
if (!isset($_GET['naked3'])) die();
if (!isset($_GET['naked4'])) die();
if (!isset($_GET['hidden2'])) die();
if (!isset($_GET['hidden3'])) die();
if (!isset($_GET['hidden4'])) die();
if (!isset($_GET['yWing'])) die();
if (!isset($_GET['xyzWing'])) die();
if (!isset($_GET['xWing'])) die();
if (!isset($_GET['swordfish'])) die();
if (!isset($_GET['jellyfish'])) die();
if (!isset($_GET['uniqueRectangle'])) die();
if (!isset($_GET['phistomefel'])) die();
if (!isset($_GET['superpositions'])) die();
if (!isset($_GET['bruteForce'])) die();

$puzzleClues = $_GET['puzzleClues'];
$puzzleFilled = $_GET['puzzleFilled'];
$clueCount = $_GET['clueCount'];
$simple = $_GET['simple'];
$naked2 = $_GET['naked2'];
$naked3 = $_GET['naked3'];
$naked4 = $_GET['naked4'];
$hidden2 = $_GET['hidden2'];
$hidden3 = $_GET['hidden3'];
$hidden4 = $_GET['hidden4'];
$yWing = $_GET['yWing'];
$xyzWing = $_GET['xyzWing'];
$xWing = $_GET['xWing'];
$swordfish = $_GET['swordfish'];
$jellyfish = $_GET['jellyfish'];
$uniqueRectangle = $_GET['uniqueRectangle'];
$phistomefel = $_GET['phistomefel'];
$superpositions = $_GET['superpositions'];
$bruteForce = $_GET['bruteForce'];

$servername = "localhost";
$username = "snovakow";
$password = "kewbac-recge1-Fiwpux";
$dbname = "sudoku";

try {
	$conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
	// set the PDO error mode to exception
	$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
	echo "Connected successfully";

	$sql = "INSERT INTO puzzles (puzzleClues, puzzleFilled, clueCount, simple, naked2, naked3, naked4, hidden2, hidden3, hidden4, 
			yWing, xyzWing, xWing, swordfish, jellyfish, uniqueRectangle, phistomefel, superpositions, bruteForce) 
			VALUES ($puzzleClues, $puzzleFilled, $clueCount, $simple, $naked2, $naked3, $naked4, $hidden2, $hidden3, $hidden4, 
			$yWing, $xyzWing, $xWing, $swordfish, $jellyfish, $uniqueRectangle, $phistomefel, $superpositions, $bruteForce)";
	// use exec() because no results are returned
	$conn->exec($sql);
	echo "New record created successfully";
} catch (PDOException $e) {
	echo "Connection failed: " . $e->getMessage();
}

$conn = null;

$processCount = 1;
echo ("Done " . $processCount . " processed.<br>");
