<?php

/**
 * Configuration file for PaperCMS
 * 
 * This file contains all deployment-specific settings.
 * Update BASE_URL when deploying to a new platform.
 */

class Config {
    
    /**
     * Base URL for the deployed site
     * 
     * Examples:
     * - GitHub Pages: 'https://username.github.io/repo-name'
     * - Netlify: 'https://your-site.netlify.app'
     * - Custom domain: 'https://your-domain.com'
     * - Vercel: 'https://your-project.vercel.app'
     * - Local development: 'http://localhost:8000'
     */
    const BASE_URL = 'https://msieur-gab.github.io/paperCMS';
    
    /**
     * Get the base URL with trailing slash
     */
    public static function getBaseUrl() {
        return rtrim(self::BASE_URL, '/');
    }
    
    /**
     * Get the base URL with trailing slash for internal use
     */
    public static function getBaseUrlWithSlash() {
        return rtrim(self::BASE_URL, '/') . '/';
    }
    
    /**
     * Auto-detect base URL from environment (for advanced setups)
     * This can be used instead of the hardcoded BASE_URL
     */
    public static function getAutoDetectedBaseUrl() {
        // Try to detect from environment variables (common in hosting platforms)
        if (isset($_SERVER['DEPLOY_URL'])) {
            return $_SERVER['DEPLOY_URL']; // Netlify
        }
        
        if (isset($_SERVER['VERCEL_URL'])) {
            return 'https://' . $_SERVER['VERCEL_URL']; // Vercel
        }
        
        if (isset($_SERVER['HTTP_HOST']) && isset($_SERVER['REQUEST_SCHEME'])) {
            return $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'];
        }
        
        // Fallback to configured URL
        return self::BASE_URL;
    }
    
    /**
     * Site metadata
     */
    const SITE_NAME = 'Gabriel Baude';
    const SITE_DESCRIPTION = 'Designer, Technologist - Portfolio & Explorations';
    const AUTHOR_NAME = 'Gabriel Baude';
    
    /**
     * SEO settings
     */
    const DEFAULT_IMAGE = './content/media/default-og-image.jpg';
    const TWITTER_HANDLE = '@your-handle'; // Optional
    
}

?>