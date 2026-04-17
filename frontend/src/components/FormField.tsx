/**
 * 共享的表单字段包装组件
 *
 * @author Fangxinxin
 * @date 2026-04-16
 */

interface FormFieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

/**
 * 表单字段包装组件 - 显示标签和必填星号
 */
export function FormField({ label, required, children }: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
