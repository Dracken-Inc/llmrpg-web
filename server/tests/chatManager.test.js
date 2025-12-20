let chatManager;

describe('chatManager', () => {
  const CAMPAIGN_ID = 'camp-chat-1';

  beforeEach(() => {
    jest.resetModules();
    chatManager = require('../managers/chatManager');
  });

  test('getByCampaign returns empty initially', () => {
    const list = chatManager.getByCampaign(CAMPAIGN_ID);
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBe(0);
  });

  test('add creates message with id and timestamp', () => {
    const msg = chatManager.add(CAMPAIGN_ID, { author: 'Alice', text: 'Hello' });
    expect(msg).toBeDefined();
    expect(msg.id).toBeDefined();
    expect(msg.timestamp).toBeDefined();
    expect(msg.author).toBe('Alice');
    expect(msg.text).toBe('Hello');

    const list = chatManager.getByCampaign(CAMPAIGN_ID);
    expect(list.length).toBe(1);
    expect(list[0].text).toBe('Hello');
  });

  test('getByCampaign respects limit and returns last N messages', () => {
    for (let i = 0; i < 10; i++) {
      chatManager.add(CAMPAIGN_ID, { author: 'Bot', text: `msg${i}` });
    }
    const last3 = chatManager.getByCampaign(CAMPAIGN_ID, 3);
    expect(last3.length).toBe(3);
    expect(last3[0].text).toBe('msg7');
    expect(last3[1].text).toBe('msg8');
    expect(last3[2].text).toBe('msg9');
  });

  test('keeps only last 500 messages per campaign', () => {
    for (let i = 0; i < 510; i++) {
      chatManager.add(CAMPAIGN_ID, { author: 'Bot', text: `m${i}` });
    }
    const list = chatManager.getByCampaign(CAMPAIGN_ID, 1000);
    expect(list.length).toBe(500);
    // Ensure the first kept is m10 (since 510 - 500 = 10 dropped)
    expect(list[0].text).toBe('m10');
    expect(list[499].text).toBe('m509');
  });

  test('clear removes all messages', () => {
    chatManager.add(CAMPAIGN_ID, { author: 'X', text: 'one' });
    chatManager.add(CAMPAIGN_ID, { author: 'Y', text: 'two' });
    const res = chatManager.clear(CAMPAIGN_ID);
    expect(res).toBe(true);
    const list = chatManager.getByCampaign(CAMPAIGN_ID);
    expect(list.length).toBe(0);
  });
});
