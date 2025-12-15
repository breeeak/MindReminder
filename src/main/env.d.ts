/// <reference types="vite/client" />

// 声明静态资源模块
declare module '*.png' {
  const src: string
  export default src
}

declare module '*.png?asset' {
  const src: string
  export default src
}

declare module '*.jpg' {
  const src: string
  export default src
}

declare module '*.jpeg' {
  const src: string
  export default src
}

declare module '*.svg' {
  const src: string
  export default src
}

declare module '*.ico' {
  const src: string
  export default src
}

declare module '*.icns' {
  const src: string
  export default src
}

// 扩展 Electron App 类型
declare module 'electron' {
  interface App {
    isQuitting?: boolean
  }
}

