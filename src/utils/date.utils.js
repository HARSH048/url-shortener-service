export const getDateRange = (startDate) => {
  const formattedDateStart = startDate.replace(/\//g, '-');
  const startOfDay = new Date(`${formattedDateStart}T00:00:00.000Z`);
  const endOfDay = new Date(`${formattedDateStart}T23:59:59.999Z`);
  return { startOfDay, endOfDay };
};

export const getRecentDays = (days) => {
  const dates = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
};