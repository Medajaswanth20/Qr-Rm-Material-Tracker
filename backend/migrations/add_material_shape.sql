-- Migration: Add material_shape column to shipments and report tables

-- Add to shipments table
ALTER TABLE shipments
ADD COLUMN IF NOT EXISTS material_shape VARCHAR(50);

-- Add to report table
ALTER TABLE report
ADD COLUMN IF NOT EXISTS material_shape VARCHAR(50);
