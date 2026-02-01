-- LLMRPG MUD Database Schema
-- SQLite database for persistent world storage

-- Rooms table - All locations in the game world
CREATE TABLE IF NOT EXISTS rooms (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	description TEXT NOT NULL,
	region TEXT,
	coords TEXT,
	flags TEXT,
	created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- NPCs table - Non-player characters
CREATE TABLE IF NOT EXISTS npcs (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	description TEXT NOT NULL,
	room_id TEXT NOT NULL,
	schedule_id TEXT,
	personality TEXT,
	stats TEXT, -- JSON: {str, dex, con, int, wis, cha}
	hp INTEGER DEFAULT 100,
	max_hp INTEGER DEFAULT 100,
	level INTEGER DEFAULT 1,
	respawn_room_id TEXT,
	greet_radius INTEGER DEFAULT 0,
	created_at INTEGER DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (room_id) REFERENCES rooms(id)
);

-- Exits table - Connections between rooms
CREATE TABLE IF NOT EXISTS exits (
	id TEXT PRIMARY KEY,
	from_room_id TEXT NOT NULL,
	to_room_id TEXT NOT NULL,
	direction TEXT NOT NULL, -- north, south, east, west, up, down, enter, exit
	is_locked INTEGER DEFAULT 0,
	key_item_id TEXT,
	created_at INTEGER DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (from_room_id) REFERENCES rooms(id),
	FOREIGN KEY (to_room_id) REFERENCES rooms(id)
);

-- Characters table - Player characters
CREATE TABLE IF NOT EXISTS characters (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL UNIQUE,
	room_id TEXT NOT NULL,
	stats TEXT, -- JSON: {str, dex, con, int, wis, cha}
	hp INTEGER DEFAULT 100,
	max_hp INTEGER DEFAULT 100,
	level INTEGER DEFAULT 1,
	experience INTEGER DEFAULT 0,
	inventory TEXT, -- JSON array of item IDs
	created_at INTEGER DEFAULT (strftime('%s', 'now')),
	last_login INTEGER DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (room_id) REFERENCES rooms(id)
);

-- Conversation history table - NPC dialogue history
CREATE TABLE IF NOT EXISTS conversation (
	npc_id TEXT NOT NULL,
	character_id TEXT NOT NULL,
	history_json TEXT NOT NULL, -- JSON array of messages
	updated_at INTEGER NOT NULL,
	PRIMARY KEY (npc_id, character_id),
	FOREIGN KEY (npc_id) REFERENCES npcs(id),
	FOREIGN KEY (character_id) REFERENCES characters(id)
);

-- Schedules table - NPC time-based schedules
CREATE TABLE IF NOT EXISTS schedules (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	routines TEXT NOT NULL, -- JSON array of {startMinute, endMinute, roomId, action}
	created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Cache table - AI response cache
CREATE TABLE IF NOT EXISTS cache (
	cache_key TEXT PRIMARY KEY,
	response TEXT NOT NULL,
	created_at INTEGER DEFAULT (strftime('%s', 'now')),
	hit_count INTEGER DEFAULT 0
);

-- Combat log table - Combat event history
CREATE TABLE IF NOT EXISTS combat_log (
	id TEXT PRIMARY KEY,
	combat_id TEXT NOT NULL,
	attacker_id TEXT NOT NULL,
	defender_id TEXT NOT NULL,
	action_type TEXT NOT NULL, -- attack, damage, miss, crit, death
	roll_result INTEGER,
	damage INTEGER,
	message TEXT NOT NULL,
	created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_npcs_room ON npcs(room_id);
CREATE INDEX IF NOT EXISTS idx_exits_from ON exits(from_room_id);
CREATE INDEX IF NOT EXISTS idx_exits_to ON exits(to_room_id);
CREATE INDEX IF NOT EXISTS idx_characters_room ON characters(room_id);
CREATE INDEX IF NOT EXISTS idx_conversation_npc ON conversation(npc_id);
CREATE INDEX IF NOT EXISTS idx_conversation_char ON conversation(character_id);
CREATE INDEX IF NOT EXISTS idx_combat_log_combat ON combat_log(combat_id);
