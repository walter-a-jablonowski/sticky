<?php
require_once 'vendor/autoload.php';
require_once 'lib/BoardManager.php';
require_once 'lib/Config.php';

$config         = Config::getInstance();
$boardManager   = new BoardManager();
$folderContent  = $boardManager->getCurrentFolderContent();
$boardData      = $boardManager->getBoardData();
$availableFiles = $boardManager->getAvailableFiles($folderContent, $boardData);

?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Free View Board</title>
  <link rel="stylesheet" href="style.css?v=<?= time() ?>">
</head>
<body>
  <header>
    <div class="folder-name"><?= htmlspecialchars( basename($config->get('base_folder'))) ?></div>
    <div class="add-widget-dropdown">
      <button class="dropdown-btn">Add Widget</button>
      <div class="dropdown-content">
        <a href="#" data-action="new-md">New MD</a>
        <?php foreach($availableFiles as $file): ?>
          <a href="#" data-file="<?= htmlspecialchars($file) ?>"><?= htmlspecialchars( basename($file)) ?></a>
        <?php endforeach; ?>
      </div>
    </div>
  </header>

  <main id="whiteboard">
    <?php foreach($boardData['elements'] as $element): ?>
      <div class="widget" 
           id="<?= htmlspecialchars($element['id']) ?>"
           data-type="<?= htmlspecialchars($element['type']) ?>"
           data-source="<?= htmlspecialchars($element['source']) ?>"
           style="left: <?= $element['position']['x'] ?>px; 
                  top: <?= $element['position']['y'] ?>px;
                  width: <?= $element['dimensions']['width'] ?>px;
                  height: <?= $element['dimensions']['height'] ?>px;
                  background-color: <?= htmlspecialchars($element['color'] ?? '#f0f0f0') ?>;">
        <div class="widget-header">
          <div class="connection-handle"></div>
          <span class="widget-title" contenteditable="true"><?= htmlspecialchars( basename($element['source'])) ?></span>
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
          <?php if( $element['type'] === 'text'): ?>
            <div class="text-content" contenteditable="true">
              <pre><?= htmlspecialchars( file_get_contents($element['source'])) ?></pre>
            </div>
          <?php elseif( $element['type'] === 'image'): ?>
            <img src="<?= htmlspecialchars($element['source']) ?>" alt="Image">
          <?php endif; ?>
        </div>
      </div>
    <?php endforeach; ?>
  </main>

  <script src="controller.js?v=<?= time() ?>"></script>
</body>
</html>
