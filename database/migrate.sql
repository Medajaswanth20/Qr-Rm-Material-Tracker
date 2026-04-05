-- Backup Shipment_db first. Run once.
-- If a statement fails (already migrated), skip that line.
--
-- report table (rebuild with fix_report_table.sql): uom, material_grade, total_kgs
--   One row per (material_grade, uom); total_kgs = SUM(kgs) from shipments.

BEGIN;

ALTER TABLE categories RENAME TO material_types;

ALTER TABLE shipments RENAME COLUMN product TO raw_material_dimensions;
ALTER TABLE shipments RENAME COLUMN country TO material_grade;
ALTER TABLE shipments RENAME COLUMN category TO material_type;
ALTER TABLE shipments RENAME COLUMN quantity TO kgs;
ALTER TABLE shipments RENAME COLUMN sales TO uom;

ALTER TABLE shipments ALTER COLUMN uom TYPE text USING (
  CASE WHEN uom IS NULL THEN NULL ELSE trim(both FROM uom::text) END
);

-- Rebuild report to uom + material_grade + total_kgs (run fix_report_table.sql next)

COMMIT;
