<?php
    class MySQL
    {
        public $db;
        
        public $db_host;
        public $db_user;
        public $db_pwd;
        
        public $database;
        
        public $error;
        
        function __construct($db = "heatmaps", $connect = true) {
            $this->db_host="localhost";

            $this->db_user="api";
            $this->db_pwd="8xCwz5AB12N53peR";
            //$this->db_user="root";
            //$this->db_pwd="root";

            $this->database=$db;
            
            $this->error=NULL;
            
            if($connect) $this->db = new PDO(
				'mysql:host='.$this->db_host.';dbname='.$db.';', 
				$this->db_user, 
				$this->db_pwd, 
				array(PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES 'utf8'")
			);
        }
        function __destruct() {
            $this->db=NULL;
        }
        
        public function query($query) {
            if($this->db) {
                try {
                    $this->error=NULL;
                    if(strcasecmp(substr($query, 0, 7), "SELECT ")==0) $result = $this->db->query($query);
                    else $result = $this->db->exec($query);
                } catch(PDOException $ex) {
                    $this->error = $ex->getMessage();
                    $result=NULL;
                }
                return $result;
            }
        }
    }
?>