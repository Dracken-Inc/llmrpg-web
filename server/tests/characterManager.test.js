const fs = require('fs');
const path = require('path');

// Temporarily redirect characters.json to a test file to avoid polluting real DB
const charactersFile = path.join(__dirname, '../db/characters.json');
const backupFile = path.join(__dirname, '../db/characters.backup.json');

const characterManager = require('../managers/characterManager');

describe('characterManager', () => {
  beforeEach(() => {
    if (fs.existsSync(charactersFile)) {
      fs.copyFileSync(charactersFile, backupFile);
    }
    fs.writeFileSync(charactersFile, JSON.stringify([], null, 2));
  });

  afterEach(() => {
    if (fs.existsSync(backupFile)) {
      fs.copyFileSync(backupFile, charactersFile);
      fs.unlinkSync(backupFile);
    }
  });

  const CAMPAIGN_ID = 'camp-abc';

  test('getAll returns empty initially', () => {
    expect(characterManager.getAll()).toEqual([]);
  });

  test('create adds a character with id and timestamps', () => {
    const newChar = characterManager.create({ name: 'Alice', campaignId: CAMPAIGN_ID, cls: 'Wizard', level: 1 });
    expect(newChar.id).toBeDefined();
    expect(newChar.createdAt).toBeDefined();
    const all = characterManager.getAll();
    expect(all.length).toBe(1);
    expect(all[0].name).toBe('Alice');
  });

  test('getByCampaign filters by campaignId', () => {
    characterManager.create({ name: 'A', campaignId: CAMPAIGN_ID });
    characterManager.create({ name: 'B', campaignId: 'other' });
    const list = characterManager.getByCampaign(CAMPAIGN_ID);
    expect(list.map(c => c.name)).toEqual(['A']);
  });

  test('getById finds a specific character', () => {
    const c = characterManager.create({ name: 'Target', campaignId: CAMPAIGN_ID });
    const found = characterManager.getById(c.id);
    expect(found).toBeDefined();
    expect(found.name).toBe('Target');
  });

  test('update modifies fields and sets updatedAt', () => {
    const c = characterManager.create({ name: 'Up', campaignId: CAMPAIGN_ID, level: 1 });
    const updated = characterManager.update(c.id, { level: 2, name: 'Upgraded' });
    expect(updated.level).toBe(2);
    expect(updated.name).toBe('Upgraded');
    expect(updated.updatedAt).toBeDefined();
  });

  test('delete removes a character', () => {
    const c = characterManager.create({ name: 'Del', campaignId: CAMPAIGN_ID });
    const ok = characterManager.delete(c.id);
    expect(ok).toBe(true);
    expect(characterManager.getAll().length).toBe(0);
  });

  test('delete returns false when id not found', () => {
    const ok = characterManager.delete('missing-id');
    expect(ok).toBe(false);
  });
});
