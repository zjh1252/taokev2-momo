/**
 * 滑块验证码封装（对齐 frontend src/lib/captcha.ts）
 *
 * H5：可后续接入 tac 静态资源；当前 captcha 未启用时不会触发。
 * 小程序：暂不支持 DOM 滑块，遇到 CAPTCHA_REQUIRED 时提示改用账号密码登录。
 */

export const CAPTCHA_REQUIRED_CODE = 10021;

const MP_CAPTCHA_HINT = '当前需完成滑块验证。小程序暂不支持滑块，请改用「账号登录」或前往 PC/H5 端操作';

/**
 * @param {(captchaToken: string|undefined, silent: boolean) => Promise<any>} call
 */
export async function withCaptcha(call) {
  try {
    return await call(undefined, true);
  } catch (e) {
    if (e?.code !== CAPTCHA_REQUIRED_CODE) {
      throw e;
    }

    // #ifdef H5
    throw new Error('请先完成滑块验证（H5 滑块组件接入中，请暂时使用账号密码登录）');
    // #endif

    // #ifdef MP-WEIXIN || APP-PLUS
    throw new Error(MP_CAPTCHA_HINT);
    // #endif
  }
}
