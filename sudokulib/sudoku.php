<?php
if (!isset($_GET['version'])) die();
$version = (int)$_GET['version'];
if ($version !== 2) die();

if (!isset($_GET['strategy'])) die();
$type = $_GET['strategy'];

$strategy = "";

$tableNames = [
	"simple_hidden_min",
	"simple_hidden_max",
	"simple_omission_min",
	"simple_omission_max",
	"simple_naked_min",
	"simple_naked_max",
	"candidate_visible_min",
	"candidate_visible_max",
	"candidate_naked2_min",
	"candidate_naked2_max",
	"candidate_naked3_min",
	"candidate_naked3_max",
	"candidate_naked4",
	"candidate_hidden1",
	"candidate_hidden2",
	"candidate_hidden3",
	"candidate_hidden4",
	"candidate_omissions",
	"candidate_uniqueRectangle",
	"candidate_yWing_min",
	"candidate_yWing_max",
	"candidate_xyzWing",
	"candidate_xWing",
	"candidate_swordfish",
	"candidate_jellyfish",
	"super_min",
	"super_max",
	"custom",
	"hardcoded",
];
foreach ($tableNames as $tableName) {
	if ($tableName == $type) {
		$strategy = $type;
		break;
	}
}

if ($strategy == "") die();

function tableName($number)
{
	$pad = str_pad($number, 3, "0", STR_PAD_LEFT);
	return "puzzles$pad";
}

try {
	$servername = "localhost";
	$username = "snovakow";
	$password = "kewbac-recge1-Fiwpux";
	$dbname = "sudoku";
	$db = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);

	if ($strategy == 'custom') {
		$stmt = $db->prepare("SELECT `id`, `title`, `puzzle_id`, `table_id` FROM `custom`");
		$stmt->execute();
		$result = $stmt->fetchAll(\PDO::FETCH_ASSOC);
		$results = [];
		foreach ($result as $key => $row) {
			$id = $row['id'];
			$title = $row['title'];
			$puzzle_id = $row['puzzle_id'];
			$table_id = $row['table_id'];

			$table = tableName($table_id);
			$stmt = $db->prepare("SELECT HEX(`puzzleData`) AS 'puzzleData' FROM `$table` WHERE `id`=$puzzle_id");

			$stmt->execute();
			$result = $stmt->fetch();
			$puzzleData = $result['puzzleData'];

			$results[] = ['id' => $id, 'title' => $title, 'puzzleData' => $puzzleData];
		}
		exit(json_encode($results));
	}

	if ($strategy == 'hardcoded') {
		$stmt = $db->prepare("SELECT `id`, `title`, `puzzle` FROM `hardcoded`");
		$stmt->execute();
		$result = $stmt->fetchAll(\PDO::FETCH_ASSOC);
		$results = [];
		foreach ($result as $key => $row) {
			$id = $row['id'];
			$title = $row['title'];
			$puzzleData = $row['puzzle'];
			$results[] = ['id' => $id, 'title' => $title, 'puzzleData' => $puzzleData];
		}
		exit(json_encode($results));
	}

	$stmt = $db->prepare("SELECT `puzzle_id`, `table_id` FROM `$strategy` AS strategy   
		JOIN (
			SELECT FLOOR(RAND() * (SELECT MAX(`id`) FROM `$strategy`)) AS `strategy_id`
		) AS random ON strategy.`id` > random.`strategy_id`
		LIMIT 1");
	$stmt->execute();
	$result = $stmt->fetch();

	$table_id = $result['table_id'];
	$puzzle_id = $result['puzzle_id'];
	$table = tableName($table_id);
	$stmt = $db->prepare("SELECT HEX(`puzzleData`) AS 'puzzleData' FROM `$table` WHERE `id`=$puzzle_id");

	$stmt->execute();
	$result = $stmt->fetch();
	$puzzleData = $result['puzzleData'];

	$id = "$table_id:$puzzle_id";
	$result = ['id' => $id, 'puzzleData' => $puzzleData];
	exit(json_encode($result));
} catch (PDOException $e) {
	// echo "Error: " . $e->getMessage();
}
