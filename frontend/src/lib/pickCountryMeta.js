/**
 * @param {string | undefined} country
 * @param {(key: string) => string} t
 */
export function pickCountryLabel(country, t) {
  if (country === "KR") return t("pickDetail.countryKr");
  if (country === "HK") return t("pickDetail.countryHk");
  return t("pickDetail.countryUs");
}

/** @param {string | undefined} country */
export function pickCurrencyLabel(country) {
  if (country === "KR") return "KRW";
  if (country === "HK") return "HKD";
  return "USD";
}
