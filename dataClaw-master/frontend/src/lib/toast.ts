import { toast } from 'sonner';

/**
 * 语义化 Toast 便捷工具
 * <p>封装 sonner 的 toast 调用，业务代码可直接 import 使用。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-07 16:00
 */

/** 成功提示（绿色） */
export const showSuccess = (message: string) => toast.success(message);

/** 错误/危险提示（大红色） */
export const showError = (message: string) => toast.error(message);

/** 信息提示（主题色轻柔版） */
export const showInfo = (message: string) => toast.info(message);
