const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../index');

const campaignsFile = path.join(__dirname, '../db/campaigns.json');
const charactersFile = path.join(__dirname, '../db/characters.json');
const usersFile = path.join(__dirname, '../db/users.json');

const backup = (file) => {
  const backupPath = file.replace('.json', '.backup.json');
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, backupPath);
  }
  return backupPath;
};

const restore = (file, backupPath) => {
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, file);
    fs.unlinkSync(backupPath);
  }
};

describe('API Integration: campaigns & characters (auth protected)', () => {
  let token;
  let campaignId;
  let characterId;

  let campaignsBackup;
  let charactersBackup;
  let usersBackup;

  beforeAll(async () => {
    campaignsBackup = backup(campaignsFile);
    charactersBackup = backup(charactersFile);
    usersBackup = backup(usersFile);

    const username = `user_${Date.now()}`;
    const password = 'P@ssw0rd!';

    // Register
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ username, password });
    expect(regRes.status).toBe(200);
    expect(regRes.body.token).toBeDefined();

    // Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username, password });
    expect(loginRes.status).toBe(200);
    token = loginRes.body.token;
    expect(token).toBeDefined();
  });

  afterAll(() => {
    restore(campaignsFile, campaignsBackup);
    restore(charactersFile, charactersBackup);
    restore(usersFile, usersBackup);
  });

  test('create and list campaigns', async () => {
    const createRes = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Integration Campaign', description: 'API test' });
    expect(createRes.status).toBe(201);
    expect(createRes.body.id).toBeDefined();
    campaignId = createRes.body.id;

    const listRes = await request(app)
      .get('/api/campaigns')
      .set('Authorization', `Bearer ${token}`);
    expect(listRes.status).toBe(200);
    const found = listRes.body.find(c => c.id === campaignId);
    expect(found).toBeDefined();
  });

  test('get, update, delete campaign', async () => {
    const getRes = await request(app)
      .get(`/api/campaigns/${campaignId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.id).toBe(campaignId);

    const updRes = await request(app)
      .put(`/api/campaigns/${campaignId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Integration Campaign Updated' });
    expect(updRes.status).toBe(200);
    expect(updRes.body.name).toBe('Integration Campaign Updated');

    const delRes = await request(app)
      .delete(`/api/campaigns/${campaignId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);
  });

  test('create character tied to campaign, list/get/update/delete', async () => {
    // Recreate a campaign to attach character
    const cRes = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Char Campaign' });
    expect(cRes.status).toBe(201);
    campaignId = cRes.body.id;

    const createChar = await request(app)
      .post('/api/characters')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Hero', campaignId, cls: 'Fighter', level: 1 });
    expect(createChar.status).toBe(201);
    characterId = createChar.body.id;

    const listChars = await request(app)
      .get(`/api/characters?campaignId=${campaignId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(listChars.status).toBe(200);
    const found = listChars.body.find(ch => ch.id === characterId);
    expect(found).toBeDefined();

    const getChar = await request(app)
      .get(`/api/characters/${characterId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(getChar.status).toBe(200);
    expect(getChar.body.id).toBe(characterId);

    const updChar = await request(app)
      .put(`/api/characters/${characterId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ level: 2 });
    expect(updChar.status).toBe(200);
    expect(updChar.body.level).toBe(2);

    const delChar = await request(app)
      .delete(`/api/characters/${characterId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(delChar.status).toBe(200);
    expect(delChar.body.success).toBe(true);
  });
});
