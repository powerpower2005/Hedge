export function formatReturn(rate) {
  if (rate == null || Number.isNaN(rate)) return "—";
  return `${(rate * 100).toFixed(1)}%`;
}

export function formatPrice(country, price) {
  if (price == null || Number.isNaN(price)) return "—";
  if (country === "KR") return `₩${price.toLocaleString("ko-KR", { maximumFractionDigits: 0 })}`;
  return `$${price.toFixed(2)}`;
}
