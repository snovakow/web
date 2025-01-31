<?php

const MAX_SIZE = 10000000;

// 0 = Update Prep Statements
// 1 = Populate Statements
// 2 = Populated Tables
// 3 = Totals
// 4 = Simples and Visuals
// 5 = Strategies
// 6 = Superpositions
// 7 = Clues

if (!isset($_GET['mode'])) die;

$mode = (int)$_GET['mode'];
if (!is_int($mode) || $mode < 0 || $mode > 7) die;

function totalCount($tableCount, $puzzleCount)
{
	if ($tableCount === 0) return 0;
	return (($tableCount - 1) * MAX_SIZE) +  $puzzleCount;
}

function tableName($number, $append = "")
{
	$pad = str_pad($number, 3, "0", STR_PAD_LEFT);
	$puzzles = isset($_GET['tablex']) ? "puzzlex" : "puzzles";
	return "$puzzles$append$pad";
}

function percentage($count, $total, $precision, $pad = 3)
{
	$percent = number_format(100.0 * $count / $total, $precision, '.', "");
	$pad = str_pad($percent, $precision + $pad, "0", STR_PAD_LEFT);
	return "$pad%";
}

function getStat($title, $count, $total, $precision)
{
	$percent = percentage($count, $total, $precision);
	$number = number_format($count);
	return "$title: $percent $number";
}

function printStat($title, $count, $total, $precision)
{
	$stat = getStat($title, $count, $total, $precision);
	echo "$stat\n";
}

function queryStrategy($db, $table)
{
	$stmt = $db->prepare("SELECT COUNT(*) AS count, MAX(`count`) AS max FROM `" . $table . "`");
	$stmt->execute();
	$result = $stmt->fetch();
	return $result;
}

function tableGeneralStatement($tableCount, $tableName, $fields, $select, $logic, $order)
{
	$tableName_offline = "{$tableName}_offline";
	$tableName_tmp1 = "{$tableName}_tmp1";
	$tableName_tmp2 = "{$tableName}_tmp2";
	$sql = "";

	$sql .= "DROP TABLE IF EXISTS `$tableName_offline`;\n";
	$sql .= "CREATE TABLE `$tableName_offline` (\n";
	$sql .= "  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,\n";
	foreach ($fields as $field) $sql .= "  `$field` tinyint(2) unsigned NOT NULL,\n";
	$sql .= "  `puzzle_id` int(10) unsigned NOT NULL,\n";
	$sql .= "  `table_id` int(10) unsigned NOT NULL,\n";
	$sql .= "  PRIMARY KEY (`id`)\n";
	$sql .= ") ENGINE=InnoDB DEFAULT CHARSET=ascii;\n";

	if ($tableCount > 1) {
		$sql .= "DROP TEMPORARY TABLE IF EXISTS `$tableName_tmp1`;\n";
		$sql .= "CREATE TEMPORARY TABLE `$tableName_tmp1` (\n";
		foreach ($fields as $field) $sql .= "  `$field` tinyint(2) unsigned NOT NULL,\n";
		$sql .= "  `puzzle_id` int(10) unsigned NOT NULL,\n";
		$sql .= "  `table_id` int(10) unsigned NOT NULL\n";
		$sql .= ") ENGINE=InnoDB DEFAULT CHARSET=ascii;\n";
	}

	if ($tableCount > 2) {
		$sql .= "DROP TEMPORARY TABLE IF EXISTS `$tableName_tmp2`;\n";
		$sql .= "CREATE TEMPORARY TABLE `$tableName_tmp2` (\n";
		foreach ($fields as $field) $sql .= "  `$field` tinyint(2) unsigned NOT NULL,\n";
		$sql .= "  `puzzle_id` int(10) unsigned NOT NULL,\n";
		$sql .= "  `table_id` int(10) unsigned NOT NULL\n";
		$sql .= ") ENGINE=InnoDB DEFAULT CHARSET=ascii;\n";
	}

	$tableLead = $tableName_offline;
	for ($table_id = 1; $table_id <= $tableCount; $table_id++) {
		$tableSwap = $tableLead;
		if ($table_id == $tableCount) $tableLead = $tableName_offline;
		else $tableLead = ($table_id % 2 == 1) ? $tableName_tmp1 : $tableName_tmp2;

		if ($table_id > 2 && $table_id < $tableCount) $sql .= "TRUNCATE TABLE `$tableLead`;\n";

		$fieldList = implode("`, `", $fields);
		$sql .= "INSERT INTO `$tableLead` (`$fieldList`, `puzzle_id`, `table_id`)\n";

		$table = tableName($table_id);

		$selectLogic = "SELECT $select, `id` AS puzzle_id, '$table_id' AS table_id FROM `$table` WHERE $logic";
		if ($table_id > 1) {
			$sql .= "($selectLogic) \n";
			$sql .= "UNION ALL (SELECT `$fieldList`, `puzzle_id`, `table_id` FROM `$tableSwap`) \n";
		} else {
			$sql .= "$selectLogic \n";
		}
		$sql .= "ORDER BY {$order} LIMIT 1000000;\n";
	}

	$sql .= "DROP TABLE IF EXISTS `$tableName`;\n";
	$sql .= "RENAME TABLE $tableName_offline TO $tableName;\n";

	if ($tableCount > 1) $sql .= "DROP TEMPORARY TABLE `$tableName_tmp1`;\n";
	if ($tableCount > 2) $sql .= "DROP TEMPORARY TABLE `$tableName_tmp2`;\n";

	return $sql;
}
function tableStatement($tableCount, $select, $tableName, $logic, $min = false)
{

	$fields = ["count", "clueCount"];
	$select = "$select AS count, `clueCount`";
	$order = $min ? "count, clueCount DESC" : "count DESC";
	return tableGeneralStatement($tableCount, $tableName, $fields, $select, $logic, $order);
}
function tableStrategyLogic($tableCount, $solveType, $strategy, $tableName, $frequency = 1, $min = false)
{
	$logic = "`solveType`=$solveType";
	$logic .= tableLogic($strategy, $frequency);
	$sql = tableStatement($tableCount, $strategy, $tableName, $logic, $min);
	return "$sql\n";
}

function strategyLogic($strategy, $priority = "", $frequency = 1)
{
	if ($strategy == $priority) return " AND `$strategy`>=$frequency";
	return " AND `$strategy`=0";
}
function tableLogic($strategy = "", $frequency = 1)
{
	$logic = "";
	$logic .= strategyLogic("naked2", $strategy, $frequency);
	$logic .= strategyLogic("naked3", $strategy, $frequency);
	$logic .= strategyLogic("naked4", $strategy, $frequency);
	$logic .= strategyLogic("hidden1", $strategy, $frequency);
	$logic .= strategyLogic("hidden2", $strategy, $frequency);
	$logic .= strategyLogic("hidden3", $strategy, $frequency);
	$logic .= strategyLogic("hidden4", $strategy, $frequency);
	$logic .= strategyLogic("omissions", $strategy, $frequency);
	$logic .= strategyLogic("uniqueRectangle", $strategy, $frequency);
	$logic .= strategyLogic("yWing", $strategy, $frequency);
	$logic .= strategyLogic("xyzWing", $strategy, $frequency);
	$logic .= strategyLogic("xWing", $strategy, $frequency);
	$logic .= strategyLogic("swordfish", $strategy, $frequency);
	$logic .= strategyLogic("jellyfish", $strategy, $frequency);
	return $logic;
}

function superSort($a, $b)
{
	if ($a['superSize'] == $b['superSize']) {
		if ($a['superDepth'] == $b['superDepth']) return 0;
		return ($a['superDepth'] < $b['superDepth']) ? -1 : 1;
	}
	return ($a['superSize'] < $b['superSize']) ? -1 : 1;
}

try {
	$servername = "localhost";
	$username = "snovakow";
	$password = "kewbac-recge1-Fiwpux";
	$dbname = "sudoku";
	$db = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);

	$tableCount = 0;
	$puzzleCount = 0;
	$totalCount = 0;

	$tablex = isset($_GET['tablex']);
	$tables = $tablex ? "tablex" : "tables";

	$tableCount = (int)$_GET['table'];
	if (is_int($tableCount) && $tableCount >= 1 && $tableCount <= 1000) {
		$puzzleCount = MAX_SIZE;
		$totalCount = totalCount($tableCount, $puzzleCount);
	} else {
		$stmt = $db->prepare("SELECT `tableCount`, `puzzleCount` FROM `$tables`");
		$stmt->execute();
		$result = $stmt->fetch();
		$tableCount = (int)$result['tableCount'];
		$puzzleCount = (int)$result['puzzleCount'];
		$totalCount = totalCount($tableCount, $puzzleCount);
	}

	if ($mode === 0) {
		$tableNames = [];
		for ($i = 1; $i <= $tableCount; $i++) {
			$tableName = tableName($i);

			$rename = tableName($i, "_bu");

			$sql = "DROP TABLE IF EXISTS `$rename`;";
			echo "$sql\n";

			$sql = "RENAME TABLE $tableName TO $rename;";
			echo "$sql\n";

			$sql = "CREATE TABLE `$tableName` (
  `id` int(10) unsigned NOT NULL,
  `puzzleData` binary(32) NOT NULL DEFAULT '00000000000000000000000000000000',
  `clueCount` tinyint(2) unsigned NOT NULL DEFAULT '0',
  `solveType` tinyint(1) unsigned NOT NULL DEFAULT '0',
  `hiddenSimple` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `omissionSimple` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `naked2Simple` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `naked3Simple` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `nakedSimple` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `omissionVisible` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `naked2Visible` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `nakedVisible` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `naked2` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `naked3` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `naked4` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `hidden1` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `hidden2` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `hidden3` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `hidden4` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `omissions` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `uniqueRectangle` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `yWing` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `xyzWing` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `xWing` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `swordfish` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `jellyfish` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `superRank` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `superSize` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `superType` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `superDepth` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `superCount` tinyint(3) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=ascii COLLATE=ascii_bin;";
			echo "$sql\n";

			$sql = "INSERT INTO `$tableName` (`id`, `puzzleData`, `clueCount`) SELECT `id`, `puzzleData`, `clueCount` FROM `$rename`;";
			echo "$sql\n";
		}
	}

	if ($mode === 1) {
		$fields = ["count", "clueCount"];
		$select = "`hiddenSimple` AS count, `clueCount`";
		$logic = "`solveType`=0 AND `clueCount`>=28 AND `omissionSimple`=0 AND `naked2Simple`=0 AND `naked3Simple`=0 AND `nakedSimple`=0";
		echo tableGeneralStatement($tableCount, "simple_hidden", $fields, $select, $logic, "count DESC"), "\n";

		$select = "`omissionSimple` AS count, `clueCount`";
		$logic = "`solveType`=0 AND `omissionSimple`>=4 AND `naked2Simple`=0 AND `naked3Simple`=0 AND `nakedSimple`=0";
		echo tableGeneralStatement($tableCount, "simple_omission", $fields, $select, $logic, "count DESC"), "\n";

		$select = "`nakedSimple` AS count, `clueCount`";
		$logic = "`solveType`=0 AND `nakedSimple`>=8";
		echo tableGeneralStatement($tableCount, "simple_naked", $fields, $select, $logic, "count DESC"), "\n";

		$select = "`nakedVisible` AS count, `clueCount`";
		$logic = "`solveType`=1 AND `nakedVisible`>=4";
		echo tableGeneralStatement($tableCount, "candidate_visible", $fields, $select, $logic, "count DESC"), "\n";

		echo tableStrategyLogic($tableCount, 3, "naked2", "candidate_naked2", 4);
		echo tableStrategyLogic($tableCount, 3, "naked3", "candidate_naked3", 4);
		echo tableStrategyLogic($tableCount, 3, "naked4", "candidate_naked4", 3);
		echo tableStrategyLogic($tableCount, 3, "hidden1", "candidate_hidden1");
		echo tableStrategyLogic($tableCount, 3, "hidden2", "candidate_hidden2");
		echo tableStrategyLogic($tableCount, 3, "hidden3", "candidate_hidden3");
		echo tableStrategyLogic($tableCount, 3, "hidden4", "candidate_hidden4");
		echo tableStrategyLogic($tableCount, 3, "omissions", "candidate_omissions", 2);
		echo tableStrategyLogic($tableCount, 3, "uniqueRectangle", "candidate_uniqueRectangle", 2);
		echo tableStrategyLogic($tableCount, 3, "yWing", "candidate_yWing", 4);
		echo tableStrategyLogic($tableCount, 3, "xyzWing", "candidate_xyzWing", 2);
		echo tableStrategyLogic($tableCount, 3, "xWing", "candidate_xWing", 1);
		echo tableStrategyLogic($tableCount, 3, "swordfish", "candidate_swordfish");
		echo tableStrategyLogic($tableCount, 3, "jellyfish", "candidate_jellyfish");

		$fields = ["superSize", "superDepth", "superCount", "superRank", "superType"];
		$select = implode(", ", $fields);
		$logic = "`solveType`=4 AND `superSize`=2 AND `superDepth`<=2 AND ";
		$logic .= "`naked2`=0 AND `naked3`=0 AND `naked4`=0 AND `hidden1`=0 AND `hidden2`=0 AND `hidden3`=0 AND `hidden4`=0 AND ";
		$logic .= "`omissions`=0 AND `uniqueRectangle`=0 AND `yWing`=0 AND `xyzWing`=0 AND `xWing`=0 AND `swordfish`=0 AND `jellyfish`=0";
		$order = implode(", ", $fields);
		echo tableGeneralStatement($tableCount, "super_min", $fields, $select, $logic, $order), "\n";

		$fields = ["superSize", "superCount", "superDepth", "superRank", "superType"];
		$select = implode(", ", $fields);
		$logic = "`solveType`=4 AND `superSize`>=4";
		$order = implode(" DESC, ", $fields) . " DESC";
		echo tableGeneralStatement($tableCount, "super_max", $fields, $select, $logic, $order), "\n";
	}

	if ($mode === 2) {
		echo "--- Populated Tables ", number_format($totalCount), "\n\n";

		$len1 = 5;
		$len2 = 9;
		$len3 = 9;
		$tableName = "simple_hidden";
		echo "$tableName\n";
		printf("%-{$len1}s %{$len2}s %{$len3}s\n", "Clues", "Percent", "Count");
		printf("%'-{$len1}s %'-{$len2}s %'-{$len3}s\n", "", "", "");

		$sql = "SELECT COUNT(*) AS groupCount, `clueCount` AS count FROM `$tableName` GROUP BY `clueCount` ORDER BY 'clueCount DESC'";
		$stmt = $db->prepare($sql);
		$stmt->execute();
		$results = $stmt->fetchAll(\PDO::FETCH_ASSOC);
		$total = 0;
		foreach ($results as $result) $total += $result['groupCount'];
		foreach ($results as $result) {
			$groupCount = (int)$result['groupCount'];
			$count = (int)$result['count'];

			$percent = percentage($groupCount, $total, 4, 2);
			$format = number_format($groupCount);
			printf("%-{$len1}s %{$len2}s %{$len3}s\n", $count, $percent, $format);
		}
		echo "\n";

		$tableNames = [
			"simple_hidden",
			"simple_omission",
			"simple_naked",
			"candidate_visible",
			"candidate_naked2",
			"candidate_naked3",
			"candidate_naked4",
			"candidate_hidden1",
			"candidate_hidden2",
			"candidate_hidden3",
			"candidate_hidden4",
			"candidate_omissions",
			"candidate_uniqueRectangle",
			"candidate_yWing",
			"candidate_xyzWing",
			"candidate_xWing",
			"candidate_swordfish",
			"candidate_jellyfish",
			"super_min",
			"super_max",
		];

		$len1 = 25;
		$len2 = 8;
		$len3 = 3;
		$len4 = 3;
		$len5 = 9;
		printf("%-{$len1}s %{$len2}s %{$len3}s %{$len4}s %{$len5}s\n", "Table", "Percent", "Min", "Max", "Count");
		printf("%'-{$len1}s %'-{$len2}s %'-{$len3}s %'-{$len4}s %'-{$len5}s\n", "", "", "", "", "");
		foreach ($tableNames as $tableName) {
			$property = "count";
			if ($tableName == "super_min" || $tableName == "super_max") $property = "superCount";
			elseif (substr($tableName, -4) === "_min") $property = "clueCount";

			$sql = "SELECT COUNT(*) AS count, MIN(`$property`) AS min, MAX(`$property`) AS max FROM `$tableName`";

			$stmt = $db->prepare($sql);
			$stmt->execute();
			$result = $stmt->fetch();
			$count = $result['count'];

			printf(
				"%-{$len1}s %{$len2}s %{$len3}s %{$len4}s %{$len5}s\n",
				$tableName,
				percentage($count, 1000000, 3, 2),
				number_format($result['min']),
				number_format($result['max']),
				number_format($count)
			);
		}
		echo "\n";

		$sql = "SELECT ";
		$sql .= "MIN(`superSize`) AS superSizeMin, ";
		$sql .= "MIN(`superDepth`) AS superDepthMin, ";
		$sql .= "MIN(`superCount`) AS superCountMin, ";
		$sql .= "MIN(`superRank`) AS superRankMin, ";
		$sql .= "MIN(`superType`) AS superTypeMin, ";
		$sql .= "MAX(`superSize`) AS superSizeMax, ";
		$sql .= "MAX(`superDepth`) AS superDepthMax, ";
		$sql .= "MAX(`superCount`) AS superCountMax, ";
		$sql .= "MAX(`superRank`) AS superRankMax, ";
		$sql .= "MAX(`superType`) AS superTypeMax";

		$fields = ["superSize", "superDepth", "superCount", "superRank", "superType"];
		$tableName = "super_min";
		echo "$tableName\n";

		$stmt = $db->prepare("$sql FROM `$tableName`");
		$stmt->execute();
		$result = $stmt->fetch();

		echo "Size: {$result['superSizeMin']} - {$result['superSizeMax']}\n";
		$stmt = $db->prepare("SELECT `superDepth`, `superCount`, COUNT(*) AS count FROM `$tableName` GROUP BY `superDepth`, `superCount`");
		$stmt->execute();
		$group = $stmt->fetchAll(\PDO::FETCH_ASSOC);
		foreach ($group as $row) {
			$superDepth = $row['superDepth'];
			$superCount = $row['superCount'];
			$count = $row['count'];

			$percent = percentage($count, 1000000, 4);
			$number = number_format($count);
			echo "Depth $superDepth Count $superCount: $percent $number\n";
		}
		echo "Rank: {$result['superRankMin']} - {$result['superRankMax']}\n";
		echo "Type: {$result['superTypeMin']} - {$result['superTypeMax']}\n";
		echo "\n";

		$fields = ["superSize", "superDepth", "superCount", "superRank", "superType"];
		$tableName = "super_max";
		echo "$tableName\n";

		$stmt = $db->prepare("$sql FROM `$tableName`");
		$stmt->execute();
		$result = $stmt->fetch();

		$stmt = $db->prepare("SELECT `superSize`, COUNT(*) AS count FROM `$tableName` GROUP BY `superSize`");
		$stmt->execute();
		$group = $stmt->fetchAll(\PDO::FETCH_ASSOC);
		foreach ($group as $row) {
			$superSize = $row['superSize'];
			$count = $row['count'];

			$percent = percentage($count, 1000000, 4);
			$number = number_format($count);
			echo "Size $superSize: $percent $number\n";
		}
		// echo "Size: {$result['superSizeMin']} - {$result['superSizeMax']}\n";
		echo "Depth: {$result['superDepthMin']} - {$result['superDepthMax']}\n";
		echo "Count: {$result['superCountMin']} - {$result['superCountMax']}\n";
		echo "Rank: {$result['superRankMin']} - {$result['superRankMax']}\n";
		echo "Type: {$result['superTypeMin']} - {$result['superTypeMax']}\n";
	}

	if ($mode === 3 && !$tablex) {
		$counts = [];
		$total = 0;
		for ($i = 1; $i <= $tableCount; $i++) {
			$table = tableName($i);
			$sql = "SELECT `solveType`, COUNT(*) AS count FROM `$table` GROUP BY `solveType`";
			$stmt = $db->prepare($sql);
			$stmt->execute();
			$result = $stmt->fetchAll(\PDO::FETCH_ASSOC);
			foreach ($result as $key => $row) {
				$solveType = $row['solveType'];
				$count = $row['count'];
				$total += $count;
				if (array_key_exists($solveType, $counts)) $counts[$solveType] += $count;
				else $counts[$solveType] = $count;
			}
		}

		$simple = $counts[0];
		$candidateVisual = $counts[1];
		$candidate = $counts[2];
		$candidateMinimal = $counts[3];
		$unsolvable = $counts[4];

		$results = [
			'simple' => $simple,
			'candidateVisual' => $candidateVisual,
			'candidate' => $candidate,
			'candidateMinimal' => $candidateMinimal,
			'unsolvable' => $unsolvable,
			'totalCount' => $total
		];
		exit(json_encode($results));
	}

	if ($mode === 3 && $tablex) {
		$puzzles = [];
		for ($i = 1; $i <= $tableCount; $i++) {
			$table = tableName($i);
			$sql = "SELECT `solveType`, RIGHT(HEX(`puzzleData`), 42) AS puzzle, COUNT(*) AS count FROM `$table` GROUP BY puzzle, `solveType`";
			$stmt = $db->prepare($sql);
			$stmt->execute();
			$result = $stmt->fetchAll(\PDO::FETCH_ASSOC);

			$counts = [];
			foreach ($result as $key => $row) {
				$solveType = $row['solveType'];
				$puzzle = $row['puzzle'];
				$count = $row['count'];

				$counts = array_key_exists($puzzle, $puzzles) ? $puzzles[$puzzle] : [];

				if (!array_key_exists($solveType, $counts)) $counts[$solveType] = $count;
				else $counts[$solveType] += $count;

				$puzzles[$puzzle] = $counts;
			}
		}

		$results = [];
		foreach ($puzzles as $puzzle => $counts) {
			$simple = $counts[0];
			$candidateVisual = $counts[1];
			$candidate = $counts[2];
			$candidateMinimal = $counts[3];
			$unsolvable = $counts[4];

			$totalCount = 0;
			$totalCount += $simple;
			$totalCount += $candidateVisual;
			$totalCount += $candidate;
			$totalCount += $candidateMinimal;
			$totalCount += $unsolvable;

			$result = [
				'simple' => $simple,
				'candidateVisual' => $candidateVisual,
				'candidate' => $candidate,
				'candidateMinimal' => $candidateMinimal,
				'unsolvable' => $unsolvable,
				'totalCount' => $totalCount
			];
			$results[] = $result;
		}
		exit(json_encode($results));
	}

	if ($mode === 4) {
		$strategies = [
			"hiddenSimple",
			"omissionSimple",
			"naked2Simple",
			"naked3Simple",
			"nakedSimple",
			"omissionVisible",
			"naked2Visible",
			"nakedVisible",
		];

		$solveTypes = [];
		$solveTypes['hiddenSimple'] = 0;
		$solveTypes['omissionSimple'] = 0;
		$solveTypes['naked2Simple'] = 0;
		$solveTypes['naked3Simple'] = 0;
		$solveTypes['nakedSimple'] = 0;
		$solveTypes['omissionVisible'] = 1;
		$solveTypes['naked2Visible'] = 1;
		$solveTypes['nakedVisible'] = 1;

		if (!$tablex) {
			$values = [];
			foreach ($strategies as $strategy) $values[$strategy] = ['strategy' => 0, 'iso' => 0, 'isomax' => 0];

			for ($i = 1; $i <= $tableCount; $i++) {
				$table = tableName($i);

				$sqls = [];

				$strategyLogic = $strategies;
				foreach ($strategies as $strategy) {
					$sqls[] = "SUM(`$strategy`>0) AS $strategy";

					$solveType = $solveTypes[$strategy];
					$isoList = ["`solveType`=$solveType"];
					$maxList = ["(`solveType`=$solveType)"];

					$logic = array_shift($strategyLogic);
					$isoList[] = "`$logic`>0";
					$maxList[] = "`$logic`";
					foreach ($strategyLogic as $iso) {
						$isoList[] = "`$iso`=0";
						$maxList[] = "(`$iso`=0)";
					}
					$sql = implode(" AND ", $isoList);
					$sqls[] = "SUM($sql) AS {$strategy}Iso";
					$sql = implode(" * ", $maxList);
					$sqls[] = "MAX($sql) AS {$strategy}IsoMax";
				}

				$sql = implode(",", $sqls);

				$sql = "SELECT $sql FROM `$table` WHERE `solveType`<=1";

				$stmt = $db->prepare($sql);
				$stmt->execute();
				$result = $stmt->fetch(\PDO::FETCH_ASSOC);

				foreach ($strategies as $strategy) {
					$value = &$values[$strategy];
					$value['strategy'] += (int)$result[$strategy];
					$value['iso'] += (int)$result["{$strategy}Iso"];
					$value['isomax'] = max($value['isomax'], (int)$result["{$strategy}IsoMax"]);
				}
			}

			$results = [
				'values' => $values,
				'totalCount' => $totalCount
			];
			exit(json_encode($values));
		}
		if ($tablex) {
		}
	}

	if ($mode === 5) {
		$strategies = [
			"naked2",
			"naked3",
			"naked4",
			"hidden1",
			"hidden2",
			"hidden3",
			"hidden4",
			"omissions",
			"uniqueRectangle",
			"yWing",
			"xyzWing",
			"xWing",
			"swordfish",
			"jellyfish",
		];

		$results = [];
		$total = 0;

		for ($i = 1; $i <= $tableCount; $i++) {
			$table = tableName($i);

			$sql = "SELECT ";
			foreach ($strategies as $strategy) {
				$isolated = tableLogic($strategy);
				$sql .= "SUM(`{$strategy}`>0) AS {$strategy}, ";
				$sql .= "MAX(`{$strategy}`) AS {$strategy}Max, ";
				$sql .= "SUM(`{$strategy}`>0 AND `solveType`=3) AS {$strategy}Min, ";
				$sql .= "MAX(IF(`solveType`=3, `{$strategy}`, 0)) AS {$strategy}MinMax, ";
				$sql .= "SUM(`solveType`=3$isolated) as {$strategy}Iso, ";
				$sql .= "MAX(IF(`solveType`=3$isolated, `{$strategy}`, 0)) as {$strategy}IsoMax, ";
			}
			$sql .= "COUNT(*) AS count FROM `$table` WHERE `solveType`=2 OR `solveType`=3";

			$stmt = $db->prepare($sql);
			$stmt->execute();
			$result = $stmt->fetch(\PDO::FETCH_ASSOC);

			$results[] = $result;
			$total += (int)$result['count'];
		}

		$percent = percentage($total, $totalCount, 2);
		$number = number_format($total);
		echo "--- Strategies $percent $number\n\n";

		echo str_pad("Strategy", 17, " ", STR_PAD_BOTH);
		echo str_pad("Percent (Max) Count", 34, " ", STR_PAD_BOTH);
		echo str_pad("Minimal", 34, " ", STR_PAD_BOTH);
		echo str_pad("Isolated", 34, " ", STR_PAD_BOTH);
		echo "\n";
		echo str_pad(str_pad("", 16, "-", STR_PAD_BOTH), 17, " ");
		echo str_pad(str_pad("", 33, "-", STR_PAD_BOTH), 34, " ");
		echo str_pad(str_pad("", 33, "-", STR_PAD_BOTH), 34, " ");
		echo str_pad(str_pad("", 33, "-", STR_PAD_BOTH), 34, " ");
		echo "\n";

		$strategyNames = [
			"Naked2",
			"Naked3",
			"Naked4",
			"Hidden1",
			"Hidden2",
			"Hidden3",
			"Hidden4",
			"Omissions",
			"Unique Rectangle",
			"Y-Wing",
			"XYZ-Wing",
			"X-Wing",
			"Swordfish",
			"Jellyfish",
		];
		$strategyCount = count($strategyNames);
		for ($i = 0; $i < $strategyCount; $i++) {
			$title = $strategyNames[$i];
			$strategy = $strategies[$i];

			$strategyType = 0;
			$strategyType_Max = 0;
			$strategyType_Min = 0;
			$strategyType_MinMax = 0;
			$strategyType_Iso = 0;
			$strategyType_IsoMax = 0;

			foreach ($results as $result) {
				$strategyType += (int)$result[$strategy];
				$strategyType_Max = max($strategyType_Max, (int)$result["{$strategy}Max"]);
				$strategyType_Min += (int)$result["{$strategy}Min"];
				$strategyType_MinMax = max($strategyType_MinMax, (int)$result["{$strategy}MinMax"]);
				$strategyType_Iso += (int)$result["{$strategy}Iso"];
				$strategyType_IsoMax = max($strategyType_IsoMax, (int)$result["{$strategy}IsoMax"]);
			}

			$percent = percentage($strategyType, $total, 5);
			$max = number_format($strategyType_Max);
			$format = number_format($strategyType);

			$percentMin = percentage($strategyType_Min, $total, 5);
			$maxMin = number_format($strategyType_MinMax);
			$formatMin = number_format($strategyType_Min);

			$percentIso = percentage($strategyType_Iso, $total, 5);
			$maxIso = number_format($strategyType_IsoMax);
			$formatIso = number_format($strategyType_Iso);

			echo str_pad("{$title}", 17, " ");
			echo str_pad("$percent ($max) $format", 34, " ");
			echo str_pad("$percentMin ($maxMin) $formatMin", 34, " ");
			echo str_pad("$percentIso ($maxIso) $formatIso", 34, " ");
			echo "\n";
		}
	}

	if ($mode === 6) {
		$number = number_format($totalCount);
		echo "--- Superpositions $number\n\n";

		$len1 = 6;
		$len2 = 6;
		$len3 = 6;
		$len4 = 6;
		$len5 = 20;

		$rows = [];

		for ($i = 1; $i <= $tableCount; $i++) {
			$table = tableName($i);
			$sql = "";
			$sql .= "SELECT `superSize`, `superDepth`, `superCount`, COUNT(*) AS count ";
			$sql .= "FROM `$table` WHERE `solveType`=4 GROUP BY `superSize`, `superDepth`, `superCount`";
			$stmt = $db->prepare($sql);
			$stmt->execute();

			$result = $stmt->fetchAll(\PDO::FETCH_ASSOC);
			foreach ($result as $row) $rows[] = $row;
		}

		usort($rows, "superSort");

		$results = [];
		foreach ($rows as $row) {
			$superSize = $row['superSize'];
			$superDepth = $row['superDepth'];

			$title =  "";
			$title .=  str_pad("$superSize    ", $len1, " ", STR_PAD_LEFT);
			$title .=  str_pad("$superDepth    ", $len2, " ", STR_PAD_LEFT);

			$result = $results[$title] ?: [];
			$result[] = $row;
			$results[$title] = $result;
		}

		$titles = [];
		$total = 0;
		foreach ($results as $title => $value) {
			$started = false;
			$countTotal = 0;
			$max = 0;
			$min = 0;
			foreach ($value as $row) {
				$superCount = $row['superCount'];
				$count = $row['count'];

				$countTotal += $count;
				if ($started) {
					$max = max($max, $superCount);
					$min = min($min, $superCount);
				} else {
					$max = $superCount;
					$min = $superCount;
					$started = true;
				}
			}

			$total = max($total, $countTotal);

			$values = $titles[$title] ?: [];
			$values['count'] = $countTotal;
			$values['max'] = $max;
			$values['min'] = $min;
			$titles[$title] = $values;
		}

		echo str_pad("Size", $len1, " ", STR_PAD_BOTH);
		echo str_pad("Depth", $len2, " ", STR_PAD_BOTH);
		echo str_pad("Min", $len3, " ", STR_PAD_BOTH);
		echo str_pad("Max", $len4, " ", STR_PAD_BOTH);
		echo str_pad("Total", $len5, " ", STR_PAD_BOTH);
		echo "\n";
		echo str_pad(str_pad("", $len1 - 1, "-", STR_PAD_BOTH), $len1, " ");
		echo str_pad(str_pad("", $len2 - 1, "-", STR_PAD_BOTH), $len2, " ");
		echo str_pad(str_pad("", $len3 - 1, "-", STR_PAD_BOTH), $len3, " ");
		echo str_pad(str_pad("", $len4 - 1, "-", STR_PAD_BOTH), $len4, " ");
		echo str_pad(str_pad("", $len5 - 1, "-", STR_PAD_BOTH), $len5, " ");
		echo "\n";

		foreach ($titles as $title => $values) {
			$count = $values['count'];
			$max = $values['max'];
			$min = $values['min'];

			$title .=  str_pad("$min    ", $len3, " ", STR_PAD_LEFT);
			$title .=  str_pad("$max    ", $len4, " ", STR_PAD_LEFT);

			$percent = percentage($count, $total, 5);
			$format = number_format($count);

			echo $title;
			echo str_pad("$percent $format", $len5, " ", STR_PAD_RIGHT);
			echo "\n";
		}
	}

	if ($mode === 7) {
		$number = number_format($totalCount);
		echo "--- Clues $number\n\n";
		$counts = [];
		$countSimple = [];
		$countVisible = [];
		$countCandidate = [];
		$countUnsolvable = [];

		for ($i = 1; $i <= $tableCount; $i++) {
			$table = tableName($i);
			$sql = "SELECT `clueCount`, `solveType`, COUNT(*) AS count FROM `$table` GROUP BY `clueCount`, `solveType`";
			$stmt = $db->prepare($sql);
			$stmt->execute();
			$result = $stmt->fetchAll(\PDO::FETCH_ASSOC);
			foreach ($result as $key => $row) {
				$clueCount = $row['clueCount'];
				$solveType = (int)$row['solveType'];
				$count = (int)$row['count'];

				if (!$counts[$clueCount]) $counts[$clueCount] = 0;
				if (!$countSimple[$clueCount]) $countSimple[$clueCount] = 0;
				if (!$countVisible[$clueCount]) $countVisible[$clueCount] = 0;
				if (!$countCandidate[$clueCount]) $countCandidate[$clueCount] = 0;
				if (!$countUnsolvable[$clueCount]) $countUnsolvable[$clueCount] = 0;

				$counts[$clueCount] += $count;
				if ($solveType == 0) $countSimple[$clueCount] += $count;
				if ($solveType == 1) $countVisible[$clueCount] += $count;
				if ($solveType == 2) $countCandidate[$clueCount] += $count;
				if ($solveType == 3) $countCandidate[$clueCount] += $count;
				if ($solveType == 4) $countUnsolvable[$clueCount] += $count;
			}
		}

		foreach ($counts as $clueCount => $count) {
			printStat($clueCount, $count, $totalCount, 5);
		}
		echo "\n";

		$countsSimple = 0;
		$countsVisible = 0;
		$countsCandidate = 0;
		$countsUnsolvable = 0;
		foreach ($countSimple as $clueCount => $count) $countsSimple += $count;
		foreach ($countVisible as $clueCount => $count) $countsVisible += $count;
		foreach ($countCandidate as $clueCount => $count) $countsCandidate += $count;
		foreach ($countUnsolvable as $clueCount => $count) $countsUnsolvable += $count;

		printStat("Simple", $countsSimple, $totalCount, 2);
		foreach ($counts as $clueCount => $count) printStat($clueCount, $countSimple[$clueCount], $count, 2);
		echo "\n";

		printStat("Visible", $countsVisible, $totalCount, 2);
		foreach ($counts as $clueCount => $count) printStat($clueCount, $countVisible[$clueCount], $count, 2);
		echo "\n";

		printStat("Candidate", $countsCandidate, $totalCount, 2);
		foreach ($counts as $clueCount => $count) printStat($clueCount, $countCandidate[$clueCount], $count, 2);
		echo "\n";

		printStat("Unsolvable", $countsUnsolvable, $totalCount, 2);
		foreach ($counts as $clueCount => $count) printStat($clueCount, $countUnsolvable[$clueCount], $count, 2);
		echo "\n";
	}
} catch (PDOException $e) {
	// echo "Error: " . $e->getMessage();
}
