const campaignManager = require('../managers/campaignManager');

describe('CampaignManager', () => {
  let createdCampaignId;

  describe('create', () => {
    it('should create a new campaign', () => {
      const campaignData = {
        name: 'Test Campaign',
        description: 'A test campaign'
      };

      const campaign = campaignManager.create(campaignData);

      expect(campaign).toBeDefined();
      expect(campaign.id).toBeDefined();
      expect(campaign.name).toBe('Test Campaign');
      expect(campaign.description).toBe('A test campaign');
      expect(campaign.createdAt).toBeDefined();

      createdCampaignId = campaign.id;
    });

    it('should create campaign with minimal data', () => {
      const campaign = campaignManager.create({ name: 'Minimal Campaign' });

      expect(campaign).toBeDefined();
      expect(campaign.id).toBeDefined();
      expect(campaign.name).toBe('Minimal Campaign');
    });
  });

  describe('getAll', () => {
    it('should return array of campaigns', () => {
      const campaigns = campaignManager.getAll();

      expect(Array.isArray(campaigns)).toBe(true);
      expect(campaigns.length).toBeGreaterThan(0);
    });

    it('should include created campaigns', () => {
      const testCampaign = campaignManager.create({ name: 'Find Me Campaign' });
      const campaigns = campaignManager.getAll();

      const found = campaigns.find(c => c.id === testCampaign.id);
      expect(found).toBeDefined();
      expect(found.name).toBe('Find Me Campaign');
    });
  });

  describe('getById', () => {
    it('should get campaign by ID', () => {
      const created = campaignManager.create({ name: 'Get By ID Test' });
      const campaign = campaignManager.getById(created.id);

      expect(campaign).toBeDefined();
      expect(campaign.id).toBe(created.id);
      expect(campaign.name).toBe('Get By ID Test');
    });

    it('should return undefined for non-existent campaign', () => {
      const campaign = campaignManager.getById('non-existent-id');

      expect(campaign).toBeUndefined();
    });
  });

  describe('update', () => {
    it('should update existing campaign', () => {
      const created = campaignManager.create({ name: 'Original Name' });
      const updated = campaignManager.update(created.id, { name: 'Updated Name' });

      expect(updated).toBeDefined();
      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe('Updated Name');
    });

    it('should return null when updating non-existent campaign', () => {
      const updated = campaignManager.update('non-existent-id', { name: 'Test' });

      expect(updated).toBeNull();
    });

    it('should preserve unchanged fields', () => {
      const created = campaignManager.create({
        name: 'Test Campaign',
        description: 'Original Description'
      });

      const updated = campaignManager.update(created.id, { name: 'New Name' });

      expect(updated.description).toBe('Original Description');
    });
  });

  describe('delete', () => {
    it('should delete existing campaign', () => {
      const created = campaignManager.create({ name: 'To Be Deleted' });
      const result = campaignManager.delete(created.id);

      expect(result).toBe(true);

      const found = campaignManager.getById(created.id);
      expect(found).toBeUndefined();
    });

    it('should return false when deleting non-existent campaign', () => {
      const result = campaignManager.delete('non-existent-id');

      expect(result).toBe(false);
    });
  });
});
