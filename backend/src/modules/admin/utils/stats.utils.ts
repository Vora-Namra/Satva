export const calculatePercentageChange = (current: number | string, previous: number | string): string => {
  const currNum = Number(current) || 0;
  const prevNum = Number(previous) || 0;
  
  if (prevNum === 0) {
    return currNum > 0 ? '+100%' : '0%';
  }
  
  const change = ((currNum - prevNum) / prevNum) * 100;
  return change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
};