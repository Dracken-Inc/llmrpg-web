/**
 * Generation options for KoboldCPP
 */
export interface GenerationOptions {
	max_length?: number;
	temperature?: number;
	top_p?: number;
	top_k?: number;
	rep_pen?: number;
	stop_sequence?: string[];
}

/**
 * KoboldCPP API response
 */
interface KoboldResponse {
	results: Array<{ text: string }>;
}

/**
 * KoboldCPPService - Local AI integration via KoboldCPP API
 * Endpoint: http://localhost:5001
 * Model: Mistral 7B Q4 (or similar)
 */
export class KoboldCPPService {
	private endpoint: string;

	constructor(endpoint: string = 'http://localhost:5001') {
		this.endpoint = endpoint;
	}

	/**
	 * Generate NPC response
	 * @param prompt - Full prompt including context
	 * @param options - Generation options
	 */
	async generateNPCResponse(prompt: string, options?: GenerationOptions): Promise<string> {
		const startTime = Date.now();

		try {
			const response = await fetch(`${this.endpoint}/api/v1/generate`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					prompt,
					max_length: options?.max_length || 150,
					temperature: options?.temperature || 0.7,
					top_p: options?.top_p || 0.9,
					top_k: options?.top_k || 40,
					rep_pen: options?.rep_pen || 1.1,
					stop_sequence: options?.stop_sequence || ['\n', 'Player:', 'You:'],
				}),
			});

			if (!response.ok) {
				throw new Error(`KoboldCPP API error: ${response.status} ${response.statusText}`);
			}

			const data = (await response.json()) as KoboldResponse;

			if (!data.results || data.results.length === 0) {
				throw new Error('No results from KoboldCPP');
			}

			const elapsed = Date.now() - startTime;
			console.log(`[KoboldCPP] Generated response in ${elapsed}ms`);

			return data.results[0].text.trim();
		} catch (error) {
			console.error('[KoboldCPP] Generation failed:', error);
			
			// Fallback response
			return "I'm having trouble thinking right now. Perhaps try again in a moment?";
		}
	}

	/**
	 * Check if KoboldCPP is available
	 */
	async healthCheck(): Promise<boolean> {
		try {
			const response = await fetch(`${this.endpoint}/api/v1/info`, {
				method: 'GET',
			});
			return response.ok;
		} catch {
			return false;
		}
	}

	/**
	 * Get KoboldCPP server info
	 */
	async getInfo(): Promise<unknown> {
		try {
			const response = await fetch(`${this.endpoint}/api/v1/info`, {
				method: 'GET',
			});

			if (!response.ok) {
				throw new Error(`KoboldCPP info error: ${response.status}`);
			}

			return await response.json();
		} catch (error) {
			console.error('[KoboldCPP] Failed to get info:', error);
			return null;
		}
	}
}
