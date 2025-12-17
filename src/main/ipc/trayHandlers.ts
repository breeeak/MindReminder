import { ipcMain } from 'electron'
import { IPCChannel } from '../../common/ipc-channels'
import { getTrayService } from '../services/TrayService'
import log from '../utils/logger'

/**
 * 注册托盘相关的 IPC 处理器
 */
export function registerTrayHandlers(): void {
  // 更新待复习数量
  ipcMain.handle(IPCChannel.TRAY_UPDATE_REVIEW_COUNT, async (_event, count: number) => {
    try {
      const trayService = getTrayService()
      trayService.updateReviewCount(count)
      return { data: null }
    } catch (error) {
      log.error('IPC tray:updateReviewCount failed:', { count, error })
      throw error
    }
  })
}


