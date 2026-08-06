-- Push notification channel for the kasir order board.
--
-- LISTEN/NOTIFY is stock PostgreSQL, so this keeps the realtime feature
-- portable: moving off Supabase to Neon, RDS, or a self-hosted Postgres only
-- changes the connection string, not the application code.
--
-- The trigger fires per STATEMENT (not per row) so a bulk write sends one
-- wake-up, and it lives in the database so *every* write path -- server
-- actions, the future customer ordering flow, even manual SQL -- notifies the
-- board. Nothing to remember at the call site.
--
-- The payload is intentionally empty: it is only a "something changed" signal.
-- Clients re-fetch through the authenticated server component, so order
-- contents never travel over the notification channel.

CREATE OR REPLACE FUNCTION notify_order_changed() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('order_changed', '');
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS order_changed ON "Order";

CREATE TRIGGER order_changed
AFTER INSERT OR UPDATE OR DELETE ON "Order"
FOR EACH STATEMENT EXECUTE FUNCTION notify_order_changed();
