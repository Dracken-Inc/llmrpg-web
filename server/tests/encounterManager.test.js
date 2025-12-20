let encounterManager;

describe('encounterManager', () => {
  const CAMPAIGN_ID = 'camp-1';

  beforeEach(() => {
    jest.resetModules();
    encounterManager = require('../managers/encounterManager');
  });

  test('getByCampaign returns empty initially', () => {
    const list = encounterManager.getByCampaign(CAMPAIGN_ID);
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBe(0);
  });

  test('create adds encounter with defaults and id', () => {
    const enc = encounterManager.create(CAMPAIGN_ID, { name: 'Goblin Ambush' });
    expect(enc).toBeDefined();
    expect(enc.id).toBeDefined();
    expect(enc.createdAt).toBeDefined();
    expect(enc.active).toBe(false);
    expect(enc.enemies).toEqual([]);

    const list = encounterManager.getByCampaign(CAMPAIGN_ID);
    expect(list.length).toBe(1);
    expect(list[0].name).toBe('Goblin Ambush');
  });

  test('getById finds specific encounter', async () => {
    const e1 = encounterManager.create(CAMPAIGN_ID, { name: 'E1' });
    // Ensure Date.now() differs for id generation
    await new Promise(r => setTimeout(r, 2));
    const e2 = encounterManager.create(CAMPAIGN_ID, { name: 'E2' });
    const found = encounterManager.getById(CAMPAIGN_ID, e2.id);
    expect(found).toBeDefined();
    expect(found.id).toBe(e2.id);
    expect(found.name).toBe('E2');
  });

  test('update modifies fields and sets updatedAt', () => {
    const enc = encounterManager.create(CAMPAIGN_ID, { name: 'Battle', active: false });
    const updated = encounterManager.update(CAMPAIGN_ID, enc.id, { active: true, name: 'Boss Battle' });
    expect(updated).toBeDefined();
    expect(updated.id).toBe(enc.id);
    expect(updated.active).toBe(true);
    expect(updated.name).toBe('Boss Battle');
    expect(updated.updatedAt).toBeDefined();
  });

  test('update returns null for non-existent encounter', () => {
    const updated = encounterManager.update(CAMPAIGN_ID, 'missing-id', { active: true });
    expect(updated).toBeNull();
  });

  test('delete removes encounter', () => {
    const enc = encounterManager.create(CAMPAIGN_ID, { name: 'To Delete' });
    const ok = encounterManager.delete(CAMPAIGN_ID, enc.id);
    expect(ok).toBe(true);
    const list = encounterManager.getByCampaign(CAMPAIGN_ID);
    expect(list.length).toBe(0);
  });

  test('delete returns false when id not found', () => {
    const ok = encounterManager.delete(CAMPAIGN_ID, 'missing-id');
    expect(ok).toBe(false);
  });

  test('addEnemy adds enemy with id; removeEnemy removes it', () => {
    const enc = encounterManager.create(CAMPAIGN_ID, { name: 'Ambush' });
    const afterAdd = encounterManager.addEnemy(CAMPAIGN_ID, enc.id, { name: 'Goblin', hp: 7 });
    expect(afterAdd).toBeDefined();
    expect(afterAdd.enemies.length).toBe(1);
    const enemyId = afterAdd.enemies[0].id;
    expect(enemyId).toBeDefined();

    const afterRemove = encounterManager.removeEnemy(CAMPAIGN_ID, enc.id, enemyId);
    expect(afterRemove).toBeDefined();
    expect(afterRemove.enemies.length).toBe(0);
  });

  test('addEnemy returns null when campaign or encounter missing', () => {
    const res = encounterManager.addEnemy('unknown-camp', 'missing-enc', { name: 'Orc' });
    expect(res).toBeNull();
  });
});
