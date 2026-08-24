-- Removes orphaned Airwallex credential/settings rows after the Whop cutover.
-- DESTRUCTIVE but scoped: deletes app_settings keys prefixed AIRWALLEX_.
-- Only run once all workspaces are migrated to Whop billing (see README).
delete from app_settings where key like 'AIRWALLEX\_%';
