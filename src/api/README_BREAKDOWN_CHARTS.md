API usage for breakdown charts (frontend)

- Hook: useGetBreakdownCharts(params)
- Endpoint: GET /maintenance/signages/breakdown/chart
- Params: startdate, enddate, cabang_id, equipment_id, lokasi_id, kategori|ctg, top
- Returns rows: { range, filters, daily_series, daily_series_by_status, status_distribution, top_equipment }

Example:
```
const { data: charts, loading } = useGetBreakdownCharts({ cabang_id: 2, ctg: 'HE' })
```
