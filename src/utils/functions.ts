export function groupByProperty(array, property) {
  return array.reduce((grouped, item) => {
    const key = item[property];
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(item);
    return grouped;
  }, {});
}

export const renderDailyDivider = (index, list) => {
  if (index === 0) return true;

  const current = list[index];
  const previous = list[index - 1];

  if (new Date(current.date).getDay() !== new Date(previous.date).getDay())
    return true;
  return false;
};
