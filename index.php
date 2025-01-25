<?php
require_once 'vendor/autoload.php';
require_once 'lib/BoardManager.php';
require_once 'lib/Config.php';

$config = Config::getInstance();
$boardManager = new BoardManager();
$folderContent = $boardManager->getCurrentFolderContent();
$boardData = $boardManager->getBoardData();
$availableFiles = $boardManager->getAvailableFiles($folderContent, $boardData);
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Free View Board</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header>
    <div class="folder-name"><?php echo htmlspecialchars(basename($config->get('base_folder'))); ?></div>
    <div class="add-widget-dropdown">
      <button class="dropdown-btn">Add Widget</button>
      <div class="dropdown-content">
        <a href="#" data-action="new-md">New MD</a>
        <?php foreach($availableFiles as $file): ?>
          <a href="#" data-file="<?php echo htmlspecialchars($file); ?>"><?php echo htmlspecialchars(basename($file)); ?></a>
        <?php endforeach; ?>
      </div>
    </div>
  </header>

  <main id="whiteboard">
    <?php foreach($boardData['elements'] as $element): ?>
      <div class="widget" 
           id="<?php echo htmlspecialchars($element['id']); ?>"
           data-type="<?php echo htmlspecialchars($element['type']); ?>"
           data-source="<?php echo htmlspecialchars($element['source']); ?>"
           style="left: <?php echo $element['position']['x']; ?>px; 
                  top: <?php echo $element['position']['y']; ?>px;
                  width: <?php echo $element['dimensions']['width']; ?>px;
                  height: <?php echo $element['dimensions']['height']; ?>px;
                  background-color: <?php echo htmlspecialchars($element['color'] ?? '#f0f0f0'); ?>;">
        <div class="widget-header">
          <div class="connection-handle"></div>
          <span class="widget-title" contenteditable="true"><?php echo htmlspecialchars(basename($element['source'])); ?></span>
          <div class="widget-controls">
            <div class="dropdown">
              <button class="dropdown-btn">⋮</button>
              <div class="dropdown-content">
                <a href="#" data-action="delete">Delete</a>
                <div class="color-options">
                  <a href="#" data-color="#f0f0f0">Default</a>
                  <a href="#" data-color="#ffecec">Light Red</a>
                  <a href="#" data-color="#ecffec">Light Green</a>
                  <a href="#" data-color="#ececff">Light Blue</a>
                </div>
              </div>
            </div>
            <button class="close-btn">×</button>
          </div>
        </div>
        <div class="widget-content">
          <?php if($element['type'] === 'text'): ?>
            <div class="text-content" contenteditable="true">
              <?php echo htmlspecialchars(file_get_contents($element['source'])); ?>
            </div>
          <?php elseif($element['type'] === 'image'): ?>
            <img src="<?php echo htmlspecialchars($element['source']); ?>" alt="Widget Image">
          <?php endif; ?>
        </div>
      </div>
    <?php endforeach; ?>
  </main>

  <script src="controller.js"></script>
</body>
</html>
