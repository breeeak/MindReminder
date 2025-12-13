import log from 'electron-log'
import path from 'path'
import { getLogPath } from './pathHelper'

// 配置日志文件位置
log.transports.file.resolvePathFn = () => {
  const logPath = getLogPath()
  return path.join(logPath, 'main.log')
}

// 配置日志级别
log.transports.file.level = 'info'
log.transports.console.level = process.env.NODE_ENV === 'development' ? 'debug' : 'warn'

// 配置日志格式
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'

// 日志文件最大大小（10MB）
log.transports.file.maxSize = 10 * 1024 * 1024

export default log


