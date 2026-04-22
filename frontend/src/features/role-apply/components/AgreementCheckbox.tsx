'use client';

import { Link } from '@/i18n/navigation';

interface AgreementCheckboxProps {
  /** 复选框唯一 id（避免同页多份重复） */
  id: string;
  /** 协议中文标题，例如 "淘课网注册专家经纪人合作协议" */
  title: string;
  /** 协议正文页面的内部路径 */
  href: string;
  /** 当前勾选状态 */
  checked: boolean;
  /** 协议版本号；默认 v1 */
  version?: string;
  /** 勾选状态变化回调 — 同时返回当前的版本号 */
  onChange: (checked: boolean, version: string) => void;
}

/**
 * 通用「合作协议勾选」组件 — 角色申请表单底部统一使用。
 *
 * <p>勾选后会同时回写当前协议版本号，便于上层立即落库。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-22 14:30
 */
export default function AgreementCheckbox({
  id,
  title,
  href,
  checked,
  version = 'v1',
  onChange,
}: AgreementCheckboxProps) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-slate-50 p-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked, version)}
        className="mt-0.5 size-4 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer"
      />
      <label htmlFor={id} className="text-sm text-gray-700 cursor-pointer">
        我已阅读并同意
        <Link
          href={href}
          target="_blank"
          className="text-primary hover:underline mx-1"
        >
          《{title}》
        </Link>
        <span className="text-red-500">*</span>
      </label>
    </div>
  );
}
