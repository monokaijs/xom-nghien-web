-- Persist the order chosen in the game-server admin screen.
-- This is safe to run on every deployment. Negative IDs preserve the previous
-- newest-first presentation only when the column is first introduced.
SET @needs_server_sort_order = (
  SELECT COUNT(*) = 0
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'servers'
    AND column_name = 'sort_order'
);

SET @add_server_sort_order = IF(
  @needs_server_sort_order,
  'ALTER TABLE servers ADD COLUMN sort_order INT NOT NULL DEFAULT 0 AFTER metadata_url',
  'SELECT 1'
);

PREPARE add_server_sort_order_statement FROM @add_server_sort_order;
EXECUTE add_server_sort_order_statement;
DEALLOCATE PREPARE add_server_sort_order_statement;

UPDATE servers SET sort_order = -id WHERE @needs_server_sort_order = 1;
