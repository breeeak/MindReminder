import { app, shell, BrowserWindow, ipcMain, dialog, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { getDatabaseService } from './database/DatabaseService'
import { validateDatabaseSchema } from './database/validateSchema'
import { AppError, handleGlobalError } from './utils/errors'
import {
  initRepositories,
  getReminderRepository,
  getSettingsRepository
} from './database/repositories'
import log from './utils/logger'
import { registerAllHandlers } from './ipc'
import { ReminderScheduler } from './services/ReminderScheduler'
import { BackupService } from './services/BackupService'
import { getTrayService } from './services/TrayService'
import { SettingsService } from './services/SettingsService'

// 全局服务实例
let reminderScheduler: ReminderScheduler | null = null
let mainWindowInstance: BrowserWindow | null = null
let settingsService: SettingsService | null = null
let isQuitting = false

// 导出退出状态管理函数
export function setIsQuitting(value: boolean): void {
  isQuitting = value
}

export function getIsQuitting(): boolean {
  return isQuitting
}

// 设置全局错误处理器
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error)
  handleGlobalError(error)
})

process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Rejection at:', promise, 'reason:', reason)
  if (reason instanceof Error) {
    handleGlobalError(reason)
  }
})

function createWindow(): void {
  // 获取窗口状态
  let windowState: { width: number; height: number; x?: number; y?: number } = { 
    width: 1200, 
    height: 800, 
    x: undefined, 
    y: undefined 
  }
  
  if (settingsService) {
    try {
      const savedState = settingsService.getWindowState()
      if (savedState) {
        windowState = {
          width: Math.max(savedState.width || 1200, 800),
          height: Math.max(savedState.height || 800, 600),
          x: savedState.x,
          y: savedState.y
        }
        
        // 如果 x 或 y 为 0，表示需要居中
        if (windowState.x === 0 || windowState.y === 0) {
          windowState.x = undefined
          windowState.y = undefined
        }
        
        // 检查窗口位置是否在屏幕内
        if (windowState.x !== undefined && windowState.y !== undefined) {
          const displays = screen.getAllDisplays()
          const isOnScreen = displays.some(display => {
            const { x, y, width, height } = display.bounds
            return (
              windowState.x! >= x &&
              windowState.y! >= y &&
              windowState.x! < x + width &&
              windowState.y! < y + height
            )
          })
          
          // 如果不在屏幕内，则重置为居中
          if (!isOnScreen) {
            windowState.x = undefined
            windowState.y = undefined
          }
        }
      }
    } catch (error) {
      log.warn('Failed to load window state:', error)
    }
  }

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    show: false,
    autoHideMenuBar: true,
    title: 'MindReminder - 智能复习助手',
    minWidth: 800,
    minHeight: 600,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true, // ✅ 启用context isolation
      nodeIntegration: false // ✅ 禁用node integration
    }
  })

  mainWindowInstance = mainWindow

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 保存窗口状态
  const saveWindowState = () => {
    if (!mainWindow || mainWindow.isDestroyed() || !settingsService) return
    
    try {
      const bounds = mainWindow.getBounds()
      settingsService.updateWindowState({
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y
      })
    } catch (error) {
      log.warn('Failed to save window state:', error)
    }
  }

  // 监听窗口大小和位置变化
  mainWindow.on('resize', saveWindowState)
  mainWindow.on('move', saveWindowState)

  // 处理窗口关闭事件
  mainWindow.on('close', async (event) => {
    // 如果是应用退出流程，不拦截
    if (isQuitting) {
      saveWindowState()
      return
    }

    // 阻止默认关闭行为
    event.preventDefault()

    // 读取用户设置
    let closeButtonAction: 'ask' | 'quit' | 'minimize' = 'ask'
    
    if (settingsService) {
      try {
        const systemSettings = settingsService.getSystemSettings()
        closeButtonAction = systemSettings.closeButtonAction || 'ask'
      } catch (error) {
        log.warn('Failed to get system settings:', error)
      }
    }
    
    // 根据设置处理关闭行为
    log.info('Close button action:', closeButtonAction)
    
    if (closeButtonAction === 'quit') {
      // 直接退出
      log.info('Quitting application')
      isQuitting = true
      saveWindowState()
      app.quit()
    } else if (closeButtonAction === 'minimize') {
      // 最小化到托盘
      log.info('Minimizing to tray')
      const trayService = getTrayService()
      trayService.hideWindow()
      log.info('Window should be hidden now')
    } else {
      // 询问用户
      const result = await dialog.showMessageBox(mainWindow, {
        type: 'question',
        title: '关闭窗口',
        message: '您想要如何处理窗口？',
        detail: '退出将完全关闭应用程序，最小化到托盘将在后台继续运行。',
        buttons: ['退出应用', '最小化到托盘', '取消'],
        defaultId: 1, // 默认选择"最小化到托盘"
        cancelId: 2,
        checkboxLabel: '记住我的选择',
        checkboxChecked: false,
        noLink: true
      })

      const rememberChoice = result.checkboxChecked

      if (result.response === 0) {
        // 退出应用
        if (rememberChoice && settingsService) {
          try {
            settingsService.updateSystemSettings({ closeButtonAction: 'quit' })
            log.info('User preference saved: quit')
          } catch (error) {
            log.warn('Failed to save user preference:', error)
          }
        }
        isQuitting = true
        saveWindowState()
        app.quit()
      } else if (result.response === 1) {
        // 最小化到托盘
        log.info('User chose to minimize to tray')
        if (rememberChoice && settingsService) {
          try {
            settingsService.updateSystemSettings({ closeButtonAction: 'minimize' })
            log.info('User preference saved: minimize')
          } catch (error) {
            log.warn('Failed to save user preference:', error)
          }
        }
        log.info('Getting tray service and hiding window')
        const trayService = getTrayService()
        trayService.hideWindow()
        log.info('hideWindow called')
      }
      // result.response === 2 表示取消，什么都不做
    }
  })

  // 最小化按钮：使用默认行为（最小化到任务栏）
  // 不需要监听 minimize 事件

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  log.info('App is ready, initializing...')

  // 初始化数据库
  try {
    log.info('Initializing database...')
    const dbService = getDatabaseService()
    await dbService.initialize()

    // 验证数据库结构
    const isValid = validateDatabaseSchema()
    if (!isValid) {
      throw new Error('Database schema validation failed')
    }
    log.info('Database initialized successfully')

    // 初始化Repository
    log.info('Initializing repositories...')
    initRepositories(dbService)
    log.info('Repositories initialized successfully')

    // 初始化 SettingsService
    log.info('Initializing settings service...')
    const settingsRepo = getSettingsRepository()
    settingsService = new SettingsService(settingsRepo)
    log.info('Settings service initialized successfully')

    // 注册IPC handlers
    log.info('Registering IPC handlers...')
    registerAllHandlers()
    log.info('IPC handlers registered successfully')

    // 应用系统设置
    applySystemSettings()

    // 启动提醒调度器
    log.info('Starting reminder scheduler...')
    const reminderRepo = getReminderRepository()
    reminderScheduler = new ReminderScheduler(reminderRepo)
    reminderScheduler.start()
    log.info('Reminder scheduler started successfully')

    // 执行自动备份
    log.info('Checking for auto backup...')
    const backupService = new BackupService(dbService)
    if (backupService.shouldAutoBackup()) {
      try {
        const backupPath = await backupService.performAutoBackup()
        if (backupPath) {
          log.info('Auto backup completed:', backupPath)
        }
      } catch (error) {
        log.warn('Auto backup failed, but continuing:', error)
      }
    }

    // 运行测试（仅在开发环境）
    if (is.dev) {
      testRepositories()
    }
  } catch (error) {
    log.error('Failed to initialize app:', error)

    // 显示用户友好的错误对话框
    let errorMessage = '数据库初始化失败，请重启应用或联系技术支持。'

    if (error instanceof AppError) {
      errorMessage = error.userMessage
    }

    dialog.showErrorBox('数据库错误', errorMessage)

    // 严重错误，退出应用
    app.quit()
    return
  }

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.mindreminder')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test (legacy - can be removed after IPC handlers are verified)
  ipcMain.on('ping', () => console.log('pong'))

  // 创建主窗口
  createWindow()

  // 初始化系统托盘（必须在 createWindow() 之后）
  log.info('Initializing system tray...')
  if (mainWindowInstance) {
    const trayService = getTrayService()
    trayService.initialize(mainWindowInstance)
    log.info('System tray initialized successfully')
  } else {
    log.error('mainWindowInstance is null, cannot initialize tray')
  }

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  // 停止提醒调度器
  if (reminderScheduler) {
    reminderScheduler.stop()
    reminderScheduler = null
  }

  // 关闭数据库连接
  const dbService = getDatabaseService()
  dbService.close()

  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

/**
 * 应用系统设置
 */
function applySystemSettings(): void {
  if (!settingsService) return

  try {
    const systemSettings = settingsService.getSystemSettings()

    // 应用开机自启动设置
    app.setLoginItemSettings({
      openAtLogin: systemSettings.autoLaunch,
      openAsHidden: systemSettings.autoLaunch // 自启动时最小化到托盘
    })

    log.info('System settings applied:', {
      autoLaunch: systemSettings.autoLaunch,
      minimizeToTray: systemSettings.minimizeToTray,
      theme: systemSettings.theme
    })
  } catch (error) {
    log.error('Failed to apply system settings:', error)
  }
}

/**
 * 测试Repository功能（仅在开发环境运行）
 */
async function testRepositories(): Promise<void> {
  try {
    log.info('=== Testing Repositories ===')

    // 注释掉测试代码，避免每次启动都创建测试数据
    // 测试1: 创建知识点
    // const knowledge = knowledgeRepo.create({
    //   title: '测试知识点',
    //   content: '这是测试内容',
    //   tags: ['测试', 'Repository'],
    //   frequencyCoefficient: 1.0
    // })
    // log.info('✅ Created knowledge:', knowledge)

    // 测试2: 查询知识点
    // const found = knowledgeRepo.findById(knowledge.id)
    // log.info('✅ Found knowledge:', found)

    // 测试3: 搜索知识点
    // const searchResults = knowledgeRepo.search('测试')
    // log.info(`✅ Search results: ${searchResults.length} records`)

    // 测试4: 按标签查询
    // const tagResults = knowledgeRepo.findByTags(['测试'])
    // log.info(`✅ Tag results: ${tagResults.length} records`)

    // 测试5: 更新知识点
    // const updated = knowledgeRepo.update(knowledge.id, {
    //   title: '测试知识点（已更新）'
    // })
    // log.info('✅ Updated knowledge:', updated)

    // 测试6: 更新频率系数
    // const coefficientUpdated = knowledgeRepo.updateFrequencyCoefficient(knowledge.id, 1.5)
    // log.info(`✅ Frequency coefficient updated: ${coefficientUpdated}`)

    // 测试7: 创建复习记录
    // const review = reviewRepo.createReview(
    //   knowledge.id,
    //   5,
    //   new Date(Date.now() + 24 * 60 * 60 * 1000) // 明天
    // )
    // log.info('✅ Created review:', review)

    // 测试8: 查询知识点的复习历史
    // const reviewHistory = reviewRepo.findByKnowledgeId(knowledge.id)
    // log.info(`✅ Review history: ${reviewHistory.length} records`)

    // 测试9: 查询到期复习
    // const dueReviews = reviewRepo.findDueReviews(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000))
    // log.info(`✅ Due reviews: ${dueReviews.length} records`)

    // 测试10: 查询所有知识点
    // const allKnowledge = knowledgeRepo.findAll()
    // log.info(`✅ All knowledge: ${allKnowledge.length} records`)

    log.info('=== Repository initialization completed ===')
  } catch (error) {
    log.error('Repository test failed:', error)
  }
}
