/*
# Create core tables for cozy room app

This migration creates the core database schema for the cozy room application,
supporting multi-user data isolation with row-level security.

## 1. New Tables

### user_profiles
- `id` (uuid, primary key, references auth.users)
- `display_name` (text, user's display name)
- `avatar_url` (text, optional avatar image URL)
- `current_character_id` (text, ID of currently selected character)
- `settings` (jsonb, user preferences like music/night mode)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### custom_characters
- `id` (uuid, primary key)
- `name` (text, character name)
- `image_url` (text, character image URL)
- `bio` (text, character description)
- `personalities` (text[], array of personality tag IDs)
- `stat_name` (text, name of the stat like "哈气值")
- `stat_max` (integer, max stat value, default 100)
- `is_public` (boolean, whether publicly visible)
- `is_official` (boolean, true for official characters)
- `creator_id` (uuid, references auth.users, null for official)
- `created_at` (timestamp)

### user_characters
- `id` (uuid, primary key)
- `user_id` (uuid, references auth.users)
- `character_id` (text, references custom_characters.id or official character ID)
- `current_stat` (integer, current stat value)
- `stage` (text, current stage name)
- `acquired_at` (timestamp)

### inventory_items
- `id` (uuid, primary key)
- `user_id` (uuid, references auth.users)
- `item_id` (text, shop item ID)
- `quantity` (integer, default 1)
- `position_x` (float, room position X percentage)
- `position_y` (float, room position Y percentage)
- `rotation` (integer, rotation angle in degrees)
- `is_hidden` (boolean, whether item is hidden)
- `acquired_at` (timestamp)

### letters
- `id` (uuid, primary key)
- `user_id` (uuid, references auth.users)
- `title` (text, letter title)
- `content` (text, letter body)
- `image_url` (text, optional image)
- `category` (text, 'all', 'favorite', or 'event')
- `date` (text, display date like "春天 · 第 1 天")
- `is_favorite` (boolean, default false)
- `created_at` (timestamp)

### album_images
- `id` (uuid, primary key)
- `user_id` (uuid, references auth.users)
- `image_url` (text, image URL)
- `title` (text, image title)
- `date` (text, display date)
- `source_letter_id` (uuid, optional reference to letters)
- `created_at` (timestamp)

## 2. Security

All tables enable RLS with owner-scoped CRUD policies:
- Each authenticated user can only access rows where `user_id = auth.uid()`
- Public characters and official content are readable by all authenticated users
- INSERT policies use `WITH CHECK (auth.uid() = user_id)`
- UPDATE/DELETE policies use `USING (auth.uid() = user_id)`

## 3. Notes

1. Official characters (is_official = true) are seeded separately and visible to all users.
2. Custom characters can be made public (is_public = true) for sharing.
3. User character data tracks current stat values and stages.
4. Inventory items track placement in the room (position, rotation, visibility).
*/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  current_character_id text DEFAULT 'char-kitty',
  settings jsonb DEFAULT '{"music": true, "notify": true, "nightMode": false}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Custom characters table (includes official and user-created)
CREATE TABLE IF NOT EXISTS custom_characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  image_url text NOT NULL,
  bio text,
  personalities text[] DEFAULT '{}',
  stat_name text DEFAULT '好感度',
  stat_max integer DEFAULT 100,
  is_public boolean DEFAULT false,
  is_official boolean DEFAULT false,
  creator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE custom_characters ENABLE ROW LEVEL SECURITY;

-- User-character ownership and progress
CREATE TABLE IF NOT EXISTS user_characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id text NOT NULL,
  current_stat integer DEFAULT 50,
  stage text DEFAULT '初识阶段',
  acquired_at timestamptz DEFAULT now(),
  UNIQUE(user_id, character_id)
);

ALTER TABLE user_characters ENABLE ROW LEVEL SECURITY;

-- Inventory items
CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id text NOT NULL,
  quantity integer DEFAULT 1,
  position_x float DEFAULT 50,
  position_y float DEFAULT 50,
  rotation integer DEFAULT 0,
  is_hidden boolean DEFAULT false,
  acquired_at timestamptz DEFAULT now()
);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- Letters (user's memory collection)
CREATE TABLE IF NOT EXISTS letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  image_url text,
  category text DEFAULT 'all',
  date text,
  is_favorite boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE letters ENABLE ROW LEVEL SECURITY;

-- Album images
CREATE TABLE IF NOT EXISTS album_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  title text,
  date text,
  source_letter_id uuid REFERENCES letters(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE album_images ENABLE ROW LEVEL SECURITY;

-- ========== RLS Policies ==========

-- user_profiles: users can CRUD their own profile
DROP POLICY IF EXISTS "select_own_profile" ON user_profiles;
CREATE POLICY "select_own_profile" ON user_profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON user_profiles;
CREATE POLICY "insert_own_profile" ON user_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON user_profiles;
CREATE POLICY "update_own_profile" ON user_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- custom_characters: creator owns their characters, public ones are readable by all
DROP POLICY IF EXISTS "select_characters" ON custom_characters;
CREATE POLICY "select_characters" ON custom_characters FOR SELECT
  TO authenticated USING (is_public = true OR is_official = true OR creator_id = auth.uid());

DROP POLICY IF EXISTS "insert_own_character" ON custom_characters;
CREATE POLICY "insert_own_character" ON custom_characters FOR INSERT
  TO authenticated WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "update_own_character" ON custom_characters;
CREATE POLICY "update_own_character" ON custom_characters FOR UPDATE
  TO authenticated USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "delete_own_character" ON custom_characters;
CREATE POLICY "delete_own_character" ON custom_characters FOR DELETE
  TO authenticated USING (creator_id = auth.uid());

-- user_characters: users own their character progress
DROP POLICY IF EXISTS "select_own_user_characters" ON user_characters;
CREATE POLICY "select_own_user_characters" ON user_characters FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_user_characters" ON user_characters;
CREATE POLICY "insert_own_user_characters" ON user_characters FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_user_characters" ON user_characters;
CREATE POLICY "update_own_user_characters" ON user_characters FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_user_characters" ON user_characters;
CREATE POLICY "delete_own_user_characters" ON user_characters FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- inventory_items: users own their inventory
DROP POLICY IF EXISTS "select_own_inventory" ON inventory_items;
CREATE POLICY "select_own_inventory" ON inventory_items FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_inventory" ON inventory_items;
CREATE POLICY "insert_own_inventory" ON inventory_items FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_inventory" ON inventory_items;
CREATE POLICY "update_own_inventory" ON inventory_items FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_inventory" ON inventory_items;
CREATE POLICY "delete_own_inventory" ON inventory_items FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- letters: users own their letters
DROP POLICY IF EXISTS "select_own_letters" ON letters;
CREATE POLICY "select_own_letters" ON letters FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_letters" ON letters;
CREATE POLICY "insert_own_letters" ON letters FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_letters" ON letters;
CREATE POLICY "update_own_letters" ON letters FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_letters" ON letters;
CREATE POLICY "delete_own_letters" ON letters FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- album_images: users own their album
DROP POLICY IF EXISTS "select_own_album" ON album_images;
CREATE POLICY "select_own_album" ON album_images FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_album" ON album_images;
CREATE POLICY "insert_own_album" ON album_images FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_album" ON album_images;
CREATE POLICY "update_own_album" ON album_images FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_album" ON album_images;
CREATE POLICY "delete_own_album" ON album_images FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ========== Indexes for common queries ==========
CREATE INDEX IF NOT EXISTS idx_user_characters_user_id ON user_characters(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_user_id ON inventory_items(user_id);
CREATE INDEX IF NOT EXISTS idx_letters_user_id ON letters(user_id);
CREATE INDEX IF NOT EXISTS idx_album_images_user_id ON album_images(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_characters_creator ON custom_characters(creator_id);
CREATE INDEX IF NOT EXISTS idx_custom_characters_public ON custom_characters(is_public);
