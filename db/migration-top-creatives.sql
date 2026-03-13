-- Migration: Add 'top_creative' label to reference_images
-- This allows the reference_images table to store top-performing creative references
-- uploaded through the Client Generator, which Smart Batch auto-uses during generation.

-- Drop the existing CHECK constraint and recreate with the new label
ALTER TABLE reference_images DROP CONSTRAINT IF EXISTS reference_images_label_check;
ALTER TABLE reference_images ADD CONSTRAINT reference_images_label_check
  CHECK (label IN ('identity', 'outfit', 'product', 'background', 'top_creative'));
