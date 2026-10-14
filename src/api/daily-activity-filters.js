// Shared defaults for list and export. Plan view opts into is_plan=all.
export function dailyActivityFilters(params = {}) {
  const isPlan = params.is_plan ?? false;
  const actualOnly = !['all', true, 1, '1', 'true'].includes(isPlan);
  return {
    ...params,
    is_plan: isPlan,
    plan_status: actualOnly ? 'REALIZED' : params.plan_status || ''
  };
}
