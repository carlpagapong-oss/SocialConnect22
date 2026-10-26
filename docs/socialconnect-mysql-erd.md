# Existing SocialConnect MySQL ERD

This diagram is derived from `server/social_connect_schema.sql` and the checked-in migrations. It describes the schema only; it does not describe any data currently in XAMPP.

```mermaid
erDiagram
    ACCOUNT ||--o| PROFILE : "has"
    ACCOUNT ||--o{ POST : "owns"
    POST ||--o{ POST : "is shared as"
    ACCOUNT ||--o{ FOLLOW : "follows"
    ACCOUNT ||--o{ FOLLOW : "is followed by"
    ACCOUNT ||--o{ POST_LIKE : "likes"
    POST ||--o{ POST_LIKE : "receives"
    ACCOUNT ||--o{ COMMENT : "writes"
    POST ||--o{ COMMENT : "contains"
    ACCOUNT ||--o{ BOOKMARK : "creates"
    POST ||--o{ BOOKMARK : "is saved in"

    ACCOUNT {
        int_unsigned account_id PK
        varchar_50 username UK
        varchar_255 email UK
        varchar_255 password_hash
        varchar_20 role
        varchar_20 account_status
        datetime created_at
    }

    PROFILE {
        int_unsigned profile_id PK
        int_unsigned account_id FK_UK
        varchar_100 display_name
        varchar_255 profile_picture "nullable"
        varchar_255 background_picture "nullable"
        varchar_30 background_position
        text bio "nullable"
        tinyint_unsigned age "nullable"
        date birthday "nullable"
        varchar_30 relation_status "nullable"
        varchar_30 gender "nullable"
    }

    POST {
        int_unsigned post_id PK
        int_unsigned account_id FK
        text content
        varchar_255 image_path "nullable"
        varchar_10 media_type "nullable"
        datetime created_at
        datetime updated_at
        int_unsigned original_post_id FK "nullable"
    }

    FOLLOW {
        int_unsigned follow_id PK
        int_unsigned follower_id FK
        int_unsigned following_id FK
        datetime created_at
    }

    POST_LIKE {
        int_unsigned like_id PK
        int_unsigned account_id FK
        int_unsigned post_id FK
        datetime created_at
    }

    COMMENT {
        int_unsigned comment_id PK
        int_unsigned account_id FK
        int_unsigned post_id FK
        text comment_text
        datetime created_at
        datetime updated_at
    }

    BOOKMARK {
        int_unsigned bookmark_id PK
        int_unsigned account_id FK
        int_unsigned post_id FK
        datetime created_at
    }
```

## Constraints and indexes

- `account.username` and `account.email` are unique. `account(account_id)` is the primary key; `(role, account_status)` has an index.
- `profile.account_id` is unique, making the account-to-profile relationship one-to-zero-or-one. It cascades on account delete and update.
- `post.account_id` cascades on account delete/update. `post.original_post_id` is a nullable self-reference and cascades when the original post is deleted.
- `(follow.follower_id, follow.following_id)`, `(post_like.account_id, post_like.post_id)`, and `(bookmark.account_id, bookmark.post_id)` are unique pairs.
- The relationship indexes shown in the SQL export are retained in the PostgreSQL proposal.
- MySQL uses `AUTO_INCREMENT`, unsigned integer types, `DATETIME`, `ON UPDATE CURRENT_TIMESTAMP`, and `utf8mb4`; these require PostgreSQL translations.
