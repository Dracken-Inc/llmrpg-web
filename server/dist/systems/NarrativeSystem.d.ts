import { System } from '../core/System';
export interface NarrativeEvent {
    type: string;
    subject: string;
    action: string;
    target?: string;
    details?: Record<string, any>;
    timestamp: number;
}
export interface NarrativeEntry {
    id: string;
    timestamp: number;
    text: string;
    tags: string[];
}
export declare class NarrativeSystem extends System {
    private narrativeLog;
    private nextEntryId;
    update(deltaTime: number): void;
    addEvent(event: NarrativeEvent): NarrativeEntry;
    private eventToNarrative;
    getNarrativeLog(limit?: number): NarrativeEntry[];
    getNarrativeByTag(tag: string): NarrativeEntry[];
    clearNarrative(): void;
    getRecentNarrative(seconds?: number): NarrativeEntry[];
    formatNarrativeForDisplay(maxEntries?: number): string;
}
//# sourceMappingURL=NarrativeSystem.d.ts.map