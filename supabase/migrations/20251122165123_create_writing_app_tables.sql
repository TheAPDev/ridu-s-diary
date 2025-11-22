/*
  # Create Writing App Tables

  1. New Tables
    - `events` - Timeline events
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `order` (integer)
      - `created_at` (timestamp)
    
    - `chapters` - Story chapters
      - `id` (uuid, primary key)
      - `title` (text)
      - `content` (text)
      - `word_count` (integer)
      - `order` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `characters` - Story characters
      - `id` (uuid, primary key)
      - `name` (text)
      - `role` (text)
      - `notes` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add public read/write policies for demo (can be restricted later)
*/

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  "order" integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text DEFAULT '',
  word_count integer DEFAULT 0,
  "order" integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on events"
  ON events FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert on events"
  ON events FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update on events"
  ON events FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete on events"
  ON events FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public read on chapters"
  ON chapters FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert on chapters"
  ON chapters FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update on chapters"
  ON chapters FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete on chapters"
  ON chapters FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public read on characters"
  ON characters FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert on characters"
  ON characters FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update on characters"
  ON characters FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete on characters"
  ON characters FOR DELETE
  TO public
  USING (true);
