<!doctype html>
<html>

<head>
	<meta charset="utf-8">
	<title></title>
	<meta name="viewport" content="width=device-width,initial-scale=1">
</head>

<body>

	<script type="module">
		document.body.style.fontFamily = "'Courier New', monospace";
	</script>

	<?php
	function percentage($count, $total)
	{
		$precision = 100000;
		$number = $count / $total;
		$formatted = ceil(100 * $number * $precision) / $precision;
		return rtrim(rtrim(sprintf('%f', $formatted), '0'), ".") . "%";
	}
	function printStat($title, $count, $total)
	{
		echo $title . ": " . percentage($count, $total) . " " . number_format($count) . "<br/>";
	}

	// if(!isset($_GET['id'])) die();

	// header("Access-Control-Allow-Origin: *");

	$servername = "localhost";
	$username = "snovakow";
	$password = "kewbac-recge1-Fiwpux";
	$dbname = "sudoku";

	try {
		$conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
		$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION, PDO::ATTR_STRINGIFY_FETCHES);

		$startTime = microtime(true);
		$total = 0;
		$counts = array();

		$stmt = $conn->prepare("SELECT `clueCount`, COUNT(*) as count FROM puzzles GROUP BY `clueCount`");
		$stmt->execute();
		$result = $stmt->fetchAll(\PDO::FETCH_ASSOC);
		foreach ($result as $clueCount => $row) $total += $row['count'];
		foreach ($result as $key => $row) {
			$clueCount = $row['clueCount'];
			$count = $row['count'];

			printStat($clueCount . " Clues", $count, $total);
		}
		echo  "<br/>";

		$stmt = $conn->prepare("
		SELECT
		SUM(`has_naked2`) AS naked2,
		SUM(`has_naked3`) AS naked3,
		SUM(`has_naked4`) AS naked4,
		SUM(`has_hidden2`) AS hidden2,
		SUM(`has_hidden3`) AS hidden3,
		SUM(`has_hidden4`) AS hidden4,
		SUM(`has_yWing`) AS yWing,
		SUM(`has_xyzWing`) AS xyzWing,
		SUM(`has_xWing`) AS xWing,
		SUM(`has_swordfish`) AS swordfish,
		SUM(`has_jellyfish`) AS jellyfish,
		SUM(`has_uniqueRectangle`) AS uniqueRectangle,
		SUM(`has_phistomefel`) AS phistomefel
		FROM puzzles WHERE `bruteForce` = 0");
		$stmt->execute();
		$solveTypes = $stmt->fetch();

		$naked2 = $solveTypes['naked2'];
		$naked3 = $solveTypes['naked3'];
		$naked4 = $solveTypes['naked4'];
		$hidden2 = $solveTypes['hidden2'];
		$hidden3 = $solveTypes['hidden3'];
		$hidden4 = $solveTypes['hidden4'];
		$yWing = $solveTypes['yWing'];
		$xyzWing = $solveTypes['xyzWing'];
		$xWing = $solveTypes['xWing'];
		$swordfish = $solveTypes['swordfish'];
		$jellyfish = $solveTypes['jellyfish'];
		$uniqueRectangle = $solveTypes['uniqueRectangle'];
		$phistomefel = $solveTypes['phistomefel'];

		printStat("Naked 2", $naked2, $total);
		printStat("Naked 3", $naked3, $total);
		printStat("Naked 4", $naked4, $total);
		printStat("Hidden 2", $hidden2, $total);
		printStat("Hidden 3", $hidden3, $total);
		printStat("Hidden 4", $hidden4, $total);
		printStat("yWing", $yWing, $total);
		printStat("xyzWing", $xyzWing, $total);
		printStat("xWing", $xWing, $total);
		printStat("swordfish", $swordfish, $total);
		printStat("jellyfish", $jellyfish, $total);
		printStat("uniqueRectangle", $uniqueRectangle, $total);
		printStat("phistomefel", $phistomefel, $total);
		echo  "<br/>";

		$stmt = $conn->prepare("SELECT `solveType`, COUNT(*) as count FROM puzzles GROUP BY `solveType`");
		$stmt->execute();
		$result = $stmt->fetchAll(\PDO::FETCH_ASSOC);
		foreach ($result as $key => $row) {
			$solveType = $row['solveType'];
			$count = $row['count'];

			$type = "Simples";
			if ($solveType === "1") $type =  "Markers";
			else if ($solveType === "2") $type = "Brute Force";
			printStat($type, $count, $total);
		}
		echo  "<br/>";

		echo  "Total Puzzles: " . number_format($total) . "<br/>";
		echo  "<br/>";

		$endtime = microtime(true);
		$timediff = $endtime - $startTime;
		echo $timediff . " seconds<br/>";
	} catch (PDOException $e) {
		echo "Error: " . $e->getMessage();
	}
	$conn = null;
	?>

</body>

</html>