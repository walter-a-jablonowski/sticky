<?php

use Symfony\Component\Yaml\Yaml;

class Config 
{
  private static $instance = null;
  private $config = null;
  
  private function __construct() 
  {
    $this->config = Yaml::parseFile(__DIR__ . '/../config.yml');
  }
  
  public static function getInstance() 
  {
    if( ! self::$instance) {
      self::$instance = new self();
    }
    return self::$instance;
  }
  
  public function get($key, $default = null) 
  {
    $keys = explode('.', $key);
    $value = $this->config;
    
    foreach($keys as $k) {
      if( ! isset($value[$k])) {
        return $default;
      }
      $value = $value[$k];
    }
    
    return $value;
  }
}
