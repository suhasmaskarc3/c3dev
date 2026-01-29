
// Mock Internal Config Service
const DEFAULT_CONFIG = {
    refreshIntervalMinutes: 60, // Default to 1 hour
    features: {
        enableThemeToggle: true,
        enableBetaFeatures: false
    }
};

export const ConfigService = {
    /**
     * Fetches application configuration
     * simulating an async internal service call
     * @returns {Promise<{refreshIntervalMinutes: number}>}
     */
    getConfig: async () => {
        // Simulate network delay
        return new Promise(resolve => {
            setTimeout(() => {
                // Return mock config (could be extended to fetch from a real endpoint later)
                resolve(DEFAULT_CONFIG);
            }, 500);
        });
    }
};
