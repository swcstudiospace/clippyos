-- One AnalyticsSnapshot per client per calendar day. Later pulls update the same row.
create unique index if not exists analytics_snapshots_client_date_uidx
  on analytics_snapshots (client_id, date);
