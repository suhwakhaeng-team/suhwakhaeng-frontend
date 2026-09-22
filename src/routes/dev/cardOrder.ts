export function moveCard(order: number[], from: number, to: number): number[] {
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from >= order.length || to >= order.length || from === to) return order;
  const updated = [...order];
  const [card] = updated.splice(from, 1);
  updated.splice(to, 0, card);
  return updated;
}
