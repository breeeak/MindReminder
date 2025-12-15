import { app, Tray, Menu, BrowserWindow, nativeImage } from 'electron'
import * as path from 'path'
import log from '../utils/logger'
import { setIsQuitting } from '../index'

/**
 * 系统托盘服务
 */
export class TrayService {
  private tray: Tray | null = null
  private mainWindow: BrowserWindow | null = null
  private pendingReviewCount: number = 0

  /**
   * 初始化托盘
   */
  initialize(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow
    
    // 创建托盘图标
    const iconPath = this.getTrayIconPath()
    const icon = nativeImage.createFromPath(iconPath)
    
    this.tray = new Tray(icon)
    this.tray.setToolTip('MindReminder - 智能复习助手')
    
    // 设置托盘菜单
    this.updateContextMenu()
    
    // 点击托盘图标显示窗口
    this.tray.on('click', () => {
      this.showWindow()
    })

    log.info('Tray service initialized')
  }

  /**
   * 更新待复习数量
   */
  updateReviewCount(count: number): void {
    this.pendingReviewCount = count
    
    // 更新托盘菜单
    this.updateContextMenu()
    
    // 更新托盘提示
    if (count > 0) {
      this.tray?.setToolTip(`MindReminder - ${count} 个待复习`)
    } else {
      this.tray?.setToolTip('MindReminder - 智能复习助手')
    }
    
    log.debug('Tray review count updated:', count)
  }

  /**
   * 显示窗口
   */
  showWindow(): void {
    if (!this.mainWindow) return
    
    // 恢复任务栏图标
    this.mainWindow.setSkipTaskbar(false)
    
    if (this.mainWindow.isMinimized()) {
      this.mainWindow.restore()
    }
    
    this.mainWindow.show()
    this.mainWindow.focus()
    
    log.debug('Window shown from tray')
  }

  /**
   * 隐藏窗口到托盘
   */
  hideWindow(): void {
    if (!this.mainWindow) {
      log.error('Cannot hide window: mainWindow is null')
      return
    }
    
    if (this.mainWindow.isDestroyed()) {
      log.error('Cannot hide window: mainWindow is destroyed')
      return
    }
    
    try {
      // 顺序很重要：先设置 skipTaskbar，再隐藏窗口
      this.mainWindow.setSkipTaskbar(true)
      this.mainWindow.hide()
      log.info('Window hidden to tray successfully')
    } catch (error) {
      log.error('Error hiding window to tray:', error)
    }
  }

  /**
   * 销毁托盘
   */
  destroy(): void {
    if (this.tray) {
      this.tray.destroy()
      this.tray = null
      log.info('Tray destroyed')
    }
  }

  /**
   * 更新上下文菜单
   */
  private updateContextMenu(): void {
    if (!this.tray || !this.mainWindow) return
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '打开 MindReminder',
        click: () => {
          this.showWindow()
        }
      },
      {
        type: 'separator'
      },
      {
        label: `今日待复习 (${this.pendingReviewCount}个)`,
        enabled: this.pendingReviewCount > 0,
        click: () => {
          this.showWindow()
          // 导航到复习页面
          this.mainWindow?.webContents.send('navigate-to', '/review')
        }
      },
      {
        label: '快速记录',
        click: () => {
          this.showWindow()
          // 导航到新建知识点页面
          this.mainWindow?.webContents.send('show-quick-add')
        }
      },
      {
        type: 'separator'
      },
      {
        label: '退出',
        click: () => {
          // 设置退出标志，防止 close 事件拦截
          setIsQuitting(true)
          app.quit()
        }
      }
    ])
    
    this.tray.setContextMenu(contextMenu)
  }

  /**
   * 获取托盘图标路径
   */
  private getTrayIconPath(): string {
    // 根据平台选择合适的图标
    if (process.platform === 'win32') {
      return path.join(__dirname, '../../resources/icon.ico')
    } else if (process.platform === 'darwin') {
      // macOS 使用 Template 图标
      return path.join(__dirname, '../../resources/iconTemplate.png')
    } else {
      return path.join(__dirname, '../../resources/icon.png')
    }
  }
}

// 单例模式
let trayServiceInstance: TrayService | null = null

export function getTrayService(): TrayService {
  if (!trayServiceInstance) {
    trayServiceInstance = new TrayService()
  }
  return trayServiceInstance
}

