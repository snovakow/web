<?php
    // Author: Scott Novakowski
	$version=1;
	
	if(!isset($_POST['version'])) die();
	if($_POST['version']!=$version) die();

	$isWeb=true;
	$platform="Web";
	$platformID=3;
	$videoTitle = NULL;

	$vrArray=true;
	if(isset($_GET['platform'])) {
		die("Disabled");
		
		$platform=$_GET['platform'];
		if($platform!="Android" && $platform!="iOS") die();
		$isWeb=false;
		if($platform=="iOS") $platformID=1;
		else $platformID=2;
	} else {
		if(!isset($_POST['platform'])) die();
		$platform=$_POST['platform'];
		if($platform=="Web") {
			$platformID=3;
			$vrArray=false;
		} else if($platform=="Android") {
			$platformID=2;
		} else if($platform=="iOS") {
			$platformID=1;
		} else {
			die();			
		}

		if(!isset($_POST['client'])) die();
		$client=$_POST['client'];
		if($client=="ARTE") $clientID=2;
		else if($client=="LiquidCinema") $clientID=1;
		else die();
		
		if(!isset($_POST['device'])) die();
		if(!isset($_POST['app_version'])) die();
		if(!isset($_POST['os_version'])) die();
		if(!isset($_POST['time'])) die();
		if(!isset($_POST['hrot'])) die();
		if(!isset($_POST['vrot'])) die();
		if(!isset($_POST['count'])) die();
		if($vrArray) {
			if(!isset($_POST['vr'])) die();
		}

		if(!isset($_POST['video_path'])) die();
		if(!isset($_POST['video_file'])) die();
		if(isset($_POST['video_title'])) $videoTitle=$_POST['video_title'];
	}
	
	include 'db.php';
	
	$width=64.0;
	$height=32.0;
	$timeRate=4.0;

	$database = new LWMySQL();

	$test = ($clientID!=2);
	//$test = true;
	
	if($videoTitle===NULL) {
		$sqlVideo = "INSERT INTO `video`(`Path`, `File`, `Created`, `Updated`) 
					VALUES (:VideoPath, :VideoFile, FROM_UNIXTIME(:Date), FROM_UNIXTIME(:Date)) 
					ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id), `Updated` = FROM_UNIXTIME(:Date), `Count` = `Count` + 1";
		if($test)
		$sqlVideo = "INSERT INTO `video2`(`Path`, `File`, `Created`, `Updated`) 
					VALUES (:VideoPath, :VideoFile, FROM_UNIXTIME(:Date), FROM_UNIXTIME(:Date)) 
					ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id), `Updated` = FROM_UNIXTIME(:Date), `Count` = `Count` + 1";
		
		$stmtVideo = $database->db->prepare($sqlVideo);
		$stmtVideo->bindParam(':VideoPath', $videoPath, PDO::PARAM_STR);
		$stmtVideo->bindParam(':VideoFile', $videoFile, PDO::PARAM_STR);
		$stmtVideo->bindParam(':Date', $date, PDO::PARAM_STR);
	} else {
		$sqlVideo = "INSERT INTO `video`(`Path`, `File`, `Title`, `Created`, `Updated`) 
					VALUES (:VideoPath, :VideoFile, :VideoTitle, FROM_UNIXTIME(:Date), FROM_UNIXTIME(:Date)) 
					ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id), `Title` = :VideoTitle, `Updated` = FROM_UNIXTIME(:Date), `Count` = `Count` + 1";
		if($test)
		$sqlVideo = "INSERT INTO `video2`(`Path`, `File`, `Title`, `Created`, `Updated`) 
					VALUES (:VideoPath, :VideoFile, :VideoTitle, FROM_UNIXTIME(:Date), FROM_UNIXTIME(:Date)) 
					ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id), `Title` = :VideoTitle, `Updated` = FROM_UNIXTIME(:Date), `Count` = `Count` + 1";
		
		$stmtVideo = $database->db->prepare($sqlVideo);
		$stmtVideo->bindParam(':VideoPath', $videoPath, PDO::PARAM_STR);
		$stmtVideo->bindParam(':VideoFile', $videoFile, PDO::PARAM_STR);
		$stmtVideo->bindParam(':VideoTitle', $videoTitle, PDO::PARAM_STR);
		$stmtVideo->bindParam(':Date', $date, PDO::PARAM_STR);
	}
  
	$sql = 	"INSERT INTO `entry`(`videoID`, `clientID`, `platformID`, `Device`, `SoftwareVersion`, `AppVersion`, `mediumID`, `TimeInterval`, `Date`) 
			VALUES (:videoID, :clientID, :platformID, :Device, :SoftwareVersion, :AppVersion, :mediumID, :TimeInterval, FROM_UNIXTIME(:Date))";
	if($isWeb) {
		$sql = 	"INSERT INTO `entry`(`videoID`, `clientID`, `platformID`, `Device`, `SoftwareVersion`, `AppVersion`, `mediumID`, `TimeInterval`) 
				VALUES (:videoID, :clientID, :platformID, :Device, :SoftwareVersion, :AppVersion, :mediumID, :TimeInterval)";
		if($test)
		$sql = 	"INSERT INTO `entry2`(`videoID`, `clientID`, `platformID`, `Device`, `SoftwareVersion`, `AppVersion`, `mediumID`, `TimeInterval`) 
				VALUES (:videoID, :clientID, :platformID, :Device, :SoftwareVersion, :AppVersion, :mediumID, :TimeInterval)";
	}	

	$stmt = $database->db->prepare($sql);
	$stmt->bindParam(':videoID', $id, PDO::PARAM_STR);
	$stmt->bindParam(':clientID', $clientID, PDO::PARAM_INT);
	$stmt->bindParam(':platformID', $platformID, PDO::PARAM_INT);
	$stmt->bindParam(':Device', $device, PDO::PARAM_STR);
	$stmt->bindParam(':SoftwareVersion', $softwareVersion, PDO::PARAM_STR);
	$stmt->bindParam(':AppVersion', $appVersion, PDO::PARAM_STR);
	$stmt->bindParam(':mediumID', $mediumID, PDO::PARAM_INT);
	$stmt->bindParam(':TimeInterval', $timeInterval, PDO::PARAM_STR);
	if(!$isWeb) {
		$stmt->bindParam(':Date', $date, PDO::PARAM_STR);
	}
	
	$glEntry=false;
	if(isset($_POST['opengl_version'])&&isset($_POST['opengl_renderer'])&&isset($_POST['max_texture_size'])) {
		$glEntry=true;
		$sqlGL =	"INSERT INTO `entrygl`(`entryID`, `MaxTex`, `Version`, `Renderer`) 
					VALUES (:entryID, :MaxTex, :Version, :Renderer)";
		if($test)
		$sqlGL =	"INSERT INTO `entrygl2`(`entryID`, `MaxTex`, `Version`, `Renderer`) 
					VALUES (:entryID, :MaxTex, :Version, :Renderer)";
		$stmtGL = $database->db->prepare($sqlGL);
		$stmtGL->bindParam(':entryID', $entryID, PDO::PARAM_INT);
		$stmtGL->bindParam(':MaxTex', $_POST['max_texture_size'], PDO::PARAM_INT);
		$stmtGL->bindParam(':Version', $_POST['opengl_version'], PDO::PARAM_STR);
		$stmtGL->bindParam(':Renderer', $_POST['opengl_renderer'], PDO::PARAM_STR);
	}
	
	$sqlData =	"INSERT INTO `data`(`videoID`, `Time`, `HRot`, `VRot`, `platformID`, `VRMode`) 
				VALUES (:videoID, :time, :hRot, :vRot, :platformID, :vr) ON DUPLICATE KEY UPDATE `Count` = `Count` + 1";
	if($test)
	$sqlData =	"INSERT INTO `data2`(`videoID`, `Time`, `HRot`, `VRot`, `platformID`, `VRMode`) 
				VALUES (:videoID, :time, :hRot, :vRot, :platformID, :vr) ON DUPLICATE KEY UPDATE `Count` = `Count` + 1";

	$stmtData = $database->db->prepare($sqlData);
	$stmtData->bindParam(':videoID', $id, PDO::PARAM_INT);
	$stmtData->bindParam(':time', $time, PDO::PARAM_INT);
	$stmtData->bindParam(':hRot', $hRot, PDO::PARAM_INT);
	$stmtData->bindParam(':vRot', $vRot, PDO::PARAM_INT);
	$stmtData->bindParam(':platformID', $platformID, PDO::PARAM_INT);
	$stmtData->bindParam(':vr', $vr, PDO::PARAM_INT);

	$timeInterval=0.25;
	if($isWeb) {
		$times=explode(",", $_POST['time']);
		$length=count($times);	
		if($length==0) die();
		
		$hRots=explode(",", $_POST['hrot']);
		if($length!=count($hRots)) die();	
		
		$vRots=explode(",", $_POST['vrot']);
		if($length!=count($vRots)) die();	

		$counts=explode(",", $_POST['count']);
		if($length!=count($counts)) die();	

		if($vrArray) {
			$vrs=explode(",", $_POST['vr']);
			if($length!=count($vrs)) die();	
		}
		
		header("Access-Control-Allow-Origin: *");

		$device=$_POST['device'];
		$softwareVersion=$_POST['os_version'];
		$appVersion=$_POST['app_version'];
		$vr=0;
		$mediumID=2;

		$date=time();
		$videoPath=$_POST['video_path'];
		$videoFile=$_POST['video_file'];
		$stmtVideo->execute();
		$id = $database->db->lastInsertId();

		$stmt->execute();

		if($glEntry) {
			$entryID = $database->db->lastInsertId();
			$stmtGL->execute();
		}

		for($i=0; $i<$length; $i++) {
			$time=$times[$i];
			$hRot=$hRots[$i];
			$vRot=$vRots[$i];
			if($vrArray) {
				$vr=$vrs[$i];
			}
			$stmtData->execute();			
		}
	} else {
		die();
		set_time_limit(60*60*24);
		echo("Start<br>");
		
		//if($platform=="iOS") $files=glob('./data/2016_02/ios/*');
		//else $files=glob('./data/2016_02/android/*');
		if($platform=="iOS") $files=glob('../../heatmap/data/2016_03_11/ios/*');
		else $files=glob('../../heatmap/data/2016_03_11/android/*');		
		
		$processCount=0;
		
		foreach($files as $file) {
			$base=basename($file);

			$date=filemtime($file);

			$pos=strpos($base, "_2016");
			if($pos===false) $pos=strpos($base, "_2015");
			if($pos===false) $pos=strpos($base, "_%3F%3F%3F%3F");
			if($pos===false) $pos=strpos($base, "_????");
			if($pos===false) $pos=strpos($base, "_2000");
			if($pos===false) $pos=strpos($base, "_2014");
			if($pos===false) $pos=strpos($base, "_2559");
			if($pos===false) {
				echo 'date: '.$base.'<br>';
				continue;
			}
			$name=substr($base, 0, $pos);
			$name = str_replace("_", " ", $name);

			//if($name != "Stratos") continue;
			if($name != "Seppia") continue;

			$client="ARTE";
			$clientID=2;
			$pos=strpos($base, "_".$client."_");
			if($pos===false) { $client="LiquidCinema"; $clientID=1; $pos=strpos($base, "_".$client."_"); }
			if($pos===false) {
				echo 'client: '.$base.'<br>';
				continue;
			}
			
			$end=substr($base, $pos+2+strlen($client), -7);
			$pos=strrpos($end, "_");
			if($pos===false) {
				echo 'end: '.$base.'<br>';
				continue;
			}
			
			$medium = substr($end, $pos+1);
			if($medium=="local" || $medium=="stream") {
				$end=substr($end, 0, $pos);
				$pos=strrpos($end, "_");
			} else {
				$medium="";			
				continue;
			}
			if($medium=="local") $mediumID=1;
			if($medium=="stream") $mediumID=2;
			
			if($pos===false) {
				echo 'appVersion: '.$base.'<br>';
				continue;
			}
			$appVersion = substr($end, $pos+1);
			
			$end=substr($end, 0, $pos);

			if(strpos($end, "Apple")!==false) {
				$matches = array();
				if (preg_match('#(\d+.\d+)$#', $end, $matches)) {
					$softwareVersion = $matches[1];
					$end=substr($end, 0, -strlen($softwareVersion));
				} else {
					echo 'OS version: '.$base.'<br>';
					continue;
				}
			} else {
				$pos=strrpos($end, "_");
				$softwareVersion = substr($end, $pos+1);
				$end=substr($end, 0, $pos);			
			}
			
			$device = str_replace("_", " ", $end);
			
			$zh = gzopen($file, 'r') or die("can't open: $file");
			$first=true;
			$lines=array();
			while ($line = gzgets($zh,1024)) {
				if($first) {
					$first=false;
				} else {
					$components=explode(",", $line);
					if(count($components)==6) {
						$lines[]=$components;
					} else {
						echo "ERROR: ".$base.": ".$line.'<br>';
						$first=true;
						break;
					}
				}
				$line=null;
				unset($line);
			}
			gzclose($zh) or die("can't close: $file");
			
			if($first) continue;

			$len=count($lines);
			if($len==0) continue;

			$stmtVideo->execute();
			$id = $database->db->lastInsertId();
			
			$stmt->execute();
			
			for ($i = 0; $i < $len; $i++) {
				$components=$lines[$i];
				
				$frame=floatval($components[0]);
				$hRot=floatval($components[2]);
				$vRot=floatval($components[3]);

				if($frame<0) { continue; }
				if($hRot<-180.0) { echo("hRot ".$hRot.": ".$base."<br>"); continue; }
				if($hRot>180.0) { echo("hRot ".$hRot.": ".$base."<br>"); continue; }
				if($vRot<-180.0) { echo("vRot ".$vRot.": ".$base."<br>"); continue; }
				if($vRot>180.0) { echo("vRot ".$vRot.": ".$base."<br>"); continue; }
				if($vRot<-90.0) { $vRot=-180.0-$vRot; if($hRot<0.0) $hRot+=180.0; else $hRot-=180.0; }
				if($vRot>90.0) { $vRot=180.0-$vRot; if($hRot<0.0) $hRot+=180.0; else $hRot-=180.0; }
				$time=$frame/30.0;
				$time=floor($time*$timeRate);

				$hRot=floor((180.0-$hRot)*($width/360.0));
				if($hRot==$width) $hRot-=$width;
				$hRot=min($hRot, $width-1);
				$hRot=max($hRot, 0);
				$vRot=floor((90.0-$vRot)*($height/180.0));
				$vRot=min($vRot, $height-1);
				$vRot=max($vRot, 0);

				$vr=$components[1];
				$stmtData->execute($dataValues);
			}
			
			$processCount++;
		}
		echo("Done ".$processCount." processed.<br>");
	}	
?>