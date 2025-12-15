import { useEffect, useState } from 'react'
import {
  Card,
  Slider,
  InputNumber,
  Select,
  Switch,
  TimePicker,
  Button,
  message,
  Space,
  Typography,
  Row,
  Col,
  Modal,
  Tag,
  Table
} from 'antd'
import {
  SettingOutlined,
  BellOutlined,
  DesktopOutlined,
  SyncOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  DatabaseOutlined,
  DownloadOutlined,
  ExportOutlined,
  ImportOutlined,
  FolderOpenOutlined
} from '@ant-design/icons'
import { useSettingsStore } from '../stores/settingsStore'
import { useAppStore } from '../stores/appStore'
import type { BackupMetadata } from '../../../preload/index.d'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography
const { Option } = Select

export default function SettingsPage() {
  const {
    settings,
    loading,
    error,
    loadAllSettings,
    updateReviewSettings,
    updateReminderSettings,
    updateSystemSettings,
    resetToDefaults
  } = useSettingsStore()

  const { setTheme } = useAppStore()

  const [reminderTimes, setReminderTimes] = useState<string[]>([])
  const [backups, setBackups] = useState<BackupMetadata[]>([])
  const [backupLoading, setBackupLoading] = useState(false)

  useEffect(() => {
    loadAllSettings()
    loadBackups()
  }, [loadAllSettings])

  const loadBackups = async () => {
    try {
      const response = await window.api.backup.list()
      setBackups(response.data)
    } catch (error) {
      console.error('Failed to load backups:', error)
    }
  }

  useEffect(() => {
    if (settings?.reminder.reminderTimes) {
      setReminderTimes(settings.reminder.reminderTimes)
    }
  }, [settings])

  const handleReviewSettingsChange = async (field: string, value: any) => {
    try {
      await updateReviewSettings({ [field]: value })
      message.success('复习设置已更新')
    } catch (error) {
      message.error('更新失败')
    }
  }

  const handleReminderSettingsChange = async (field: string, value: any) => {
    try {
      await updateReminderSettings({ [field]: value })
      message.success('提醒设置已更新')
    } catch (error) {
      message.error('更新失败')
    }
  }

  const handleSystemSettingsChange = async (field: string, value: any) => {
    try {
      await updateSystemSettings({ [field]: value })
      message.success('系统设置已更新')
      if (field === 'autoLaunch') {
        message.info('开机自启动设置将在重启后生效')
      }
      // 如果修改的是主题，同时更新 appStore 的主题状态
      if (field === 'theme') {
        setTheme(value as 'light' | 'dark')
      }
    } catch (error) {
      message.error('更新失败')
    }
  }

  const handleAddReminderTime = (time: dayjs.Dayjs | null) => {
    if (!time) return
    const timeStr = time.format('HH:mm')
    if (!reminderTimes.includes(timeStr)) {
      const newTimes = [...reminderTimes, timeStr].sort()
      setReminderTimes(newTimes)
      handleReminderSettingsChange('reminderTimes', newTimes)
    }
  }

  const handleRemoveReminderTime = (time: string) => {
    const newTimes = reminderTimes.filter((t) => t !== time)
    setReminderTimes(newTimes)
    handleReminderSettingsChange('reminderTimes', newTimes)
  }

  const handleResetSettings = () => {
    Modal.confirm({
      title: '确认重置设置',
      content: '确定要恢复默认设置吗？此操作不可撤销。',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await resetToDefaults()
          message.success('设置已重置为默认值')
        } catch (error) {
          message.error('重置失败')
        }
      }
    })
  }

  if (loading && !settings) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <SyncOutlined spin style={{ fontSize: 32 }} />
        <div style={{ marginTop: 16 }}>加载设置中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#ff4d4f' }}>
        <InfoCircleOutlined style={{ fontSize: 32 }} />
        <div style={{ marginTop: 16 }}>{error}</div>
      </div>
    )
  }

  if (!settings) {
    return null
  }

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <Title level={2}>
        <SettingOutlined /> 设置中心
      </Title>
      <Paragraph type="secondary">自定义应用的各项设置，以符合您的个人习惯和需求</Paragraph>

      {/* 复习设置 */}
      <Card
        title={
          <Space>
            <SyncOutlined />
            <span>复习设置</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Row gutter={[16, 24]}>
          <Col span={24}>
            <div>
              <Text strong>全局复习频率系数</Text>
              <Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 8 }}>
                调整所有知识点的复习频率，值越大复习间隔越长
              </Paragraph>
              <Row gutter={16} align="middle">
                <Col flex="auto">
                  <Slider
                    min={0.5}
                    max={1.5}
                    step={0.1}
                    value={settings.review.globalFrequencyCoefficient}
                    onChange={(value) => handleReviewSettingsChange('globalFrequencyCoefficient', value)}
                    marks={{ 0.5: '0.5x', 1.0: '1.0x', 1.5: '1.5x' }}
                  />
                </Col>
                <Col>
                  <InputNumber
                    min={0.5}
                    max={1.5}
                    step={0.1}
                    value={settings.review.globalFrequencyCoefficient}
                    onChange={(value) => value && handleReviewSettingsChange('globalFrequencyCoefficient', value)}
                    style={{ width: 80 }}
                  />
                </Col>
              </Row>
            </div>
          </Col>

          <Col span={12}>
            <div>
              <Text strong>记忆标准天数</Text>
              <Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 8 }}>
                达到此天数后视为已掌握
              </Paragraph>
              <InputNumber
                min={1}
                max={365}
                value={settings.review.memoryStandardDays}
                onChange={(value) => value && handleReviewSettingsChange('memoryStandardDays', value)}
                addonAfter="天"
                style={{ width: '100%' }}
              />
            </div>
          </Col>

          <Col span={12}>
            <div>
              <Text strong>记忆标准评分</Text>
              <Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 8 }}>
                评分达到此标准才算已掌握
              </Paragraph>
              <Select
                value={settings.review.memoryStandardRating}
                onChange={(value) => handleReviewSettingsChange('memoryStandardRating', value)}
                style={{ width: '100%' }}
              >
                <Option value={3}>3 - 记得还可以</Option>
                <Option value={4}>4 - 记得很清楚</Option>
                <Option value={5}>5 - 完全记得</Option>
              </Select>
            </div>
          </Col>

          <Col span={12}>
            <div>
              <Text strong>长期抽查间隔</Text>
              <Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 8 }}>
                已掌握知识点的抽查间隔
              </Paragraph>
              <InputNumber
                min={1}
                max={365}
                value={settings.review.longTermReviewInterval}
                onChange={(value) => value && handleReviewSettingsChange('longTermReviewInterval', value)}
                addonAfter="天"
                style={{ width: '100%' }}
              />
            </div>
          </Col>
        </Row>
      </Card>

      {/* 提醒设置 */}
      <Card
        title={
          <Space>
            <BellOutlined />
            <span>提醒设置</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Row gutter={[16, 24]}>
          <Col span={24}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong>启用每日提醒</Text>
                <Switch
                  checked={settings.reminder.enableDailyReminder}
                  onChange={(checked) => handleReminderSettingsChange('enableDailyReminder', checked)}
                />
              </div>
              <Text type="secondary">在设定的时间提醒您进行复习</Text>
            </Space>
          </Col>

          <Col span={24}>
            <div>
              <Text strong>提醒时间</Text>
              <Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 8 }}>
                添加多个提醒时间
              </Paragraph>
              <Space wrap style={{ marginBottom: 8 }}>
                {reminderTimes.map((time) => (
                  <Tag
                    key={time}
                    closable
                    onClose={() => handleRemoveReminderTime(time)}
                  >
                    {time}
                  </Tag>
                ))}
              </Space>
              <div>
                <TimePicker
                  format="HH:mm"
                  placeholder="选择时间"
                  onChange={handleAddReminderTime}
                  style={{ width: 200 }}
                />
              </div>
            </div>
          </Col>

          <Col span={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong>提醒声音</Text>
                <Switch
                  checked={settings.reminder.reminderSound}
                  onChange={(checked) => handleReminderSettingsChange('reminderSound', checked)}
                />
              </div>
              <Text type="secondary">提醒时播放声音</Text>
            </Space>
          </Col>

          <Col span={12}>
            <div>
              <Text strong>提醒方式</Text>
              <Select
                value={settings.reminder.reminderMethod}
                onChange={(value) => handleReminderSettingsChange('reminderMethod', value)}
                style={{ width: '100%', marginTop: 8 }}
              >
                <Option value="notification">通知</Option>
                <Option value="tray">托盘闪烁</Option>
              </Select>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 系统设置 */}
      <Card
        title={
          <Space>
            <DesktopOutlined />
            <span>系统设置</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Row gutter={[16, 24]}>
          <Col span={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong>开机自启动</Text>
                <Switch
                  checked={settings.system.autoLaunch}
                  onChange={(checked) => handleSystemSettingsChange('autoLaunch', checked)}
                />
              </div>
              <Text type="secondary">系统启动时自动运行</Text>
            </Space>
          </Col>

          <Col span={24}>
            <div>
              <Text strong>关闭按钮行为</Text>
              <Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 8 }}>
                点击窗口关闭按钮时的行为方式
              </Paragraph>
              <Select
                value={settings.system.closeButtonAction}
                onChange={(value) => handleSystemSettingsChange('closeButtonAction', value)}
                style={{ width: '100%' }}
              >
                <Option value="ask">
                  <div>
                    <div>每次询问</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>点击关闭按钮时弹出对话框询问</Text>
                  </div>
                </Option>
                <Option value="quit">
                  <div>
                    <div>直接退出</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>点击关闭按钮时直接退出应用</Text>
                  </div>
                </Option>
                <Option value="minimize">
                  <div>
                    <div>最小化到托盘</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>点击关闭按钮时最小化到系统托盘</Text>
                  </div>
                </Option>
              </Select>
            </div>
          </Col>

          <Col span={12}>
            <div>
              <Text strong>界面主题</Text>
              <Select
                value={settings.system.theme}
                onChange={(value) => handleSystemSettingsChange('theme', value)}
                style={{ width: '100%', marginTop: 8 }}
              >
                <Option value="light">浅色</Option>
                <Option value="dark">深色</Option>
              </Select>
            </div>
          </Col>

          <Col span={12}>
            <div>
              <Text strong>数据存储位置</Text>
              <Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 8, fontSize: 12 }}>
                {settings.system.dataPath || '默认位置'}
              </Paragraph>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 数据备份和恢复 */}
      <Card
        title={
          <Space>
            <DatabaseOutlined />
            <span>数据备份和恢复</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Row gutter={[16, 24]}>
          <Col span={24}>
            <Space wrap>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                loading={backupLoading}
                onClick={async () => {
                  setBackupLoading(true)
                  try {
                    await window.api.backup.create()
                    message.success('备份创建成功')
                    await loadBackups()
                  } catch (error) {
                    message.error('备份创建失败')
                  } finally {
                    setBackupLoading(false)
                  }
                }}
              >
                立即备份
              </Button>
              <Button
                icon={<ExportOutlined />}
                onClick={async () => {
                  try {
                    const result = await window.api.backup.exportJSON()
                    if (result.data) {
                      message.success('数据导出成功')
                    }
                  } catch (error) {
                    message.error('数据导出失败')
                  }
                }}
              >
                导出为 JSON
              </Button>
              <Button
                icon={<ExportOutlined />}
                onClick={async () => {
                  try {
                    const result = await window.api.backup.exportCSV()
                    if (result.data) {
                      message.success('数据导出成功')
                    }
                  } catch (error) {
                    message.error('数据导出失败')
                  }
                }}
              >
                导出为 CSV
              </Button>
              <Button
                icon={<ImportOutlined />}
                onClick={async () => {
                  Modal.confirm({
                    title: '确认导入数据',
                    content: '导入数据将与现有数据合并，可能会覆盖相同ID的记录。是否继续？',
                    okText: '确认',
                    cancelText: '取消',
                    onOk: async () => {
                      try {
                        const result = await window.api.backup.importJSON()
                        if (result.data) {
                          message.success('数据导入成功')
                        }
                      } catch (error) {
                        message.error('数据导入失败')
                      }
                    }
                  })
                }}
              >
                从 JSON 导入
              </Button>
              <Button
                icon={<FolderOpenOutlined />}
                onClick={async () => {
                  try {
                    const result = await window.api.backup.getDirectory()
                    message.info(`备份目录: ${result.data}`)
                  } catch (error) {
                    message.error('获取备份目录失败')
                  }
                }}
              >
                打开备份目录
              </Button>
            </Space>
          </Col>

          <Col span={24}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              可用备份
            </Text>
            <Table
              dataSource={backups}
              rowKey="fileName"
              size="small"
              pagination={false}
              columns={[
                {
                  title: '日期',
                  dataIndex: 'createdAt',
                  key: 'createdAt',
                  render: (timestamp: number) => dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
                },
                {
                  title: '大小',
                  dataIndex: 'size',
                  key: 'size',
                  render: (size: number) => `${(size / (1024 * 1024)).toFixed(2)} MB`
                },
                {
                  title: '知识点',
                  dataIndex: 'knowledgeCount',
                  key: 'knowledgeCount'
                },
                {
                  title: '复习记录',
                  dataIndex: 'reviewCount',
                  key: 'reviewCount'
                },
                {
                  title: '操作',
                  key: 'actions',
                  render: (_: any, record: BackupMetadata) => (
                    <Button
                      type="link"
                      size="small"
                      onClick={() => {
                        Modal.confirm({
                          title: '确认恢复备份',
                          content: '恢复备份将覆盖当前数据，建议先备份当前数据。是否继续？',
                          okText: '确认',
                          cancelText: '取消',
                          okButtonProps: { danger: true },
                          onOk: async () => {
                            try {
                              await window.api.backup.restore(record.filePath)
                              message.success('备份恢复成功，应用将重新加载')
                              setTimeout(() => window.location.reload(), 1000)
                            } catch (error) {
                              message.error('备份恢复失败')
                            }
                          }
                        })
                      }}
                    >
                      恢复
                    </Button>
                  )
                }
              ]}
            />
          </Col>
        </Row>
      </Card>

      {/* 操作按钮 */}
      <Card>
        <Space size="large">
          <Button
            type="default"
            icon={<ReloadOutlined />}
            onClick={handleResetSettings}
          >
            恢复默认设置
          </Button>
          <Button
            type="default"
            onClick={() => {
              Modal.confirm({
                title: '重置窗口状态',
                content: '确定要将窗口恢复为默认尺寸和居中位置吗？',
                okText: '确认',
                cancelText: '取消',
                onOk: async () => {
                  try {
                    await window.api.settings.updateWindow({
                      width: 1200,
                      height: 800,
                      x: 0,
                      y: 0
                    })
                    message.success('窗口已重置，重启应用后生效')
                  } catch (error) {
                    message.error('重置窗口失败')
                  }
                }
              })
            }}
          >
            重置窗口
          </Button>
        </Space>
      </Card>
    </div>
  )
}

