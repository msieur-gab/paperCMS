<?php

/**
 * Configuration file for PaperCMS
 * 
 * This file contains all deployment-specific settings.
 * Update BASE_URL when deploying to a new platform.
 */

class Config
{

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
    const BASE_URL = 'http://127.0.0.1:5500';

    /**
     * Auto-detect base URL from server environment
     * Works for localhost, GitHub Pages, Netlify, Vercel, etc.
     */
    private static function detectBaseUrl()
    {
        // 1. Try environment variables (Netlify, Vercel, etc.)
        if (isset($_SERVER['DEPLOY_URL'])) {
            return rtrim($_SERVER['DEPLOY_URL'], '/'); // Netlify
        }

        if (isset($_SERVER['VERCEL_URL'])) {
            return 'https://' . rtrim($_SERVER['VERCEL_URL'], '/'); // Vercel
        }

        // 2. Detect from HTTP headers (most common)
        if (isset($_SERVER['HTTP_HOST'])) {
            $scheme = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http';
            $host = $_SERVER['HTTP_HOST'];

            // Get the base path (e.g., /paperCMS for GitHub Pages)
            $scriptName = $_SERVER['SCRIPT_NAME']; // e.g., /paperCMS/php/generate.php
            $basePath = dirname(dirname($scriptName)); // Remove /php/generate.php

            // Clean up the path
            if ($basePath === '/' || $basePath === '.') {
                $basePath = '';
            }

            return $scheme . '://' . $host . $basePath;
        }

        // 3. Fallback to configured URL
        return self::BASE_URL;
    }

    /**
     * Get the base URL (auto-detected or fallback to config)
     */
    public static function getBaseUrl()
    {
        return self::detectBaseUrl();
    }

    /**
     * Get the base URL with trailing slash for internal use
     */
    public static function getBaseUrlWithSlash()
    {
        return self::detectBaseUrl() . '/';
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