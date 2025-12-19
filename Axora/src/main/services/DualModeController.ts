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
    this.setCompactMode(); // Default start
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
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    // Use configured window dimensions
    const SIDEBAR_WIDTH = SidecarConfig.window.width;
    const SIDEBAR_HEIGHT = SidecarConfig.window.height;

    this.mainWindow.setSize(SIDEBAR_WIDTH, SIDEBAR_HEIGHT);

    // Position based on configuration
    let yPos;
    const { yAxisAlign, margins } = SidecarConfig.position;

    if (yAxisAlign === 'top') {
      yPos = margins.top;
    } else if (yAxisAlign === 'bottom') {
      yPos = height - SIDEBAR_HEIGHT - margins.bottom;
    } else if (yAxisAlign === 'upper-quarter') {
      // Position centrée autour du premier quart (25% du haut)
      yPos = Math.floor((height * 0.25) - (SIDEBAR_HEIGHT / 2));
    } else {
      // Default: center
      yPos = Math.floor((height - SIDEBAR_HEIGHT) / 2);
    }

    const xPos = width - SIDEBAR_WIDTH - margins.right;
    this.mainWindow.setPosition(xPos, yPos);

    this.mainWindow.setAlwaysOnTop(true, 'floating');
    this.mainWindow.setOpacity(1.0); // Window itself is full opacity, content handles transparency

    // Reset mouse behavior to default for compact (usually relying on renderer to set ignore or not)
    // but ensure we are not in a weird state
    // this.mainWindow.setIgnoreMouseEvents(true, { forward: true });

    this.mainWindow.show();
  }

  private setHubMode() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    // Hub: Central overlay, 80% width/height
    const HUB_WIDTH = Math.floor(width * 0.8);
    const HUB_HEIGHT = Math.floor(height * 0.8);
    const x = Math.floor((width - HUB_WIDTH) / 2);
    const y = Math.floor((height - HUB_HEIGHT) / 2);

    // Disable ignoring mouse events for Hub
    this.mainWindow.setIgnoreMouseEvents(false);

    this.mainWindow.setSize(HUB_WIDTH, HUB_HEIGHT);
    this.mainWindow.setPosition(x, y);
    this.mainWindow.setAlwaysOnTop(true, 'modal-panel');
    this.mainWindow.show();
    this.mainWindow.focus();
  }

  private setPhiVisionMode() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    // Fullscreen Overlay
    this.mainWindow.setSize(width, height);
    this.mainWindow.setPosition(0, 0);

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
