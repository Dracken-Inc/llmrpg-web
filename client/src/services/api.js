const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Campaign API methods
  async getCampaigns() {
    return this.request('/api/campaigns');
  }

  async getCampaign(id) {
    return this.request(`/api/campaigns/${id}`);
  }

  async createCampaign(data) {
    return this.request('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateCampaign(id, data) {
    return this.request(`/api/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteCampaign(id) {
    return this.request(`/api/campaigns/${id}`, {
      method: 'DELETE'
    });
  }

  // Character API methods
  async getCharacters(campaignId = null) {
    const query = campaignId ? `?campaignId=${campaignId}` : '';
    return this.request(`/api/characters${query}`);
  }

  async getCharacter(id) {
    return this.request(`/api/characters/${id}`);
  }

  async createCharacter(data) {
    return this.request('/api/characters', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateCharacter(id, data) {
    return this.request(`/api/characters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteCharacter(id) {
    return this.request(`/api/characters/${id}`, {
      method: 'DELETE'
    });
  }
}

export default new ApiService();
