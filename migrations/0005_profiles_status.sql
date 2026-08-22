-- Operator status for revoke. Existing rows stay ACTIVE.
alter table app_profiles
  add column if not exists status text not null default 'ACTIVE';

alter table app_profiles
  drop constraint if exists app_profiles_status_check;

alter table app_profiles
  add constraint app_profiles_status_check
  check (status in ('ACTIVE', 'REVOKED'));
