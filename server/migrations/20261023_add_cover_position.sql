ALTER TABLE profile
  ADD COLUMN background_position VARCHAR(30) NOT NULL DEFAULT '50% 50%'
  AFTER background_picture;
