<?php
require_once 'markdown-to-json.php';
require_once 'static-page-generator.php';
require_once 'sitemap-generator.php';

// Add minimal inline styles
$styles = <<<EOT
<style>
    body {
        font-family: system-ui, -apple-system, sans-serif;
        padding: 20px;
        max-width: 1200px;
        margin: 0 auto;
    }
    table {
        border-collapse: collapse;
        width: 100%;
        margin: 1rem 0;
        font-size: 0.9rem;
    }
    th, td {
        padding: 0.5rem;
        text-align: left;
        border: 1px solid #ddd;
    }
    th {
        background: #f5f5f5;
        font-weight: 600;
    }
    .error { color: #dc3545; }
    .success { color: #28a745; }
    .warning { color: #ffc107; }
    .count { font-weight: 600; }
    h2 { 
        color: #333;
        font-size: 1.2rem;
        margin: 2rem 0 1rem;
    }
    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
    }
</style>
EOT;

echo $styles;

try {
    // Process JSON files
    $converter = new MarkdownConverter();
    $count = $converter->processFiles();
    $stats = $converter->getProcessingStats();

    // Generate static HTML pages for social media
    $staticGenerator = new StaticPageGenerator();
    $staticResults = $staticGenerator->generateAllPages();
    $staticStats = $staticGenerator->getGenerationStats();

    // Generate sitemap
    $sitemapGenerator = new SitemapGenerator();
    $sitemapResult = $sitemapGenerator->generateSitemap();
    if ($sitemapResult['success']) {
        $sitemapStats = ['generated' => 1, 'entries' => $sitemapResult['entries']];
    } else {
        $sitemapStats = ['generated' => 0, 'error' => $sitemapResult['error']];
    }

    echo "<h2>Content Processing Summary</h2>";
    echo "<div class='grid'>";

    // Overall Statistics
    echo "<div><table>
            <tr><th colspan='2'>Overall Statistics</th></tr>
            <tr>
                <td>Total Files</td>
                <td class='count'>{$stats['overall']['total']}</td>
            </tr>
            <tr>
                <td>Successfully Processed</td>
                <td class='count success'>{$stats['overall']['success']}</td>
            </tr>
            <tr>
                <td>Errors</td>
                <td class='count " . ($stats['overall']['errors'] > 0 ? 'error' : '') . "'>{$stats['overall']['errors']}</td>
            </tr>
          </table></div>";

    // Category Distribution
    echo "<div><table>
            <tr><th colspan='2'>Category Distribution</th></tr>";
    foreach ($stats['categories'] as $category => $count) {
        echo "<tr>
                <td>" . ucfirst($category) . "</td>
                <td class='count'>$count</td>
              </tr>";
    }
    echo "</table></div>";

    // Status Distribution
    echo "<div><table>
            <tr><th colspan='2'>Status Distribution</th></tr>";
    foreach ($stats['status'] as $status => $count) {
        echo "<tr>
                <td>" . ucfirst($status) . "</td>
                <td class='count'>$count</td>
              </tr>";
    }
    echo "</table></div>";

    // Missing Fields
    if (!empty($stats['missing'])) {
        echo "<div><table>
                <tr><th colspan='2'>Missing Optional Fields</th></tr>";
        foreach ($stats['missing'] as $field => $count) {
            echo "<tr>
                    <td>" . ucfirst($field) . "</td>
                    <td class='count warning'>$count</td>
                  </tr>";
        }
        echo "</table></div>";
    }

    // Static Page Generation Stats
    echo "<div><table>
            <tr><th colspan='2'>Static Page Generation</th></tr>
            <tr>
                <td>Pages Generated</td>
                <td class='count success'>{$staticResults['generated']}</td>
            </tr>
            <tr>
                <td>Generation Errors</td>
                <td class='count " . (count($staticResults['errors']) > 0 ? 'error' : '') . "'>" . count($staticResults['errors']) . "</td>
            </tr>
            <tr>
                <td>Total Static Files</td>
                <td class='count'>{$staticStats['static_pages_count']}</td>
            </tr>
          </table></div>";

    // Sitemap Generation Stats
    echo "<div><table>
            <tr><th colspan='2'>Sitemap Generation</th></tr>
            <tr>
                <td>Sitemap Created</td>
                <td class='count " . ($sitemapStats['generated'] > 0 ? 'success' : 'error') . "'>" . ($sitemapStats['generated'] > 0 ? 'Yes' : 'No') . "</td>
            </tr>";
    if (isset($sitemapStats['entries'])) {
        echo "<tr>
                <td>URL Entries</td>
                <td class='count'>{$sitemapStats['entries']}</td>
              </tr>";
    }
    if (isset($sitemapStats['error'])) {
        echo "<tr>
                <td>Error</td>
                <td class='error'>{$sitemapStats['error']}</td>
              </tr>";
    }
    echo "</table></div>";

    echo "</div>"; // Close grid

    // Sitemap Preview
    if ($sitemapStats['generated'] > 0 && file_exists('sitemap.xml')) {
        echo "<h2>Sitemap Preview</h2>";
        echo "<div style='background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; padding: 1rem; margin: 1rem 0;'>";
        echo "<div style='display: grid; grid-template-columns: 1fr auto auto auto; gap: 0.5rem; font-size: 0.9rem;'>";
        echo "<div style='font-weight: 600; padding: 0.5rem; background: #e9ecef; border-radius: 2px;'>URL</div>";
        echo "<div style='font-weight: 600; padding: 0.5rem; background: #e9ecef; border-radius: 2px; text-align: center;'>Priority</div>";
        echo "<div style='font-weight: 600; padding: 0.5rem; background: #e9ecef; border-radius: 2px; text-align: center;'>Frequency</div>";
        echo "<div style='font-weight: 600; padding: 0.5rem; background: #e9ecef; border-radius: 2px; text-align: center;'>Last Modified</div>";
        
        // Parse sitemap XML to show URLs
        $sitemapContent = file_get_contents('sitemap.xml');
        if (preg_match_all('/<url>\s*<loc>(.*?)<\/loc>\s*<lastmod>(.*?)<\/lastmod>\s*<changefreq>(.*?)<\/changefreq>\s*<priority>(.*?)<\/priority>\s*<\/url>/s', $sitemapContent, $matches, PREG_SET_ORDER)) {
            foreach ($matches as $match) {
                $url = htmlspecialchars($match[1]);
                $lastmod = htmlspecialchars($match[2]);
                $changefreq = htmlspecialchars($match[3]);
                $priority = htmlspecialchars($match[4]);
                
                // Style priority based on value
                $priorityClass = 'color: #666;';
                if ($priority == '1.0') $priorityClass = 'color: #28a745; font-weight: 600;';
                elseif ($priority == '0.9') $priorityClass = 'color: #17a2b8; font-weight: 600;';
                elseif ($priority == '0.8') $priorityClass = 'color: #6f42c1;';
                
                // Truncate long URLs for display
                $displayUrl = strlen($url) > 60 ? substr($url, 0, 57) . '...' : $url;
                
                echo "<div style='padding: 0.25rem 0.5rem; word-break: break-all;'>";
                echo "<a href='$url' target='_blank' style='color: #007bff; text-decoration: none; font-size: 0.85rem;'>$displayUrl</a>";
                echo "</div>";
                echo "<div style='padding: 0.25rem 0.5rem; text-align: center; $priorityClass'>$priority</div>";
                echo "<div style='padding: 0.25rem 0.5rem; text-align: center; color: #666; font-size: 0.85rem;'>$changefreq</div>";
                echo "<div style='padding: 0.25rem 0.5rem; text-align: center; color: #666; font-size: 0.85rem;'>$lastmod</div>";
            }
        }
        
        echo "</div>";
        echo "<div style='margin-top: 1rem; padding: 0.5rem; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 2px; font-size: 0.85rem;'>";
        echo "💡 <strong>How it works:</strong> Search engines will discover all these URLs through your sitemap.xml file, ";
        echo "allowing them to index your articles even though your main site is a JavaScript SPA.";
        echo "</div>";
        echo "</div>";
    }

    // Generated Static Pages List
    if ($staticResults['generated'] > 0) {
        $staticFiles = glob('static/*.html');
        if (!empty($staticFiles)) {
            echo "<h2>Generated Static Pages</h2>";
            echo "<div style='display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem;'>";
            foreach ($staticFiles as $file) {
                $filename = basename($file);
                $fileUrl = './static/' . $filename;
                $fileSize = round(filesize($file) / 1024, 1);
                $modTime = date('Y-m-d H:i:s', filemtime($file));
                
                echo "<div style='border: 1px solid #ddd; border-radius: 4px; padding: 1rem;'>";
                echo "<h3 style='margin: 0 0 0.5rem; font-size: 1rem;'><a href='$fileUrl' target='_blank'>$filename</a></h3>";
                echo "<div style='font-size: 0.8rem; color: #666;'>";
                echo "<div>Size: {$fileSize} KB</div>";
                echo "<div>Modified: $modTime</div>";
                echo "</div>";
                echo "</div>";
            }
            echo "</div>";
        }
    }

    // Static Generation Error Details (if any)
    if (!empty($staticResults['errors'])) {
        echo "<h2>Static Generation Errors</h2>
              <table>
                <tr>
                    <th>File</th>
                    <th>Error Message</th>
                </tr>";
        foreach ($staticResults['errors'] as $error) {
            echo "<tr>
                    <td>{$error['file']}</td>
                    <td class='error'>{$error['error']}</td>
                  </tr>";
        }
        echo "</table>";
    }

    // Error Details Section (if any)
    if (!empty($stats['errorDetails'])) {
        echo "<h2>Error Details</h2>
              <table>
                <tr>
                    <th>File</th>
                    <th>Error Message</th>
                </tr>";
        foreach ($stats['errorDetails'] as $error) {
            echo "<tr>
                    <td>{$error['file']}</td>
                    <td class='error'>{$error['error']}</td>
                  </tr>";
        }
        echo "</table>";
    }

} catch (Exception $e) {
    echo "<div class='error'>Error: " . $e->getMessage() . "</div>";
}
?>