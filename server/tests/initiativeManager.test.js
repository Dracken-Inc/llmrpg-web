const initiative = require('../managers/initiativeManager');

describe('initiativeManager', () => {
  const CAMPAIGN_ID = 'camp-1';

  beforeEach(() => {
    initiative.reset(CAMPAIGN_ID);
  });

  test('get() returns default state when empty', () => {
    const state = initiative.get(CAMPAIGN_ID);
    expect(state).toEqual({ round: 0, currentTurn: 0, participants: [] });
  });

  test('addParticipant() adds and sorts by initiative desc', () => {
    initiative.addParticipant(CAMPAIGN_ID, { name: 'A', initiative: 5 });
    initiative.addParticipant(CAMPAIGN_ID, { name: 'B', initiative: 12 });
    initiative.addParticipant(CAMPAIGN_ID, { name: 'C', initiative: 7 });
    const state = initiative.get(CAMPAIGN_ID);
    const order = state.participants.map(p => p.name);
    expect(order).toEqual(['B', 'C', 'A']);
  });

  test('nextTurn() cycles through participants and increments round', () => {
    initiative.addParticipant(CAMPAIGN_ID, { name: 'A', initiative: 10 });
    initiative.addParticipant(CAMPAIGN_ID, { name: 'B', initiative: 9 });

    let state = initiative.get(CAMPAIGN_ID);
    expect(state.currentTurn).toBe(0);
    expect(state.round).toBe(0);

    // advance to B
    initiative.nextTurn(CAMPAIGN_ID);
    state = initiative.get(CAMPAIGN_ID);
    expect(state.currentTurn).toBe(1);
    expect(state.round).toBe(0);

    // advance back to A and round increments
    initiative.nextTurn(CAMPAIGN_ID);
    state = initiative.get(CAMPAIGN_ID);
    expect(state.currentTurn).toBe(0);
    expect(state.round).toBe(1);
  });

  test('removeParticipant() removes by id', () => {
    const state1 = initiative.addParticipant(CAMPAIGN_ID, { name: 'A', initiative: 3 });
    const idToRemove = state1.participants[0].id;
    initiative.removeParticipant(CAMPAIGN_ID, idToRemove);
    const state = initiative.get(CAMPAIGN_ID);
    expect(state.participants.length).toBe(0);
  });

  test('reset() clears state', () => {
    initiative.addParticipant(CAMPAIGN_ID, { name: 'A', initiative: 3 });
    initiative.nextTurn(CAMPAIGN_ID);
    const resetState = initiative.reset(CAMPAIGN_ID);
    expect(resetState).toEqual({ round: 0, currentTurn: 0, participants: [] });
  });
});
