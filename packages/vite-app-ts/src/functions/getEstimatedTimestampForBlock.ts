const AVERAGE_BLOCK_TIME = 14.5 * 1000; // ms

/**
 * Gets the estimated timestamp for a give block
 * @param currentBlock
 * @param selectedBlock
 */
export const getEstimatedTimestampForBlock = (currentBlock: number, selectedBlock: number): number => {
  if (selectedBlock <= currentBlock) return 0;

  const currentTimestamp = new Date().getTime();
  const msUntilSelectedBlock = (selectedBlock - currentBlock) * AVERAGE_BLOCK_TIME;

  return currentTimestamp + msUntilSelectedBlock;
};
