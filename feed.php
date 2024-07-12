<?php
	if(!isset($_GET['id'])) die();

	header("Access-Control-Allow-Origin: *");

	$filename = "cache/".$_GET['id'].".txt";
	$filepath = realpath("./".$filename);
    $time = time();
	if(file_exists($filepath)) {
		//$filetime=filemtime($filename);
		//$filesize=filesize($filename);
		//if(($time-$filetime)<60*60*24*3) {
			header('Content-Length: ' . filesize($filename));            
			readfile($filepath);
            exit;
		//}
	}

	include 'db.php';

	//ini_set('memory_limit', '2048M');
    
	$database = new LWMySQL();
	$database->db->setAttribute(PDO::MYSQL_ATTR_USE_BUFFERED_QUERY, false);

	$sql = 'SELECT Time, HRot, VRot, platformID, VRMode, Count FROM data WHERE videoID=:id LIMIT 3000000'; // 45 meg
    $stmt = $database->db->prepare($sql);
    $stmt->bindParam(':id', $_GET['id'], PDO::PARAM_INT);
    $stmt->execute();

	$filetmp = "cache/_tmp_".$_GET['id']."_".$time.".txt";

    function shutdown($path) {
        if(file_exists($path)) unlink($path);
    }
    register_shutdown_function('shutdown', realpath("./".$filetmp));

    $file = fopen($filetmp, "w");

    while($row = $stmt->fetch()) {
		$line=$row['Time']." ".$row['HRot']." ".$row['VRot']." ".$row['platformID']." ".$row['VRMode']." ".$row['Count']."/";
		echo ($line);	
		$row=null;
		unset($row);
		fwrite($file, $line);
		$line=null;
		unset($line);
	}

    fclose($file);
    rename($filetmp, $filename);
?>