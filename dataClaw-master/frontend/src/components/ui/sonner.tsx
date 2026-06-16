"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

/**
 * 全局 Toast 通知组件
 * <p>基于 Sonner 定制，支持 error / info / success 三种类型，
 * 顶部居中显示，3 秒自动消失，带关闭按钮。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-07 16:00
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="top-center"
      offset="80px"
      duration={3000}
      closeButton
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast: "cn-toast",
          closeButton: "!border-current/20",
          error:
            "!bg-destructive/10 !text-destructive !border-destructive/25",
          info:
            "!bg-info/15 !text-info-foreground !border-info/30",
          success:
            "!bg-success/10 !text-success !border-success/25",
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          zIndex: 100000,
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
