# PaperCMS Deployment Guide

## Quick Deployment to OVH

### 1. Upload Files
Upload all files to your OVH web directory, typically:
- `public_html/` or `www/` directory
- Ensure all file permissions are correct (644 for files, 755 for directories)

### 2. Configure Base URL
Edit `php/config.php` and update the `BASE_URL`:

```php
const BASE_URL = 'https://your-domain.com';  // Replace with your actual domain
```

### 3. Test the System

**Homepage:** `https://your-domain.com/`
- Should load the SPA homepage

**Projects:** `https://your-domain.com/projects` 
- Should load the projects grid

**Articles:** `https://your-domain.com/project/kanawa`
- Should load pre-rendered article with perfect SEO

### 4. Verify SEO
Test with search engine tools:
- **Google PageSpeed Insights**: Check loading performance
- **Facebook Debugger**: Verify Open Graph tags
- **Twitter Card Validator**: Test social sharing
- **View Source**: Confirm meta tags and content are present

### 5. Update Content
To add new articles:
1. Create markdown file in `content/` directory
2. Run `php php/generate.php` to update the JSON API
3. New article automatically available at `/project/filename`

## Testing Locally

```bash
# Start local PHP server
php -S localhost:8000

# Test URLs
http://localhost:8000/                    # Homepage
http://localhost:8000/projects            # Projects page
http://localhost:8000/project/kanawa      # Article page
```

## Troubleshooting

### URL Rewriting Issues
If clean URLs don't work:
1. Ensure `.htaccess` is uploaded and readable
2. Verify Apache `mod_rewrite` is enabled
3. Check file permissions on `.htaccess` (644)

### PHP Errors
If you see PHP errors:
1. Check PHP version (7.4+ recommended)
2. Ensure all files uploaded correctly
3. Verify file paths in `php/config.php`

### Missing Content
If articles don't load:
1. Run `php php/generate.php` to regenerate API
2. Check `public/api/publications.json` exists
3. Verify markdown files have proper YAML frontmatter

## Performance Optimization

The system includes:
- ✅ Asset caching (CSS, JS, images)
- ✅ Optimized URL structure
- ✅ Minimal PHP processing overhead
- ✅ Static asset delivery

## Security Notes

The `.htaccess` includes basic security headers:
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff  
- Referrer-Policy: strict-origin-when-cross-origin

For production, consider additional security measures based on your hosting environment.