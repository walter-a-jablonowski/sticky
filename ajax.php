<?php

require_once 'vendor/autoload.php';
require_once 'lib/BoardManager.php';
require_once 'lib/Config.php';

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$boardManager = new BoardManager();
$config = Config::getInstance();

function determineFileType($filename) 
{
  global $config;
  $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
  
  $textTypes = $config->get('supported_files.text', ['txt', 'md']);
  $imageTypes = $config->get('supported_files.image', ['jpg', 'jpeg', 'png', 'gif']);
  
  if(in_array($extension, $textTypes)) {
    return 'text';
  }
  if(in_array($extension, $imageTypes)) {
    return 'image';
  }
  return null;
}

try {
  switch($input['action']) {
    case 'getBoardData':
      $data = $boardManager->getBoardData();
      echo json_encode(['success' => true, 'board' => $data]);
      break;
      
    case 'createWidget':
      $filename = '- new - ' . date('YmdHis') . '.md';
      file_put_contents($filename, $input['content']);
      $widget = $boardManager->addWidget($filename, 'text');
      echo json_encode(['success' => true, 'widget' => $widget]);
      break;
      
    case 'addWidget':
      $type = determineFileType($input['source']);
      if( ! $type) {
        throw new Exception("Unsupported file type");
      }
      $widget = $boardManager->addWidget($input['source'], $type);
      echo json_encode(['success' => true, 'widget' => $widget]);
      break;
      
    case 'updateWidget':
      $boardManager->updateWidget($input['id'], $input['updates']);
      echo json_encode(['success' => true]);
      break;
      
    case 'removeWidget':
      $boardManager->removeWidget($input['id']);
      echo json_encode(['success' => true]);
      break;
      
    case 'deleteWidget':
      $data = $boardManager->getBoardData();
      $widget = null;
      foreach($data['elements'] as $element) {
        if($element['id'] === $input['id']) {
          $widget = $element;
          break;
        }
      }
      
      if($widget && file_exists($widget['source'])) {
        unlink($widget['source']);
      }
      
      $boardManager->removeWidget($input['id']);
      echo json_encode(['success' => true]);
      break;
      
    case 'saveContent':
      $data = $boardManager->getBoardData();
      $widget = null;
      foreach($data['elements'] as $element) {
        if($element['id'] === $input['id']) {
          $widget = $element;
          break;
        }
      }
      
      if($widget && file_exists($widget['source'])) {
        file_put_contents($widget['source'], $input['content']);
        echo json_encode(['success' => true]);
      } else {
        throw new Exception("Widget or file missing");
      }
      break;

    case 'addConnection':
      $connection = $boardManager->addConnection(
        $input['sourceId'],
        $input['targetId'],
        $input['isArrow'] ?? false,
        $input['label'] ?? ''
      );
      echo json_encode(['success' => true, 'connection' => $connection]);
      break;

    case 'updateConnection':
      $boardManager->updateConnection($input['id'], $input['updates']);
      echo json_encode(['success' => true]);
      break;

    case 'removeConnection':
      $boardManager->removeConnection($input['id']);
      echo json_encode(['success' => true]);
      break;

    case 'getConnections':
      $data = $boardManager->getBoardData();
      echo json_encode(['success' => true, 'connections' => $data['connections']]);
      break;
      
    default:
      throw new Exception("Unknown action");
  }
}
catch(Exception $e) {
  http_response_code(400);
  echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
