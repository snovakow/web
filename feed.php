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
	// if(!isset($_GET['id'])) die();

	// header("Access-Control-Allow-Origin: *");

	$servername = "localhost";
	$username = "snovakow";
	$password = "kewbac-recge1-Fiwpux";
	$dbname = "sudoku";

	try {
		$conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
		$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
		$stmt = $conn->prepare("SELECT `clueCount`, count(*) as count FROM puzzles GROUP BY `clueCount`");
		$stmt->execute();

		$total = 0;
		$counts = array();

		$result = $stmt->fetchAll(\PDO::FETCH_ASSOC);
		foreach ($result as $clueCount => $row) {
			$total += $row['count'];
		}

		$precision = 100000;

		foreach ($result as $clueCount => $row) {
			$clueCount = $row['clueCount'];
			$count = $row['count'];

			$number = $count / $total;
			$formatted = ceil(100 * $number * $precision) / $precision;
			echo  $clueCount;
			echo  ": ";
			echo rtrim(rtrim(sprintf('%f', $formatted), '0'), ".");
			echo  "% ";
			echo  number_format($count);
			echo  "<br/>";
		}

		echo  "Total: " . number_format($total) . "<br/>";
	} catch (PDOException $e) {
		echo "Error: " . $e->getMessage();
	}
	$conn = null;
	?>

</body>

</html>