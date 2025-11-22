-- Seed sample data for the writing app UI
-- Adds a few characters, chapters and timeline events so the panels show content

INSERT INTO characters (id, name, role, notes, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Ash', 'Protagonist', 'A quiet but determined investigator.', now(), now()),
  (gen_random_uuid(), 'Mira', 'Antagonist', 'Charismatic leader of the opposing faction.', now(), now()),
  (gen_random_uuid(), 'Sam', 'Supporting', 'Childhood friend and confidant.', now(), now());

INSERT INTO chapters (id, title, content, word_count, "order", created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Chapter 1: The Call', 'Ash receives a mysterious letter that changes everything.', 620, 0, now(), now()),
  (gen_random_uuid(), 'Chapter 2: Crossroads', 'An unexpected meeting forces Ash to choose a side.', 1342, 1, now(), now());

INSERT INTO events (id, title, description, "order", created_at)
VALUES
  (gen_random_uuid(), 'Mysterious Letter', 'Ash receives a sealed letter with no return address.', 0, now()),
  (gen_random_uuid(), 'First Confrontation', 'Tensions rise after the meeting at the docks.', 1, now());

-- NOTE: These seeds are safe to re-run because they always insert new rows; if you prefer idempotent seeds
-- we can use fixed UUIDs and UPSERT logic instead.
