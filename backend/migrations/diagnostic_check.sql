-- ── DIAGNOSTIC: Run this first to see what exists ────────────
SELECT 'rm_categories' AS tbl, COUNT(*) FROM rm_categories
UNION ALL
SELECT 'rm_shapes', COUNT(*) FROM rm_shapes
UNION ALL
SELECT 'material_grades', COUNT(*) FROM material_grades
UNION ALL
SELECT 'material_types (with category_id)', COUNT(*) FROM material_types WHERE category_id IS NOT NULL;
