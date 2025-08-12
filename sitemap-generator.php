<?php

require_once 'config.php';

/**
 * Sitemap Generator for PaperCMS
 * Generates XML sitemap for search engines
 */
class SitemapGenerator {
    
    private $baseUrl;
    private $stats;
    
    public function __construct($baseUrl = null) {
        // Use config-based URL if no URL provided
        if ($baseUrl === null) {
            $baseUrl = Config::getBaseUrl();
        }
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->stats = [
            'generated' => 0,
            'errors' => [],
            'urls_count' => 0
        ];
    }
    
    /**
     * Generate complete sitemap
     */
    public function generateSitemap() {
        try {
            // Load publications data
            $publicationsFile = 'public/api/publications.json';
            if (!file_exists($publicationsFile)) {
                throw new Exception('Publications file not found');
            }
            
            $json = json_decode(file_get_contents($publicationsFile), true);
            if (!$json || !isset($json['publications'])) {
                throw new Exception('Invalid publications data');
            }
            
            // Generate sitemap XML
            $xml = $this->generateSitemapXML($json['publications']);
            
            // Write sitemap to file
            if (file_put_contents('sitemap.xml', $xml) === false) {
                throw new Exception('Failed to write sitemap file');
            }
            
            // Generate robots.txt with dynamic sitemap URL
            $this->generateRobotsTxt();
            
            $this->stats['generated'] = 1;
            return ['success' => true, 'entries' => $this->stats['urls_count']];
            
        } catch (Exception $e) {
            $this->stats['errors'][] = $e->getMessage();
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
    
    /**
     * Generate XML sitemap content
     */
    private function generateSitemapXML($publications) {
        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . PHP_EOL;
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . PHP_EOL;
        
        // Add homepage
        $xml .= $this->createURLEntry($this->baseUrl . '/', date('Y-m-d'), 'weekly', '1.0');
        
        // Add main sections
        $xml .= $this->createURLEntry($this->baseUrl . '/#about', date('Y-m-d'), 'monthly', '0.9');
        $xml .= $this->createURLEntry($this->baseUrl . '/#work', date('Y-m-d'), 'daily', '0.9');
        
        // Add static pages for published articles
        foreach ($publications as $pub) {
            if ($pub['status'] === 'published') {
                $filename = pathinfo($pub['path'], PATHINFO_FILENAME);
                $staticUrl = $this->baseUrl . '/static/' . $filename . '.html';
                $lastmod = $pub['date']['updated'];
                $xml .= $this->createURLEntry($staticUrl, $lastmod, 'monthly', '0.8');
            }
        }
        
        $xml .= '</urlset>' . PHP_EOL;
        
        return $xml;
    }
    
    /**
     * Create individual URL entry
     */
    private function createURLEntry($url, $lastmod, $changefreq, $priority) {
        $this->stats['urls_count']++;
        
        $xml = '  <url>' . PHP_EOL;
        $xml .= '    <loc>' . htmlspecialchars($url) . '</loc>' . PHP_EOL;
        $xml .= '    <lastmod>' . $lastmod . '</lastmod>' . PHP_EOL;
        $xml .= '    <changefreq>' . $changefreq . '</changefreq>' . PHP_EOL;
        $xml .= '    <priority>' . $priority . '</priority>' . PHP_EOL;
        $xml .= '  </url>' . PHP_EOL;
        
        return $xml;
    }
    
    /**
     * Generate robots.txt file with dynamic sitemap URL
     */
    private function generateRobotsTxt() {
        $robotsContent = "User-agent: *\n";
        $robotsContent .= "Allow: /\n\n";
        $robotsContent .= "# Sitemap location\n";
        $robotsContent .= "Sitemap: " . $this->baseUrl . "/sitemap.xml\n\n";
        $robotsContent .= "# Specific allowances for important content\n";
        $robotsContent .= "Allow: /static/\n";
        $robotsContent .= "Allow: /content/\n";
        $robotsContent .= "Allow: /public/api/\n\n";
        $robotsContent .= "# Crawl delay (optional - prevents overwhelming your server)\n";
        $robotsContent .= "Crawl-delay: 1\n";
        
        file_put_contents('robots.txt', $robotsContent);
    }
    
    /**
     * Get generation statistics
     */
    public function getStats() {
        return $this->stats;
    }
}

?>