ALTER TABLE post
  ADD COLUMN original_post_id INT UNSIGNED NULL,
  ADD INDEX idx_post_original_post_id (original_post_id),
  ADD CONSTRAINT fk_post_original_post
    FOREIGN KEY (original_post_id) REFERENCES post(post_id)
    ON DELETE CASCADE;
