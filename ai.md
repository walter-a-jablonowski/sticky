
Prompt version 1

introduced a handle for making connections in chat

--

I am making an app which is a whiteboard with limited diagramming features. The content of a file system folder is shown in widgets.

## Page layout

- Header
  - name of the current folder on the left
  - drop down right aligned which is used for adding widgets
    - entries
      - "new md" for making a new text widget
      - below that a list of all files from the file sytems folder which aren't currently on the board (files that were added when the app was closed)
    - when "new md" is clicked add a new widget on the board and save it to the file system
    - when one of the existing file is clicked, add it to the board as widget

- Content area (whiteboard)

## Processing on page load

When the page loads we first compare the content of .sys/free-view.json (structure see below) and the file system folder with PHP

- remove files that were deleted in file system from the json file
- and remember new files for the file system for displaying in the dropdown in page header

## Widget features

- Multiple widget types for displaying different file types
  - Text files (.txt, .md)
  - Images (.jpg, .png, .gif)
  - more file types may be added later
- Features of the different widget types
  - text widgets
    - file name as headline (editable)
    - drop down menu right of headline (in the upper right corner)
      - entry "delete" (for removing widget and deleting its file permanently)
      - below that list of bg colors
    - right of the menu: x button for remove a widget from the board (but don't delete its file in file system)
    - file content (editable), save when focus is lost
  - image widgets
    - file name as headline (editable)
    - drop down menu right of headline (in the upper right corner)
      - entry "delete" (for removing widget and deleting its file permanently)
      - below that list of bg colors
    - right of the menu: x button for remove a widget from the board (but don't delete its file in file system)
    - image (fills the widget content area)
- Widget manipulation
  - move widget
  - resize
  - change bg color by using widget's menu

## Limited diagramming features 

A line or an arrow can be drawn from one widget to a second one

- add
  - draw from center to center but line is visible only from the edges of widgets
  - choose an easy handling for adding line or arrow with mouse
- move line or arrow with the widgets it's conntected to
  - when a wdget is moved the lines or arrows connected with it move as well
- label
  - lines and arrows may have a label (optional) at their center
    - add edit or remove label
    - choose an easy handling for adding, editing or removing the label
- delete a line or arrow

## Misc

- Avoid svg and third party libraries for widgets and lines/arrows, instead use plain javascript html elements

## Data structure

Widget and line/arrow data is saved in a json file .sys/free-view.json

Structure similar to this:

```json
{
  "elements": 
  [
    {
      "id": "unique-id",
      "type": "text|image|future-type",
      "source": "file-path",
      "color": "#000000",
      "position": {"x": 0, "y": 0},
      "dimensions": {"width": 100, "height": 100}
    }
  ],
  "connections": 
  [
    {
      "id": "connection-id",
      "sourceId": "element-id-1",
      "targetId": "element-id-2",
      "isArrow": true|false,
      "label": "optional-label"
    }
  ]
}
```

Please include a folder /debug with a buch of demo files for trying the app
