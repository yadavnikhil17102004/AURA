// AURA Configuration
// Fetches configuration from the server and dispatches an event when ready.

(async function() {
    try {
        const response = await fetch('/api/config');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const config = await response.json();
        window.AURA_CONFIG = config;

        // Auto-load the configuration into localStorage
        if (typeof localStorage !== 'undefined') {
            const provider = config.API_PROVIDER || 'openrouter';
            
            if (provider.toLowerCase().startsWith('google')) {
                localStorage.setItem('google_ai_key', config.API_KEY);
            } else {
                localStorage.setItem('openrouter_api_key', config.API_KEY);
            }
            
            localStorage.setItem('aura_config', JSON.stringify(config));
        }

        // Notify the rest of the application that the config is ready
        document.dispatchEvent(new CustomEvent('aura-config-loaded'));
        console.log('AURA configuration loaded successfully.');

    } catch (error) {
        console.error('Failed to load AURA configuration:', error);
        // You could display an error to the user here
        const errorDisplay = document.createElement('div');
        errorDisplay.textContent = 'Fatal Error: Could not load application configuration. Please check the server and refresh the page.';
        errorDisplay.style.cssText = 'position:fixed;top:0;left:0;width:100%;background-color:red;color:white;text-align:center;padding:10px;font-family:sans-serif;z-index:9999;';
        document.body.prepend(errorDisplay);
    }
})();
