<?php
// Hybrid routing: Pre-render articles for SEO, serve SPA shell for navigation
require_once 'php/config.php';
require_once 'php/markdown-to-json.php';

// Get the request path - handle CLI and web server environments
if (php_sapi_name() === 'cli') {
    // CLI mode - default to homepage for testing
    $requestPath = '/';
} else {
    // Web server mode - get actual request path
    $requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    $basePath = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? ''), '/');
    if ($basePath !== '/' && $basePath !== '') {
        $requestPath = substr($requestPath, strlen($basePath));
    }
    $requestPath = rtrim($requestPath, '/') ?: '/';
}

// Route detection
if (preg_match('#^/project/([^/]+)/?$#', $requestPath, $matches)) {
    // Article route - serve pre-rendered content
    $articleSlug = $matches[1];
    renderArticlePage($articleSlug);
} else {
    // Navigation route - serve SPA shell
    renderSPAShell();
}

function renderArticlePage($slug) {
    try {
        // Load publications data
        $jsonFile = __DIR__ . '/public/api/publications.json';
        if (!file_exists($jsonFile)) {
            throw new Exception('Publications data not found');
        }
        
        $jsonData = json_decode(file_get_contents($jsonFile), true);
        if (!$jsonData || !isset($jsonData['publications'])) {
            throw new Exception('Invalid publications data');
        }
        
        // Find the article
        $article = null;
        foreach ($jsonData['publications'] as $pub) {
            $pubSlug = basename($pub['path'], '.md');
            if ($pubSlug === $slug) {
                $article = $pub;
                break;
            }
        }
        
        if (!$article) {
            http_response_code(404);
            renderSPAShell(); // Fallback to SPA
            return;
        }
        
        // Load the actual markdown content
        $markdownFile = __DIR__ . '/content/' . $slug . '.md';
        if (!file_exists($markdownFile)) {
            http_response_code(404);
            renderSPAShell();
            return;
        }
        
        $markdownContent = file_get_contents($markdownFile);
        
        // Parse markdown to get HTML content
        $converter = new MarkdownConverter(__DIR__);
        $parsedContent = $converter->parseMarkdown($markdownContent);
        
        // Generate SEO-optimized HTML
        generateArticleHTML($article, $parsedContent['html'], $slug);
        
    } catch (Exception $e) {
        error_log("Error rendering article $slug: " . $e->getMessage());
        renderSPAShell(); // Fallback to SPA
    }
}

function generateArticleHTML($article, $contentHtml, $slug) {
    $baseUrl = Config::getBaseUrlWithSlash();
    $title = htmlspecialchars($article['title']) . ' - Gabriel Baude';
    $description = htmlspecialchars($article['description']);
    $image = $article['thumbnail'] ?? './content/media/og-default.jpg';
    $articleUrl = $baseUrl . 'project/' . $slug;
    
    // Resolve image URL
    if (!filter_var($image, FILTER_VALIDATE_URL)) {
        $image = $baseUrl . ltrim($image, './');
    }
    
    ?><!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $title; ?></title>
    <meta name="description" content="<?php echo $description; ?>">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="<?php echo $articleUrl; ?>">
    <meta property="og:title" content="<?php echo $title; ?>">
    <meta property="og:description" content="<?php echo $description; ?>">
    <meta property="og:image" content="<?php echo $image; ?>">
    <meta property="og:site_name" content="Gabriel Baude Portfolio">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="<?php echo $articleUrl; ?>">
    <meta name="twitter:title" content="<?php echo $title; ?>">
    <meta name="twitter:description" content="<?php echo $description; ?>">
    <meta name="twitter:image" content="<?php echo $image; ?>">
    
    <!-- Article specific meta -->
    <?php if (isset($article['contributors'])): ?>
        <?php foreach ($article['contributors'] as $contributor): ?>
            <?php if ($contributor['role'] === 'author'): ?>
                <meta name="author" content="<?php echo htmlspecialchars($contributor['name']); ?>">
                <meta property="article:author" content="<?php echo htmlspecialchars($contributor['name']); ?>">
            <?php endif; ?>
        <?php endforeach; ?>
    <?php endif; ?>
    
    <?php if (isset($article['date']['published'])): ?>
        <meta property="article:published_time" content="<?php echo $article['date']['published']; ?>">
    <?php endif; ?>
    
    <?php if (isset($article['tags'])): ?>
        <?php foreach ($article['tags'] as $tag): ?>
            <meta property="article:tag" content="<?php echo htmlspecialchars($tag); ?>">
        <?php endforeach; ?>
    <?php endif; ?>
    
    <?php if (isset($article['category'])): ?>
        <meta property="article:section" content="<?php echo htmlspecialchars($article['category']); ?>">
    <?php endif; ?>
    
    <!-- Structured Data -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "<?php echo addslashes($article['title']); ?>",
        "description": "<?php echo addslashes($article['description']); ?>",
        "url": "<?php echo $articleUrl; ?>",
        "author": {
            "@type": "Person",
            "name": "<?php echo isset($article['contributors'][0]['name']) ? addslashes($article['contributors'][0]['name']) : 'Gabriel Baude'; ?>"
        },
        "publisher": {
            "@type": "Person",
            "name": "Gabriel Baude"
        }
        <?php if (isset($article['date']['published'])): ?>
        ,"datePublished": "<?php echo $article['date']['published']; ?>"
        <?php endif; ?>
        <?php if (isset($article['thumbnail'])): ?>
        ,"image": "<?php echo $image; ?>"
        <?php endif; ?>
        <?php if (isset($article['category'])): ?>
        ,"genre": "<?php echo addslashes($article['category']); ?>"
        <?php endif; ?>
        <?php if (isset($article['tags'])): ?>
        ,"keywords": "<?php echo addslashes(implode(', ', $article['tags'])); ?>"
        <?php endif; ?>
    }
    </script>
    
    <!-- Canonical URL -->
    <link rel="canonical" href="<?php echo $articleUrl; ?>">
    
    <link rel="stylesheet" href="<?php echo $baseUrl; ?>css/main.css">
</head>
<body class="article-page">
    <?php renderSPABody($contentHtml, true); ?>
    <script type="module" src="<?php echo $baseUrl; ?>main.js"></script>
</body>
</html><?php
}

function renderSPAShell() {
    // Serve the original SPA shell (index.html content)
    $baseUrl = Config::getBaseUrlWithSlash();
    ?><!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gabriel Baude - Designer & Technologist</title>
    <meta name="description" content="Portfolio of Gabriel Baude - Designer and technologist exploring the intersection of traditional wisdom and modern design challenges.">
    <meta name="keywords" content="designer, technologist, portfolio, design, traditional wisdom, modern design">
    <meta name="author" content="Gabriel Baude">
    
    <!-- Basic Open Graph tags (URLs will be set dynamically) -->
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Gabriel Baude Portfolio">
    
    <!-- Twitter card type -->
    <meta name="twitter:card" content="summary_large_image">
    
    <link rel="stylesheet" href="<?php echo $baseUrl; ?>css/main.css">
</head>
<body>
    <?php renderSPABody(); ?>
    <script type="module" src="<?php echo $baseUrl; ?>main.js"></script>
</body>
</html><?php
}

function renderSPABody($articleContent = null, $isArticlePage = false) {
    if ($isArticlePage && $articleContent) {
        // Pre-populate with article content
        renderArticleBody($articleContent);
    } else {
        // Original SPA body structure
        renderOriginalSPABody();
    }
}

function renderArticleBody($contentHtml) {
    ?>
    <main role="main" data-active-section="project-details" class="article-prerendered">
        <section id="story" class="section">
            <div class="section-content">
                <div id="lipsum">
                    <section>
                        <h1>Hello, I'm Gabriel</h1>
                        <h2>Designer, Technologist </h2>
                        <p>For over a vicennium, I've been navigating the intersection of design, technology, and cultural understanding. My journey has taken me from Europe to China, where immersion in traditional wisdom has profoundly shaped my approach to design and problem-solving.</p>
                    </section>
                    
                    <section>
                        <h1>Professional Journey</h1>
                        <p>After establishing my foundation in design in Europe, I made the transformative decision to work in China. This experience has been more than a career move—it became a journey of discovery, leading me to explore how ancient principles can inform modern design challenges.</p>
                        
                        <p>My work spans across:</p>
                        <ul>
                          <li>Digital product design and development</li>
                          <li>Cross-cultural design implementation</li>
                          <li>Integration of traditional principles in modern contexts</li>
                          <li>Design methodology development</li>
                        </ul>
                      
                        <h2>Current Focus</h2>
                        <p>Today, I blend traditional wisdom with contemporary design needs, exploring how timeless principles can address modern challenges. This approach has shaped my:</p>
                        <ul>
                          <li>Design philosophy</li>
                          <li>Problem-solving methods</li>
                          <li>Understanding of user needs across cultures</li>
                          <li>Approach to sustainable and meaningful solutions</li>
                        </ul>
                      
                        <h2>About This Space</h2>
                        <p>This platform is where I share my ongoing journey of learning and creation. It's a collection of:</p>
                        <ul>
                          <li>Insights gained from bridging Eastern and Western design principles</li>
                          <li>Practical applications of theoretical concepts</li>
                          <li>Explorations in making complex systems more accessible</li>
                          <li>Documentation of both successes and learning experiences</li>
                        </ul>
                        
                        <p>I believe in sharing knowledge openly and fostering discussion. Whether you're a designer, developer, or simply curious about the intersection of traditional wisdom and modern design, I hope you'll find value in these explorations.</p>
                    </section>
                </div>
            </div>
        </section>

        <section id="projects" class="section">
          <div class="section-content">
              <header class="work-header">
                  <div class="work-header-main">
                      <h1>Projects</h1><nav class="category-filter" aria-label="Project categories">
                        <!-- Category buttons will be injected here -->
                    </nav>
                      <div class="search-container">
                          <!-- Search component will be injected here -->
                      </div>
                      <div class="sort-container">
                        <!-- Sort component gets injected here -->
                    </div>
                  </div>
                  <nav class="category-filter" aria-label="Project categories">
                      <!-- Category buttons will be injected here -->
                  </nav>
              </header>
              <div class="projects-container">
                  <div class="projects-grid">
                      <!-- Project cards will be injected here -->
                  </div>
              </div>
          </div>
      </section>

        <section id="project-details" class="section">
            <aside class="project-media" aria-label="Project media">
                <figure class="current-media">
                    <!-- Media will be injected here -->
                </figure>
            </aside>
            
            <article class="project-content">
                <header class="project-header">
                    <h1 class="project-title"></h1>
                    <p class="header-enhancement author-byline" style="display: none;">
                      By <img class="author-avatar-header" src="" alt="" width="48" height="48">
                      <span class="author-name-header" rel="author"></span>
                    </p>
                    <p class="header-enhancement date-byline" style="display: none;">
                      Published on <time class="publication-date-header" datetime=""></time>
                    </p>
                </header>
                
                <div id="project-details-content" class="content-scroll">
                    <?php echo $contentHtml; ?>
                </div>
            </article>
        </section>
    </main>

    <?php renderSharedComponents(); ?>
    <?php
}

function renderOriginalSPABody() {
    // Copy of the original index.html body content
    ?>
    <main role="main" data-active-section="story">
        <section id="story" class="section">
            <div class="section-content">
                <div id="lipsum">
                    <section>
                        <h1>Hello, I'm Gabriel</h1>
                        <h2>Designer, Technologist </h2>
                        <p>For over a vicennium, I've been navigating the intersection of design, technology, and cultural understanding. My journey has taken me from Europe to China, where immersion in traditional wisdom has profoundly shaped my approach to design and problem-solving.</p>
                      </section>
                      
                      <section>
                        <h1>Professional Journey</h1>
                        <p>After establishing my foundation in design in Europe, I made the transformative decision to work in China. This experience has been more than a career move—it became a journey of discovery, leading me to explore how ancient principles can inform modern design challenges.</p>
                        
                        <p>My work spans across:</p>
                        <ul>
                          <li>Digital product design and development</li>
                          <li>Cross-cultural design implementation</li>
                          <li>Integration of traditional principles in modern contexts</li>
                          <li>Design methodology development</li>
                        </ul>
                      
                        <h2>Current Focus</h2>
                        <p>Today, I blend traditional wisdom with contemporary design needs, exploring how timeless principles can address modern challenges. This approach has shaped my:</p>
                        <ul>
                          <li>Design philosophy</li>
                          <li>Problem-solving methods</li>
                          <li>Understanding of user needs across cultures</li>
                          <li>Approach to sustainable and meaningful solutions</li>
                        </ul>
                      
                        <h2>About This Space</h2>
                        <p>This platform is where I share my ongoing journey of learning and creation. It's a collection of:</p>
                        <ul>
                          <li>Insights gained from bridging Eastern and Western design principles</li>
                          <li>Practical applications of theoretical concepts</li>
                          <li>Explorations in making complex systems more accessible</li>
                          <li>Documentation of both successes and learning experiences</li>
                        </ul>
                        
                        <p>I believe in sharing knowledge openly and fostering discussion. Whether you're a designer, developer, or simply curious about the intersection of traditional wisdom and modern design, I hope you'll find value in these explorations.</p>
                      </section>
                      
                      <section>
                        <h1>Open Knowledge & Collaboration</h1>
                        <p>Everything shared here, unless explicitly stated otherwise, is copyleft. This means you are free to:</p>
                        <ul>
                          <li>Download and use the content</li>
                          <li>Adapt the ideas to your own context</li>
                          <li>Build upon the concepts</li>
                          <li>Share your adaptations with others</li>
                        </ul>
                      
                        <p>The goal is to let these ideas grow and evolve beyond their initial scope. Each concept shared here is like a seed—it might flourish differently in different contexts, and that's exactly what makes it valuable.</p>
                      
                        <p>If you find yourself particularly drawn to certain concepts or see potential for collaboration, I welcome direct engagement. Whether you want to:</p>
                        <ul>
                          <li>Further develop an existing idea</li>
                          <li>Refine a methodology</li>
                          <li>Apply a concept in a new context</li>
                          <li>Start a collaborative project</li>
                        </ul>
                      
                        <p>Feel free to reach out. The best ideas often emerge from unexpected connections and collaborations.</p>
                      </section>
                      
                      <section>
                        <h1>A Journey Through Design</h1>
                        <p>From abstract thought to concrete reality, every creation has a story.</p>
                      
                        <h2>Categories</h2>
                        
                        <div>
                          <h3>Reflexion</h3>
                          <p>Where ideas take shape through contemplation of principles, philosophies, and possibilities. Here, we explore the theoretical foundations that guide our approach to design and creation.</p>
                          <p><em>Think of it as the fertile soil from which innovation grows.</em></p>
                        </div>
                      
                        <div>
                          <h3>Exploration</h3>
                          <p>The bridge between thought and action. Through prototyping, experimentation, and iterative learning, we discover how theoretical insights can transform into practical methods.</p>
                          <p><em>Consider this our laboratory, where ideas meet reality.</em></p>
                        </div>
                      
                        <div>
                          <h3>Application</h3>
                          <p>Where theory and exploration culminate in tangible results. These are the concrete manifestations of our journey, from finished projects to practical solutions.</p>
                          <p><em>The realization of possibilities, where abstract becomes concrete.</em></p>
                        </div>
                      
                        <p><em>Each category flows into the next, creating a continuous cycle of learning and creation.</em></p>
                    </section><section>
                        <h1>An Invitation to Explore</h1>
                        <p>Each piece of content here is part of a larger conversation, a branch in an ever-growing tree of thoughts and creations. You'll find related content suggestions throughout, inviting you to explore different perspectives and stages of various journeys.</p>
                      
                        <p>Some paths may lead to fully realized projects, while others might remain as thought experiments or unfinished explorations. This incompleteness isn't a flaw—it's a reflection of how learning and creation truly work. Each unfinished branch holds potential for future discovery, waiting for the right moment or perspective to continue its growth.</p>
                      
                        <h3>How to Navigate</h3>
                        <ul>
                          <li>Follow related content links to see how ideas evolve across categories</li>
                          <li>Explore different stages of the same concept—from initial reflection to practical application</li>
                          <li>Discover unexpected connections between seemingly unrelated topics</li>
                        </ul>
                      
                        <p><em>Remember: These are living documents, growing and evolving with each new insight and discovery. Some branches may lie dormant, others may flourish in unexpected ways—each contributing to the larger tapestry of understanding.</em></p>
                      </section>
                    </div>
            </div>
        </section>

        <section id="projects" class="section">
          <div class="section-content">
              <header class="work-header">
                  <div class="work-header-main">
                      <h1>Projects</h1><nav class="category-filter" aria-label="Project categories">
                        <!-- Category buttons will be injected here -->
                    </nav>
                      <div class="search-container">
                          <!-- Search component will be injected here -->
                      </div>
                      <div class="sort-container">
                        <!-- Sort component gets injected here -->
                    </div>
                  </div>
                  <nav class="category-filter" aria-label="Project categories">
                      <!-- Category buttons will be injected here -->
                  </nav>
              </header>
              <div class="projects-container">
                  <div class="projects-grid">
                      <!-- Project cards will be injected here -->
                  </div>
              </div>
          </div>
      </section>

        <section id="project-details" class="section">
            <aside class="project-media" aria-label="Project media">
                <figure class="current-media">
                    <!-- Media will be injected here -->
                </figure>
            </aside>
            
            <article class="project-content">
              <header class="project-header">
                <h1 class="project-title"></h1>
                <p class="header-enhancement author-byline" style="display: none;">
                  By <img class="author-avatar-header" src="" alt="" width="48" height="48">
                  <span class="author-name-header" rel="author"></span>
                </p>
                <p class="header-enhancement date-byline" style="display: none;">
                  Published on <time class="publication-date-header" datetime=""></time>
                </p>
              </header>
                
                <div id="project-details-content" class="content-scroll">
                    <!-- Project content will be injected here -->
                </div>
            </article>
        </section>
    </main>

    <?php renderSharedComponents(); ?>
    <?php
}

function renderSharedComponents() {
    ?>
    <div class="settings-drawer" aria-hidden="true" role="dialog" aria-label="Settings panel">
      <div class="settings-content">
          <div class="settings-controls">
            <div class="settings-control-group"></div>
            <div class="settings-control-group"></div>
            
            <div class="settings-control-group">
              <label>Font Size</label>
              <div class="font-size-controls">
                  <button class="font-size-decrease" aria-label="Decrease font size">A-</button>
                  <button class="font-size-reset" aria-label="Reset font size">Reset</button>
                  <button class="font-size-increase" aria-label="Increase font size">A+</button>
              </div>
          </div>
              <div class="settings-control-group">
                  <label>Theme</label>
                  <div class="controls-container">
                      <button class="theme-toggle" aria-label="Toggle theme"></button>
                  </div>
              </div>
          </div>
      </div>
  </div>

    <nav class="main-nav">
      <button class="settings-toggle" aria-label="Open settings">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 15a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
    </button>
        <a href="/" section="story">Story</a>
        <a href="/projects" section="projects">Projects</a>
    </nav>
    <?php
}
?>