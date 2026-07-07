export const POSITION_GAP = 1024;

export function positionBetween(
  before: number | null,
  after: number | null,
): number {
  if (before === null && after === null) {
    return POSITION_GAP;
  }
  if (before === null) {
    return after! - POSITION_GAP;
  }
  if (after === null) {
    return before + POSITION_GAP;
  }
  return (before + after) / 2;
}

export function needsRebalance(before: number, after: number): boolean {
  return after - before < 1e-6;
}

export function rebalancePositions(count: number): number[] {
  return Array.from({ length: count }, (_, index) => (index + 1) * POSITION_GAP);
}

export function nextAppendPosition(lastPosition: number | null): number {
  return lastPosition === null ? POSITION_GAP : lastPosition + POSITION_GAP;
}
