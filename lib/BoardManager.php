<?php

require_once __DIR__ . '/Config.php';

class BoardManager 
{
  private $config;
  private $boardFile;
  private $basePath;
  private $defaultDimensions;
  
  public function __construct() 
  {
    $this->config    = Config::getInstance();
    $this->basePath  = $this->config->get('base_folder');
    $this->boardFile = $this->basePath . '/' . $this->config->get('board_file');
    $this->defaultDimensions = $this->config->get('default_widget');
    
    if( ! file_exists($this->basePath) )
      mkdir($this->basePath, 0777, true);
    
    $sysDir = dirname($this->boardFile);
    if( ! file_exists($sysDir) )
      mkdir($sysDir, 0777, true);
    
    if( ! file_exists($this->boardFile) )
      $this->initBoardFile();
  }

  private function initBoardFile() 
  {
    $data = [
      'elements' => [],
      'connections' => []
    ];
    file_put_contents($this->boardFile, json_encode($data, JSON_PRETTY_PRINT));
  }

  public function getBoardData() 
  {
    if( ! file_exists($this->boardFile) )
      $this->initBoardFile();
      
    $content = file_get_contents($this->boardFile);
    $data    = json_decode($content, true);
    
    if( ! is_array($data) || ! isset($data['elements']) || ! isset($data['connections'])) {
      $this->initBoardFile();
      $data = [
        'elements' => [],
        'connections' => []
      ];
    }
    
    // Remove elements whose files don't exist anymore
    $data['elements'] = array_filter($data['elements'] ?? [], function($element) {
      return file_exists($this->basePath . '/' . $element['source']);
    });
    
    // Clean up connections for removed elements
    $elementIds = array_column($data['elements'], 'id');
    $data['connections'] = array_filter($data['connections'] ?? [], function($connection) use ($elementIds) {
      return in_array($connection['sourceId'], $elementIds) && 
             in_array($connection['targetId'], $elementIds);
    });
    
    $this->saveBoardData($data);
    return $data;
  }

  public function getAvailableFiles($baseFolder, $boardData) 
  {
    $folderContent = array_filter( scandir($baseFolder), function($file) use ($baseFolder) {
      return ! in_array($file, ['.', '..', '.sys']) && is_file($baseFolder . '/' . $file);
    });
    
    $usedFiles = array_column($boardData['elements'], 'source');
    return array_values( array_diff($folderContent, $usedFiles));
  }

  public function saveBoardData($data) 
  {
    file_put_contents($this->boardFile, json_encode($data, JSON_PRETTY_PRINT));
  }

  public function addWidget($source, $type) 
  {
    $data = $this->getBoardData();
    
    $widget = [
      'id' => 'widget_' . uniqid(),
      'type' => $type,
      'source' => $source,
      'position' => [
        'x' => 20,
        'y' => 20
      ],
      'dimensions' => $this->defaultDimensions
    ];
    
    $data['elements'][] = $widget;
    $this->saveBoardData($data);
    
    return $widget;
  }

  public function updateWidget($id, $updates) 
  {
    $data = $this->getBoardData();
    
    foreach($data['elements'] as &$element)
      if($element['id'] === $id) {
        foreach($updates as $key => $value)
          $element[$key] = $value;
        break;
      }
    
    $this->saveBoardData($data);
  }

  public function deleteWidget($id) 
  {
    $data = $this->getBoardData();
    
    // Remove the widget
    $data['elements'] = array_filter($data['elements'], function($element) use ($id) {
      return $element['id'] !== $id;
    });
    
    // Remove associated connections
    $data['connections'] = array_filter($data['connections'] ?? [], function($connection) use ($id) {
      return $connection['sourceId'] !== $id && $connection['targetId'] !== $id;
    });
    
    $this->saveBoardData($data);
  }

  public function addConnection($sourceId, $targetId, $isArrow = false) 
  {
    $data = $this->getBoardData();
    
    $connection = [
      'id' => 'connection_' . uniqid(),
      'sourceId' => $sourceId,
      'targetId' => $targetId,
      'isArrow' => $isArrow
    ];
    
    $data['connections'][] = $connection;
    $this->saveBoardData($data);
    
    return $connection;
  }

  public function updateConnection($id, $updates) 
  {
    $data = $this->getBoardData();
    
    foreach($data['connections'] as &$connection)
      if($connection['id'] === $id) {
        foreach($updates as $key => $value)
          $connection[$key] = $value;
        break;
      }
    
    $this->saveBoardData($data);
  }
}
