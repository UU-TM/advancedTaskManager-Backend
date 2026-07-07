import {
  needsRebalance,
  nextAppendPosition,
  positionBetween,
  rebalancePositions,
  POSITION_GAP,
} from './position.util';

describe('position.util', () => {
  describe('positionBetween', () => {
    it('returns initial gap for empty column', () => {
      expect(positionBetween(null, null)).toBe(POSITION_GAP);
    });

    it('prepends before first item', () => {
      expect(positionBetween(null, 2048)).toBe(1024);
    });

    it('appends after last item', () => {
      expect(positionBetween(2048, null)).toBe(3072);
    });

    it('inserts between two items', () => {
      expect(positionBetween(1024, 3072)).toBe(2048);
    });
  });

  describe('needsRebalance', () => {
    it('returns true when gap is too small', () => {
      expect(needsRebalance(1, 1.0000000001)).toBe(true);
    });

    it('returns false when gap is sufficient', () => {
      expect(needsRebalance(1024, 2048)).toBe(false);
    });
  });

  describe('rebalancePositions', () => {
    it('assigns evenly spaced positions', () => {
      expect(rebalancePositions(3)).toEqual([1024, 2048, 3072]);
    });
  });

  describe('nextAppendPosition', () => {
    it('returns initial gap for empty list', () => {
      expect(nextAppendPosition(null)).toBe(POSITION_GAP);
    });

    it('adds gap after last position', () => {
      expect(nextAppendPosition(3072)).toBe(4096);
    });
  });
});
