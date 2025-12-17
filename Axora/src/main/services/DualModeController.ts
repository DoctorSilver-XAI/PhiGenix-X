import { BrowserWindow, screen, ipcMain } from 'electron';

export type ViewMode = 'compact' | 'hub' | 'hidden';

export class DualModeController {
  private mainWindow: BrowserWindow;
  private currentMode: ViewMode = 'compact';

  constructor(window: BrowserWindow) {
    this.mainWindow = window;
    this.init();
  }

  private init() {
    this.setupListeners();
    this.setCompactMode(); // Default start
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
      if (this.currentMode === 'compact') {
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
      case 'hidden':
        this.mainWindow.hide();
        break;
    }
  }

  private setCompactMode() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    // Sidecar: Larger than content to allow for heavy shadows (content is fixed ~68x220)
    // 150x300 ensures the 32px blur shadow is not clipped
    const SIDEBAR_WIDTH = 150;
    const SIDEBAR_HEIGHT = 300;

    this.mainWindow.setSize(SIDEBAR_WIDTH, SIDEBAR_HEIGHT);
    // Center vertically on the right edge
    const yPos = Math.floor((height - SIDEBAR_HEIGHT) / 2);
    this.mainWindow.setPosition(width - SIDEBAR_WIDTH, yPos);

    this.mainWindow.setAlwaysOnTop(true, 'floating');
    this.mainWindow.setOpacity(1.0);

    // Default: Ignore mouse (click-through) until hovered
    // content failure causes user to be unable to interact if this is true
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
}
