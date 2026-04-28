/**
 * 从本地视频文件抽取首帧并以 JPEG Blob 返回。
 *
 * <p>用于「上传视频后自动生成封面」场景：将视频文件用 ObjectURL 加载到隐藏
 * 的 {@code <video>}，跳到极小偏移量（避免 0s 黑帧）后绘制到 canvas，
 * 再 toBlob 输出。</p>
 *
 * @param file 本地视频文件
 * @param seekSeconds 抽帧偏移秒，默认 0.1s（避开纯黑首帧）
 * @param quality JPEG 质量 0-1，默认 0.85
 * @returns 抽取的封面 Blob
 *
 * @author Fangxinxin
 * @date 2026-04-28 17:30
 */
export async function extractVideoFirstFrame(
  file: File,
  seekSeconds = 0.1,
  quality = 0.85,
): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    // 关键：跨域 ObjectURL 也需 anonymous 才能 drawImage
    video.crossOrigin = 'anonymous';

    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.removeAttribute('src');
      video.load();
    };

    const onError = () => {
      cleanup();
      reject(new Error('视频解码失败，无法抽取封面'));
    };

    video.addEventListener('error', onError);

    video.addEventListener(
      'loadedmetadata',
      () => {
        // 视频时长太短时直接取 0
        const seek = Number.isFinite(video.duration) && video.duration > seekSeconds
          ? seekSeconds
          : 0;
        try {
          video.currentTime = seek;
        } catch {
          onError();
        }
      },
      { once: true },
    );

    video.addEventListener(
      'seeked',
      () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 1280;
          canvas.height = video.videoHeight || 720;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            cleanup();
            reject(new Error('无法创建画布'));
            return;
          }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => {
              cleanup();
              if (blob) resolve(blob);
              else reject(new Error('封面生成失败'));
            },
            'image/jpeg',
            quality,
          );
        } catch (err) {
          cleanup();
          reject(err instanceof Error ? err : new Error('封面生成失败'));
        }
      },
      { once: true },
    );

    video.src = url;
  });
}
