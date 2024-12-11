<?php

class MarkdownConverter
{
    private $contentDir;
    private $outputFile;
    private $baseDir;

    public function __construct($baseDir = null)
    {
        // If no base directory provided, use the directory where the script is located
        $this->baseDir = $baseDir ?: dirname(__FILE__);

        // Set paths relative to base directory
        $this->contentDir = $this->baseDir . '/content';
        $this->outputFile = $this->baseDir . '/public/api/publications.json';

        // Ensure content directory exists
        if (!is_dir($this->contentDir)) {
            throw new Exception("Content directory not found at: " . $this->contentDir);
        }
    }

    public function processFiles()
    {
        $publications = array();
        $files = $this->getMarkdownFiles($this->contentDir);

        foreach ($files as $file) {
            $content = file_get_contents($file);
            if ($metadata = $this->extractFrontmatter($content)) {
                if ($this->isPublished($metadata)) {
                    $publications[] = $this->createPublicationData($metadata, $file);
                }
            }
        }

        // Sort by publication date (newest first)
        usort($publications, function ($a, $b) {
            return strtotime($b['date']['published']) - strtotime($a['date']['published']);
        });

        // Create output directory if it doesn't exist
        $outputDir = dirname($this->outputFile);
        if (!is_dir($outputDir)) {
            mkdir($outputDir, 0755, true);
        }

        // Write JSON file
        $json = json_encode(array('publications' => $publications), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        file_put_contents($this->outputFile, $json);

        return count($publications);
    }

    private function getMarkdownFiles($dir)
    {
        try {
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
        } catch (Exception $e) {
            echo "Error accessing directory: " . $dir . "\n";
            echo "Error message: " . $e->getMessage() . "\n";
            return array();
        }
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
        $parents = array();
        $currentLevel = 0;
        $previousLevel = 0;
        $currentArray = null;

        foreach ($lines as $line) {
            if (trim($line) === '')
                continue;

            $level = strlen($line) - strlen(ltrim($line));
            $line = trim($line);

            // Handle arrays (lines starting with -)
            if (strpos($line, '- ') === 0) {
                $value = trim(substr($line, 1));
                if ($currentArray === null) {
                    $currentArray = array();
                    $this->setValueInArray($result, $parents, $currentArray);
                }
                $currentArray[] = $value;
                continue;
            } else {
                $currentArray = null;
            }

            // Handle key-value pairs
            if (strpos($line, ':') !== false) {
                $parts = explode(':', $line, 2);
                $key = trim($parts[0]);
                $value = isset($parts[1]) ? trim($parts[1]) : '';

                if ($level < $previousLevel) {
                    $parents = array_slice($parents, 0, $level / 2);
                }

                if ($value === '') {
                    // This is a parent key
                    $parents[$level] = $key;
                    $this->setValueInArray($result, array_slice($parents, 0, $level / 2 + 1), array());
                } else {
                    // This is a value
                    $this->setValueInArray($result, $parents, $value, $key);
                }

                $previousLevel = $level;
            }
        }

        return $result;
    }

    private function setValueInArray(&$array, $parents, $value, $lastKey = null)
    {
        $current = &$array;
        foreach ($parents as $parent) {
            if (!isset($current[$parent])) {
                $current[$parent] = array();
            }
            $current = &$current[$parent];
        }
        if ($lastKey !== null) {
            $current[$lastKey] = $value;
        } else {
            $current = $value;
        }
    }

    private function isPublished($metadata)
    {
        if (!isset($metadata['date']['published'])) {
            return false;
        }

        $publishDate = strtotime($metadata['date']['published']);
        return $publishDate !== false && $publishDate <= time();
    }

    private function createPublicationData($metadata, $file)
    {
        $relativePath = str_replace($this->contentDir . '/', '', $file);
        $slug = pathinfo($file, PATHINFO_FILENAME);

        return array(
            'slug' => $slug,
            'path' => $relativePath,
            'title' => isset($metadata['title']) ? $metadata['title'] : '',
            'description' => isset($metadata['description']) ? $metadata['description'] : '',
            'date' => isset($metadata['date']) ? $metadata['date'] : array(),
            'author' => isset($metadata['author']) ? $metadata['author'] : array(),
            'category' => isset($metadata['category']) ? $metadata['category'] : '',
            'subcategories' => isset($metadata['subcategories']) ? $metadata['subcategories'] : array(),
            'tags' => isset($metadata['tags']) ? $metadata['tags'] : array(),
            'related' => isset($metadata['related']) ? $metadata['related'] : array(),
            'project' => isset($metadata['project']) ? $metadata['project'] : array()
        );
    }
}

// Get the project root directory
$projectRoot = dirname(__FILE__);

// Create converter with project root
try {
    $converter = new MarkdownConverter($projectRoot);
    $count = $converter->processFiles();
    echo "Successfully processed $count publications\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Current directory: " . getcwd() . "\n";
    echo "Project root: " . $projectRoot . "\n";
    die();
}

?>