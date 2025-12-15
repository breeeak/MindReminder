import React, { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Button,
  Spin,
  Alert,
  Space,
  Divider,
  Card,
  Typography,
  Descriptions,
  Tag,
  Modal,
  message
} from 'antd'
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  HistoryOutlined,
  TrophyOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import { useKnowledgeStore } from '../stores'
import { useReviewStore } from '../stores/reviewStore'
import { KnowledgeEditDialog } from '../components/KnowledgeEditDialog'
import ReactMarkdown from 'react-markdown'

const { Title, Text } = Typography

// 评分表情映射
const getRatingEmoji = (rating: number): string => {
  const emojis: Record<number, string> = {
    1: '😟',
    2: '🤔',
    3: '😐',
    4: '😊',
    5: '🎯'
  }
  return emojis[rating] || '❓'
}

/**
 * 知识点详情页面
 */
export const KnowledgeDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)

  // Store状态
  const currentKnowledge = useKnowledgeStore((state) => state.currentKnowledge)
  const reviewHistory = useKnowledgeStore((state) => state.reviewHistory)
  const reviewStatistics = useKnowledgeStore((state) => state.reviewStatistics)
  const detailLoading = useKnowledgeStore((state) => state.detailLoading)
  const detailError = useKnowledgeStore((state) => state.detailError)

  // Store方法
  const fetchKnowledgeDetail = useKnowledgeStore((state) => state.fetchKnowledgeDetail)
  const fetchReviewHistory = useKnowledgeStore((state) => state.fetchReviewHistory)
  const deleteKnowledge = useKnowledgeStore((state) => state.deleteKnowledge)
  const clearDetail = useKnowledgeStore((state) => state.clearDetail)

  // Review Store方法
  const markForImmediateReview = useReviewStore((state) => state.markForImmediateReview)
  const startReviewSession = useReviewStore((state) => state.startReviewSession)

  useEffect(() => {
    if (id) {
      fetchKnowledgeDetail(id)
      fetchReviewHistory(id)
    }

    return () => {
      clearDetail()
    }
  }, [id])

  const handleBack = () => {
    navigate('/knowledge')
  }

  const handleEdit = () => {
    setIsEditDialogOpen(true)
  }

  const handleDelete = () => {
    Modal.confirm({
      title: '确定删除此知识点吗？',
      content: '删除后无法恢复，复习历史也将被删除。',
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        if (id) {
          try {
            await deleteKnowledge(id)
            message.success('删除成功')
            navigate('/knowledge')
          } catch (error) {
            message.error('删除失败')
          }
        }
      }
    })
  }

  const handleStartReview = () => {
    if (!currentKnowledge) return

    // 直接启动单个知识点的复习会话
    const reviewTask = {
      ...currentKnowledge,
      priority: 'due_today' as const,
      dueTime: Date.now()
    }

    startReviewSession([reviewTask])
    navigate('/review/session')
  }

  const handleMarkForReview = async () => {
    if (id) {
      try {
        await markForImmediateReview(id)
        // 跳转到今日复习页面
        navigate('/review')
      } catch (error) {
        // 错误已在store中处理
      }
    }
  }

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false)
    if (id) {
      fetchKnowledgeDetail(id)
    }
  }

  if (detailLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  if (detailError) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert
          message="加载失败"
          description={detailError}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => id && fetchKnowledgeDetail(id)}>
              重试
            </Button>
          }
        />
      </div>
    )
  }

  if (!currentKnowledge) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert message="知识点不存在" type="warning" showIcon />
        <Button onClick={handleBack} style={{ marginTop: '16px' }}>
          返回列表
        </Button>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', height: '100%', overflow: 'auto' }}>
      {/* 顶部操作栏 */}
      <div
        style={{
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
          返回列表
        </Button>

        <Space>
          {/* 仅在没有复习历史时显示复习相关按钮 */}
          {reviewHistory.length === 0 && (
            <>
              <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleStartReview}>
                开始复习
              </Button>
              <Button icon={<ClockCircleOutlined />} onClick={handleMarkForReview}>
                加入今日复习
              </Button>
            </>
          )}
          <Button icon={<EditOutlined />} onClick={handleEdit}>
            编辑
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
            删除
          </Button>
        </Space>
      </div>

      {/* 知识点基本信息 */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <Title level={2} style={{ margin: 0, flex: 1 }}>
            {currentKnowledge.title}
          </Title>

          {/* 【新增】掌握状态徽章 */}
          {currentKnowledge.masteryStatus === 'mastered' && (
            <div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
            >
              <Tag
                icon={<TrophyOutlined />}
                color="success"
                style={{ fontSize: '16px', padding: '8px 16px', margin: 0 }}
              >
                已掌握
              </Tag>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                长期抽查模式（60天/次）
              </Text>
            </div>
          )}
        </div>

        <Space size="small" wrap style={{ marginBottom: '16px' }}>
          {currentKnowledge.tags && currentKnowledge.tags.length > 0 ? (
            currentKnowledge.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)
          ) : (
            <Text type="secondary">无标签</Text>
          )}
        </Space>

        {currentKnowledge.content && (
          <Card
            type="inner"
            title="内容详情"
            style={{ backgroundColor: '#fafafa', marginBottom: '16px' }}
          >
            <ReactMarkdown>{currentKnowledge.content}</ReactMarkdown>
          </Card>
        )}

        <Space size="large">
          <Text type="secondary">
            创建时间: {new Date(currentKnowledge.createdAt).toLocaleString('zh-CN')}
          </Text>
          <Text type="secondary">
            更新时间: {new Date(currentKnowledge.updatedAt).toLocaleString('zh-CN')}
          </Text>
        </Space>
      </Card>

      <Divider />

      {/* 复习统计 */}
      <Card
        title={
          <Space>
            <TrophyOutlined />
            <span>复习统计</span>
          </Space>
        }
        style={{ marginBottom: '24px' }}
      >
        <Descriptions column={2} bordered>
          <Descriptions.Item label="复习次数">
            {reviewStatistics?.totalReviews || 0} 次
          </Descriptions.Item>
          <Descriptions.Item label="平均评分">
            {reviewStatistics?.avgRating ? reviewStatistics.avgRating.toFixed(1) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="最后复习时间" span={2}>
            {reviewStatistics?.lastReviewAt
              ? new Date(reviewStatistics.lastReviewAt).toLocaleString('zh-CN')
              : '尚未复习'}
          </Descriptions.Item>
          <Descriptions.Item label="复习频率系数" span={2}>
            {currentKnowledge.frequencyCoefficient}x
            {currentKnowledge.frequencyCoefficient !== 1.0 && (
              <Text type="secondary"> (已调整)</Text>
            )}
          </Descriptions.Item>
          {/* 【新增】掌握状态显示 */}
          <Descriptions.Item label="掌握状态">
            {currentKnowledge.masteryStatus === 'mastered' ? (
              <Tag color="success" icon={<TrophyOutlined />}>
                已掌握
              </Tag>
            ) : (
              <Tag color="processing">学习中</Tag>
            )}
          </Descriptions.Item>
          {currentKnowledge.masteredAt && (
            <Descriptions.Item label="掌握时间">
              {new Date(currentKnowledge.masteredAt).toLocaleString('zh-CN')}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Divider />

      {/* 复习历史时间轴 */}
      <Card
        title={
          <Space>
            <HistoryOutlined />
            <span>复习历史</span>
            <Text type="secondary" style={{ fontSize: '14px', fontWeight: 'normal' }}>
              （共{reviewHistory.length}次）
            </Text>
          </Space>
        }
      >
        {reviewHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Text type="secondary">这个知识点还没有复习记录</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              点击上方"开始复习"按钮开始第一次复习
            </Text>
          </div>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {reviewHistory.slice(0, 10).map((review, index) => {
              // 安全处理时间戳
              const reviewedAt = review.reviewedAt || 0
              const nextReviewAt = review.nextReviewAt || 0
              
              // 计算间隔天数
              const intervalMs = nextReviewAt - reviewedAt
              const intervalDays = intervalMs > 0 ? (intervalMs / (24 * 60 * 60 * 1000)).toFixed(1) : '0'

              // 评分颜色
              const ratingColor = review.rating >= 4 ? 'green' : review.rating >= 3 ? 'blue' : 'red'

              return (
                <Card
                  key={review.id}
                  size="small"
                  bordered
                  style={{ borderLeft: `4px solid ${ratingColor}` }}
                >
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '24px' }}>{getRatingEmoji(review.rating)}</span>
                      <div style={{ flex: 1 }}>
                        <Text strong>评分：{review.rating} 分</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          第 {reviewHistory.length - index} 次复习
                        </Text>
                      </div>
                      <Tag color={ratingColor}>间隔 {intervalDays} 天</Tag>
                    </div>
                    <div style={{ paddingLeft: '36px' }}>
                      <Text type="secondary" style={{ fontSize: '13px' }}>
                        复习时间：{reviewedAt > 0 ? new Date(reviewedAt).toLocaleString('zh-CN') : '未知'}
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '13px' }}>
                        下次复习：{nextReviewAt > 0 ? new Date(nextReviewAt).toLocaleString('zh-CN') : '未知'}
                      </Text>
                    </div>
                  </Space>
                </Card>
              )
            })}
            {reviewHistory.length > 10 && (
              <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
                还有{reviewHistory.length - 10}条记录...
              </Text>
            )}
          </Space>
        )}
      </Card>

      {/* 编辑对话框 */}
      <KnowledgeEditDialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSuccess={handleEditSuccess}
        knowledge={currentKnowledge}
      />
    </div>
  )
}

