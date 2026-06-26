/**
 * 文件上传接口
 *
 * 使用 uni.uploadFile（不能走 uni.request）；后端 multipart 字段名：file
 * 限制：单文件 ≤10MB；图片类型 jpg/jpeg/png/gif/webp
 *
 * 返回值规范：解包后的 FileUploadResponse（{ url, name, size, ... }），与其他 API 模块一致
 */
import config from '@/configs';
import { getToken } from '@/utils/request';

/**
 * 内部通用上传方法
 * @param {string} endpoint 例如 '/uploads/avatars'
 * @param {string} filePath 本地文件临时路径（uni.chooseImage 返回的 tempFilePaths[0]）
 * @param {Object} [extraFormData] 额外的表单字段（用于通用 /uploads/files 等）
 */
function uploadFile(endpoint, filePath, extraFormData = {}) {
  const token = getToken();
  const url = config.baseURL + endpoint;
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url,
      filePath,
      name: 'file',
      formData: extraFormData,
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success: (res) => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          uni.showToast({ title: `上传失败（${res.statusCode}）`, icon: 'none' });
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        let body = res.data;
        try {
          body = typeof body === 'string' ? JSON.parse(body) : body;
        } catch (_) { /* keep raw */ }
        if (body && typeof body === 'object' && 'code' in body) {
          if (body.code === 0) {
            resolve(body.data);
          } else {
            uni.showToast({ title: body.message || '上传失败', icon: 'none' });
            const err = new Error(body.message || 'UploadError');
            err.code = body.code;
            reject(err);
          }
        } else {
          resolve(body);
        }
      },
      fail: (err) => {
        uni.showToast({ title: err.errMsg || '上传失败', icon: 'none' });
        reject(err);
      },
    });
  });
}

/** 上传头像 → POST /uploads/avatars，返回 { url, ... } */
export const uploadAvatar = (filePath) => uploadFile('/uploads/avatars', filePath);

/** 上传通用图片 → POST /uploads/images */
export const uploadImage = (filePath) => uploadFile('/uploads/images', filePath);

/** 上传通用文件（PDF/Word 等）→ POST /uploads/files */
export const uploadDoc = (filePath) => uploadFile('/uploads/files', filePath);

/**
 * 认证证明文件上传：图片走 /uploads/images，其它走 /uploads/files
 * @param {string} filePath uni 本地临时路径
 * @returns {Promise<string>} 后端返回的文件 URL
 */
export async function uploadCertFile(filePath) {
  const lower = (filePath || '').toLowerCase();
  const isImage = /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/.test(lower)
    || lower.includes('tmp') && !/\.(pdf|doc|docx)(\?.*)?$/.test(lower);
  const data = isImage ? await uploadImage(filePath) : await uploadDoc(filePath);
  return data?.url || data;
}
