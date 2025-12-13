import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { getDatabaseService } from './database/DatabaseService'
import { validateDatabaseSchema } from './database/validateSchema'
import { AppError } from './utils/errors'
import { initRepositories, getKnowledgeRepository, getReviewRepository } from './database/repositories'
import log from './utils/logger'
import { registerAllHandlers } from './ipc'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,  // ✅ 启用context isolation
      nodeIntegration: false,  // ✅ 禁用node integration
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

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
app.whenReady().then(() => {
  log.info('App is ready, initializing...')
  
  // 初始化数据库
  try {
    log.info('Initializing database...')
    const dbService = getDatabaseService()
    dbService.initialize()
    
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

    // 注册IPC handlers
    log.info('Registering IPC handlers...')
    registerAllHandlers()
    log.info('IPC handlers registered successfully')

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

  createWindow()

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
 * 测试Repository功能（仅在开发环境运行）
 */
async function testRepositories(): Promise<void> {
  try {
    log.info('=== Testing Repositories ===')

    const knowledgeRepo = getKnowledgeRepository()
    const reviewRepo = getReviewRepository()

    // 测试1: 创建知识点
    const knowledge = knowledgeRepo.create({
      title: '测试知识点',
      content: '这是测试内容',
      tags: ['测试', 'Repository'],
      frequencyCoefficient: 1.0
    })
    log.info('✅ Created knowledge:', knowledge)

    // 测试2: 查询知识点
    const found = knowledgeRepo.findById(knowledge.id)
    log.info('✅ Found knowledge:', found)

    // 测试3: 搜索知识点
    const searchResults = knowledgeRepo.search('测试')
    log.info(`✅ Search results: ${searchResults.length} records`)

    // 测试4: 按标签查询
    const tagResults = knowledgeRepo.findByTags(['测试'])
    log.info(`✅ Tag results: ${tagResults.length} records`)

    // 测试5: 更新知识点
    const updated = knowledgeRepo.update(knowledge.id, {
      title: '测试知识点（已更新）'
    })
    log.info('✅ Updated knowledge:', updated)

    // 测试6: 更新频率系数
    const coefficientUpdated = knowledgeRepo.updateFrequencyCoefficient(knowledge.id, 1.5)
    log.info(`✅ Frequency coefficient updated: ${coefficientUpdated}`)

    // 测试7: 创建复习记录
    const review = reviewRepo.createReview(
      knowledge.id,
      5,
      new Date(Date.now() + 24 * 60 * 60 * 1000) // 明天
    )
    log.info('✅ Created review:', review)

    // 测试8: 查询知识点的复习历史
    const reviewHistory = reviewRepo.findByKnowledgeId(knowledge.id)
    log.info(`✅ Review history: ${reviewHistory.length} records`)

    // 测试9: 查询到期复习
    const dueReviews = reviewRepo.findDueReviews(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000))
    log.info(`✅ Due reviews: ${dueReviews.length} records`)

    // 测试10: 查询所有知识点
    const allKnowledge = knowledgeRepo.findAll()
    log.info(`✅ All knowledge: ${allKnowledge.length} records`)

    log.info('=== All Repository tests passed! ===')
  } catch (error) {
    log.error('Repository test failed:', error)
  }
}
