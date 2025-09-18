<?php
require_once 'config.php';

class MarkdownConverter
{
    private $contentDir;
    private $outputFile;
    private $baseUrl;
    private $processingStats = [
        'total' => 0,
        'success' => 0,
        'errors' => [],
        'categories' => [],
        'statusCount' => [],
        'missingFields' => []
    ];

    public function __construct($baseDir = null)
    {
        $this->baseDir = $baseDir ?: dirname(dirname(__FILE__));
        $this->contentDir = $this->baseDir . '/content';
        $this->outputFile = $this->baseDir . '/public/api/publications.json';
        $this->baseUrl = Config::getBaseUrlWithSlash();

        if (!is_dir($this->contentDir)) {
            throw new Exception("Content directory not found at: " . $this->contentDir);
        }
    }

    private function cleanPath($path)
    {
        // Remove backslashes and normalize forward slashes
        $path = str_replace('\\', '/', $path);
        // Remove double forward slashes
        $path = preg_replace('#/+#', '/', $path);
        // Remove starting forward slash and content/ prefix if exists
        $path = ltrim($path, '/');
        $path = preg_replace('/^content\//', '', $path);
        return $path;
    }

    public function parseMarkdown($content) {
        // Parse markdown content for routing system
        $match = preg_match('/^---\n(.*?)\n---\n(.*)$/s', $content, $matches);
        if (!$match) {
            throw new Exception('Invalid markdown format - missing YAML frontmatter');
        }
        
        $frontmatter = $matches[1];
        $markdownBody = trim($matches[2]);
        
        // Parse YAML frontmatter (simple parser for basic needs)
        $metadata = $this->parseSimpleYaml($frontmatter);
        
        // Convert markdown to HTML (simple implementation)
        $html = $this->markdownToHtml($markdownBody);
        
        return [
            'metadata' => $metadata,
            'html' => $html
        ];
    }

    public function processFiles()
    {
        $publications = array();
        $files = $this->getMarkdownFiles($this->contentDir);
        $this->processingStats['total'] = count($files);

        foreach ($files as $file) {
            try {
                $content = file_get_contents($file);
                if ($metadata = $this->extractFrontmatter($content)) {
                    $metadata = $this->validateMetadata($metadata, $file);
                    $this->updateStats($metadata);

                    if ($this->shouldInclude($metadata)) {
                        $publications[] = $this->createPublicationData($metadata, $file);
                        $this->processingStats['success']++;
                    }
                }
            } catch (Exception $e) {
                $this->processingStats['errors'][] = [
                    'file' => basename($file),
                    'error' => $e->getMessage()
                ];
                continue;
            }
        }

        usort($publications, function ($a, $b) {
            return $a['reference'] - $b['reference'];
        });

        $outputDir = dirname($this->outputFile);
        if (!is_dir($outputDir)) {
            mkdir($outputDir, 0755, true);
        }

        $json = json_encode(
            ['publications' => $publications],
            JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
        );

        file_put_contents($this->outputFile, $json);

        return count($publications);
    }

    private function createPublicationData($metadata, $file)
    {
        $relativePath = $this->cleanPath(str_replace($this->contentDir . '/', '', $file));

        // Clean thumbnail path
        $thumbnail = '';
        if (!empty($metadata['thumbnail'])) {
            $thumbnail = './content/' . $this->cleanPath($metadata['thumbnail']);
        }

        // Clean contributor avatars
        if (isset($metadata['contributors']) && is_array($metadata['contributors'])) {
            foreach ($metadata['contributors'] as &$contributor) {
                if (isset($contributor['avatar'])) {
                    $contributor['avatar'] = './' . $this->cleanPath($contributor['avatar']);
                }
            }
        }

        // Clean related paths
        $related = [];
        if (!empty($metadata['related'])) {
            $related = array_map(function ($path) {
                return 'content/' . $this->cleanPath($path);
            }, $metadata['related']);
        }

        $canonicalUrl = $this->baseUrl . 'project/' . pathinfo($relativePath, PATHINFO_FILENAME);

        return array(
            'reference' => $metadata['reference'],
            'path' => $relativePath,
            'title' => $metadata['title'],
            'description' => $metadata['description'],
            'thumbnail' => $thumbnail,
            'status' => $metadata['status'],
            'date' => $metadata['date'],
            'category' => $metadata['category'],
            'subcategories' => $metadata['subcategories'] ?? [],
            'tags' => $metadata['tags'],
            'contributors' => $metadata['contributors'] ?? [],
            'related' => $related,
            'documents' => $metadata['documents'] ?? [],
            'links' => $metadata['links'] ?? [],
            'seo' => [
                'title' => $metadata['title'],
                'description' => $metadata['description'],
                'keywords' => implode(', ', array_merge(
                    $metadata['tags'],
                    $metadata['subcategories'] ?? []
                )),
                'canonical' => $canonicalUrl,
                'og' => [
                    'title' => $metadata['title'],
                    'description' => $metadata['description'],
                    'image' => $thumbnail,
                    'type' => $metadata['category'],
                    'url' => $canonicalUrl
                ],
                'alternates' => $metadata['seo']['alternates'] ?? []
            ]
        );
    }
    private function updateStats($metadata)
    {
        $category = $metadata['category'] ?? 'undefined';
        $this->processingStats['categories'][$category] =
            ($this->processingStats['categories'][$category] ?? 0) + 1;

        $status = $metadata['status'] ?? 'undefined';
        $this->processingStats['statusCount'][$status] =
            ($this->processingStats['statusCount'][$status] ?? 0) + 1;

        $optionalFields = ['thumbnail', 'subcategories', 'related', 'documents', 'links'];
        foreach ($optionalFields as $field) {
            if (empty($metadata[$field])) {
                $this->processingStats['missingFields'][$field] =
                    ($this->processingStats['missingFields'][$field] ?? 0) + 1;
            }
        }
    }

    public function getProcessingStats()
    {
        return [
            'overall' => [
                'total' => $this->processingStats['total'],
                'success' => $this->processingStats['success'],
                'errors' => count($this->processingStats['errors'])
            ],
            'categories' => $this->processingStats['categories'],
            'status' => $this->processingStats['statusCount'],
            'missing' => $this->processingStats['missingFields'],
            'errorDetails' => $this->processingStats['errors']
        ];
    }

    // Helper methods for the new parseMarkdown function
    private function parseSimpleYaml($yamlString) {
        // Simple YAML parser for basic key-value pairs
        $metadata = [];
        $lines = explode("\n", $yamlString);
        
        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line) || strpos($line, '#') === 0) continue;
            
            if (preg_match('/^([^:]+):\s*(.*)$/', $line, $matches)) {
                $key = trim($matches[1]);
                $value = trim($matches[2]);
                
                // Handle quoted values
                if ((substr($value, 0, 1) === '"' && substr($value, -1) === '"') ||
                    (substr($value, 0, 1) === "'" && substr($value, -1) === "'")) {
                    $value = substr($value, 1, -1);
                }
                
                $metadata[$key] = $value;
            }
        }
        
        return $metadata;
    }
    
    private function markdownToHtml($markdown) {
        // Simple markdown to HTML converter for basic needs
        $html = $markdown;
        
        // Convert headers
        $html = preg_replace('/^### (.*$)/m', '<h3>$1</h3>', $html);
        $html = preg_replace('/^## (.*$)/m', '<h2>$1</h2>', $html);
        $html = preg_replace('/^# (.*$)/m', '<h1>$1</h1>', $html);
        
        // Convert paragraphs
        $html = preg_replace('/\n\n/', '</p><p>', $html);
        $html = '<p>' . $html . '</p>';
        
        // Convert line breaks
        $html = preg_replace('/\n/', '<br>', $html);
        
        // Convert bold and italic
        $html = preg_replace('/\*\*(.*?)\*\*/', '<strong>$1</strong>', $html);
        $html = preg_replace('/\*(.*?)\*/', '<em>$1</em>', $html);
        
        // Convert links
        $html = preg_replace('/\[([^\]]+)\]\(([^)]+)\)/', '<a href="$2">$1</a>', $html);
        
        // Convert images
        $html = preg_replace('/!\[([^\]]*)\]\(([^)]+)\)/', '<img src="$2" alt="$1" data-media="image">', $html);
        
        // Clean up empty paragraphs
        $html = preg_replace('/<p><\/p>/', '', $html);
        $html = preg_replace('/<p>\s*<\/p>/', '', $html);
        
        return $html;
    }

    private function shouldInclude($metadata)
    {
        return isset($metadata['status']) &&
            in_array($metadata['status'], ['published', 'archived', 'draft']);
    }

    private function getMarkdownFiles($dir)
    {
        $files = array();
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($dir, RecursiveDirectoryIterator::SKIP_DOTS)
        );

        foreach ($iterator as $file) {
            if ($file->isFile() && $file->getExtension() === 'md') {
                $files[] = $file->getPathname();
            }
        }

        return $files;
    }

    private function extractFrontmatter($content)
    {
        if (preg_match('/^---\n(.*?)\n---/s', $content, $matches)) {
            return $this->parseYaml($matches[1]);
        }
        return null;
    }

    private function parseYaml($yaml)
    {
        $lines = explode("\n", $yaml);
        $result = array();
        $currentKey = '';
        $currentArray = [];
        $inArray = false;
        $arrayIndent = 0;
        $currentArrayItem = null;

        foreach ($lines as $line) {
            $line = rtrim($line);
            if (empty($line))
                continue;

            $indent = strlen($line) - strlen(ltrim($line));
            $line = ltrim($line);

            if (strpos($line, '- ') === 0) {
                $value = substr($line, 2);

                if (!$inArray) {
                    $inArray = true;
                    $arrayIndent = $indent;
                    $currentArray = [];
                }

                if (strpos($value, ':') !== false) {
                    // Array item with key-value pair
                    list($key, $val) = explode(':', $value, 2);
                    $currentArrayItem = array(trim($key) => trim($val));
                    $currentArray[] = $currentArrayItem;
                } else {
                    // Simple array item
                    $currentArrayItem = array();
                    $currentArray[] = trim($value);
                }

                $result[$currentKey] = $currentArray;
                continue;
            } else {
                // Check if we're continuing a nested array item
                if ($inArray && $indent > $arrayIndent && $currentArrayItem !== null && is_array($currentArrayItem)) {
                    if (preg_match('/^([^:]+):(.*)$/', $line, $matches)) {
                        $key = trim($matches[1]);
                        $value = trim($matches[2]);
                        
                        // Add to the last array item
                        $lastIndex = count($currentArray) - 1;
                        if ($lastIndex >= 0 && is_array($currentArray[$lastIndex])) {
                            $currentArray[$lastIndex][$key] = $value;
                            $result[$currentKey] = $currentArray;
                        }
                    }
                    continue;
                } elseif ($inArray && $indent <= $arrayIndent) {
                    $inArray = false;
                    $currentArrayItem = null;
                }
            }

            if (preg_match('/^([^:]+):(.*)$/', $line, $matches)) {
                $key = trim($matches[1]);
                $value = trim($matches[2]);

                if ($indent == 0) {
                    $currentKey = $key;
                    if ($value !== '') {
                        $result[$key] = $value;
                    } else {
                        $result[$key] = array();
                    }
                    $inArray = false;
                    $currentArrayItem = null;
                } else {
                    if (!empty($value)) {
                        if (!isset($result[$currentKey]) || !is_array($result[$currentKey])) {
                            $result[$currentKey] = array();
                        }
                        $result[$currentKey][$key] = $value;
                    }
                }
            }
        }

        return $result;
    }

    private function validateMetadata($metadata, $currentFile)
    {
        $required = ['reference', 'title', 'description', 'status', 'date', 'category', 'contributors', 'tags'];
        foreach ($required as $field) {
            if (!isset($metadata[$field])) {
                throw new Exception(sprintf(
                    "Missing required field '%s' in file: %s",
                    $field,
                    basename($currentFile)
                ));
            }
        }

        $validStatuses = ['published', 'draft', 'archived'];
        if (!in_array($metadata['status'], $validStatuses)) {
            throw new Exception(sprintf(
                "Invalid status value '%s' in file: %s\nExpected one of: %s",
                $metadata['status'],
                basename($currentFile),
                implode(', ', $validStatuses)
            ));
        }

        $validCategories = ['project', 'making-of', 'article'];
        if (!in_array($metadata['category'], $validCategories)) {
            throw new Exception(sprintf(
                "Invalid category value '%s' in file: %s\nExpected one of: %s",
                $metadata['category'],
                basename($currentFile),
                implode(', ', $validCategories)
            ));
        }

        return $metadata;
    }
}

?>