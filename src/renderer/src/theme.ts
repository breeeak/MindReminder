import type { ThemeConfig } from 'antd'

/**
 * 颜色令牌接口 - 定义语义化颜色系统
 */
export interface ColorTokens {
  // 语义化颜色
  knowledge: string // 知识点相关 - 蓝色
  diary: string // 日记相关 - 绿色
  reminder: string // 提醒相关 - 橙色

  // 中性色系
  bgPrimary: string // 主背景色
  bgSecondary: string // 次要背景色
  bgTertiary: string // 第三级背景色
  borderColor: string // 边框颜色
  textPrimary: string // 主文本色
  textSecondary: string // 次要文本色
  textTertiary: string // 第三级文本色
}

/**
 * 浅色模式主题配置
 */
export const lightTheme: ThemeConfig = {
  token: {
    // Ant Design 主色系
    colorPrimary: '#1890ff', // 知识点、主要操作
    colorSuccess: '#52c41a', // 日记、成功状态
    colorWarning: '#fa8c16', // 提醒、待复习
    colorError: '#ff4d4f', // 错误、删除

    // 中性色系
    colorBgBase: '#ffffff', // 主背景
    colorBgContainer: '#ffffff', // 容器背景
    colorBgLayout: '#f0f0f0', // 布局背景
    colorBorder: '#d9d9d9', // 边框颜色
    colorTextBase: '#262626', // 主文本
    colorText: '#262626', // 主文本
    colorTextSecondary: '#595959', // 次要文本
    colorTextTertiary: '#8c8c8c', // 第三级文本

    // 字体系统
    fontSize: 14,
    fontSizeHeading4: 20,
    fontSizeHeading3: 24,
    lineHeight: 1.5715,
    lineHeightHeading4: 1.4,
    lineHeightHeading3: 1.35,

    // 间距系统 (8px网格)
    marginXS: 4, // 0.5x
    marginSM: 8, // 1x
    margin: 16, // 2x
    marginMD: 16, // 2x
    marginLG: 24, // 3x
    marginXL: 32, // 4x

    // 视觉温暖化元素
    borderRadius: 4, // 适度圆角
    borderRadiusLG: 6, // 大组件圆角
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)', // 柔和阴影
    boxShadowSecondary: '0 1px 2px rgba(0, 0, 0, 0.08)', // 更柔和的阴影

    // 动画时长
    motionDurationMid: '0.2s', // 标准动画
    motionDurationSlow: '0.3s' // 主题切换动画
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      headerHeight: 48,
      siderBg: '#fafafa',
      bodyBg: '#f0f0f0'
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: '#e6f7ff',
      itemHoverBg: '#f5f5f5',
      itemHeight: 48,
      iconSize: 16
    },
    Button: {
      controlHeight: 32,
      borderRadius: 4,
      primaryShadow: 'none' // 移除主按钮阴影
    },
    Card: {
      borderRadius: 6
    }
  }
}

/**
 * 深色模式主题配置
 */
export const darkTheme: ThemeConfig = {
  token: {
    // Ant Design 主色系 (深色模式下更亮的颜色)
    colorPrimary: '#40a9ff', // 更亮的蓝色
    colorSuccess: '#73d13d', // 更亮的绿色
    colorWarning: '#ffa940', // 更亮的橙色
    colorError: '#ff7875', // 更亮的红色

    // 中性色系 - 深色模式
    colorBgBase: '#141414', // 主背景
    colorBgContainer: '#1f1f1f', // 容器背景
    colorBgLayout: '#000000', // 布局背景
    colorBorder: '#434343', // 边框颜色
    colorTextBase: 'rgba(255, 255, 255, 0.87)', // 主文本 (避免纯白)
    colorText: 'rgba(255, 255, 255, 0.87)', // 主文本
    colorTextSecondary: 'rgba(255, 255, 255, 0.65)', // 次要文本
    colorTextTertiary: 'rgba(255, 255, 255, 0.45)', // 第三级文本

    // 字体系统 (与浅色模式相同)
    fontSize: 14,
    fontSizeHeading4: 20,
    fontSizeHeading3: 24,
    lineHeight: 1.5715,
    lineHeightHeading4: 1.4,
    lineHeightHeading3: 1.35,

    // 间距系统 (与浅色模式相同)
    marginXS: 4,
    marginSM: 8,
    margin: 16,
    marginMD: 16,
    marginLG: 24,
    marginXL: 32,

    // 视觉温暖化元素 (与浅色模式相同)
    borderRadius: 4,
    borderRadiusLG: 6,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)', // 深色模式阴影加深
    boxShadowSecondary: '0 1px 2px rgba(0, 0, 0, 0.20)',

    // 动画时长 (与浅色模式相同)
    motionDurationMid: '0.2s',
    motionDurationSlow: '0.3s'
  },
  components: {
    Layout: {
      headerBg: '#1f1f1f',
      headerHeight: 48,
      siderBg: '#141414',
      bodyBg: '#000000'
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: '#111b26',
      itemHoverBg: '#262626',
      itemHeight: 48,
      iconSize: 16
    },
    Button: {
      controlHeight: 32,
      borderRadius: 4,
      primaryShadow: 'none' // 移除主按钮阴影
    },
    Card: {
      borderRadius: 6
    }
  }
}

/**
 * 获取主题配置
 * @param mode 主题模式 ('light' | 'dark')
 * @returns ThemeConfig
 */
export function getThemeConfig(mode: 'light' | 'dark'): ThemeConfig {
  return mode === 'dark' ? darkTheme : lightTheme
}

/**
 * 系统字体栈
 */
export const systemFontFamily =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif"

/**
 * 语义化颜色映射 - 浅色模式
 */
export const lightSemanticColors: ColorTokens = {
  knowledge: '#1890ff', // 蓝色
  diary: '#52c41a', // 绿色
  reminder: '#fa8c16', // 橙色
  bgPrimary: '#ffffff',
  bgSecondary: '#fafafa',
  bgTertiary: '#f0f0f0',
  borderColor: '#d9d9d9',
  textPrimary: '#262626',
  textSecondary: '#595959',
  textTertiary: '#8c8c8c'
}

/**
 * 语义化颜色映射 - 深色模式
 */
export const darkSemanticColors: ColorTokens = {
  knowledge: '#40a9ff', // 更亮的蓝色
  diary: '#73d13d', // 更亮的绿色
  reminder: '#ffa940', // 更亮的橙色
  bgPrimary: '#141414',
  bgSecondary: '#1f1f1f',
  bgTertiary: '#262626',
  borderColor: '#434343',
  textPrimary: 'rgba(255, 255, 255, 0.87)',
  textSecondary: 'rgba(255, 255, 255, 0.65)',
  textTertiary: 'rgba(255, 255, 255, 0.45)'
}

/**
 * 获取语义化颜色
 * @param mode 主题模式
 * @returns ColorTokens
 */
export function getSemanticColors(mode: 'light' | 'dark'): ColorTokens {
  return mode === 'dark' ? darkSemanticColors : lightSemanticColors
}



