-- TikTok Content Posting mode on SocialPost (inbox vs Direct Post).

alter table social_posts add column if not exists tiktok_post_mode text;
