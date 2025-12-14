import log from 'electron-log'
import path from 'path'
import { app } from 'electron'

/**
 * 配置electron-log日志系统
 */
function configureLogger(): void {
  // 日志文件路径（跨平台）
  const logsPath = app.getPath('logs')
  log.transports.file.resolvePathFn = () => {
    return path.join(logsPath, 'main.log')
  }

  // 日志级别配置
  log.transports.file.level = 'info'
  log.transports.console.level = process.env.NODE_ENV === 'development' ? 'debug' : 'warn'

  // 日志格式
  log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'

  // 日志文件大小限制（10MB）
  log.transports.file.maxSize = 10 * 1024 * 1024

  log.info('Logger initialized', { logsPath })
}

// 应用启动时初始化
configureLogger()

export default log
