<?php
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
        $this->baseDir = $baseDir ?: dirname(__FILE__);
        $this->contentDir = $this->baseDir . '/content';
        $this->outputFile = $this->baseDir . '/public/api/publications.json';
        $this->baseUrl = 'https://www.yourdomain.com';

        if (!is_dir($this->contentDir)) {
            throw new Exception("Content directory not found at: " . $this->contentDir);
        }
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

        $json = json_encode(['publications' => $publications], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        file_put_contents($this->outputFile, $json);

        return $count = count($publications);
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

    private function shouldInclude($metadata)
    {
        return isset($metadata['status']) &&
            in_array($metadata['status'], ['published', 'archived']);
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
                    list($key, $val) = explode(':', $value, 2);
                    $currentArray[] = array(trim($key) => trim($val));
                } else {
                    $currentArray[] = trim($value);
                }

                $result[$currentKey] = $currentArray;
                continue;
            } else {
                if ($inArray && $indent <= $arrayIndent) {
                    $inArray = false;
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
        $required = ['reference', 'title', 'description', 'status', 'date', 'category', 'author', 'tags'];
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

        $validCategories = ['exploration', 'reflexion', 'application'];
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

    private function createPublicationData($metadata, $file)
    {
        $relativePath = str_replace($this->contentDir . '/', '', $file);
        $filename = pathinfo($file, PATHINFO_FILENAME);
        $canonicalUrl = $this->baseUrl . '/index.html#project/' . $filename;

        return array(
            'reference' => $metadata['reference'],
            'path' => $relativePath,
            'title' => $metadata['title'],
            'description' => $metadata['description'],
            'thumbnail' => $metadata['thumbnail'] ?? '',
            'status' => $metadata['status'],
            'date' => $metadata['date'],
            'category' => $metadata['category'],
            'subcategories' => $metadata['subcategories'] ?? [],
            'tags' => $metadata['tags'],
            'author' => $metadata['author'],
            'related' => $metadata['related'] ?? [],
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
                    'image' => $metadata['thumbnail'] ?? '',
                    'type' => $metadata['category'],
                    'url' => $canonicalUrl
                ],
                'alternates' => $metadata['seo']['alternates'] ?? []
            ]
        );
    }
}
?>