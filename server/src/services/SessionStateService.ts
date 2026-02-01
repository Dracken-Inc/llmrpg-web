/**
 * SessionStateService - In-memory per-campaign state
 * All changes are ephemeral and reset between campaigns/sessions.
 */
export class SessionStateService {
	private deadNpcIds = new Set<string>();

	markNpcDead(npcId: string): void {
		this.deadNpcIds.add(npcId);
	}

	isNpcDead(npcId: string): boolean {
		return this.deadNpcIds.has(npcId);
	}

	reset(): void {
		this.deadNpcIds.clear();
	}
}
