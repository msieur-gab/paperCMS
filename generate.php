<?php
require_once 'markdown-to-json.php';

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
    $converter = new MarkdownConverter();
    $count = $converter->processFiles();
    $stats = $converter->getProcessingStats();

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

    echo "</div>"; // Close grid

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