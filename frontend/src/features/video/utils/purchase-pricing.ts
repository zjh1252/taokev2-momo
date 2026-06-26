/** 按人数计算小计：封顶前 = 单价 × 人数，达到封顶价后不再增加 */
export function calcVideoSubtotal(unitPrice: number, quantity: number, companyCap: number) {
  const raw = unitPrice * Math.max(1, quantity);
  if (companyCap > 0 && raw > companyCap) {
    return companyCap;
  }
  return raw;
}

export function formatVideoMoney(value: number) {
  return value.toFixed(2);
}
