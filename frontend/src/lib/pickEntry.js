export function isEntryPending(pick) {
  return pick?.status?.current === "pending_entry";
}

export function hasEntryPrice(pick) {
  const price = pick?.entry?.price;
  return typeof price === "number" && !Number.isNaN(price);
}
