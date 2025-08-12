<?php
require_once 'markdown-to-json.php';
require_once 'static-page-generator.php';

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

    echo "</div>"; // Close grid

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