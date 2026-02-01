import { NPC } from './RoomService';

/**
 * NPCPersonalityBuilder - Builds system prompts for NPC dialogue
 * Includes location, time, context, and personality
 */
export class NPCPersonalityBuilder {
	/**
	 * Build a full prompt for NPC response generation
	 * @param npc - NPC data
	 * @param playerMessage - Player's message
	 * @param conversationContext - Recent conversation history
	 * @param roomName - Current room name
	 * @param gameTime - Current game time
	 */
	buildPrompt(
		npc: NPC,
		playerMessage: string,
		conversationContext: string,
		roomName: string = 'Unknown Location',
		gameTime?: { hours: number; minutes: number }
	): string {
		const systemPrompt = this.buildSystemPrompt(npc, roomName, gameTime);
		const userPrompt = this.buildUserPrompt(playerMessage, conversationContext);

		return `${systemPrompt}\n\n${userPrompt}\n\nNPC:`;
	}

	/**
	 * Build system prompt (NPC personality and context)
	 */
	private buildSystemPrompt(
		npc: NPC,
		roomName: string,
		gameTime?: { hours: number; minutes: number }
	): string {
		let prompt = `You are ${npc.name}, a character in a fantasy MUD game.\n\n`;

		// Add description
		prompt += `Description: ${npc.description}\n\n`;

		// Add personality
		if (npc.personality) {
			prompt += `Personality: ${npc.personality}\n\n`;
		}

		// Add location context
		prompt += `You are currently in: ${roomName}\n`;

		// Add time context
		if (gameTime) {
			const timeOfDay = this.getTimeOfDay(gameTime.hours);
			prompt += `Time: ${this.formatTime(gameTime.hours, gameTime.minutes)} (${timeOfDay})\n`;
		}

		prompt += '\n';

		// Add instructions
		prompt += 'Instructions:\n';
		prompt += '- Respond in character as this NPC\n';
		prompt += '- Keep responses brief (1-3 sentences)\n';
		prompt += '- Use medieval fantasy language appropriate for the setting\n';
		prompt += '- Reference your location and situation when relevant\n';
		prompt += '- Do not break character or acknowledge you are an AI\n';

		return prompt;
	}

	/**
	 * Build user prompt (player message + context)
	 */
	private buildUserPrompt(playerMessage: string, conversationContext: string): string {
		let prompt = '';

		// Add conversation context if available
		if (conversationContext) {
			prompt += conversationContext + '\n';
		}

		// Add current player message
		prompt += `Player: ${playerMessage}`;

		return prompt;
	}

	/**
	 * Get time of day description
	 */
	private getTimeOfDay(hours: number): string {
		if (hours >= 5 && hours < 12) return 'morning';
		if (hours >= 12 && hours < 17) return 'afternoon';
		if (hours >= 17 && hours < 21) return 'evening';
		return 'night';
	}

	/**
	 * Format time as string
	 */
	private formatTime(hours: number, minutes: number): string {
		const h = hours % 12 || 12;
		const m = minutes.toString().padStart(2, '0');
		const period = hours < 12 ? 'AM' : 'PM';
		return `${h}:${m} ${period}`;
	}

	/**
	 * Build a simple greeting prompt (for proximity greetings)
	 */
	buildGreetingPrompt(npc: NPC, roomName: string): string {
		let prompt = `You are ${npc.name}. ${npc.description}\n\n`;

		if (npc.personality) {
			prompt += `Personality: ${npc.personality}\n\n`;
		}

		prompt += `You are in ${roomName}. A player has just entered the room.\n\n`;
		prompt += 'Generate a brief greeting (one sentence).\n\n';
		prompt += 'Greeting:';

		return prompt;
	}
}
