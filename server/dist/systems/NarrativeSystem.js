"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NarrativeSystem = void 0;
const System_1 = require("../core/System");
class NarrativeSystem extends System_1.System {
    constructor() {
        super(...arguments);
        this.narrativeLog = [];
        this.nextEntryId = 1;
    }
    update(deltaTime) {
        // Narrative system is primarily event-driven
        // Update can process time-based narrative events if needed
    }
    addEvent(event) {
        const text = this.eventToNarrative(event);
        const entry = {
            id: `narrative_${this.nextEntryId++}`,
            timestamp: event.timestamp,
            text,
            tags: [event.type, event.subject, ...(event.target ? [event.target] : [])]
        };
        this.narrativeLog.push(entry);
        return entry;
    }
    eventToNarrative(event) {
        const { type, subject, action, target, details } = event;
        switch (type) {
            case 'combat.start':
                return `⚔️ Combat initiated! ${subject} and allies face off against enemies.`;
            case 'combat.attack':
                if (details?.hit) {
                    if (details?.critical) {
                        return `💥 ${subject} lands a CRITICAL HIT on ${target}! ${details?.damage || 0} damage dealt!`;
                    }
                    return `✓ ${subject} strikes ${target} for ${details?.damage || 0} damage.`;
                }
                return `✗ ${subject} misses ${target}.`;
            case 'combat.heal':
                return `💚 ${subject} heals ${target} for ${details?.amount || 0} HP.`;
            case 'combat.defeat':
                return `💀 ${subject} has been defeated!`;
            case 'combat.end':
                return `⚔️ Combat ended. Victory!`;
            case 'character.levelup':
                return `⭐ ${subject} reached level ${details?.level || 1}!`;
            case 'character.join':
                return `👥 ${subject} has joined the party.`;
            case 'character.leave':
                return `👥 ${subject} has left the party.`;
            case 'quest.start':
                return `📜 ${subject} accepted quest: ${details?.questName || 'Unknown Quest'}`;
            case 'quest.complete':
                return `✨ ${subject} completed quest: ${details?.questName || 'Unknown Quest'}`;
            case 'treasure.find':
                return `💰 ${subject} found ${details?.item || 'treasure'}!`;
            case 'item.equip':
                return `🛡️ ${subject} equipped ${details?.itemName || 'an item'}.`;
            case 'item.unequip':
                return `⛔ ${subject} unequipped ${details?.itemName || 'an item'}.`;
            case 'spell.cast':
                return `✨ ${subject} casts ${details?.spellName || 'a spell'} on ${target || 'an area'}.`;
            case 'conversation.start':
                return `💬 ${subject} begins speaking with ${target}.`;
            case 'conversation.end':
                return `💬 The conversation with ${target} concludes.`;
            case 'location.enter':
                return `📍 ${subject} enters ${details?.location || 'a new area'}.`;
            case 'location.exit':
                return `📍 ${subject} leaves ${details?.location || 'the area'}.`;
            default:
                return `${subject} ${action} ${target || ''}`.trim();
        }
    }
    getNarrativeLog(limit) {
        if (limit) {
            return this.narrativeLog.slice(-limit);
        }
        return [...this.narrativeLog];
    }
    getNarrativeByTag(tag) {
        return this.narrativeLog.filter((entry) => entry.tags.includes(tag));
    }
    clearNarrative() {
        this.narrativeLog = [];
    }
    getRecentNarrative(seconds = 60) {
        const now = Date.now();
        const cutoff = now - seconds * 1000;
        return this.narrativeLog.filter((entry) => entry.timestamp > cutoff);
    }
    formatNarrativeForDisplay(maxEntries = 20) {
        const entries = this.narrativeLog.slice(-maxEntries);
        return entries.map((e) => e.text).join('\n');
    }
}
exports.NarrativeSystem = NarrativeSystem;
//# sourceMappingURL=NarrativeSystem.js.map