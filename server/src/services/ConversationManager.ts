import { DatabaseService } from './DatabaseService';

/**
 * Conversation message
 */
export interface ConversationMessage {
	role: 'player' | 'npc';
	content: string;
	timestamp: number;
}

/**
 * ConversationManager - Manages NPC conversation history
 * Stores last N messages per NPC/player pair
 */
export class ConversationManager {
	private maxHistoryLength = 10; // Keep last 10 messages

	constructor(private db: DatabaseService) {}

	/**
	 * Get conversation history between player and NPC
	 */
	async getHistory(npcId: string, characterId: string): Promise<ConversationMessage[]> {
		const row = await this.db.queryOne<{ history_json: string }>(
			'SELECT history_json FROM conversation WHERE npc_id = ? AND character_id = ?',
			[npcId, characterId]
		);

		if (!row) return [];

		try {
			return JSON.parse(row.history_json);
		} catch {
			return [];
		}
	}

	/**
	 * Add a message to conversation history
	 */
	async addMessage(
		npcId: string,
		characterId: string,
		role: 'player' | 'npc',
		content: string
	): Promise<void> {
		const history = await this.getHistory(npcId, characterId);

		// Add new message
		history.push({
			role,
			content,
			timestamp: Date.now(),
		});

		// Trim to max length (keep most recent)
		if (history.length > this.maxHistoryLength) {
			history.splice(0, history.length - this.maxHistoryLength);
		}

		// Save to database
		await this.db.execute(
			`INSERT OR REPLACE INTO conversation (npc_id, character_id, history_json, updated_at)
			 VALUES (?, ?, ?, ?)`,
			[npcId, characterId, JSON.stringify(history), Date.now()]
		);
	}

	/**
	 * Build conversation context for prompt
	 */
	async buildContext(npcId: string, characterId: string): Promise<string> {
		const history = await this.getHistory(npcId, characterId);

		if (history.length === 0) return '';

		let context = '\n\nRecent conversation:\n';
		history.forEach((msg) => {
			const speaker = msg.role === 'player' ? 'Player' : 'NPC';
			context += `${speaker}: ${msg.content}\n`;
		});

		return context;
	}

	/**
	 * Clear conversation history
	 */
	async clearHistory(npcId: string, characterId: string): Promise<void> {
		await this.db.execute(
			'DELETE FROM conversation WHERE npc_id = ? AND character_id = ?',
			[npcId, characterId]
		);
	}

	/**
	 * Set max history length
	 */
	setMaxHistoryLength(length: number): void {
		this.maxHistoryLength = length;
	}
}
