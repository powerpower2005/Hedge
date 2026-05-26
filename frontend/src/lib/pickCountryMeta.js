/**
 * @param {string | undefined} country
 * @param {(key: string) => string} t
 */
export function pickCountryLabel(country, t) {
  if (country === "KR") return t("pickDetail.countryKr");
  if (country === "HK") return t("pickDetail.countryHk");
  if (country === "JP") return t("pickDetail.countryJp");
  return t("pickDetail.countryUs");
}

/** @param {string | undefined} country */
export function pickCurrencyLabel(country) {
  if (country === "KR") return "KRW";
  if (country === "HK") return "HKD";
  if (country === "JP") return "JPY";
  return "USD";
}
