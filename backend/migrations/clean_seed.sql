-- ══════════════════════════════════════════════════════════════
--  CLEAN SEED — Run this in Supabase SQL Editor
--  Safe to run multiple times (uses TRUNCATE + re-insert)
-- ══════════════════════════════════════════════════════════════

-- Step 1: Seed categories (safe upsert)
INSERT INTO rm_categories (name) VALUES
  ('Metal'), ('Plastic'), ('Rubber'),
  ('Wood'), ('Glass'), ('Chemical'), ('Textile')
ON CONFLICT (name) DO NOTHING;

-- ── Verify categories ──────────────────────────────────────
-- SELECT * FROM rm_categories;

-- Step 2: Seed rm_shapes — Metal
DO $$
DECLARE
  metal_id INT;
  plastic_id INT;
  rubber_id INT;
  wood_id INT;
  glass_id INT;
  chem_id INT;
  textile_id INT;
BEGIN
  SELECT id INTO metal_id   FROM rm_categories WHERE name = 'Metal';
  SELECT id INTO plastic_id FROM rm_categories WHERE name = 'Plastic';
  SELECT id INTO rubber_id  FROM rm_categories WHERE name = 'Rubber';
  SELECT id INTO wood_id    FROM rm_categories WHERE name = 'Wood';
  SELECT id INTO glass_id   FROM rm_categories WHERE name = 'Glass';
  SELECT id INTO chem_id    FROM rm_categories WHERE name = 'Chemical';
  SELECT id INTO textile_id FROM rm_categories WHERE name = 'Textile';

  -- ── METAL ────────────────────────────────────────────────
  INSERT INTO rm_shapes (category_id, shape_name, dim_format, dim_fields, calc_type) VALUES
  (metal_id, 'Round Rod', 'OD × L',
   '[{"key":"od","label":"Diameter","unit":"mm","type":"number"},{"key":"l","label":"Length","unit":"mm","type":"number"}]',
   'rod')
  ON CONFLICT (category_id, shape_name) DO UPDATE SET
    dim_format = EXCLUDED.dim_format,
    dim_fields = EXCLUDED.dim_fields,
    calc_type  = EXCLUDED.calc_type;

  INSERT INTO rm_shapes (category_id, shape_name, dim_format, dim_fields, calc_type) VALUES
  (metal_id, 'Pipe / Tube', 'OD × ID × L',
   '[{"key":"od","label":"Outer Dia","unit":"mm","type":"number"},{"key":"id","label":"Inner Dia","unit":"mm","type":"number"},{"key":"l","label":"Length","unit":"mm","type":"number"}]',
   'pipe')
  ON CONFLICT (category_id, shape_name) DO UPDATE SET
    dim_format = EXCLUDED.dim_format, dim_fields = EXCLUDED.dim_fields, calc_type = EXCLUDED.calc_type;

  INSERT INTO rm_shapes (category_id, shape_name, dim_format, dim_fields, calc_type) VALUES
  (metal_id, 'Sheet / Plate', 'L × W × T',
   '[{"key":"l","label":"Length","unit":"mm","type":"number"},{"key":"w","label":"Width","unit":"mm","type":"number"},{"key":"t","label":"Thickness","unit":"mm","type":"number"}]',
   'sheet')
  ON CONFLICT (category_id, shape_name) DO UPDATE SET
    dim_format = EXCLUDED.dim_format, dim_fields = EXCLUDED.dim_fields, calc_type = EXCLUDED.calc_type;

  INSERT INTO rm_shapes (category_id, shape_name, dim_format, dim_fields, calc_type) VALUES
  (metal_id, 'Flat Bar', 'W × T × L',
   '[{"key":"w","label":"Width","unit":"mm","type":"number"},{"key":"t","label":"Thickness","unit":"mm","type":"number"},{"key":"l","label":"Length","unit":"mm","type":"number"}]',
   'flat_bar')
  ON CONFLICT (category_id, shape_name) DO UPDATE SET
    dim_format = EXCLUDED.dim_format, dim_fields = EXCLUDED.dim_fields, calc_type = EXCLUDED.calc_type;

  INSERT INTO rm_shapes (category_id, shape_name, dim_format, dim_fields, calc_type) VALUES
  (metal_id, 'Square Bar', 'A × A × L',
   '[{"key":"a","label":"Side","unit":"mm","type":"number"},{"key":"l","label":"Length","unit":"mm","type":"number"}]',
   'square_bar')
  ON CONFLICT (category_id, shape_name) DO UPDATE SET
    dim_format = EXCLUDED.dim_format, dim_fields = EXCLUDED.dim_fields, calc_type = EXCLUDED.calc_type;

  INSERT INTO rm_shapes (category_id, shape_name, dim_format, dim_fields, calc_type) VALUES
  (metal_id, 'Rectangular Bar', 'W × H × L',
   '[{"key":"w","label":"Width","unit":"mm","type":"number"},{"key":"h","label":"Height","unit":"mm","type":"number"},{"key":"l","label":"Length","unit":"mm","type":"number"}]',
   'rect_bar')
  ON CONFLICT (category_id, shape_name) DO UPDATE SET
    dim_format = EXCLUDED.dim_format, dim_fields = EXCLUDED.dim_fields, calc_type = EXCLUDED.calc_type;

  INSERT INTO rm_shapes (category_id, shape_name, dim_format, dim_fields, calc_type) VALUES
  (metal_id, 'Angle', 'A × B × T × L',
   '[{"key":"a","label":"Leg 1","unit":"mm","type":"number"},{"key":"b","label":"Leg 2","unit":"mm","type":"number"},{"key":"t","label":"Thickness","unit":"mm","type":"number"},{"key":"l","label":"Length","unit":"mm","type":"number"}]',
   'angle')
  ON CONFLICT (category_id, shape_name) DO UPDATE SET
    dim_format = EXCLUDED.dim_format, dim_fields = EXCLUDED.dim_fields, calc_type = EXCLUDED.calc_type;

  INSERT INTO rm_shapes (category_id, shape_name, dim_format, dim_fields, calc_type) VALUES
  (metal_id, 'Channel', 'W × H × T × L',
   '[{"key":"w","label":"Width","unit":"mm","type":"number"},{"key":"h","label":"Height","unit":"mm","type":"number"},{"key":"t","label":"Thickness","unit":"mm","type":"number"},{"key":"l","label":"Length","unit":"mm","type":"number"}]',
   'channel')
  ON CONFLICT (category_id, shape_name) DO UPDATE SET
    dim_format = EXCLUDED.dim_format, dim_fields = EXCLUDED.dim_fields, calc_type = EXCLUDED.calc_type;

  INSERT INTO rm_shapes (category_id, shape_name, dim_format, dim_fields, calc_type) VALUES
  (metal_id, 'Beam (I/H)', 'H × W × T × L',
   '[{"key":"h","label":"Height","unit":"mm","type":"number"},{"key":"w","label":"Flange Width","unit":"mm","type":"number"},{"key":"t","label":"Web Thickness","unit":"mm","type":"number"},{"key":"l","label":"Length","unit":"mm","type":"number"}]',
   'beam')
  ON CONFLICT (category_id, shape_name) DO UPDATE SET
    dim_format = EXCLUDED.dim_format, dim_fields = EXCLUDED.dim_fields, calc_type = EXCLUDED.calc_type;

  INSERT INTO rm_shapes (category_id, shape_name, dim_format, dim_fields, calc_type) VALUES
  (metal_id, 'Coil', 'W × T × Weight',
   '[{"key":"w","label":"Width","unit":"mm","type":"number"},{"key":"t","label":"Thickness","unit":"mm","type":"number"},{"key":"wt","label":"Weight","unit":"kg","type":"number"}]',
   'weight_only')
  ON CONFLICT (category_id, shape_name) DO UPDATE SET
    dim_format = EXCLUDED.dim_format, dim_fields = EXCLUDED.dim_fields, calc_type = EXCLUDED.calc_type;

  INSERT INTO rm_shapes (category_id, shape_name, dim_format, dim_fields, calc_type) VALUES
  (metal_id, 'Wire', 'Dia × Length',
   '[{"key":"od","label":"Diameter","unit":"mm","type":"number"},{"key":"l","label":"Length","unit":"mm","type":"number"}]',
   'rod')
  ON CONFLICT (category_id, shape_name) DO UPDATE SET
    dim_format = EXCLUDED.dim_format, dim_fields = EXCLUDED.dim_fields, calc_type = EXCLUDED.calc_type;

  -- ── PLASTIC ──────────────────────────────────────────────
  INSERT INTO rm_shapes (category_id, shape_name, dim_format, dim_fields, calc_type) VALUES
  (plastic_id, 'Rod', 'OD × L',
   '[{"key":"od","label":"Diameter","unit":"mm","type":"number"},{"key":"l","label":"Length","unit":"mm","type":"number"}]',
   'rod')
  ON CONFLICT (category_id, shape_name) DO UPDATE SET
    dim_format = EXCLUDED.dim_format, dim_fields = EXCLUDED.dim_fields, calc_type = EXCLUDED.calc_type;

  INSERT INTO rm_shapes (category_id, shape_name, dim_format, dim_fields, calc_type) VALUES
  (plastic_id, 'Pipe', 'OD × ID × L',
   '[{"key":"od","label":"Outer Dia","unit":"mm","type":"number"},{"key":"id","label":"Inner Dia","unit":"mm","type":"number"},{"key":"l","label":"Length","unit":"mm","type":"number"}]',
   'pipe')
  ON CONFLICT (category_id, shape_name) DO UPDATE SET
    dim_format = EXCLUDED.dim_format, dim_fields = EXCLUDED.dim_fields, calc_type = EXCLUDED.calc_type;

  INSERT INTO rm_shapes (category_id, shape_name, dim_format, dim_fields, calc_type) VALUES
  (plastic_id, 'Sheet', 'L × W × T',
   '[{"key":"l","label":"Length","unit":"mm","type":"number"},{"key":"w","label":"Width","unit":"mm","type":"number"},{"key":"t","label":"Thickness","unit":"mm","type":"number"}]',
   'sheet')
  ON CONFLICT (category_id, shape_name) DO UPDATE SET
    dim_format = EXCLUDED.dim_format, dim_fields = EXCLUDED.dim_fields, calc_type = EXCLUDED.calc_type;

  INSERT INTO rm_shapes (category_id, shape_name, dim_format, dim_fields, calc_type) VALUES
  (plastic_id, 'Film', 'W × T × Length',
   '[{"key":"w","label":"Width","unit":"mm","type":"number"},{"key":"t","label":"Thickness","unit":"mm","type":"number"},{"key":"l","label":"Length","unit":"mm","type":"number"}]',
   'flat_bar')
  ON CONFLICT (category_id, shape_name) DO UPDATE SET
    dim_format = EXCLUDED.dim_format, dim_fields = EXCLUDED.dim_fields, calc_type = EXCLUDED.calc_type;

  INSERT INTO rm_shapes (category_id, shape_name, dim_format, dim_fields, calc_type) VALUES
  (plastic_id, 'Roll', 'W × T × Weight',
   '[{"key":"w","label":"Width","unit":"mm","type":"number"},{"key":"t","label":"Thickness","unit":"mm","type":"number"},{"key":"wt","label":"Weight","unit":"kg","type":"number"}]',
   'weight_only')
  ON CONFLICT (category_id, shape_name) DO UPDATE SET
    dim_format = EXCLUDED.dim_format, dim_fields = EXCLUDED.dim_fields, calc_type = EXCLUDED.calc_type;

  INSERT INTO rm_shapes (category_id, shape_name, dim_format, dim_fields, calc_type) VALUES
  (plastic_id, 'Granules', 'Weight',
   '[{"key":"wt","label":"Weight","unit":"kg","type":"number"}]',
   'weight_only')
  ON CONFLICT (category_id, shape_name) DO UPDATE SET
    dim_format = EXCLUDED.dim_format, dim_fields = EXCLUDED.dim_fields, calc_type = EXCLUDED.calc_type;

  INSERT INTO rm_shapes (category_id, shape_name, dim_format, dim_fields, calc_type) VALUES
  (plastic_id, 'Block', 'L × W × H',
   '[{"key":"l","label":"Length","unit":"mm","type":"number"},{"key":"w","label":"Width","unit":"mm","type":"number"},{"key":"h","label":"Height","unit":"mm","type":"number"}]',
   'rect_bar')
  ON CONFLICT (category_id, shape_name) DO UPDATE SET
    dim_format = EXCLUDED.dim_format, dim_fields = EXCLUDED.dim_fields, calc_type = EXCLUDED.calc_type;

  INSERT INTO rm_shapes (category_id, shape_name, dim_format, dim_fields, calc_type) VALUES
  (plastic_id, 'Profile', 'Profile × L',
   '[{"key":"profile","label":"Profile Description","unit":"","type":"text"},{"key":"l","label":"Length","unit":"mm","type":"number"}]',
   'weight_only')
  ON CONFLICT (category_id, shape_name) DO UPDATE SET
    dim_format = EXCLUDED.dim_format, dim_fields = EXCLUDED.dim_fields, calc_type = EXCLUDED.calc_type;

  -- ── RUBBER ───────────────────────────────────────────────
  INSERT INTO rm_shapes (category_id, shape_name, dim_format, dim_fields, calc_type) VALUES
  (rubber_id, 'Sheet', 'L × W × T',
   '[{"key":"l","label":"Length","unit":"mm","type":"number"},{"key":"w","label":"Width","unit":"mm","type":"number"},{"key":"t","label":"Thickness","unit":"mm","type":"number"}]',
   'sheet')
  ON CONFLICT (category_id, shape_name) DO UPDATE SET
    dim_format = EXCLUDED.dim_format, dim_fields = EXCLUDED.dim_fields, calc_type = EXCLUDED.calc_type;

  INSERT INTO rm_shapes (category_id, shape_name, dim_format, dim_fields, calc_type) VALUES
  (rubber_id, 'Roll', 'W × T × Length',
   '[{"key":"w","label":"Width","unit":"mm","type":"number"},{"key":"t","label":"Thickness","unit":"mm","type":"number"},{"key":"l","label":"Length","unit":"mm","type":"number"}]',
   'flat_bar')
  ON CONFLICT (category_id, shape_name) DO UPDATE SET
    dim_format = EXCLUDED.dim_format, dim_fields = EXCLUDED.dim_fields, calc_type = EXCLUDED.calc_type;

  INSERT INTO rm_shapes (category_id, shape_name, dim_format, dim_fields, calc_type) VALUES
  (rubber_id, 'Ring', 'OD × ID × T',
   '[{"key":"od","label":"Outer Dia","unit":"mm","type":"number"},{"key":"id","label":"Inner Dia","unit":"mm","type":"number"},{"key":"t","label":"Thickness","unit":"mm","type":"number"}]',
   'ring')
  ON CONFLICT (category_id, shape_name) DO UPDATE SET
    dim_format = EXCLUDED.dim_format, dim_fields = EXCLUDED.dim_fields, calc_type = EXCLUDED.calc_type;

  INSERT INTO rm_shapes (category_id, shape_name, dim_format, dim_fields, calc_type) VALUES
  (rubber_id, 'Block', 'L × W × H',
   '[{"key":"l","label":"Length","unit":"mm","type":"number"},{"key":"w","label":"Width","unit":"mm","type":"number"},{"key":"h","label":"Height","unit":"mm","type":"number"}]',
   'rect_bar')
  ON CONFLICT (category_id, shape_name) DO UPDATE SET
    dim_format = EXCLUDED.dim_format, dim_fields = EXCLUDED.dim_fields, calc_type = EXCLUDED.calc_type;

  -- ── WOOD ─────────────────────────────────────────────────
  INSERT INTO rm_shapes (category_id, shape_name, dim_format, dim_fields, calc_type) VALUES
  (wood_id, 'Plank', 'L × W × T',
   '[{"key":"l","label":"Length","unit":"mm","type":"number"},{"key":"w","label":"Width","unit":"mm","type":"number"},{"key":"t","label":"Thickness","unit":"mm","type":"number"}]',
   'sheet')
  ON CONFLICT (category_id, shape_name) DO UPDATE SET
    dim_format = EXCLUDED.dim_format, dim_fields = EXCLUDED.dim_fields, calc_type = EXCLUDED.calc_type;

  INSERT INTO rm_shapes (category_id, shape_name, dim_format, dim_fields, calc_type) VALUES
  (wood_id, 'Log', 'Dia × L',
   '[{"key":"od","label":"Diameter","unit":"mm","type":"number"},{"key":"l","label":"Length","unit":"mm","type":"number"}]',
   'rod')
  ON CONFLICT (category_id, shape_name) DO UPDATE SET
    dim_format = EXCLUDED.dim_format, dim_fields = EXCLUDED.dim_fields, calc_type = EXCLUDED.calc_type;

  INSERT INTO rm_shapes (category_id, shape_name, dim_format, dim_fields, calc_type) VALUES
  (wood_id, 'Block', 'L × W × H',
   '[{"key":"l","label":"Length","unit":"mm","type":"number"},{"key":"w","label":"Width","unit":"mm","type":"number"},{"key":"h","label":"Height","unit":"mm","type":"number"}]',
   'rect_bar')
  ON CONFLICT (category_id, shape_name) DO UPDATE SET
    dim_format = EXCLUDED.dim_format, dim_fields = EXCLUDED.dim_fields, calc_type = EXCLUDED.calc_type;

  -- ── GLASS ────────────────────────────────────────────────
  INSERT INTO rm_shapes (category_id, shape_name, dim_format, dim_fields, calc_type) VALUES
  (glass_id, 'Sheet', 'L × W × T',
   '[{"key":"l","label":"Length","unit":"mm","type":"number"},{"key":"w","label":"Width","unit":"mm","type":"number"},{"key":"t","label":"Thickness","unit":"mm","type":"number"}]',
   'sheet')
  ON CONFLICT (category_id, shape_name) DO UPDATE SET
    dim_format = EXCLUDED.dim_format, dim_fields = EXCLUDED.dim_fields, calc_type = EXCLUDED.calc_type;

  -- ── CHEMICAL ─────────────────────────────────────────────
  INSERT INTO rm_shapes (category_id, shape_name, dim_format, dim_fields, calc_type) VALUES
  (chem_id, 'Liquid', 'Volume / Weight',
   '[{"key":"vol","label":"Volume","unit":"L","type":"number"},{"key":"wt","label":"Weight","unit":"kg","type":"number"}]',
   'weight_only')
  ON CONFLICT (category_id, shape_name) DO UPDATE SET
    dim_format = EXCLUDED.dim_format, dim_fields = EXCLUDED.dim_fields, calc_type = EXCLUDED.calc_type;

  INSERT INTO rm_shapes (category_id, shape_name, dim_format, dim_fields, calc_type) VALUES
  (chem_id, 'Powder', 'Weight',
   '[{"key":"wt","label":"Weight","unit":"kg","type":"number"}]',
   'weight_only')
  ON CONFLICT (category_id, shape_name) DO UPDATE SET
    dim_format = EXCLUDED.dim_format, dim_fields = EXCLUDED.dim_fields, calc_type = EXCLUDED.calc_type;

  -- ── TEXTILE ──────────────────────────────────────────────
  INSERT INTO rm_shapes (category_id, shape_name, dim_format, dim_fields, calc_type) VALUES
  (textile_id, 'Roll', 'W × GSM × Length',
   '[{"key":"w","label":"Width","unit":"m","type":"number"},{"key":"gsm","label":"GSM (Density)","unit":"g/m²","type":"number"},{"key":"l","label":"Length","unit":"m","type":"number"}]',
   'textile_roll')
  ON CONFLICT (category_id, shape_name) DO UPDATE SET
    dim_format = EXCLUDED.dim_format, dim_fields = EXCLUDED.dim_fields, calc_type = EXCLUDED.calc_type;

  INSERT INTO rm_shapes (category_id, shape_name, dim_format, dim_fields, calc_type) VALUES
  (textile_id, 'Sheet', 'L × W',
   '[{"key":"l","label":"Length","unit":"m","type":"number"},{"key":"w","label":"Width","unit":"m","type":"number"}]',
   'weight_only')
  ON CONFLICT (category_id, shape_name) DO UPDATE SET
    dim_format = EXCLUDED.dim_format, dim_fields = EXCLUDED.dim_fields, calc_type = EXCLUDED.calc_type;

END $$;

-- ── Step 3: Seed material_grades for existing material_types ──
-- SS / Stainless Steel
INSERT INTO material_grades (material_type_id, grade)
SELECT mt.id, g.grade
FROM material_types mt
CROSS JOIN (VALUES
  ('201'),('202'),('301'),('304'),('304L'),('309'),('310'),
  ('316'),('316L'),('317'),('321'),('347'),('410'),('416'),
  ('420'),('430'),('440C'),('904L'),('2205'),('2507')
) AS g(grade)
WHERE UPPER(mt.name) IN ('SS','STAINLESS STEEL','STANLESS STEEL')
ON CONFLICT (material_type_id, grade) DO NOTHING;

-- MS / Mild Steel
INSERT INTO material_grades (material_type_id, grade)
SELECT mt.id, g.grade
FROM material_types mt
CROSS JOIN (VALUES
  ('IS2062 E250'),('IS2062 E350'),('EN8'),('EN9'),('EN24'),
  ('EN36'),('A36'),('A572 GR50'),('S275'),('S355')
) AS g(grade)
WHERE UPPER(mt.name) IN ('MS','MILD STEEL')
ON CONFLICT (material_type_id, grade) DO NOTHING;

-- CS / Carbon Steel
INSERT INTO material_grades (material_type_id, grade)
SELECT mt.id, g.grade
FROM material_types mt
CROSS JOIN (VALUES
  ('EN8'),('EN24'),('EN31'),('C45'),('C55'),('C60'),('1018'),('1045'),('4140')
) AS g(grade)
WHERE UPPER(mt.name) IN ('CS','CARBON STEEL')
ON CONFLICT (material_type_id, grade) DO NOTHING;

-- AL / Aluminium
INSERT INTO material_grades (material_type_id, grade)
SELECT mt.id, g.grade
FROM material_types mt
CROSS JOIN (VALUES
  ('1100'),('2011'),('2014'),('2024'),('3003'),('5052'),('5083'),
  ('5086'),('6061'),('6063'),('6082'),('6351'),('7050'),('7075'),('7068')
) AS g(grade)
WHERE UPPER(mt.name) IN ('AL','ALUMINIUM','ALUMINUM')
ON CONFLICT (material_type_id, grade) DO NOTHING;

-- Copper
INSERT INTO material_grades (material_type_id, grade)
SELECT mt.id, g.grade
FROM material_types mt
CROSS JOIN (VALUES
  ('C10100'),('C10200 (ETP)'),('C12000'),('C12200 (DHP)'),('C14500'),('C17200 (BeCu)')
) AS g(grade)
WHERE UPPER(mt.name) IN ('COPPER','CU')
ON CONFLICT (material_type_id, grade) DO NOTHING;

-- Brass
INSERT INTO material_grades (material_type_id, grade)
SELECT mt.id, g.grade
FROM material_types mt
CROSS JOIN (VALUES
  ('C26000 (260)'),('C27000 (270)'),('C28000 (280)'),('C33000'),('C36000 (360)'),('C37700')
) AS g(grade)
WHERE UPPER(mt.name) = 'BRASS'
ON CONFLICT (material_type_id, grade) DO NOTHING;

-- Bronze
INSERT INTO material_grades (material_type_id, grade)
SELECT mt.id, g.grade
FROM material_types mt
CROSS JOIN (VALUES
  ('C51000 (Phosphor)'),('C52100'),('C54400'),
  ('C86300'),('C95400 (Al Bronze)'),('C93200')
) AS g(grade)
WHERE UPPER(mt.name) = 'BRONZE'
ON CONFLICT (material_type_id, grade) DO NOTHING;

-- Titanium
INSERT INTO material_grades (material_type_id, grade)
SELECT mt.id, g.grade
FROM material_types mt
CROSS JOIN (VALUES
  ('Grade 1'),('Grade 2'),('Grade 4'),('Grade 5 (Ti-6Al-4V)'),
  ('Grade 7'),('Grade 9'),('Grade 23')
) AS g(grade)
WHERE UPPER(mt.name) IN ('TITANIUM','TI')
ON CONFLICT (material_type_id, grade) DO NOTHING;

-- Cast Iron
INSERT INTO material_grades (material_type_id, grade)
SELECT mt.id, g.grade
FROM material_types mt
CROSS JOIN (VALUES
  ('Gray CI'),('White CI'),('Malleable CI'),('Ductile (SG) CI'),
  ('FC150'),('FC200'),('FC250'),('FC300'),('SG Iron')
) AS g(grade)
WHERE UPPER(mt.name) IN ('CAST IRON','CI')
ON CONFLICT (material_type_id, grade) DO NOTHING;

-- ── Step 4: Update material_types with category_id ─────────
UPDATE material_types SET category_id = (SELECT id FROM rm_categories WHERE name = 'Metal')
WHERE UPPER(name) IN ('SS','MS','AL','ALUMINIUM','ALUMINUM','COPPER','CU','BRASS','BRONZE',
                      'TITANIUM','TI','CAST IRON','CI','CS','CARBON STEEL','MILD STEEL',
                      'STAINLESS STEEL','STANLESS STEEL','EN8','EN24','ZINC','ZN','NICKEL',
                      'NI','LEAD','PB');

UPDATE material_types SET category_id = (SELECT id FROM rm_categories WHERE name = 'Plastic')
WHERE UPPER(name) IN ('PLASTIC','PVC','HDPE','LDPE','PP','ABS','NYLON','POLYCARBONATE',
                      'PC','PTFE','ACRYLIC','PEEK','PET','UHMWPE');

UPDATE material_types SET category_id = (SELECT id FROM rm_categories WHERE name = 'Rubber')
WHERE UPPER(name) IN ('RUBBER','NATURAL RUBBER','SYNTHETIC RUBBER','SILICONE',
                      'EPDM','NBR','SBR','NEOPRENE','VITON','BUTYL RUBBER');

UPDATE material_types SET category_id = (SELECT id FROM rm_categories WHERE name = 'Wood')
WHERE UPPER(name) IN ('WOOD','TEAK','PLYWOOD','MDF','HDF','PINE','OAK','BAMBOO');

UPDATE material_types SET category_id = (SELECT id FROM rm_categories WHERE name = 'Glass')
WHERE UPPER(name) IN ('GLASS','TEMPERED GLASS','BOROSILICATE GLASS','FLOAT GLASS');

UPDATE material_types SET category_id = (SELECT id FROM rm_categories WHERE name = 'Chemical')
WHERE UPPER(name) IN ('CHEMICAL','ACID','SOLVENT','OIL','LUBRICANT','COOLANT','ADHESIVE');

UPDATE material_types SET category_id = (SELECT id FROM rm_categories WHERE name = 'Textile')
WHERE UPPER(name) IN ('TEXTILE','FABRIC','COTTON','POLYESTER','NYLON FABRIC','WOOL','FIBERGLASS');

-- ── FINAL VERIFY ────────────────────────────────────────────
SELECT 'rm_categories' AS tbl, COUNT(*) AS cnt FROM rm_categories
UNION ALL
SELECT 'rm_shapes',          COUNT(*) FROM rm_shapes
UNION ALL
SELECT 'material_grades',    COUNT(*) FROM material_grades
UNION ALL
SELECT 'material_types (categorized)', COUNT(*) FROM material_types WHERE category_id IS NOT NULL;
