'use client';

import { useState, useEffect } from 'react';
import { Editor, Toolbar } from '@wangeditor-next/editor-for-react';
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor-next/editor';
import '@wangeditor-next/editor/dist/css/style.css';
import { storage } from '@/lib/storage';
import { TOKEN_KEY } from '@/lib/auth/constants';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

interface RichTextEditorInnerProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  /** 编辑器最小高度，默认 300 */
  minHeight?: number;
  disabled?: boolean;
}

function getAccessToken(): string {
  const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
  return tokenData?.accessToken || '';
}

/**
 * 富文本编辑器内部实现组件，基于 wangEditor-next
 * 支持受控模式（value / onChange），图片上传对接 POST /uploads/images
 *
 * @author Fangxinxin
 * @date 2026-04-07 10:00
 */
export default function RichTextEditorInner({
  value = '',
  onChange,
  placeholder = '请输入内容...',
  minHeight = 300,
  disabled = false,
}: RichTextEditorInnerProps) {
  const [editor, setEditor] = useState<IDomEditor | null>(null);

  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
        setEditor(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toolbarConfig: Partial<IToolbarConfig> = {
    excludeKeys: ['group-video', 'insertVideo', 'uploadVideo'],
  };

  const editorConfig: Partial<IEditorConfig> = {
    placeholder,
    readOnly: disabled,
    MENU_CONF: {
      uploadImage: {
        maxFileSize: 5 * 1024 * 1024,
        allowedFileTypes: ['image/*'],
        async customUpload(file: File, insertFn: (url: string) => void) {
          const formData = new FormData();
          formData.append('file', file);
          try {
            const resp = await fetch(`${API_BASE_URL}/uploads/images`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${getAccessToken()}` },
              body: formData,
            });
            const json = await resp.json();
            if (json.code === 0 && json.data?.url) {
              insertFn(json.data.url);
            }
          } catch {
            // 上传失败静默处理
          }
        },
      },
    },
  };

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      <Toolbar
        editor={editor}
        defaultConfig={toolbarConfig}
        mode="default"
        style={{ borderBottom: '1px solid #e2e8f0' }}
      />
      <Editor
        defaultConfig={editorConfig}
        value={value}
        onCreated={setEditor}
        onChange={(e) => {
          const html = e.getHtml();
          onChange?.(html);
        }}
        mode="default"
        style={{ minHeight, overflowY: 'hidden' }}
      />
    </div>
  );
}
