/** 平台客服电话 — 对齐 PC floating-actions */

export const SERVICE_PHONE = '021-34606062';
export const SERVICE_PHONE_DIAL = '02134606062';

export function callServicePhone() {
  uni.makePhoneCall({
    phoneNumber: SERVICE_PHONE_DIAL,
    fail: () => {
      uni.showToast({ title: SERVICE_PHONE, icon: 'none' });
    },
  });
}
