import React from 'react'
import { Space, Typography } from 'antd'

const { Text } = Typography

const HEAT_COLORS = [
  { level: 0, color: '#f0f0f0', label: '无' },
  { level: 1, color: '#c6e3ff', label: '1-2' },
  { level: 2, color: '#91d5ff', label: '3-5' },
  { level: 3, color: '#40a9ff', label: '6-10' },
  { level: 4, color: '#1890ff', label: '11-15' },
  { level: 5, color: '#096dd9', label: '16+' }
]

export const HeatmapLegend: React.FC = () => {
  return (
    <Space align="center" size="small" style={{ marginTop: 12, flexShrink: 0 }}>
      <Text type="secondary" style={{ fontSize: 12 }}>
        活动强度:
      </Text>
      {HEAT_COLORS.map(({ level, color, label }) => (
        <Space key={level} size={4} align="center">
          <div
            style={{
              width: 16,
              height: 16,
              backgroundColor: color,
              border: '1px solid #d9d9d9',
              borderRadius: 2
            }}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {label}
          </Text>
        </Space>
      ))}
    </Space>
  )
}









