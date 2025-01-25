class Board {
  constructor() {
    this.whiteboard = document.getElementById('whiteboard')
    this.widgets = new Map()
    this.connections = new Map()
    this.draggedWidget = null
    this.dragOffset = { x: 0, y: 0 }
    this.drawingConnection = null
    this.connectionStart = null
    this.tempLine = null
    
    this.initializeWidgets()
    this.initializeEventListeners()
  }

  initializeWidgets() {
    document.querySelectorAll('.widget').forEach(widget => {
      this.widgets.set(widget.id, widget)
      this.initializeWidget(widget)
    })
    
    // Initialize connections after all widgets are set up
    fetch('ajax.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'getBoardData'
      })
    })
    .then(response => response.json())
    .then(data => {
      if(data.success && data.board && data.board.connections) {
        console.log('Loading connections:', data.board.connections)
        data.board.connections.forEach(connection => {
          this.addConnectionToDOM(connection)
        })
      }
    })
    .catch(error => console.error('Error loading connections:', error))
  }

  initializeWidget(widget) {
    // Make widget draggable
    const header = widget.querySelector('.widget-header')
    header.addEventListener('mousedown', e => {
      if(e.target.closest('.connection-handle')) return
      if(e.button === 0) // Left click only
        this.startDragging(e, widget)
    })
    
    // Connection handle
    const handle = widget.querySelector('.connection-handle')
    handle.addEventListener('mousedown', e => {
      e.preventDefault()
      if(this.connectionStart === widget)
        this.cancelConnection()
      else if( ! this.connectionStart)
        this.startConnection(widget)
    })
    
    // Widget controls
    const controls = widget.querySelector('.widget-controls')
    controls.querySelector('.close-btn').addEventListener('click', () => this.removeWidget(widget))
    
    // Color options
    controls.querySelectorAll('[data-color]').forEach(option => {
      option.addEventListener('click', e => {
        e.preventDefault()
        widget.style.backgroundColor = option.dataset.color
        this.updateWidgetData(widget.id, { color: option.dataset.color })
      })
    })

    // Delete option
    controls.querySelector('[data-action="delete"]').addEventListener('click', e => {
      e.preventDefault()
      this.deleteWidget(widget)
    })

    // Title editing
    const title = widget.querySelector('.widget-title')
    title.addEventListener('blur', () => {
      const newSource = title.textContent
      this.updateWidgetData(widget.id, { source: newSource })
    })

    // Content editing for text widgets
    const content = widget.querySelector('.text-content')
    if(content) {
      content.addEventListener('blur', () => {
        this.saveWidgetContent(widget.id, content.textContent)
      })
    }

    // Handle widget resize
    widget.addEventListener('mouseup', () => {
      const rect = widget.getBoundingClientRect()
      this.updateWidgetData(widget.id, {
        dimensions: {
          width: rect.width,
          height: rect.height
        }
      })
      this.updateConnections(widget)
    })
  }

  initializeEventListeners() {
    document.addEventListener('mousemove', e => {
      this.handleDrag(e)
    })
    
    document.addEventListener('mouseup', e => {
      this.stopDragging()
    })
    
    // Add widget dropdown
    const dropdown = document.querySelector('.add-widget-dropdown')
    if(dropdown) {
      // New MD file
      const newMdBtn = dropdown.querySelector('[data-action="new-md"]')
      if(newMdBtn) {
        newMdBtn.addEventListener('click', e => {
          e.preventDefault()
          console.log('Creating new MD widget')
          this.createNewMdWidget()
        })
      }
      
      // Existing files
      const fileLinks = dropdown.querySelectorAll('[data-file]')
      console.log('Found file links:', fileLinks.length)
      fileLinks.forEach(link => {
        link.addEventListener('click', e => {
          e.preventDefault()
          const file = link.dataset.file
          console.log('Adding existing file:', file)
          this.addExistingFile(file)
        })
      })
    }

    // File selection event listeners
    const fileInput = document.querySelector('#file-input')
    if(fileInput) {
      fileInput.addEventListener('change', e => {
        const files = e.target.files
        if(files.length > 0) {
          this.addExistingFile(files[0])
        }
      })
    }

    // Handle right-click on whiteboard to cancel connection
    this.whiteboard.addEventListener('contextmenu', e => {
      if(this.connectionStart) {
        e.preventDefault()
        this.cancelConnection()
      }
    })
  }

  startDragging(e, widget) {
    if(e.target.closest('.widget-controls')) return
    
    this.draggedWidget = widget
    const rect = widget.getBoundingClientRect()
    this.dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
    widget.style.zIndex = 1000
  }

  handleDrag(e) {
    if( ! this.draggedWidget) return
    
    const x = e.clientX - this.dragOffset.x
    const y = e.clientY - this.dragOffset.y
    
    this.draggedWidget.style.left = `${x}px`
    this.draggedWidget.style.top = `${y}px`
    
    this.updateConnections(this.draggedWidget)
  }

  stopDragging() {
    if( ! this.draggedWidget) return
    
    const position = {
      x: parseInt(this.draggedWidget.style.left),
      y: parseInt(this.draggedWidget.style.top)
    }
    
    this.updateWidgetData(this.draggedWidget.id, { position })
    this.draggedWidget.style.zIndex = ''
    this.draggedWidget = null
  }

  startConnection(widget) {
    this.connectionStart = widget
    const handle = widget.querySelector('.connection-handle')
    handle.classList.add('active')
    
    const startPoint = this.getWidgetCenter(widget)
    
    this.tempLine = document.createElement('div')
    this.tempLine.className = 'connection temp-connection'
    this.whiteboard.appendChild(this.tempLine)
    
    this.updateTempLine(startPoint, startPoint)
    
    // Add mousemove event listener to track connection drawing
    this.drawingConnection = true
    document.addEventListener('mousemove', this.handleConnectionDraw.bind(this))
    document.addEventListener('mouseup', this.handleConnectionEnd.bind(this))
  }

  handleConnectionDraw(e) {
    if( ! this.drawingConnection) return
    
    const startPoint = this.getWidgetCenter(this.connectionStart)
    const endPoint = {
      x: e.clientX + this.whiteboard.scrollLeft,
      y: e.clientY + this.whiteboard.scrollTop
    }
    
    this.updateTempLine(startPoint, endPoint)
  }

  handleConnectionEnd(e) {
    if( ! this.drawingConnection) return
    
    const targetWidget = this.findTargetWidget(e)
    if(targetWidget && targetWidget !== this.connectionStart) {
      this.createConnection(this.connectionStart, targetWidget)
    }
    
    // Clean up event listeners
    document.removeEventListener('mousemove', this.handleConnectionDraw.bind(this))
    document.removeEventListener('mouseup', this.handleConnectionEnd.bind(this))
    this.drawingConnection = false
    this.cancelConnection()
  }

  cancelConnection() {
    if(this.connectionStart) {
      const handle = this.connectionStart.querySelector('.connection-handle')
      handle.classList.remove('active')
    }
    
    if(this.tempLine) {
      this.tempLine.remove()
      this.tempLine = null
    }
    
    // Clean up event listeners
    if(this.drawingConnection) {
      document.removeEventListener('mousemove', this.handleConnectionDraw.bind(this))
      document.removeEventListener('mouseup', this.handleConnectionEnd.bind(this))
      this.drawingConnection = false
    }
    
    this.connectionStart = null
  }

  async createConnection(sourceWidget, targetWidget) {
    const response = await fetch('ajax.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'addConnection',
        sourceId: sourceWidget.id,
        targetId: targetWidget.id,
        isArrow: true
      })
    })
    
    const data = await response.json()
    if(data.success) {
      this.addConnectionToDOM(data.connection)
    }
  }

  addConnectionToDOM(connection) {
    console.log('Adding connection to DOM:', connection)
    const sourceWidget = this.widgets.get(connection.sourceId)
    const targetWidget = this.widgets.get(connection.targetId)
    
    if( ! sourceWidget || ! targetWidget) {
      console.error('Source or target widget missing:', connection)
      return
    }
    
    const line = document.createElement('div')
    line.id = connection.id
    line.className = `connection ${connection.isArrow ? 'arrow' : ''}`
    this.whiteboard.appendChild(line)
    
    if(connection.label) {
      const label = document.createElement('div')
      label.className = 'connection-label'
      label.textContent = connection.label
      label.contentEditable = true
      label.addEventListener('blur', () => {
        this.updateConnection(connection.id, { label: label.textContent })
      })
      this.whiteboard.appendChild(label)
    }
    
    this.connections.set(connection.id, {
      element: line,
      label: connection.label ? label : null,
      sourceId: connection.sourceId,
      targetId: connection.targetId
    })
    
    // Update position after adding to DOM
    requestAnimationFrame(() => {
      this.updateConnectionPosition(connection.id)
    })
  }

  updateConnections(widget) {
    this.connections.forEach((conn, id) => {
      if(conn.sourceId === widget.id || conn.targetId === widget.id) {
        this.updateConnectionPosition(id)
      }
    })
  }

  updateConnectionPosition(connectionId) {
    const conn = this.connections.get(connectionId)
    if( ! conn) {
      console.error('Connection missing:', connectionId)
      return
    }
    
    const sourceWidget = this.widgets.get(conn.sourceId)
    const targetWidget = this.widgets.get(conn.targetId)
    
    if( ! sourceWidget || ! targetWidget) {
      console.error('Source or target widget missing for connection:', connectionId)
      return
    }
    
    const start = this.getWidgetCenter(sourceWidget)
    const end = this.getWidgetCenter(targetWidget)
    
    this.updateLine(conn.element, start, end, targetWidget)
    
    if(conn.label) {
      const midPoint = {
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2
      }
      conn.label.style.left = `${midPoint.x}px`
      conn.label.style.top = `${midPoint.y}px`
    }
  }

  updateLine(line, start, end, widget) {
    const widgetRect = widget.getBoundingClientRect();
    const widgetCenterX = widgetRect.left + widgetRect.width / 2;
    const widgetCenterY = widgetRect.top + widgetRect.height / 2;

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const scale = Math.min(
      Math.abs((widgetRect.width / 2) / dx),
      Math.abs((widgetRect.height / 2) / dy)
    );
    const offset = 5; // TASK: hardcoded offset arrow slightly hidden (AI unable to fix this 2501)
    const intersectionX = widgetCenterX - dx * scale - offset;
    const intersectionY = widgetCenterY - dy * scale - offset;

    const newLength = Math.sqrt(Math.pow(intersectionX - start.x, 2) + Math.pow(intersectionY - start.y, 2));
    const angle = Math.atan2(intersectionY - start.y, intersectionX - start.x) * 180 / Math.PI;

    line.style.width = `${newLength}px`
    line.style.left = `${start.x}px`
    line.style.top = `${start.y}px`
    line.style.transform = `rotate(${angle}deg)`
  }

  updateTempLine(start, end) {
    if( ! this.tempLine) return
    
    const dx = end.x - start.x
    const dy = end.y - start.y
    const length = Math.sqrt(dx * dx + dy * dy)
    const angle = Math.atan2(dy, dx) * 180 / Math.PI
    
    this.tempLine.style.width = `${length}px`
    this.tempLine.style.left = `${start.x}px`
    this.tempLine.style.top = `${start.y}px`
    this.tempLine.style.transform = `rotate(${angle}deg)`
  }

  getWidgetCenter(widget) {
    const rect = widget.getBoundingClientRect()
    const scrollLeft = this.whiteboard.scrollLeft
    const scrollTop = this.whiteboard.scrollTop
    
    // TASK: quick and dirty fix for y shift of lines (AI unable to fix this 2501)
    // Subtract a percentage of the widget's height from the y-coordinate
    const yOffset = rect.height * 0.1  // adjust this percentage as needed
    
    return {
      x: rect.left + rect.width / 2 + scrollLeft,
      y: rect.top + rect.height / 2 - yOffset + scrollTop
    }
  }

  findTargetWidget(e) {
    const elements = document.elementsFromPoint(e.clientX, e.clientY)
    for(const element of elements) {
      const widget = element.closest('.widget')
      if(widget && widget !== this.connectionStart)
        return widget
    }
    return null
  }

  async createNewMdWidget() {
    const response = await fetch('ajax.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'createWidget',
        type: 'text',
        content: ''
      })
    })
    
    const data = await response.json()
    if(data.success) {
      location.reload()
    }
  }

  async addExistingFile(file) {
    console.log('Adding file:', file)
    try {
      const response = await fetch('ajax.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'addWidget',
          source: file
        })
      })
      
      const data = await response.json()
      console.log('Server response:', data)
      
      if(data.success) {
        location.reload()
      } else {
        console.error('Failed to add widget:', data.error || 'Unknown error')
      }
    } catch(error) {
      console.error('Error adding widget:', error)
    }
  }

  async removeWidget(widget) {
    const response = await fetch('ajax.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'removeWidget',
        id: widget.id
      })
    })
    
    const data = await response.json()
    if(data.success) {
      // Remove associated connections
      this.connections.forEach((conn, id) => {
        if(conn.sourceId === widget.id || conn.targetId === widget.id) {
          conn.element.remove()
          if(conn.label) conn.label.remove()
          this.connections.delete(id)
        }
      })
      widget.remove()
    }
  }

  async deleteWidget(widget) {
    const response = await fetch('ajax.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'deleteWidget',
        id: widget.id
      })
    })
    
    const data = await response.json()
    if(data.success) {
      // Remove associated connections
      this.connections.forEach((conn, id) => {
        if(conn.sourceId === widget.id || conn.targetId === widget.id) {
          conn.element.remove()
          if(conn.label) conn.label.remove()
          this.connections.delete(id)
        }
      })
      widget.remove()
    }
  }

  async updateWidgetData(id, updates) {
    await fetch('ajax.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'updateWidget',
        id: id,
        updates: updates
      })
    })
  }

  async saveWidgetContent(id, content) {
    await fetch('ajax.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'saveContent',
        id: id,
        content: content
      })
    })
  }

  async updateConnection(id, updates) {
    await fetch('ajax.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'updateConnection',
        id: id,
        updates: updates
      })
    })
  }

}

// Initialize the board when the page loads
document.addEventListener('DOMContentLoaded', () => {
  window.board = new Board()
})
