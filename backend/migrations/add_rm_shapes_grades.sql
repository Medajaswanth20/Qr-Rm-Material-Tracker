-- ============================================================
--  Migration: Dynamic RM Shapes, Categories & Grades
--  Run this ONCE in your Supabase SQL editor
-- ============================================================

-- ─── STEP 1: rm_categories ───────────────────────────────────
CREATE TABLE IF NOT EXISTS rm_categories (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO rm_categories (name) VALUES
  ('Metal'), ('Plastic'), ('Rubber'),
  ('Wood'), ('Glass'), ('Chemical'), ('Textile')
ON CONFLICT DO NOTHING;

-- ─── STEP 2: rm_shapes ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS rm_shapes (
  id          SERIAL PRIMARY KEY,
  category_id INT    NOT NULL REFERENCES rm_categories(id),
  shape_name  VARCHAR(100) NOT NULL,
  dim_format  VARCHAR(200),
  dim_fields  JSONB  NOT NULL DEFAULT '[]',
  calc_type   VARCHAR(50),
  UNIQUE(category_id, shape_name)
);

-- ── Metal shapes ─────────────────────────────────────────────
INSERT INTO rm_shapes (category_id, shape_name, dim_format, dim_fields, calc_type) VALUES

((SELECT id FROM rm_categories WHERE name='Metal'),
 'Round Rod',
 'OD × L',
 '[{"key":"od","label":"Diameter","unit":"mm","type":"number"},{"key":"l","label":"Length","unit":"mm","type":"number"}]'::jsonb,
 'rod'),

((SELECT id FROM rm_categories WHERE name='Metal'),
 'Pipe / Tube',
 'OD × ID × L',
 '[{"key":"od","label":"Outer Dia","unit":"mm","type":"number"},{"key":"id","label":"Inner Dia","unit":"mm","type":"number"},{"key":"l","label":"Length","unit":"mm","type":"number"}]'::jsonb,
 'pipe'),

((SELECT id FROM rm_categories WHERE name='Metal'),
 'Sheet / Plate',
 'L × W × T',
 '[{"key":"l","label":"Length","unit":"mm","type":"number"},{"key":"w","label":"Width","unit":"mm","type":"number"},{"key":"t","label":"Thickness","unit":"mm","type":"number"}]'::jsonb,
 'sheet'),

((SELECT id FROM rm_categories WHERE name='Metal'),
 'Flat Bar',
 'W × T × L',
 '[{"key":"w","label":"Width","unit":"mm","type":"number"},{"key":"t","label":"Thickness","unit":"mm","type":"number"},{"key":"l","label":"Length","unit":"mm","type":"number"}]'::jsonb,
 'flat_bar'),

((SELECT id FROM rm_categories WHERE name='Metal'),
 'Square Bar',
 'A × A × L',
 '[{"key":"a","label":"Side","unit":"mm","type":"number"},{"key":"l","label":"Length","unit":"mm","type":"number"}]'::jsonb,
 'square_bar'),

((SELECT id FROM rm_categories WHERE name='Metal'),
 'Rectangular Bar',
 'W × H × L',
 '[{"key":"w","label":"Width","unit":"mm","type":"number"},{"key":"h","label":"Height","unit":"mm","type":"number"},{"key":"l","label":"Length","unit":"mm","type":"number"}]'::jsonb,
 'rect_bar'),

((SELECT id FROM rm_categories WHERE name='Metal'),
 'Angle',
 'A × B × T × L',
 '[{"key":"a","label":"Leg 1","unit":"mm","type":"number"},{"key":"b","label":"Leg 2","unit":"mm","type":"number"},{"key":"t","label":"Thickness","unit":"mm","type":"number"},{"key":"l","label":"Length","unit":"mm","type":"number"}]'::jsonb,
 'angle'),

((SELECT id FROM rm_categories WHERE name='Metal'),
 'Channel',
 'W × H × T × L',
 '[{"key":"w","label":"Width","unit":"mm","type":"number"},{"key":"h","label":"Height","unit":"mm","type":"number"},{"key":"t","label":"Thickness","unit":"mm","type":"number"},{"key":"l","label":"Length","unit":"mm","type":"number"}]'::jsonb,
 'channel'),

((SELECT id FROM rm_categories WHERE name='Metal'),
 'Beam (I/H)',
 'H × W × T × L',
 '[{"key":"h","label":"Height","unit":"mm","type":"number"},{"key":"w","label":"Flange Width","unit":"mm","type":"number"},{"key":"t","label":"Web Thickness","unit":"mm","type":"number"},{"key":"l","label":"Length","unit":"mm","type":"number"}]'::jsonb,
 'beam'),

((SELECT id FROM rm_categories WHERE name='Metal'),
 'Coil',
 'W × T × Weight',
 '[{"key":"w","label":"Width","unit":"mm","type":"number"},{"key":"t","label":"Thickness","unit":"mm","type":"number"},{"key":"wt","label":"Weight","unit":"kg","type":"number"}]'::jsonb,
 'weight_only'),

((SELECT id FROM rm_categories WHERE name='Metal'),
 'Wire',
 'Dia × Length',
 '[{"key":"od","label":"Diameter","unit":"mm","type":"number"},{"key":"l","label":"Length","unit":"mm","type":"number"}]'::jsonb,
 'rod')

ON CONFLICT DO NOTHING;

-- ── Plastic shapes ────────────────────────────────────────────
INSERT INTO rm_shapes (category_id, shape_name, dim_format, dim_fields, calc_type) VALUES

((SELECT id FROM rm_categories WHERE name='Plastic'),
 'Rod',
 'OD × L',
 '[{"key":"od","label":"Diameter","unit":"mm","type":"number"},{"key":"l","label":"Length","unit":"mm","type":"number"}]'::jsonb,
 'rod'),

((SELECT id FROM rm_categories WHERE name='Plastic'),
 'Pipe',
 'OD × ID × L',
 '[{"key":"od","label":"Outer Dia","unit":"mm","type":"number"},{"key":"id","label":"Inner Dia","unit":"mm","type":"number"},{"key":"l","label":"Length","unit":"mm","type":"number"}]'::jsonb,
 'pipe'),

((SELECT id FROM rm_categories WHERE name='Plastic'),
 'Sheet',
 'L × W × T',
 '[{"key":"l","label":"Length","unit":"mm","type":"number"},{"key":"w","label":"Width","unit":"mm","type":"number"},{"key":"t","label":"Thickness","unit":"mm","type":"number"}]'::jsonb,
 'sheet'),

((SELECT id FROM rm_categories WHERE name='Plastic'),
 'Film',
 'W × T × Length',
 '[{"key":"w","label":"Width","unit":"mm","type":"number"},{"key":"t","label":"Thickness","unit":"mm","type":"number"},{"key":"l","label":"Length","unit":"mm","type":"number"}]'::jsonb,
 'flat_bar'),

((SELECT id FROM rm_categories WHERE name='Plastic'),
 'Roll',
 'W × T × Weight',
 '[{"key":"w","label":"Width","unit":"mm","type":"number"},{"key":"t","label":"Thickness","unit":"mm","type":"number"},{"key":"wt","label":"Weight","unit":"kg","type":"number"}]'::jsonb,
 'weight_only'),

((SELECT id FROM rm_categories WHERE name='Plastic'),
 'Granules',
 'Weight',
 '[{"key":"wt","label":"Weight","unit":"kg","type":"number"}]'::jsonb,
 'weight_only'),

((SELECT id FROM rm_categories WHERE name='Plastic'),
 'Block',
 'L × W × H',
 '[{"key":"l","label":"Length","unit":"mm","type":"number"},{"key":"w","label":"Width","unit":"mm","type":"number"},{"key":"h","label":"Height","unit":"mm","type":"number"}]'::jsonb,
 'rect_bar'),

((SELECT id FROM rm_categories WHERE name='Plastic'),
 'Profile',
 'Profile × L',
 '[{"key":"profile","label":"Profile Description","unit":"","type":"text"},{"key":"l","label":"Length","unit":"mm","type":"number"}]'::jsonb,
 'weight_only')

ON CONFLICT DO NOTHING;

-- ── Rubber shapes ─────────────────────────────────────────────
INSERT INTO rm_shapes (category_id, shape_name, dim_format, dim_fields, calc_type) VALUES

((SELECT id FROM rm_categories WHERE name='Rubber'),
 'Sheet',
 'L × W × T',
 '[{"key":"l","label":"Length","unit":"mm","type":"number"},{"key":"w","label":"Width","unit":"mm","type":"number"},{"key":"t","label":"Thickness","unit":"mm","type":"number"}]'::jsonb,
 'sheet'),

((SELECT id FROM rm_categories WHERE name='Rubber'),
 'Roll',
 'W × T × Length',
 '[{"key":"w","label":"Width","unit":"mm","type":"number"},{"key":"t","label":"Thickness","unit":"mm","type":"number"},{"key":"l","label":"Length","unit":"mm","type":"number"}]'::jsonb,
 'flat_bar'),

((SELECT id FROM rm_categories WHERE name='Rubber'),
 'Ring',
 'OD × ID × T',
 '[{"key":"od","label":"Outer Dia","unit":"mm","type":"number"},{"key":"id","label":"Inner Dia","unit":"mm","type":"number"},{"key":"t","label":"Thickness","unit":"mm","type":"number"}]'::jsonb,
 'ring'),

((SELECT id FROM rm_categories WHERE name='Rubber'),
 'Block',
 'L × W × H',
 '[{"key":"l","label":"Length","unit":"mm","type":"number"},{"key":"w","label":"Width","unit":"mm","type":"number"},{"key":"h","label":"Height","unit":"mm","type":"number"}]'::jsonb,
 'rect_bar')

ON CONFLICT DO NOTHING;

-- ── Wood shapes ───────────────────────────────────────────────
INSERT INTO rm_shapes (category_id, shape_name, dim_format, dim_fields, calc_type) VALUES

((SELECT id FROM rm_categories WHERE name='Wood'),
 'Plank',
 'L × W × T',
 '[{"key":"l","label":"Length","unit":"mm","type":"number"},{"key":"w","label":"Width","unit":"mm","type":"number"},{"key":"t","label":"Thickness","unit":"mm","type":"number"}]'::jsonb,
 'sheet'),

((SELECT id FROM rm_categories WHERE name='Wood'),
 'Log',
 'Dia × L',
 '[{"key":"od","label":"Diameter","unit":"mm","type":"number"},{"key":"l","label":"Length","unit":"mm","type":"number"}]'::jsonb,
 'rod'),

((SELECT id FROM rm_categories WHERE name='Wood'),
 'Block',
 'L × W × H',
 '[{"key":"l","label":"Length","unit":"mm","type":"number"},{"key":"w","label":"Width","unit":"mm","type":"number"},{"key":"h","label":"Height","unit":"mm","type":"number"}]'::jsonb,
 'rect_bar')

ON CONFLICT DO NOTHING;

-- ── Glass shapes ──────────────────────────────────────────────
INSERT INTO rm_shapes (category_id, shape_name, dim_format, dim_fields, calc_type) VALUES

((SELECT id FROM rm_categories WHERE name='Glass'),
 'Sheet',
 'L × W × T',
 '[{"key":"l","label":"Length","unit":"mm","type":"number"},{"key":"w","label":"Width","unit":"mm","type":"number"},{"key":"t","label":"Thickness","unit":"mm","type":"number"}]'::jsonb,
 'sheet')

ON CONFLICT DO NOTHING;

-- ── Chemical/Liquid shapes ────────────────────────────────────
INSERT INTO rm_shapes (category_id, shape_name, dim_format, dim_fields, calc_type) VALUES

((SELECT id FROM rm_categories WHERE name='Chemical'),
 'Liquid',
 'Volume / Weight',
 '[{"key":"vol","label":"Volume","unit":"L","type":"number"},{"key":"wt","label":"Weight","unit":"kg","type":"number"}]'::jsonb,
 'weight_only'),

((SELECT id FROM rm_categories WHERE name='Chemical'),
 'Powder',
 'Weight',
 '[{"key":"wt","label":"Weight","unit":"kg","type":"number"}]'::jsonb,
 'weight_only')

ON CONFLICT DO NOTHING;

-- ── Textile/Fabric shapes ─────────────────────────────────────
INSERT INTO rm_shapes (category_id, shape_name, dim_format, dim_fields, calc_type) VALUES

((SELECT id FROM rm_categories WHERE name='Textile'),
 'Roll',
 'W × GSM × Length',
 '[{"key":"w","label":"Width","unit":"m","type":"number"},{"key":"gsm","label":"GSM (Density)","unit":"g/m²","type":"number"},{"key":"l","label":"Length","unit":"m","type":"number"}]'::jsonb,
 'textile_roll'),

((SELECT id FROM rm_categories WHERE name='Textile'),
 'Sheet',
 'L × W',
 '[{"key":"l","label":"Length","unit":"m","type":"number"},{"key":"w","label":"Width","unit":"m","type":"number"}]'::jsonb,
 'weight_only')

ON CONFLICT DO NOTHING;

-- ─── STEP 3: Add category_id to material_types ───────────────
ALTER TABLE material_types
  ADD COLUMN IF NOT EXISTS category_id INT REFERENCES rm_categories(id);

-- Update existing material types with their category
UPDATE material_types SET category_id = (SELECT id FROM rm_categories WHERE name = 'Metal')
WHERE UPPER(name) IN ('SS','MS','AL','ALUMINIUM','ALUMINUM','COPPER','CU','BRASS','BRONZE',
                      'TITANIUM','TI','CAST IRON','CI','CS','CARBON STEEL','MILD STEEL',
                      'STAINLESS STEEL','STANLESS STEEL','EN8','EN24','ZINC','ZN','NICKEL','NI','LEAD','PB');

UPDATE material_types SET category_id = (SELECT id FROM rm_categories WHERE name = 'Plastic')
WHERE UPPER(name) IN ('PLASTIC','PVC','HDPE','LDPE','PP','ABS','NYLON','POLYCARBONATE','PC',
                      'PTFE','ACRYLIC','PEEK','PET','UHMWPE');

UPDATE material_types SET category_id = (SELECT id FROM rm_categories WHERE name = 'Rubber')
WHERE UPPER(name) IN ('RUBBER','NATURAL RUBBER','SYNTHETIC RUBBER','SILICONE','EPDM','NBR',
                      'SBR','NEOPRENE','VITON','BUTYL RUBBER');

UPDATE material_types SET category_id = (SELECT id FROM rm_categories WHERE name = 'Wood')
WHERE UPPER(name) IN ('WOOD','TEAK','PLYWOOD','MDF','HDF','PINE','OAK','BAMBOO');

UPDATE material_types SET category_id = (SELECT id FROM rm_categories WHERE name = 'Glass')
WHERE UPPER(name) IN ('GLASS','TEMPERED GLASS','BOROSILICATE GLASS','FLOAT GLASS');

UPDATE material_types SET category_id = (SELECT id FROM rm_categories WHERE name = 'Chemical')
WHERE UPPER(name) IN ('CHEMICAL','ACID','SOLVENT','OIL','LUBRICANT','COOLANT','ADHESIVE');

UPDATE material_types SET category_id = (SELECT id FROM rm_categories WHERE name = 'Textile')
WHERE UPPER(name) IN ('TEXTILE','FABRIC','COTTON','POLYESTER','NYLON FABRIC','WOOL','FIBERGLASS');

-- ─── STEP 4: material_grades table ───────────────────────────
CREATE TABLE IF NOT EXISTS material_grades (
  id               SERIAL PRIMARY KEY,
  material_type_id INT NOT NULL REFERENCES material_types(id) ON DELETE CASCADE,
  grade            VARCHAR(100) NOT NULL,
  UNIQUE(material_type_id, grade)
);

-- Seed grades for SS
INSERT INTO material_grades (material_type_id, grade)
SELECT mt.id, g.grade FROM material_types mt
CROSS JOIN (VALUES
  ('201'),('202'),('301'),('304'),('304L'),('309'),('310'),
  ('316'),('316L'),('317'),('321'),('347'),('410'),('416'),
  ('420'),('430'),('440C'),('904L'),('2205'),('2507')
) AS g(grade)
WHERE UPPER(mt.name) IN ('SS','STAINLESS STEEL','STANLESS STEEL')
ON CONFLICT DO NOTHING;

-- Seed grades for MS / Mild Steel
INSERT INTO material_grades (material_type_id, grade)
SELECT mt.id, g.grade FROM material_types mt
CROSS JOIN (VALUES
  ('IS2062 E250'),('IS2062 E350'),('EN8'),('EN9'),('EN24'),
  ('EN36'),('A36'),('A572 GR50'),('S275'),('S355')
) AS g(grade)
WHERE UPPER(mt.name) IN ('MS','MILD STEEL')
ON CONFLICT DO NOTHING;

-- Seed grades for CS / Carbon Steel
INSERT INTO material_grades (material_type_id, grade)
SELECT mt.id, g.grade FROM material_types mt
CROSS JOIN (VALUES
  ('EN8'),('EN24'),('EN31'),('C45'),('C55'),('C60'),('1018'),('1045'),('4140')
) AS g(grade)
WHERE UPPER(mt.name) IN ('CS','CARBON STEEL')
ON CONFLICT DO NOTHING;

-- Seed grades for AL / Aluminium
INSERT INTO material_grades (material_type_id, grade)
SELECT mt.id, g.grade FROM material_types mt
CROSS JOIN (VALUES
  ('1100'),('2011'),('2014'),('2024'),('3003'),('5052'),('5083'),
  ('5086'),('6061'),('6063'),('6082'),('6351'),('7050'),('7075'),('7068')
) AS g(grade)
WHERE UPPER(mt.name) IN ('AL','ALUMINIUM','ALUMINUM')
ON CONFLICT DO NOTHING;

-- Seed grades for Copper
INSERT INTO material_grades (material_type_id, grade)
SELECT mt.id, g.grade FROM material_types mt
CROSS JOIN (VALUES
  ('C10100'),('C10200 (ETP)'),('C12000'),('C12200 (DHP)'),('C14500'),('C17200 (BeCu)')
) AS g(grade)
WHERE UPPER(mt.name) IN ('COPPER','CU')
ON CONFLICT DO NOTHING;

-- Seed grades for Brass
INSERT INTO material_grades (material_type_id, grade)
SELECT mt.id, g.grade FROM material_types mt
CROSS JOIN (VALUES
  ('C26000 (260)'),('C27000 (270)'),('C28000 (280)'),
  ('C33000'),('C36000 (360)'),('C37700')
) AS g(grade)
WHERE UPPER(mt.name) = 'BRASS'
ON CONFLICT DO NOTHING;

-- Seed grades for Bronze
INSERT INTO material_grades (material_type_id, grade)
SELECT mt.id, g.grade FROM material_types mt
CROSS JOIN (VALUES
  ('C51000 (Phosphor)'),('C52100'),('C54400'),
  ('C86300'),('C95400 (Al Bronze)'),('C93200')
) AS g(grade)
WHERE UPPER(mt.name) = 'BRONZE'
ON CONFLICT DO NOTHING;

-- Seed grades for Titanium
INSERT INTO material_grades (material_type_id, grade)
SELECT mt.id, g.grade FROM material_types mt
CROSS JOIN (VALUES
  ('Grade 1'),('Grade 2'),('Grade 4'),('Grade 5 (Ti-6Al-4V)'),
  ('Grade 7'),('Grade 9'),('Grade 23')
) AS g(grade)
WHERE UPPER(mt.name) IN ('TITANIUM','TI')
ON CONFLICT DO NOTHING;

-- Seed grades for Cast Iron
INSERT INTO material_grades (material_type_id, grade)
SELECT mt.id, g.grade FROM material_types mt
CROSS JOIN (VALUES
  ('Gray CI'),('White CI'),('Malleable CI'),('Ductile (SG) CI'),
  ('FC150'),('FC200'),('FC250'),('FC300'),('SG Iron')
) AS g(grade)
WHERE UPPER(mt.name) IN ('CAST IRON','CI')
ON CONFLICT DO NOTHING;

-- ─── STEP 5: Add FK columns to shipments ─────────────────────
ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS category_id       INT REFERENCES rm_categories(id),
  ADD COLUMN IF NOT EXISTS material_type_id  INT REFERENCES material_types(id),
  ADD COLUMN IF NOT EXISTS material_shape_id INT REFERENCES rm_shapes(id),
  ADD COLUMN IF NOT EXISTS material_grade_id INT REFERENCES material_grades(id);

-- ─── STEP 6: Verify (run these SELECTs to confirm) ───────────
-- SELECT COUNT(*) FROM rm_categories;      -- expect 7
-- SELECT COUNT(*) FROM rm_shapes;          -- expect 31
-- SELECT COUNT(*) FROM material_grades;    -- varies based on existing types
-- SELECT column_name FROM information_schema.columns WHERE table_name='shipments';
