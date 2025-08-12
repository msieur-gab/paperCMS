<?php
require_once 'markdown-to-json.php';

class StaticPageGenerator
{
    private $contentDir;
    private $staticDir;
    private $baseUrl;
    private $converter;
    
    public function __construct($baseDir = null)
    {
        $this->baseDir = $baseDir ?: dirname(__FILE__);
        $this->contentDir = $this->baseDir . '/content';
        $this->staticDir = $this->baseDir . '/static';
        $this->baseUrl = 'https://msieur-gab.github.io/paperCMS/';
        
        // Use existing MarkdownConverter for metadata extraction
        $this->converter = new MarkdownConverter($baseDir);
        
        // Create static directory if it doesn't exist
        if (!is_dir($this->staticDir)) {
            mkdir($this->staticDir, 0755, true);
        }
    }
    
    public function generateAllPages()
    {
        // Use the existing JSON file that was already processed by MarkdownConverter
        $jsonFile = $this->baseDir . '/public/api/publications.json';
        
        if (!file_exists($jsonFile)) {
            return [
                'generated' => 0,
                'errors' => [['file' => 'publications.json', 'error' => 'JSON file not found. Run generate.php first to process markdown files.']]
            ];
        }
        
        $jsonData = json_decode(file_get_contents($jsonFile), true);
        if (!$jsonData || !isset($jsonData['publications'])) {
            return [
                'generated' => 0,
                'errors' => [['file' => 'publications.json', 'error' => 'Invalid JSON structure']]
            ];
        }

        $generatedPages = 0;
        $errors = [];

        foreach ($jsonData['publications'] as $publication) {
            try {
                // Only generate pages for published content
                if (isset($publication['status']) && $publication['status'] === 'published') {
                    $this->generateStaticPageFromPublication($publication);
                    $generatedPages++;
                }
            } catch (Exception $e) {
                $errors[] = [
                    'file' => $publication['path'] ?? 'unknown',
                    'error' => $e->getMessage()
                ];
            }
        }

        return [
            'generated' => $generatedPages,
            'errors' => $errors
        ];
    }

    private function generateStaticPageFromPublication($publication)
    {
        // Create clean filename for static page
        $filename = str_replace('.md', '.html', basename($publication['path']));
        $outputPath = $this->staticDir . '/' . $filename;
        
        // Build HTML content with proper meta tags
        $html = $this->buildStaticPageHtmlFromPublication($publication);
        
        file_put_contents($outputPath, $html);
    }

    private function buildStaticPageHtmlFromPublication($publication)
    {
        $title = isset($publication['title']) ? htmlspecialchars($publication['title']) . ' - Gabriel Baude' : 'Gabriel Baude';
        $description = isset($publication['description']) ? htmlspecialchars($publication['description']) : 'Portfolio of Gabriel Baude - Designer and technologist';
        $image = isset($publication['thumbnail']) ? $this->resolveImagePath($publication['thumbnail']) : 'content/media/og-default.jpg';
        $url = $this->baseUrl . '#project/' . str_replace('.md', '', basename($publication['path']));
        
        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{$title}</title>
    <meta name="description" content="{$description}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="{$url}">
    <meta property="og:title" content="{$title}">
    <meta property="og:description" content="{$description}">
    <meta property="og:image" content="{$this->baseUrl}{$image}">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="{$url}">
    <meta property="twitter:title" content="{$title}">
    <meta property="twitter:description" content="{$description}">
    <meta property="twitter:image" content="{$this->baseUrl}{$image}">
    
    <!-- Article specific meta -->
    {$this->buildArticleMetaFromPublication($publication)}
    
    <!-- Structured Data -->
    <script type="application/ld+json">
    {$this->buildStructuredDataFromPublication($publication, $url)}
    </script>
    
    <!-- Canonical URL -->
    <link rel="canonical" href="{$url}">
    
    <!-- Redirect to SPA -->
    <script>
        // Redirect to single page app after brief delay for crawlers
        setTimeout(function() {
            window.location.href = "{$url}";
        }, 1000);
    </script>
    
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 800px;
            margin: 2rem auto;
            padding: 2rem;
            line-height: 1.6;
            color: #333;
            background: #fafafa;
        }
        .preview-container {
            background: white;
            border-radius: 8px;
            padding: 2rem;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .meta-info {
            color: #666;
            font-size: 0.9rem;
            margin-bottom: 1rem;
        }
        .loading {
            text-align: center;
            padding: 1rem;
            border: 2px dashed #ddd;
            border-radius: 4px;
            margin: 2rem 0;
        }
        .thumbnail {
            width: 100%;
            max-width: 400px;
            height: auto;
            border-radius: 4px;
            margin: 1rem 0;
        }
        .tags {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin: 1rem 0;
        }
        .tag {
            background: #e9ecef;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.8rem;
        }
    </style>
</head>
<body>
    <div class="preview-container">
        <div class="meta-info">
            {$this->buildBreadcrumbFromPublication($publication)}
        </div>
        
        <h1>{$publication['title']}</h1>
        
        {$this->buildThumbnailHtmlFromPublication($publication)}
        
        <p>{$publication['description']}</p>
        
        {$this->buildTagsHtmlFromPublication($publication)}
        
        <div class="loading">
            <p><strong>Loading interactive portfolio...</strong></p>
            <p>If not redirected automatically, <a href="{$url}">click here to view the full project</a>.</p>
        </div>
        
        <noscript>
            <div style="background: #f8d7da; color: #721c24; padding: 1rem; border-radius: 4px; margin: 1rem 0;">
                <strong>JavaScript Required:</strong> This portfolio requires JavaScript to display the full interactive experience. 
                <a href="{$url}">Please enable JavaScript</a> to continue.
            </div>
        </noscript>
    </div>
</body>
</html>
HTML;
    }

    private function buildArticleMetaFromPublication($publication)
    {
        $meta = '';
        
        if (isset($publication['author']['name'])) {
            $meta .= '<meta name="author" content="' . htmlspecialchars($publication['author']['name']) . '">' . "\n    ";
        }
        
        if (isset($publication['date']['published'])) {
            $meta .= '<meta property="article:published_time" content="' . $publication['date']['published'] . '">' . "\n    ";
        }
        
        if (isset($publication['date']['updated'])) {
            $meta .= '<meta property="article:modified_time" content="' . $publication['date']['updated'] . '">' . "\n    ";
        }
        
        if (isset($publication['tags']) && is_array($publication['tags'])) {
            foreach ($publication['tags'] as $tag) {
                $meta .= '<meta property="article:tag" content="' . htmlspecialchars($tag) . '">' . "\n    ";
            }
        }
        
        if (isset($publication['category'])) {
            $meta .= '<meta property="article:section" content="' . htmlspecialchars($publication['category']) . '">' . "\n    ";
        }
        
        return $meta;
    }

    private function buildStructuredDataFromPublication($publication, $url)
    {
        $structuredData = [
            "@context" => "https://schema.org",
            "@type" => "Article",
            "headline" => $publication['title'],
            "description" => $publication['description'],
            "url" => $url,
            "author" => [
                "@type" => "Person",
                "name" => $publication['author']['name'] ?? "Gabriel Baude"
            ],
            "publisher" => [
                "@type" => "Person",
                "name" => "Gabriel Baude"
            ]
        ];
        
        if (isset($publication['date']['published'])) {
            $structuredData["datePublished"] = $publication['date']['published'];
        }
        
        if (isset($publication['date']['updated'])) {
            $structuredData["dateModified"] = $publication['date']['updated'];
        }
        
        if (isset($publication['thumbnail'])) {
            $structuredData["image"] = $this->baseUrl . $this->resolveImagePath($publication['thumbnail']);
        }
        
        if (isset($publication['category'])) {
            $structuredData["genre"] = $publication['category'];
        }
        
        if (isset($publication['tags'])) {
            $structuredData["keywords"] = implode(', ', $publication['tags']);
        }
        
        return json_encode($structuredData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    }

    private function buildBreadcrumbFromPublication($publication)
    {
        $breadcrumb = '<a href="' . $this->baseUrl . '">Gabriel Baude</a>';
        
        if (isset($publication['category'])) {
            $breadcrumb .= ' → ' . ucfirst($publication['category']);
        }
        
        return $breadcrumb;
    }

    private function buildThumbnailHtmlFromPublication($publication)
    {
        if (!isset($publication['thumbnail'])) {
            return '';
        }
        
        $imagePath = $this->baseUrl . $this->resolveImagePath($publication['thumbnail']);
        $alt = 'Thumbnail for ' . htmlspecialchars($publication['title']);
        
        return '<img src="' . $imagePath . '" alt="' . $alt . '" class="thumbnail">';
    }

    private function buildTagsHtmlFromPublication($publication)
    {
        if (!isset($publication['tags']) || !is_array($publication['tags'])) {
            return '';
        }
        
        $html = '<div class="tags">';
        foreach ($publication['tags'] as $tag) {
            $html .= '<span class="tag">' . htmlspecialchars($tag) . '</span>';
        }
        $html .= '</div>';
        
        return $html;
    }
    

    private function resolveImagePath($imagePath)
    {
        if (strpos($imagePath, 'http') === 0) {
            return $imagePath; // Already absolute URL
        }
        
        // Handle relative paths - ensure they point to content/media/
        if (strpos($imagePath, 'media/') === 0) {
            return 'content/' . $imagePath;
        }
        
        if (strpos($imagePath, '/content/') !== false) {
            return ltrim($imagePath, '/');
        }
        
        // Default: assume it's in content/media/
        return 'content/media/' . ltrim($imagePath, '/');
    }


    public function cleanStaticDirectory()
    {
        if (is_dir($this->staticDir)) {
            $files = glob($this->staticDir . '/*.html');
            foreach ($files as $file) {
                unlink($file);
            }
        }
    }

    public function getGenerationStats()
    {
        $staticFiles = is_dir($this->staticDir) ? glob($this->staticDir . '/*.html') : [];
        
        return [
            'static_pages_count' => count($staticFiles),
            'static_directory' => $this->staticDir,
            'last_generated' => is_dir($this->staticDir) ? date('Y-m-d H:i:s', filemtime($this->staticDir)) : null
        ];
    }
}
?>