-- Report table: only UOM, material_grade, total_kgs (aggregated from shipments).
-- One row per (material_grade, uom). Run after shipments has material_grade, uom, kgs.

DROP TABLE IF EXISTS report;

CREATE TABLE report (
    material_grade text NOT NULL,
    uom text NOT NULL,
    total_kgs numeric NOT NULL DEFAULT 0,
    PRIMARY KEY (material_grade, uom)
);

-- Same logic as "Refresh Report Data" in the app
INSERT INTO report (material_grade, uom, total_kgs)
SELECT material_grade,
       COALESCE(NULLIF(trim(both FROM COALESCE(uom::text, '')), ''), 'N/A'),
       COALESCE(SUM(kgs), 0)
FROM shipments
GROUP BY material_grade,
         COALESCE(NULLIF(trim(both FROM COALESCE(uom::text, '')), ''), 'N/A');
