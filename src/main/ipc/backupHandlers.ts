import { ipcMain, dialog } from 'electron'
import { IPCChannel } from '../../common/ipc-channels'
import { getDatabaseService } from '../database/DatabaseService'
import { BackupService } from '../services/BackupService'
import log from '../utils/logger'

/**
 * 注册备份相关的 IPC 处理器
 */
export function registerBackupHandlers(): void {
  const dbService = getDatabaseService()
  const backupService = new BackupService(dbService)

  // 创建备份
  ipcMain.handle(IPCChannel.BACKUP_CREATE, async () => {
    try {
      const backupPath = await backupService.createBackup()
      return { data: backupPath }
    } catch (error) {
      log.error('IPC backup:create failed:', error)
      throw error
    }
  })

  // 列出所有备份
  ipcMain.handle(IPCChannel.BACKUP_LIST, async () => {
    try {
      const backups = await backupService.listBackups()
      return { data: backups }
    } catch (error) {
      log.error('IPC backup:list failed:', error)
      throw error
    }
  })

  // 恢复备份
  ipcMain.handle(IPCChannel.BACKUP_RESTORE, async (_event, backupPath: string) => {
    try {
      await backupService.restoreBackup(backupPath)
      return { data: null }
    } catch (error) {
      log.error('IPC backup:restore failed:', { backupPath, error })
      throw error
    }
  })

  // 导出为 JSON
  ipcMain.handle(IPCChannel.BACKUP_EXPORT_JSON, async () => {
    try {
      // 打开保存对话框
      const result = await dialog.showSaveDialog({
        title: '导出数据为 JSON',
        defaultPath: `mindreminder-export-${new Date().toISOString().split('T')[0]}.json`,
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
      })

      if (result.canceled || !result.filePath) {
        return { data: null }
      }

      await backupService.exportToJSON(result.filePath)
      return { data: result.filePath }
    } catch (error) {
      log.error('IPC backup:exportJSON failed:', error)
      throw error
    }
  })

  // 导出为 CSV
  ipcMain.handle(IPCChannel.BACKUP_EXPORT_CSV, async () => {
    try {
      // 打开目录选择对话框
      const result = await dialog.showOpenDialog({
        title: '选择导出目录',
        properties: ['openDirectory', 'createDirectory']
      })

      if (result.canceled || result.filePaths.length === 0) {
        return { data: null }
      }

      const outputDir = result.filePaths[0]
      const exportedFiles = await backupService.exportToCSV(outputDir)
      return { data: exportedFiles }
    } catch (error) {
      log.error('IPC backup:exportCSV failed:', error)
      throw error
    }
  })

  // 从 JSON 导入
  ipcMain.handle(IPCChannel.BACKUP_IMPORT_JSON, async () => {
    try {
      // 打开文件选择对话框
      const result = await dialog.showOpenDialog({
        title: '选择要导入的 JSON 文件',
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
        properties: ['openFile']
      })

      if (result.canceled || result.filePaths.length === 0) {
        return { data: null }
      }

      const inputPath = result.filePaths[0]
      await backupService.importFromJSON(inputPath)
      return { data: inputPath }
    } catch (error) {
      log.error('IPC backup:importJSON failed:', error)
      throw error
    }
  })

  // 获取备份目录
  ipcMain.handle(IPCChannel.BACKUP_GET_DIRECTORY, async () => {
    try {
      const directory = backupService.getBackupDirectory()
      return { data: directory }
    } catch (error) {
      log.error('IPC backup:getDirectory failed:', error)
      throw error
    }
  })

  log.info('Backup handlers registered successfully')
}



