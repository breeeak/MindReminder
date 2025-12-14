import { app } from 'electron'
import path from 'path'
import fs from 'fs'

/**
 * 获取应用数据目录
 */
export function getAppDataPath(): string {
  return app.getPath('userData')
}

/**
 * 获取数据库文件路径
 */
export function getDatabasePath(): string {
  const appDataPath = getAppDataPath()
  return path.join(appDataPath, 'mindreminder.db')
}

/**
 * 获取备份目录
 */
export function getBackupPath(): string {
  const appDataPath = getAppDataPath()
  const backupPath = path.join(appDataPath, 'backups')

  // 确保备份目录存在
  if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, { recursive: true })
  }

  return backupPath
}

/**
 * 获取日志目录
 */
export function getLogPath(): string {
  const appDataPath = getAppDataPath()
  const logPath = path.join(appDataPath, 'logs')

  // 确保日志目录存在
  if (!fs.existsSync(logPath)) {
    fs.mkdirSync(logPath, { recursive: true })
  }

  return logPath
}

/**
 * 确保目录存在
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
    // 注意: 不在此处记录日志,避免循环依赖
    // 调用方应在调用后记录日志
  }
}

/**
 * 获取平台特定路径信息（用于调试）
 */
export function getPlatformPaths() {
  return {
    platform: process.platform,
    userData: app.getPath('userData'),
    appData: app.getPath('appData'),
    home: app.getPath('home'),
    temp: app.getPath('temp'),
    logs: app.getPath('logs')
  }
}
