import { GameEngine } from '../core/GameEngine';
import { RoomService } from './RoomService';
import { Entity } from '../core/Entity';
import {
	PositionComponent,
	CharacterComponent,
	SessionComponent,
	ComponentTypes,
} from '../components/CoreComponents';

/**
 * Command response format (as per protocol)
 */
export interface CommandResponse {
	type: 'system' | 'room' | 'combat' | 'npc';
	text: string;
	meta?: Record<string, unknown>;
}

/**
 * CommandProcessorService - Processes player commands
 * Performance target: <500ms per command
 */
export class CommandProcessorService {
	constructor(
		private gameEngine: GameEngine,
		private roomService: RoomService
	) {}

	/**
	 * Process a player command
	 * @param playerId - Player entity ID
	 * @param commandText - Raw command text
	 */
	async processCommand(playerId: string, commandText: string): Promise<CommandResponse> {
		const startTime = Date.now();

		const player = this.gameEngine.getEntity(playerId);
		if (!player) {
			return {
				type: 'system',
				text: 'Error: Player entity not found.',
			};
		}

		// Parse command
		const parts = commandText.trim().toLowerCase().split(/\s+/);
		const command = parts[0];
		const args = parts.slice(1);

		let response: CommandResponse;

		try {
			// Route to appropriate command handler
			switch (command) {
				case 'look':
				case 'l':
					response = await this.handleLook(player);
					break;

				case 'who':
					response = await this.handleWho(player);
					break;

				case 'north':
				case 'south':
				case 'east':
				case 'west':
				case 'up':
				case 'down':
				case 'enter':
				case 'exit':
				case 'n':
				case 's':
				case 'e':
				case 'w':
				case 'u':
				case 'd':
					response = await this.handleMove(player, this.normalizeDirection(command));
					break;

				case 'talk':
				case 'say':
					response = await this.handleTalk(player, args);
					break;

				case 'attack':
				case 'kill':
					response = await this.handleAttack(player, args);
					break;

				case 'whisper':
					response = await this.handleWhisper(player, args);
					break;

				case 'help':
					response = this.handleHelp();
					break;

				default:
					response = {
						type: 'system',
						text: `Unknown command: ${command}. Type 'help' for a list of commands.`,
					};
			}
		} catch (error) {
			response = {
				type: 'system',
				text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
			};
		}

		// Performance check
		const elapsed = Date.now() - startTime;
		if (elapsed > 500) {
			console.warn(`Command '${command}' took ${elapsed}ms (target: <500ms)`);
		}

		return response;
	}

	/**
	 * Handle 'look' command - show room description, NPCs, exits
	 */
	private async handleLook(player: Entity): Promise<CommandResponse> {
		const position = player.getComponent<PositionComponent>(ComponentTypes.POSITION);
		if (!position) {
			return { type: 'system', text: 'Error: Player has no position.' };
		}

		const roomState = await this.roomService.getRoomState(
			position.roomId,
			this.getPlayersInRoom(position.roomId)
		);

		let text = `\n${roomState.room.name}\n`;
		text += `${roomState.room.description}\n\n`;

		// List NPCs
		if (roomState.npcs.length > 0) {
			text += 'You see:\n';
			roomState.npcs.forEach((npc) => {
				text += `  - ${npc.name}\n`;
			});
			text += '\n';
		}

		// List other players
		const otherPlayers = roomState.players.filter((id) => id !== player.id);
		if (otherPlayers.length > 0) {
			text += 'Also here:\n';
			otherPlayers.forEach((playerId) => {
				const p = this.gameEngine.getEntity(playerId);
				const char = p?.getComponent<CharacterComponent>(ComponentTypes.CHARACTER);
				if (char) {
					text += `  - ${char.name}\n`;
				}
			});
			text += '\n';
		}

		// List exits
		if (roomState.exits.length > 0) {
			text += 'Exits: ';
			text += roomState.exits.map((exit) => exit.direction).join(', ');
			text += '\n';
		}

		return { type: 'room', text };
	}

	/**
	 * Handle 'who' command - list players in current room
	 */
	private async handleWho(player: Entity): Promise<CommandResponse> {
		const position = player.getComponent<PositionComponent>(ComponentTypes.POSITION);
		if (!position) {
			return { type: 'system', text: 'Error: Player has no position.' };
		}

		const playersInRoom = this.getPlayersInRoom(position.roomId);

		if (playersInRoom.length === 1) {
			return { type: 'system', text: 'You are alone here.' };
		}

		let text = 'Players in this room:\n';
		playersInRoom.forEach((playerId) => {
			const p = this.gameEngine.getEntity(playerId);
			const char = p?.getComponent<CharacterComponent>(ComponentTypes.CHARACTER);
			if (char) {
				text += `  - ${char.name}${playerId === player.id ? ' (you)' : ''}\n`;
			}
		});

		return { type: 'system', text };
	}

	/**
	 * Handle movement commands
	 */
	private async handleMove(player: Entity, direction: string): Promise<CommandResponse> {
		const position = player.getComponent<PositionComponent>(ComponentTypes.POSITION);
		if (!position) {
			return { type: 'system', text: 'Error: Player has no position.' };
		}

		const currentRoomId = position.roomId;

		try {
			const targetRoom = await this.roomService.getRoomByDirection(currentRoomId, direction);

			if (!targetRoom) {
				return { type: 'system', text: `You cannot go ${direction} from here.` };
			}

			// Update position
			position.roomId = targetRoom.id;

			// Persist to database
			await this.roomService.moveCharacter(player.id, currentRoomId, targetRoom.id);

			return {
				type: 'room',
				text: `You move ${direction}.\n`,
				meta: { newRoomId: targetRoom.id },
			};
		} catch (error) {
			return {
				type: 'system',
				text: error instanceof Error ? error.message : 'Movement failed.',
			};
		}
	}

	/**
	 * Handle 'talk' or 'say' commands
	 */
	private async handleTalk(player: Entity, args: string[]): Promise<CommandResponse> {
		if (args.length === 0) {
			return { type: 'system', text: 'Usage: talk <message> or say <message>' };
		}

		const character = player.getComponent<CharacterComponent>(ComponentTypes.CHARACTER);
		const message = args.join(' ');

		return {
			type: 'room',
			text: `${character?.name || 'Someone'} says: "${message}"`,
			meta: { broadcast: true },
		};
	}

	/**
	 * Handle 'attack' command
	 */
	private async handleAttack(player: Entity, args: string[]): Promise<CommandResponse> {
		if (args.length === 0) {
			return { type: 'system', text: 'Usage: attack <target>' };
		}

		// Combat will be handled by CombatSystem
		return {
			type: 'combat',
			text: 'Combat system not yet implemented.',
			meta: { targetName: args[0] },
		};
	}

	/**
	 * Handle 'whisper' command - private message
	 */
	private async handleWhisper(player: Entity, args: string[]): Promise<CommandResponse> {
		if (args.length < 2) {
			return { type: 'system', text: 'Usage: whisper <player> <message>' };
		}

		const targetName = args[0];
		const message = args.slice(1).join(' ');

		return {
			type: 'system',
			text: `You whisper to ${targetName}: "${message}"`,
			meta: { whisper: true, targetName, message },
		};
	}

	/**
	 * Handle 'help' command
	 */
	private handleHelp(): CommandResponse {
		const text = `
Available Commands:
  look (l)              - View current room
  who                   - List players in room
  north/south/east/west - Move in a direction (n/s/e/w)
  up/down               - Move up or down (u/d)
  say <message>         - Speak to everyone in the room
  talk <message>        - Same as say
  whisper <player> <msg>- Private message to a player
  attack <target>       - Attack an NPC or player
  help                  - Show this help message
`;
		return { type: 'system', text };
	}

	/**
	 * Get all player entities in a room
	 */
	private getPlayersInRoom(roomId: string): string[] {
		return this.gameEngine
			.getAllEntities()
			.filter((entity) => {
				const position = entity.getComponent<PositionComponent>(ComponentTypes.POSITION);
				const character = entity.getComponent<CharacterComponent>(ComponentTypes.CHARACTER);
				return position?.roomId === roomId && character?.isPlayer === true;
			})
			.map((entity) => entity.id);
	}

	/**
	 * Normalize direction aliases
	 */
	private normalizeDirection(dir: string): string {
		const map: Record<string, string> = {
			n: 'north',
			s: 'south',
			e: 'east',
			w: 'west',
			u: 'up',
			d: 'down',
		};
		return map[dir] || dir;
	}
}
