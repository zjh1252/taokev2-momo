'use client';

import { useRef, useState } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { uploadAndParseResume, type ResumeParseResult } from '../api/service';

interface ResumeUploaderProps {
  /** 当前已上传简历的 URL（用于回显） */
  resumeUrl?: string;
  /** 解析完成回调，由父组件合并到 formData */
  onParsed: (result: ResumeParseResult) => void;
}

/**
 * 简历上传 + AI 解析按钮组件
 *
 * <p>放在专家申请表单顶部，承担「上传简历（AI解析）」入口。流程：
 * <ol>
 *   <li>选择 .docx / .pdf 文件（≤ 20MB）</li>
 *   <li>调用 {@code /trainers/me/resume/parse-and-upload} 上传 + 解析</li>
 *   <li>解析结果通过 {@code onParsed} 回调给父组件，自动预填表单</li>
 * </ol>
 *
 * @author Fangxinxin
 * @date 2026-04-21 22:30
 */
export function ResumeUploader({ resumeUrl, onParsed }: ResumeUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);

  const onPick = () => inputRef.current?.click();

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.docx') && !lower.endsWith('.pdf')) {
      toast.error('仅支持 .docx 或 .pdf 格式的简历');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('简历文件不得超过 20MB');
      return;
    }

    setUploading(true);
    setCurrentFileName(file.name);
    try {
      const { fileUrl, parseResult } = await uploadAndParseResume(file);
      // 把上传得到的 URL 一并塞进 parseResult，便于父组件回填到 formData.resumeUrl
      onParsed({ ...parseResult, resumeUrl: parseResult.resumeUrl || fileUrl });
      toast.success('简历解析成功，已自动填充可识别字段');
    } catch (err) {
      const message = err instanceof Error ? err.message : '简历解析失败';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4">
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileText className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-900">上传简历（AI 解析）</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
              推荐
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            上传 PDF / Word 简历，系统将自动识别并预填基本信息、一句话介绍、部分客户、联系方式等字段。
          </p>
          {currentFileName && !uploading && (
            <p className="mt-2 text-xs text-gray-600">最近解析文件：{currentFileName}</p>
          )}
          {resumeUrl && !uploading && !currentFileName && (
            <a
              href={resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-xs text-primary underline-offset-2 hover:underline"
            >
              查看已上传简历
            </a>
          )}
        </div>
        <div className="shrink-0">
          <button
            type="button"
            onClick={onPick}
            disabled={uploading}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {uploading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                解析中...
              </>
            ) : (
              <>
                <Upload className="size-4" />
                上传简历
              </>
            )}
          </button>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={onFileChange}
      />
    </div>
  );
}
