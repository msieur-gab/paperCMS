<?php
/**
 * HTML Content Generator
 *
 * Converts Markdown files to pre-rendered HTML, matching the client-side
 * ContentService behavior but running on the server for better performance.
 */

require_once 'config.php';

class HTMLContentGenerator
{
    private $baseDir;
    private $contentDir;
    private $outputDir;
    private $generatedFiles = [];
    private $errors = [];

    public function __construct($baseDir = null)
    {
        $this->baseDir = $baseDir ?: dirname(dirname(__FILE__));
        $this->contentDir = $this->baseDir . '/content';
        $this->outputDir = $this->baseDir . '/public/content';

        // Create output directory if it doesn't exist
        if (!is_dir($this->outputDir)) {
            mkdir($this->outputDir, 0755, true);
        }
    }

    public function generateAllHTML()
    {
        $files = $this->getMarkdownFiles($this->contentDir);

        foreach ($files as $file) {
            try {
                $this->generateHTMLFromMarkdown($file);
            } catch (Exception $e) {
                $this->errors[] = [
                    'file' => basename($file),
                    'error' => $e->getMessage()
                ];
            }
        }

        return [
            'generated' => count($this->generatedFiles),
            'errors' => $this->errors,
            'files' => $this->generatedFiles
        ];
    }

    private function generateHTMLFromMarkdown($markdownFile)
    {
        $content = file_get_contents($markdownFile);

        // Extract frontmatter and body
        if (!preg_match('/^---\n(.*?)\n---\n(.*)$/s', $content, $matches)) {
            throw new Exception('Invalid document format: No frontmatter found');
        }

        $markdown = $matches[2];

        // Convert markdown to HTML
        $html = $this->markdownToHTML($markdown);

        // Generate output filename
        $relativePath = str_replace($this->contentDir . '/', '', $markdownFile);
        $slug = pathinfo($relativePath, PATHINFO_FILENAME);
        $outputFile = $this->outputDir . '/' . $slug . '.html';

        // Write HTML file
        file_put_contents($outputFile, $html);

        $this->generatedFiles[] = [
            'source' => basename($markdownFile),
            'output' => basename($outputFile),
            'size' => strlen($html)
        ];
    }

    /**
     * Convert markdown to HTML
     * Replicates the client-side ContentService.markdownToHTML() logic
     */
    private function markdownToHTML($markdown)
    {
        $html = $markdown;

        // STEP 1: Parse chart blocks (must be before other processing)
        $html = $this->parseChartBlocks($html);

        // STEP 2: Media blocks with attributes {data-media class="..."}
        $html = preg_replace_callback(
            '/!\[([^\]]*)\]\(([^)]+)\)\s*\{([^}]+)\}/',
            function($matches) {
                $alt = $matches[1];
                $src = $this->resolvePath($matches[2]);
                $attrs = $matches[3];

                $dataMedia = strpos($attrs, 'data-media') !== false ? ' data-media' : '';
                preg_match('/class="([^"]+)"/', $attrs, $classMatch);
                $className = $classMatch ? $classMatch[1] : '';

                return sprintf(
                    '<figure class="media-block %s"%s><img src="%s" alt="%s" /></figure>',
                    $className,
                    $dataMedia,
                    $src,
                    htmlspecialchars($alt)
                );
            },
            $html
        );

        // STEP 3: Standard images and videos
        $html = preg_replace_callback(
            '/!\[([^\]]*)\]\(([^)]+)\)/',
            function($matches) {
                $alt = $matches[1];
                $srcWithArgs = $matches[2];

                // Parse source and arguments
                if (preg_match('/^([^\s"]+)\s+"([^"]+)"$/', $srcWithArgs, $quotedMatch)) {
                    $src = $quotedMatch[1];
                    $args = explode(' ', $quotedMatch[2]);
                } else {
                    $parts = preg_split('/\s+/', $srcWithArgs);
                    $src = $parts[0];
                    $args = array_slice($parts, 1);
                }

                $src = $this->resolvePath($src);

                // Check if video
                $videoExtensions = ['.webm', '.mp4', '.mov', '.avi'];
                $isVideo = false;
                foreach ($videoExtensions as $ext) {
                    if (stripos($src, $ext) !== false) {
                        $isVideo = true;
                        break;
                    }
                }

                if ($isVideo) {
                    return $this->generateVideoHTML($src, $args);
                } else {
                    return $this->generateImageHTML($src, $alt, $args);
                }
            },
            $html
        );

        // STEP 4: Links
        $html = preg_replace('/\[([^\]]+)\]\(([^)]+)\)/', '<a href="$2">$1</a>', $html);

        // STEP 5: Headers
        $html = preg_replace('/^### (.+)$/m', '<h3>$1</h3>', $html);
        $html = preg_replace('/^## (.+)$/m', '<h2>$1</h2>', $html);
        $html = preg_replace('/^# (.+)$/m', '<h1>$1</h1>', $html);

        // STEP 6: Bold and italic
        $html = preg_replace('/\*\*([^*]+)\*\*/', '<strong>$1</strong>', $html);
        $html = preg_replace('/\*([^*]+)\*/', '<em>$1</em>', $html);

        // STEP 7: Highlight and strikethrough
        $html = preg_replace('/==([^=]+)==/', '<mark>$1</mark>', $html);
        $html = preg_replace_callback(
            '/~~([^~]+)~~/',
            function($matches) {
                return '<del>' . $this->redactText($matches[1]) . '</del>';
            },
            $html
        );

        // STEP 8: Blockquotes
        $html = preg_replace_callback(
            '/(^> .+(?:\n> .+)*)/m',
            function($matches) {
                $lines = explode("\n", $matches[1]);
                $cleanLines = array_map(function($line) {
                    return preg_replace('/^> /', '', $line);
                }, $lines);
                $cleanLines = array_filter($cleanLines, function($line) {
                    return trim($line) !== '';
                });
                $content = implode('<br>', $cleanLines);

                return sprintf(
                    '<blockquote class="media-block" data-media><p>%s</p></blockquote>',
                    $content
                );
            },
            $html
        );

        // STEP 9: Code blocks
        $html = preg_replace('/```([\s\S]*?)```/', '<pre><code>$1</code></pre>', $html);
        $html = preg_replace('/`([^`]+)`/', '<code>$1</code>', $html);

        // STEP 10: Paragraphs
        $paragraphs = explode("\n\n", $html);
        $paragraphs = array_map(function($p) {
            $p = trim($p);
            if (empty($p)) return '';

            // Skip if already a block element
            if (preg_match('/^<(h[1-6]|div|figure|blockquote|pre|ul|ol|li|section)\b/', $p)) {
                return $p;
            }

            return '<p>' . $p . '</p>';
        }, $paragraphs);
        $html = implode("\n", $paragraphs);

        // STEP 11: Filter pre-header media
        $html = $this->filterPreHeaderMedia($html);

        // STEP 12: Create sections
        $html = $this->createSections($html);

        return $html;
    }

    private function parseChartBlocks($markdown)
    {
        return preg_replace_callback(
            '/```chart(?:-(\w+))?\n([\s\S]*?)```/',
            function($matches) {
                $chartType = $matches[1] ?: 'bar';
                $content = trim($matches[2]);

                try {
                    $config = json_decode($content, true);
                    if (json_last_error() !== JSON_ERROR_NONE) {
                        throw new Exception('Invalid JSON: ' . json_last_error_msg());
                    }

                    $type = $chartType ?: ($config['type'] ?? 'bar');
                    $chartId = 'chart-' . time() . '-' . substr(md5(rand()), 0, 9);
                    $configAttr = htmlspecialchars(json_encode($config));
                    $title = isset($config['title']) ? '<figcaption class="chart-title">' . htmlspecialchars($config['title']) . '</figcaption>' : '';

                    return sprintf(
                        '<figure class="chart-block media-block" data-media data-chart-type="%s" data-chart-config="%s" data-chart-id="%s"><canvas id="%s" class="chart-canvas"></canvas>%s</figure>',
                        $type,
                        $configAttr,
                        $chartId,
                        $chartId,
                        $title
                    );
                } catch (Exception $e) {
                    return sprintf(
                        '<div class="chart-error"><p>Chart configuration error: %s</p><pre><code>%s</code></pre></div>',
                        htmlspecialchars($e->getMessage()),
                        htmlspecialchars($content)
                    );
                }
            },
            $markdown
        );
    }

    private function generateVideoHTML($src, $args)
    {
        $videoAttrs = ['controls'];
        $figureAttrs = '';
        $playbackRate = '1';

        foreach ($args as $arg) {
            $lowerArg = strtolower($arg);
            if ($lowerArg === 'autoplay') {
                $videoAttrs[] = 'autoplay';
            } elseif ($lowerArg === 'loop') {
                $videoAttrs[] = 'loop';
            } elseif ($lowerArg === 'mute' || $lowerArg === 'muted') {
                $videoAttrs[] = 'muted';
            } elseif ($lowerArg === 'nocontrols') {
                $videoAttrs = array_filter($videoAttrs, function($attr) {
                    return $attr !== 'controls';
                });
            } elseif (preg_match('/^(\d+(?:\.\d+)?)x$/', $lowerArg, $match)) {
                $playbackRate = $match[1];
            } elseif ($lowerArg === 'cover') {
                $figureAttrs = ' data-fit="cover"';
            } elseif ($lowerArg === 'contain') {
                $figureAttrs = ' data-fit="contain"';
            }
        }

        $videoAttrString = implode(' ', $videoAttrs);
        $extension = pathinfo($src, PATHINFO_EXTENSION);
        $playbackScript = $playbackRate !== '1'
            ? sprintf('<script>(function(){const video=document.currentScript.previousElementSibling; if(video){video.playbackRate=%s;}})();</script>', $playbackRate)
            : '';

        return sprintf(
            '<figure class="media-block" data-media%s><video %s><source src="%s" type="video/%s">Your browser does not support the video tag.</video>%s</figure>',
            $figureAttrs,
            $videoAttrString,
            $src,
            $extension,
            $playbackScript
        );
    }

    private function generateImageHTML($src, $alt, $args)
    {
        $figureAttrs = '';
        foreach ($args as $arg) {
            $lowerArg = strtolower($arg);
            if ($lowerArg === 'cover' || $lowerArg === 'contain') {
                $figureAttrs = sprintf(' data-fit="%s"', $lowerArg);
            }
        }

        return sprintf(
            '<figure class="media-block" data-media%s><img src="%s" alt="%s" /></figure>',
            $figureAttrs,
            $src,
            htmlspecialchars($alt)
        );
    }

    private function filterPreHeaderMedia($html)
    {
        if (!preg_match('/<h[12]>/', $html, $match, PREG_OFFSET_CAPTURE)) {
            return $html;
        }

        $firstHeaderIndex = $match[0][1];
        $beforeHeader = substr($html, 0, $firstHeaderIndex);
        $fromHeader = substr($html, $firstHeaderIndex);

        $filteredBeforeHeader = preg_replace(
            '/<figure[^>]*class="[^"]*media-block[^"]*"[^>]*>.*?<\/figure>/s',
            '',
            $beforeHeader
        );
        $filteredBeforeHeader = preg_replace(
            '/<blockquote[^>]*class="[^"]*media-block[^"]*"[^>]*>.*?<\/blockquote>/s',
            '',
            $filteredBeforeHeader
        );

        return $filteredBeforeHeader . $fromHeader;
    }

    private function createSections($html)
    {
        $parts = preg_split('/(<h[12]>.*?<\/h[12]>)/', $html, -1, PREG_SPLIT_DELIM_CAPTURE);
        $result = '';
        $currentSection = '';

        foreach ($parts as $part) {
            $part = trim($part);
            if (empty($part)) continue;

            $isH1 = preg_match('/^<h1>.*<\/h1>$/', $part);
            $isH2 = preg_match('/^<h2>.*<\/h2>$/', $part);

            if ($isH1 || $isH2) {
                if ($currentSection) {
                    $result .= "<section>\n" . $currentSection . "\n</section>\n";
                    $currentSection = '';
                }
                $currentSection = $part;
            } else {
                $currentSection .= ($currentSection ? "\n" : '') . $part;
            }
        }

        if ($currentSection) {
            $result .= "<section>\n" . $currentSection . "\n</section>\n";
        }

        return $result ?: $html;
    }

    private function resolvePath($path)
    {
        if (strpos($path, 'http') === 0) {
            return $path;
        }

        $path = ltrim($path, './');

        if (strpos($path, 'media/') === 0) {
            return 'content/' . $path;
        }

        if (strpos($path, 'content/') === 0) {
            return $path;
        }

        return 'content/media/' . $path;
    }

    private function redactText($text)
    {
        return preg_replace('/\S/', 'X', $text);
    }

    private function getMarkdownFiles($dir)
    {
        $files = [];
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

    public function getStats()
    {
        return [
            'generated_count' => count($this->generatedFiles),
            'error_count' => count($this->errors),
            'output_directory' => $this->outputDir
        ];
    }
}
?>
