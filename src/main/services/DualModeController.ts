import { BrowserWindow, screen, ipcMain, globalShortcut } from 'electron';
import { SidecarConfig } from '../../config/sidecar.config';

export type ViewMode = 'compact' | 'hub' | 'hidden' | 'phivision';

export class DualModeController {
  private mainWindow: BrowserWindow;
  private currentMode: ViewMode = 'compact';

  constructor(window: BrowserWindow) {
    this.mainWindow = window;
    this.init();
  }

  private init() {
    this.setupListeners();
    this.registerShortcuts();
    this.setupDisplayChangeListener();
    this.setCompactMode(); // Default start
  }

  private setupDisplayChangeListener() {
    // Reposition when display metrics change (resolution, DPI, monitor added/removed)
    screen.on('display-metrics-changed', () => {
      if (this.currentMode === 'compact') {
        this.setCompactMode();
      } else if (this.currentMode === 'phivision') {
        this.setPhiVisionMode();
      } else if (this.currentMode === 'hub') {
        this.setHubMode();
      }
    });

    // Also handle display added/removed
    screen.on('display-added', () => {
      if (this.currentMode === 'compact') {
        this.setCompactMode();
      }
    });

    screen.on('display-removed', () => {
      if (this.currentMode === 'compact') {
        this.setCompactMode();
      }
    });
  }

  private registerShortcuts() {
    // Register Global Shortcut for PhiVision (requested by user)
    // Mac: Cmd+Shift+P, Windows: Ctrl+Shift+P
    const ret = globalShortcut.register('CommandOrControl+Shift+P', () => {
      console.log('PhiVision Shortcut Triggered');

      // 1. Ensure we are in PhiVision Mode (Fullscreen, Top)
      if (this.currentMode !== 'phivision') {
        this.switchMode('phivision');
      }

      // 2. Trigger the analysis logic in the Renderer
      // This allows the Renderer to handle the lifecycle (spinner, calling capture, showing results)
      this.mainWindow.webContents.send('axora:trigger-phivision');
    });

    if (!ret) {
      console.error('PhiVision global shortcut registration failed');
    }
  }

  private setupListeners() {
    ipcMain.handle('axora:set-mode', (_, mode: ViewMode) => {
      this.switchMode(mode);
    });

    ipcMain.handle('axora:get-mode', () => {
      return this.currentMode;
    });

    // Handle mouse interactivity toggling
    ipcMain.handle('axora:set-ignore-mouse', (_, ignore: boolean) => {
      // In phivision mode, we might want fine-grained control, but generally 
      // the renderer will tell us when the mouse is over an interactive element
      if (this.currentMode === 'compact' || this.currentMode === 'phivision') {
        // forward: true lets the hover events pass through to the webview even if ignored
        this.mainWindow.setIgnoreMouseEvents(ignore, { forward: true });
      }
    });
  }

  public switchMode(mode: ViewMode) {
    this.currentMode = mode;
    // Notify Renderer
    this.mainWindow.webContents.send('axora:mode-changed', mode);

    switch (mode) {
      case 'compact':
        this.setCompactMode();
        break;
      case 'hub':
        this.setHubMode();
        break;
      case 'phivision':
        this.setPhiVisionMode();
        break;
      case 'hidden':
        this.mainWindow.hide();
        break;
    }
  }

  private setCompactMode() {
    const display = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = display.workAreaSize;
    const { x: workAreaX, y: workAreaY } = display.workArea;

    // Use configured window dimensions, but ensure they fit the screen
    const SIDEBAR_WIDTH = Math.min(SidecarConfig.window.width, screenWidth);
    const SIDEBAR_HEIGHT = Math.min(SidecarConfig.window.height, screenHeight);

    this.mainWindow.setSize(SIDEBAR_WIDTH, SIDEBAR_HEIGHT);

    // Position based on configuration
    let yPos;
    const { yAxisAlign, xAxisAlign, margins } = SidecarConfig.position;

    if (yAxisAlign === 'top') {
      yPos = margins.top || 0;
    } else if (yAxisAlign === 'bottom') {
      yPos = screenHeight - SIDEBAR_HEIGHT - (margins.bottom || 0);
    } else if (yAxisAlign === 'upper-quarter') {
      // Position centrée autour du premier quart (25% du haut)
      yPos = Math.floor((screenHeight * 0.25) - (SIDEBAR_HEIGHT / 2));
    } else {
      // Default: center
      yPos = Math.floor((screenHeight - SIDEBAR_HEIGHT) / 2);
    }

    // Horizontal position based on xAxisAlign
    let xPos;
    if (xAxisAlign === 'left') {
      xPos = margins.left || 0;
    } else {
      // Default: right side
      xPos = screenWidth - SIDEBAR_WIDTH - (margins.right || 0);
    }

    // Clamp positions to ensure sidecar stays within screen bounds
    xPos = Math.max(0, Math.min(xPos, screenWidth - SIDEBAR_WIDTH));
    yPos = Math.max(0, Math.min(yPos, screenHeight - SIDEBAR_HEIGHT));

    const finalX = workAreaX + xPos;
    const finalY = workAreaY + yPos;

    // Add workArea offset (accounts for taskbar position)
    this.mainWindow.setPosition(finalX, finalY);

    this.mainWindow.setAlwaysOnTop(true, 'floating');
    this.mainWindow.setOpacity(1.0);

    // Ensure mouse events are enabled (might have been disabled in phivision mode)
    this.mainWindow.setIgnoreMouseEvents(false);

    this.mainWindow.show();
  }

  private setHubMode() {
    const display = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = display.workAreaSize;
    const { x: workAreaX, y: workAreaY } = display.workArea;

    // Hub: Central overlay, 80% width/height
    const HUB_WIDTH = Math.floor(screenWidth * 0.8);
    const HUB_HEIGHT = Math.floor(screenHeight * 0.8);
    const x = Math.floor((screenWidth - HUB_WIDTH) / 2);
    const y = Math.floor((screenHeight - HUB_HEIGHT) / 2);

    // Disable ignoring mouse events for Hub
    this.mainWindow.setIgnoreMouseEvents(false);

    // First set size, then position (order matters for proper window placement)
    this.mainWindow.setSize(HUB_WIDTH, HUB_HEIGHT);
    this.mainWindow.setPosition(workAreaX + x, workAreaY + y);
    this.mainWindow.setAlwaysOnTop(true, 'modal-panel');
    this.mainWindow.show();
    this.mainWindow.focus();
  }

  private setPhiVisionMode() {
    const display = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = display.workAreaSize;
    const { x: workAreaX, y: workAreaY } = display.workArea;

    // Fullscreen Overlay
    this.mainWindow.setSize(screenWidth, screenHeight);
    this.mainWindow.setPosition(workAreaX, workAreaY);

    // Transparent & Top
    this.mainWindow.setAlwaysOnTop(true, 'screen-saver'); // Higher than floating
    this.mainWindow.setOpacity(1.0);

    // Default to ignoring mouse events (click-through) so the user can click on the underlying app
    // The Renderer will explicitly setIgnoreMouse(false) when hovering over:
    // 1. The Sidecar (which is still visible)
    // 2. The Interactive Bricks/Results
    this.mainWindow.setIgnoreMouseEvents(true, { forward: true });

    this.mainWindow.show();
  }
}
