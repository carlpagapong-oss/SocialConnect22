-- SocialConnect database schema
-- Schema-only export. It contains no user data or passwords.

CREATE DATABASE IF NOT EXISTS social_connect
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;
USE social_connect;

CREATE TABLE account (
  account_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  account_status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (account_id),
  UNIQUE KEY uq_account_username (username),
  UNIQUE KEY uq_account_email (email),
  KEY idx_account_role_status (role, account_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE profile (
  profile_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id INT UNSIGNED NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  profile_picture VARCHAR(255) DEFAULT NULL,
  background_picture VARCHAR(255) DEFAULT NULL,
  background_position VARCHAR(30) NOT NULL DEFAULT '50% 50%',
  bio TEXT DEFAULT NULL,
  age TINYINT UNSIGNED DEFAULT NULL,
  birthday DATE DEFAULT NULL,
  relation_status VARCHAR(30) DEFAULT NULL,
  gender VARCHAR(30) DEFAULT NULL,
  PRIMARY KEY (profile_id),
  UNIQUE KEY uq_profile_account (account_id),
  CONSTRAINT fk_profile_account
    FOREIGN KEY (account_id) REFERENCES account (account_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE post (
  post_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id INT UNSIGNED NOT NULL,
  content TEXT NOT NULL,
  image_path VARCHAR(255) DEFAULT NULL,
  media_type VARCHAR(10) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  original_post_id INT UNSIGNED DEFAULT NULL,
  PRIMARY KEY (post_id),
  KEY idx_post_account (account_id),
  KEY idx_post_original_post_id (original_post_id),
  CONSTRAINT fk_post_account
    FOREIGN KEY (account_id) REFERENCES account (account_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_post_original_post
    FOREIGN KEY (original_post_id) REFERENCES post (post_id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE follow (
  follow_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  follower_id INT UNSIGNED NOT NULL,
  following_id INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follow_id),
  UNIQUE KEY uq_follow_pair (follower_id, following_id),
  KEY idx_follow_following (following_id),
  CONSTRAINT fk_follow_follower
    FOREIGN KEY (follower_id) REFERENCES account (account_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_follow_following
    FOREIGN KEY (following_id) REFERENCES account (account_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE post_like (
  like_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id INT UNSIGNED NOT NULL,
  post_id INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (like_id),
  UNIQUE KEY uq_like_account_post (account_id, post_id),
  KEY idx_like_post (post_id),
  CONSTRAINT fk_like_account
    FOREIGN KEY (account_id) REFERENCES account (account_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_like_post
    FOREIGN KEY (post_id) REFERENCES post (post_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE comment (
  comment_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id INT UNSIGNED NOT NULL,
  post_id INT UNSIGNED NOT NULL,
  comment_text TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (comment_id),
  KEY idx_comment_account (account_id),
  KEY idx_comment_post (post_id),
  CONSTRAINT fk_comment_account
    FOREIGN KEY (account_id) REFERENCES account (account_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_comment_post
    FOREIGN KEY (post_id) REFERENCES post (post_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE bookmark (
  bookmark_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id INT UNSIGNED NOT NULL,
  post_id INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (bookmark_id),
  UNIQUE KEY uq_bookmark_account_post (account_id, post_id),
  KEY idx_bookmark_post (post_id),
  CONSTRAINT fk_bookmark_account
    FOREIGN KEY (account_id) REFERENCES account (account_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_bookmark_post
    FOREIGN KEY (post_id) REFERENCES post (post_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
