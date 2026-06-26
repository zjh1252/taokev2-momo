import dynamic from 'next/dynamic';

/**
 * 公共富文本编辑器（SSR safe）
 *
 * <p>使用 next/dynamic 延迟加载 wangEditor-next，避免服务端渲染报错。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-07 10:00
 */
const RichTextEditor = dynamic(() => import('./RichTextEditorInner'), {
  ssr: false,
  loading: () => (
    <div className="border border-slate-200 rounded-lg bg-slate-50 animate-pulse" style={{ minHeight: 300 }} />
  ),
});

export default RichTextEditor;
