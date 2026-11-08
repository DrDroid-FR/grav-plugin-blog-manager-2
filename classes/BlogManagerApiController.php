<?php

namespace Grav\Plugin\BlogManager;

use Grav\Plugin\Api\Response\ApiResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\UploadedFileInterface;

class BlogManagerApiController extends \Grav\Plugin\Api\Controllers\AbstractApiController
{
    protected function getBlogPath(): string
    {
        return $this->grav['config']->get('plugins.blog-manager.blog_path', '/blog');
    }

    protected function adminEditUrl(string ...$segments): string
    {
        $base = rtrim((string)($this->grav['base_url'] ?? ''), '/');
        $route = '/' . trim((string)$this->grav['config']->get('plugins.admin2.route', '/admin2'), '/');
        $parts = [];
        foreach ($segments as $segment) {
            $segment = trim($segment, '/');
            if ($segment !== '') {
                $parts[] = rawurlencode($segment);
            }
        }

        return $base . $route . '/pages/edit/' . implode('/', $parts);
    }

    protected function getBlogFolder(): ?string
    {
        return $this->folderForSlug($this->getBlogPath());
    }

    protected function folderForSlug(string $slug): ?string
    {
        $slug = trim($slug, '/');
        if ($slug === '' || $this->isUnsafeSegment($slug)) {
            return null;
        }

        $pagesDir = $this->grav['locator']->findResource('page://', true);
        if (!$pagesDir || !is_dir($pagesDir)) {
            return null;
        }

        foreach (new \DirectoryIterator($pagesDir) as $file) {
            if ($file->isDot() || !$file->isDir()) {
                continue;
            }
            $basename = $file->getBasename();
            $clean = preg_replace('/^\d+\./', '', $basename);
            if ($clean === $slug) {
                return $file->getPathname();
            }
        }

        return null;
    }

    protected function isUnsafeSegment(string $value): bool
    {
        return strpos($value, '..') !== false
            || strpos($value, '/') !== false
            || strpos($value, '\\') !== false;
    }

    protected function isUnsafeName(string $name): bool
    {
        return $name === ''
            || $name === '.'
            || $name === '..'
            || strpos($name, '/') !== false
            || strpos($name, '\\') !== false;
    }

    protected function isInside(string $baseReal, string $candidateReal): bool
    {
        $baseReal = rtrim($baseReal, "/\\");
        $candidateReal = rtrim($candidateReal, "/\\");
        if ($baseReal === '' || $candidateReal === '') {
            return false;
        }
        if ($candidateReal === $baseReal) {
            return true;
        }

        return strpos($candidateReal, $baseReal . DIRECTORY_SEPARATOR) === 0;
    }

    protected function resolvePath(string $base, string $relative): ?string
    {
        if ($relative === '' || $this->isUnsafeSegment($relative)) {
            return null;
        }

        $baseReal = realpath($base);
        if (!$baseReal) {
            return null;
        }

        $targetReal = realpath($baseReal . DIRECTORY_SEPARATOR . $relative);
        if (!$targetReal || !$this->isInside($baseReal, $targetReal)) {
            return null;
        }

        return $targetReal;
    }

    protected function getPostDir(string $folder): ?string
    {
        $blogDir = $this->getBlogFolder();
        if (!$blogDir) {
            return null;
        }

        if ($this->isUnsafeSegment($folder)) {
            return null;
        }

        // Try exact match first
        $exact = $this->resolvePath($blogDir, $folder);
        if ($exact && is_dir($exact)) {
            return $exact;
        }

        // Try to find by stripped prefix match (folder might be passed without timestamp prefix)
        $strippedParam = $this->stripPostFolderPrefix($folder);
        if ($strippedParam !== $folder) {
            // param had prefix, already tried exact
        }

        // Scan blog dir for matching folders
        $dirs = glob($blogDir . '/[0-9]*', GLOB_ONLYDIR);
        if (is_array($dirs)) {
            foreach ($dirs as $postDir) {
                $basename = basename($postDir);
                if ($basename === $folder) {
                    return $this->resolvePath($blogDir, $basename);
                }
                if ($this->stripPostFolderPrefix($basename) === $strippedParam) {
                    return $this->resolvePath($blogDir, $basename);
                }
                if ($this->stripPostFolderPrefix($basename) === $folder) {
                    return $this->resolvePath($blogDir, $basename);
                }
            }
        }

        return null;
    }

    protected function stripPostFolderPrefix(string $folder): string
    {
        return preg_replace('/^\d+\./', '', $folder);
    }

    protected function defaultContentLanguage(): string
    {
        $candidates = [
            $this->grav['config']->get('system.languages.default_lang'),
            $this->grav['config']->get('site.default_lang'),
        ];
        if (isset($this->grav['language'])) {
            $candidates[] = $this->grav['language']->getDefault();
        }
        foreach ($candidates as $code) {
            if (is_string($code) && $code !== '') {
                return $code;
            }
        }

        return '';
    }

    protected function findItemFile(string $postDir): ?array
    {
        $files = $this->findItemFiles($postDir);

        return $files[0] ?? null;
    }

    /**
     * Every article file in a post folder. item.md is the default language.
     * item.{lang}.md files follow, sorted by language code.
     *
     * @return list<array{file: string, lang: string}>
     */
    protected function findItemFiles(string $postDir): array
    {
        $files = [];
        $defaultItem = $postDir . '/item.md';
        if (is_file($defaultItem)) {
            $files[] = ['file' => $defaultItem, 'lang' => $this->defaultContentLanguage()];
        }

        $items = glob($postDir . '/item.*.md');
        if ($items === false) {
            $items = [];
        }
        sort($items, SORT_STRING);
        foreach ($items as $file) {
            $basename = basename($file);
            if (!preg_match('/^item\.([^.]+)\.md$/', $basename, $m)) {
                continue;
            }
            $files[] = ['file' => $file, 'lang' => $m[1]];
        }

        return $files;
    }

    protected function itemFileForLanguage(string $postDir, string $lang): ?array
    {
        foreach ($this->findItemFiles($postDir) as $file) {
            if ($file['lang'] === $lang) {
                return $file;
            }
        }

        return null;
    }

    protected function detectImageField(array $header): string
    {
        $extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        $excludePatterns = ['avatar', 'icon', 'logo', 'favicon', 'profile', 'author', 'social'];
        $imageFields = ['hero_image', 'image', 'img', 'thumbnail', 'cover', 'hero', 'feature', 'header_image'];

        foreach ($imageFields as $field) {
            if (isset($header[$field]) && is_string($header[$field])) {
                $value = $header[$field];
                $ext = strtolower(pathinfo($value, PATHINFO_EXTENSION));
                if (in_array($ext, $extensions)) {
                    return basename($value);
                }
            }
        }

        foreach ($header as $key => $value) {
            if (!is_string($value) || $value === '') continue;

            $keyLower = strtolower((string)$key);
            $excluded = false;
            foreach ($excludePatterns as $pattern) {
                if (strpos($keyLower, $pattern) !== false) {
                    $excluded = true;
                    break;
                }
            }
            if ($excluded) continue;

            $ext = strtolower(pathinfo($value, PATHINFO_EXTENSION));
            if (in_array($ext, $extensions)) {
                return basename($value);
            }
        }

        return '';
    }

    protected function publicPageFileUrl(string $absoluteFile): string
    {
        $pagesRoot = realpath((string)$this->grav['locator']->findResource('page://', true));
        $fileReal = realpath($absoluteFile);
        if (!$pagesRoot || !$fileReal || !$this->isInside($pagesRoot, $fileReal)) {
            return '';
        }

        $pagesWeb = trim(str_replace('\\', '/', (string)$this->grav['locator']->findResource('page://', false)), '/');
        $relative = ltrim(str_replace('\\', '/', substr($fileReal, strlen($pagesRoot))), '/');
        $segments = array_map('rawurlencode', explode('/', $relative));
        $base = rtrim((string)($this->grav['base_url'] ?? ''), '/');

        return $base . '/' . $pagesWeb . '/' . implode('/', $segments);
    }

    protected function findFirstMediaImage(string $postDir): string
    {
        $extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        foreach ($extensions as $ext) {
            $images = glob($postDir . '/*.' . $ext);
            if (empty($images)) {
                $images = glob($postDir . '/*.' . strtoupper($ext));
            }
            if (!empty($images)) {
                sort($images);
                return basename($images[0]);
            }
        }
        return '';
    }

    protected function deleteTree(string $absoluteDir, string $allowedRootReal): bool
    {
        $resolved = realpath($absoluteDir);
        if (!$resolved || !is_dir($resolved) || !$this->isInside($allowedRootReal, $resolved)) {
            return false;
        }

        $items = array_diff(scandir($resolved), ['.', '..']);
        foreach ($items as $item) {
            $path = $resolved . DIRECTORY_SEPARATOR . $item;
            if (is_link($path)) {
                if (!unlink($path)) {
                    return false;
                }
                continue;
            }
            if (is_dir($path)) {
                if (!$this->deleteTree($path, $allowedRootReal)) {
                    return false;
                }
                continue;
            }
            $fileReal = realpath($path);
            if (!$fileReal || !$this->isInside($allowedRootReal, $fileReal) || !unlink($fileReal)) {
                return false;
            }
        }

        return rmdir($resolved);
    }

    protected function copyTree(string $srcReal, string $dst, string $dstRootReal): bool
    {
        $srcResolved = realpath($srcReal);
        if (!$srcResolved || !is_dir($srcResolved)) {
            return false;
        }

        return $this->copyTreeWithin($srcResolved, $srcResolved, $dst, $dstRootReal);
    }

    private function copyTreeWithin(string $srcRootReal, string $srcResolved, string $dst, string $dstRootReal): bool
    {
        if (!is_dir($srcResolved) || !$this->isInside($srcRootReal, $srcResolved)) {
            return false;
        }

        $dstParentReal = realpath(dirname($dst));
        $dstName = basename($dst);
        if (!$dstParentReal || $this->isUnsafeName($dstName)) {
            return false;
        }
        if (!$this->isInside($dstRootReal, $dstParentReal)) {
            return false;
        }

        $dstFull = $dstParentReal . DIRECTORY_SEPARATOR . $dstName;
        if (!$this->isInside($dstRootReal, $dstFull)) {
            return false;
        }
        if (!is_dir($dstFull) && !mkdir($dstFull, 0755) && !is_dir($dstFull)) {
            return false;
        }

        $items = array_diff(scandir($srcResolved), ['.', '..']);
        foreach ($items as $item) {
            if ($this->isUnsafeName((string)$item)) {
                return false;
            }
            $srcPath = $srcResolved . DIRECTORY_SEPARATOR . $item;
            $dstPath = $dstFull . DIRECTORY_SEPARATOR . $item;
            if (is_link($srcPath)) {
                return false;
            }
            if (is_dir($srcPath)) {
                $childReal = realpath($srcPath);
                if (!$childReal || !$this->copyTreeWithin($srcRootReal, $childReal, $dstPath, $dstRootReal)) {
                    return false;
                }
                continue;
            }
            $fileReal = realpath($srcPath);
            if (!$fileReal || !$this->isInside($srcRootReal, $fileReal) || !copy($fileReal, $dstPath)) {
                return false;
            }
        }

        return true;
    }

    protected function folderFromRequest(ServerRequestInterface $request): string
    {
        $folder = $this->getRouteParam($request, 'folder');
        if (is_string($folder) && $folder !== '') {
            return $folder;
        }

        $attribute = $request->getAttribute('folder');

        return is_string($attribute) ? $attribute : '';
    }

    protected function getRequestBody(ServerRequestInterface $request): array
    {
        $json = $request->getAttribute('json_body');
        if (is_array($json)) {
            return $json;
        }

        $contentType = $request->getHeaderLine('Content-Type');
        if (str_contains($contentType, 'application/json')) {
            $body = (string)$request->getBody();
            $decoded = json_decode($body, true);
            return is_array($decoded) ? $decoded : [];
        }

        $params = $request->getParsedBody();
        $query = $request->getQueryParams();

        if (!is_array($params)) {
            $params = [];
        }
        if (!is_array($query)) {
            $query = [];
        }

        return array_merge($query, $params);
    }

    public function listPosts(ServerRequestInterface $request): ResponseInterface
    {
        $this->requirePermission($request, 'blog-manager.posts.read');

        try {
            $blogDir = $this->getBlogFolder();
            if (!$blogDir) {
                return ApiResponse::create(['success' => false, 'message' => 'Blog folder not found'], 404);
            }

            $blogSlug = trim($this->getBlogPath(), '/');
            $editBase = $this->adminEditUrl($blogSlug);

            $posts = [];
            $dirs = glob($blogDir . '/*', GLOB_ONLYDIR);
            if ($dirs === false) {
                $dirs = [];
            }

            foreach ($dirs as $postDir) {
                $postFolder = basename($postDir);
                $itemFiles = $this->findItemFiles($postDir);
                if ($itemFiles === []) {
                    continue;
                }

                foreach ($itemFiles as $itemFile) {
                $content = @file_get_contents($itemFile['file']);
                if ($content === false) {
                    continue;
                }

                if (!preg_match('/^---\s*\n(.*?\n)---\s*\n(.*)$/s', $content, $matches)) {
                    continue;
                }
                $headerRaw = $matches[1] ?? '';
                $body = $matches[2] ?? '';
                try {
                    $header = \Symfony\Component\Yaml\Yaml::parse($headerRaw);
                } catch (\Exception $e) {
                    $header = [];
                }
                if (!is_array($header)) {
                    $header = [];
                }

                $editUrl = $editBase . '/' . $this->stripPostFolderPrefix($postFolder);
                if ($itemFile['lang'] !== '') {
                    $editUrl .= '?lang=' . rawurlencode($itemFile['lang']);
                }

                $presented = $this->presentPost($header, $postFolder);
                $post = [
                    'folder' => $postFolder,
                    'title' => $presented['title'],
                    'date' => $presented['date'],
                    'visible' => $header['visible'] ?? true,
                    'published' => $header['published'] ?? true,
                    'taxonomy' => $presented['taxonomy'],
                    'image' => '',
                    'image_url' => '',
                    'edit_url' => $editUrl,
                    'lang' => $itemFile['lang']
                ];

                $post['image'] = $this->detectImageField($header);
                if (!$post['image']) {
                    $post['image'] = $this->findFirstMediaImage($postDir);
                }

                $imagePath = $post['image'] !== '' ? $this->resolvePath($postDir, $post['image']) : null;
                $imageUrl = $imagePath ? $this->publicPageFileUrl($imagePath) : '';
                if ($imageUrl !== '') {
                    $post['image_url'] = $imageUrl;
                } else {
                    $post['image_url'] = rtrim((string)($this->grav['base_url'] ?? ''), '/') . '/user/plugins/blog-manager/assets/images/grav-cms-logo.svg';
                }

                $bodyContent = trim($body);
                $stripped = strip_tags($bodyContent);
                $stripped = preg_replace('/[#*_`~\[\]>|!\-]+/', '', $stripped);
                $stripped = preg_replace('/\s+/', ' ', trim($stripped));
                if (function_exists('mb_substr')) {
                    $post['excerpt'] = mb_substr($stripped, 0, 150);
                    if (mb_strlen($stripped) > 150) {
                        $post['excerpt'] .= '…';
                    }
                } else {
                    $post['excerpt'] = substr($stripped, 0, 150);
                    if (strlen($stripped) > 150) {
                        $post['excerpt'] .= '…';
                    }
                }

                $posts[] = $post;
                }
            }

            usort($posts, function ($a, $b) {
                return ((int)($b['date'] ?? 0)) <=> ((int)($a['date'] ?? 0));
            });

            return ApiResponse::create([
                'success' => true,
                'posts' => $posts,
                'new_post_url' => $this->adminEditUrl($blogSlug)
            ]);
        } catch (\Exception $e) {
            if (isset($this->grav['log'])) {
                $this->grav['log']->error('BlogManager API error in listPosts: ' . $e->getMessage());
            }
            return ApiResponse::create([
                'success' => false,
                'message' => 'Internal server error'
            ], 500);
        }
    }

    public function newPost(ServerRequestInterface $request): ResponseInterface
    {
        $this->requirePermission($request, 'blog-manager.posts.write');

        $blogDir = $this->getBlogFolder();
        if (!$blogDir) {
            return ApiResponse::create(['success' => false, 'message' => 'Blog folder not found'], 404);
        }

        $body = $this->getRequestBody($request);
        $title = $body['title'] ?? 'New Post';
        $slug = $this->slugify($title);
        $timestamp = date('YmdHis');
        $folderName = $timestamp . '-' . $slug;
        $postDir = $blogDir . '/' . $folderName;

        if (!mkdir($postDir, 0755, true)) {
            return ApiResponse::create(['success' => false, 'message' => 'Could not create post folder'], 500);
        }

        $frontmatter = [
            'title' => $title,
            'date' => date('Y-m-d\TH:i:sP'),
            'published' => false,
            'visible' => true,
            'taxonomy' => [
                'category' => ['Uncategorized'],
                'tag' => []
            ]
        ];

        $yaml = \Symfony\Component\Yaml\Yaml::dump($frontmatter, 2, 2);
        $content = "---\n" . $yaml . "---\n\n";

        $itemFile = $postDir . '/item.md';
        file_put_contents($itemFile, $content);

        $blogSlug = trim($this->getBlogPath(), '/');
        $editUrl = $this->adminEditUrl($blogSlug, $this->stripPostFolderPrefix($folderName));

        return ApiResponse::create([
            'success' => true,
            'edit_url' => $editUrl
        ], 201);
    }

    public function deletePost(ServerRequestInterface $request): ResponseInterface
    {
        $this->requirePermission($request, 'blog-manager.posts.delete');

        $body = $this->getRequestBody($request);
        $folder = $body['folder'] ?? null;

        if (!is_string($folder) || $folder === '') {
            return ApiResponse::create(['success' => false, 'message' => 'Folder not specified'], 400);
        }

        if ($this->isUnsafeSegment($folder)) {
            return ApiResponse::create(['success' => false, 'message' => 'Invalid folder parameter'], 400);
        }

        $postDir = $this->getPostDir($folder);
        if (!$postDir) {
            return ApiResponse::create(['success' => false, 'message' => 'Post not found'], 404);
        }

        $blogReal = realpath((string)$this->getBlogFolder());
        if (!$blogReal || !$this->deleteTree($postDir, $blogReal)) {
            return ApiResponse::create(['success' => false, 'message' => 'Failed to delete post'], 500);
        }

        return ApiResponse::create(['success' => true, 'message' => 'Post deleted successfully']);
    }

    public function toggleField(ServerRequestInterface $request): ResponseInterface
    {
        $this->requirePermission($request, 'blog-manager.posts.write');

        $body = $this->getRequestBody($request);
        $folder = $body['folder'] ?? null;
        $field = $body['field'] ?? null;
        $lang = $body['lang'] ?? '';

        if (!is_string($folder) || $folder === '' || !in_array($field, ['published', 'visible'], true) || !is_string($lang)) {
            return ApiResponse::create(['success' => false, 'message' => 'Invalid parameters'], 400);
        }
        if ($lang !== '' && !preg_match('/^[A-Za-z0-9_-]+$/', $lang)) {
            return ApiResponse::create(['success' => false, 'message' => 'Invalid parameters'], 400);
        }

        if ($this->isUnsafeSegment($folder)) {
            return ApiResponse::create(['success' => false, 'message' => 'Invalid folder parameter'], 400);
        }

        $postDir = $this->getPostDir($folder);
        if (!$postDir) {
            return ApiResponse::create(['success' => false, 'message' => 'Post not found'], 404);
        }

        $itemFile = $lang === '' ? $this->findItemFile($postDir) : $this->itemFileForLanguage($postDir, $lang);
        if (!$itemFile) {
            return ApiResponse::create(['success' => false, 'message' => 'Item file not found'], 404);
        }

        $content = file_get_contents($itemFile['file']);
        if (!preg_match('/^---\s*\n(.*?\n)---\s*\n(.*)$/s', $content, $matches)) {
            return ApiResponse::create(['success' => false, 'message' => 'Invalid frontmatter'], 400);
        }

        $header = \Symfony\Component\Yaml\Yaml::parse($matches[1]);
        if (!is_array($header)) {
            $header = [];
        }

        $header[$field] = !($header[$field] ?? true);

        $yaml = \Symfony\Component\Yaml\Yaml::dump($header, 2, 2);
        $newContent = "---\n" . $yaml . "---\n" . $matches[2];
        file_put_contents($itemFile['file'], $newContent);

        return ApiResponse::create([
            'success' => true,
            'field' => $field,
            'value' => $header[$field]
        ]);
    }

    public function duplicatePost(ServerRequestInterface $request): ResponseInterface
    {
        $this->requirePermission($request, 'blog-manager.posts.write');

        $body = $this->getRequestBody($request);
        $folder = $body['folder'] ?? null;

        if (!is_string($folder) || $folder === '') {
            return ApiResponse::create(['success' => false, 'message' => 'Folder not specified'], 400);
        }

        if ($this->isUnsafeSegment($folder)) {
            return ApiResponse::create(['success' => false, 'message' => 'Invalid folder parameter'], 400);
        }

        $postDir = $this->getPostDir($folder);
        if (!$postDir) {
            return ApiResponse::create(['success' => false, 'message' => 'Post not found'], 404);
        }

        $blogReal = realpath((string)$this->getBlogFolder());
        if (!$blogReal || !$this->isInside($blogReal, $postDir)) {
            return ApiResponse::create(['success' => false, 'message' => 'Post not found'], 404);
        }

        $timestamp = date('YmdHis');
        $newFolder = $folder . '-copy-' . $timestamp;
        if ($this->isUnsafeSegment($newFolder)) {
            return ApiResponse::create(['success' => false, 'message' => 'Invalid folder parameter'], 400);
        }
        $newPostDir = dirname($postDir) . DIRECTORY_SEPARATOR . $newFolder;

        if (!$this->copyTree($postDir, $newPostDir, $blogReal)) {
            return ApiResponse::create(['success' => false, 'message' => 'Failed to duplicate post'], 500);
        }

        // Update item.md in the new post
        $itemFile = $this->findItemFile($newPostDir);
        if ($itemFile) {
            $content = file_get_contents($itemFile['file']);
            if (preg_match('/^---\s*\n(.*?\n)---\s*\n(.*)$/s', $content, $matches)) {
                $header = \Symfony\Component\Yaml\Yaml::parse($matches[1]);
                if (is_array($header)) {
                    $header['title'] = ($header['title'] ?? '') . ' (Copy)';
                    $header['published'] = false;

                    $yaml = \Symfony\Component\Yaml\Yaml::dump($header, 2, 2);
                    $newContent = "---\n" . $yaml . "---\n" . $matches[2];
                    file_put_contents($itemFile['file'], $newContent);
                }
            }
        }

        $blogSlug = trim($this->getBlogPath(), '/');
        $editUrl = $this->adminEditUrl($blogSlug, $this->stripPostFolderPrefix($newFolder));

        return ApiResponse::create([
            'success' => true,
            'edit_url' => $editUrl
        ]);
    }

    public function scanBlog(ServerRequestInterface $request): ResponseInterface
    {
        $this->requirePermission($request, 'blog-manager.posts.read');

        $body = $this->getRequestBody($request);
        $requested = $body['path'] ?? null;
        if (is_string($requested) && trim($requested) !== '') {
            $blogPath = '/' . trim($requested, '/');
            $blogDir = $this->folderForSlug($blogPath);
        } else {
            $blogPath = $this->getBlogPath();
            $blogDir = $this->getBlogFolder();
        }

        if (!$blogDir) {
            return ApiResponse::create([
                'success' => false,
                'message' => 'Blog folder not found',
                'path' => $blogPath,
                'post_count' => 0,
            ], 404);
        }

        $posts = glob($blogDir . '/*', GLOB_ONLYDIR) ?: [];
        $postCount = 0;
        foreach ($posts as $postDir) {
            if ($this->findItemFile($postDir)) {
                $postCount++;
            }
        }

        return ApiResponse::create([
            'success' => true,
            'path' => $blogPath,
            'folder' => $blogDir,
            'post_count' => $postCount,
        ]);
    }

    public function exportPosts(ServerRequestInterface $request): ResponseInterface
    {
        $this->requirePermission($request, 'blog-manager.posts.export');

        $body = $this->getRequestBody($request);
        $folders = is_array($body['folders'] ?? null) ? $body['folders'] : [];

        if (empty($folders)) {
            return ApiResponse::create(['success' => false, 'message' => 'No posts selected'], 400);
        }

        foreach ($folders as $folder) {
            if (!is_string($folder) || $this->isUnsafeSegment($folder)) {
                return ApiResponse::create(['success' => false, 'message' => 'Invalid folder parameter'], 400);
            }
        }

        $blogDir = $this->getBlogFolder();
        if (!$blogDir) {
            return ApiResponse::create(['success' => false, 'message' => 'Blog folder not found'], 404);
        }

        $tmpRoot = realpath((string)$this->grav['locator']->findResource('tmp://', true));
        if (!$tmpRoot) {
            return ApiResponse::create(['success' => false, 'message' => 'Failed to create export file'], 500);
        }

        $exportDir = $tmpRoot . DIRECTORY_SEPARATOR . 'blog-manager-export-' . uniqid();
        if (!mkdir($exportDir, 0755, true)) {
            return ApiResponse::create(['success' => false, 'message' => 'Failed to create export file'], 500);
        }
        $exportReal = realpath($exportDir);
        if (!$exportReal || !$this->isInside($tmpRoot, $exportReal)) {
            return ApiResponse::create(['success' => false, 'message' => 'Failed to create export file'], 500);
        }

        try {
            $copied = 0;
            foreach ($folders as $folder) {
                $postDir = $this->getPostDir($folder);
                if (!$postDir) {
                    continue;
                }
                $dest = $exportReal . DIRECTORY_SEPARATOR . basename($postDir);
                if (!$this->copyTree($postDir, $dest, $exportReal)) {
                    $this->deleteTree($exportReal, $tmpRoot);
                    return ApiResponse::create(['success' => false, 'message' => 'Failed to export posts'], 500);
                }
                $copied++;
            }

            if ($copied === 0) {
                $this->deleteTree($exportReal, $tmpRoot);
                return ApiResponse::create(['success' => false, 'message' => 'No posts to export'], 404);
            }

            $filename = 'blog-export-' . date('Y-m-d-His') . '.zip';
            $zipPath = $tmpRoot . DIRECTORY_SEPARATOR . 'blog-export-' . date('Y-m-d-His') . '-' . uniqid() . '.zip';

            $zip = new \ZipArchive();
            if ($zip->open($zipPath, \ZipArchive::CREATE) !== true) {
                $this->deleteTree($exportReal, $tmpRoot);
                return ApiResponse::create(['success' => false, 'message' => 'Failed to create export file'], 500);
            }

            $this->addDirectoryToZip($zip, $exportReal, '');
            $zip->close();
            $this->deleteTree($exportReal, $tmpRoot);

            $zipReal = realpath($zipPath);
            if (!$zipReal || !$this->isInside($tmpRoot, $zipReal) || !is_file($zipReal)) {
                return ApiResponse::create(['success' => false, 'message' => 'Failed to create export file'], 500);
            }

            $stream = fopen($zipReal, 'rb');
            $response = new \Nyholm\Psr7\Response(
                200,
                [
                    'Content-Type' => 'application/zip',
                    'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                    'Content-Length' => filesize($zipReal),
                    'Cache-Control' => 'no-cache, must-revalidate',
                    'Pragma' => 'no-cache',
                ],
                $stream
            );

            register_shutdown_function(function () use ($zipReal, $tmpRoot) {
                $current = realpath($zipReal);
                if (!$current || !is_file($current)) {
                    return;
                }
                $root = rtrim($tmpRoot, "/\\");
                $current = rtrim($current, "/\\");
                if ($current === $root || strpos($current, $root . DIRECTORY_SEPARATOR) === 0) {
                    @unlink($current);
                }
            });

            return $response;
        } catch (\Exception $e) {
            if (is_dir($exportReal)) {
                $this->deleteTree($exportReal, $tmpRoot);
            }
            return ApiResponse::create(['success' => false, 'message' => 'Failed to export posts'], 500);
        }
    }

    public function importPosts(ServerRequestInterface $request): ResponseInterface
    {
        $this->requirePermission($request, 'blog-manager.posts.write');

        $blogDir = $this->getBlogFolder();
        $blogReal = $blogDir ? realpath($blogDir) : false;
        if (!$blogReal) {
            return ApiResponse::create(['success' => false, 'message' => 'Blog folder not found'], 404);
        }

        $upload = $this->firstUploadedFile($request);
        if (!$upload || $upload->getError() !== UPLOAD_ERR_OK) {
            return ApiResponse::create(['success' => false, 'message' => 'No file uploaded'], 400);
        }
        if (($upload->getSize() ?: 0) > 64 * 1024 * 1024) {
            return ApiResponse::create(['success' => false, 'message' => 'Import file is too large'], 400);
        }

        $tmpRoot = realpath((string)$this->grav['locator']->findResource('tmp://', true));
        if (!$tmpRoot) {
            return ApiResponse::create(['success' => false, 'message' => 'Failed to import posts'], 500);
        }

        $zipPath = $tmpRoot . DIRECTORY_SEPARATOR . 'blog-import-' . uniqid() . '.zip';
        $extractDir = $tmpRoot . DIRECTORY_SEPARATOR . 'blog-import-extract-' . uniqid();
        $extractReal = false;

        try {
            $upload->moveTo($zipPath);
            $zipReal = realpath($zipPath);
            if (!$zipReal || !$this->isInside($tmpRoot, $zipReal)) {
                return ApiResponse::create(['success' => false, 'message' => 'Failed to import posts'], 500);
            }

            $zip = new \ZipArchive();
            if ($zip->open($zipReal) !== true) {
                return ApiResponse::create(['success' => false, 'message' => 'Invalid ZIP file'], 400);
            }
            if (!mkdir($extractDir, 0755, true)) {
                $zip->close();
                return ApiResponse::create(['success' => false, 'message' => 'Failed to import posts'], 500);
            }
            $extractReal = realpath($extractDir);
            if (!$extractReal || !$this->isInside($tmpRoot, $extractReal) || !$this->extractZipSafely($zip, $extractReal)) {
                $zip->close();
                return ApiResponse::create(['success' => false, 'message' => 'Invalid ZIP file'], 400);
            }
            $zip->close();

            $postDirs = $this->collectImportPostDirs($extractReal);
            $imported = 0;
            $skipped = 0;
            foreach ($postDirs as $postDir) {
                $name = basename($postDir);
                if ($this->isUnsafeName($name)) {
                    $skipped++;
                    continue;
                }
                $destName = $name;
                if (is_dir($blogReal . DIRECTORY_SEPARATOR . $destName)) {
                    $destName .= '-import-' . date('YmdHis');
                }
                $dest = $blogReal . DIRECTORY_SEPARATOR . $destName;
                if ($this->copyTree($postDir, $dest, $blogReal)) {
                    $imported++;
                } else {
                    $skipped++;
                }
            }

            return ApiResponse::create([
                'success' => true,
                'imported' => $imported,
                'skipped' => $skipped,
            ]);
        } catch (\Exception $e) {
            return ApiResponse::create(['success' => false, 'message' => 'Failed to import posts'], 500);
        } finally {
            if ($extractReal && is_dir($extractReal)) {
                $this->deleteTree($extractReal, $tmpRoot);
            }
            $zipNow = realpath($zipPath);
            if ($zipNow && is_file($zipNow) && $this->isInside($tmpRoot, $zipNow)) {
                @unlink($zipNow);
            }
        }
    }

    private function firstUploadedFile(ServerRequestInterface $request): ?UploadedFileInterface
    {
        $found = null;
        $walk = function (array $files) use (&$walk, &$found): void {
            foreach ($files as $file) {
                if ($found instanceof UploadedFileInterface) {
                    return;
                }
                if ($file instanceof UploadedFileInterface) {
                    $found = $file;
                    return;
                }
                if (is_array($file)) {
                    $walk($file);
                }
            }
        };
        $walk($request->getUploadedFiles());

        return $found;
    }

    private function extractZipSafely(\ZipArchive $zip, string $destReal): bool
    {
        if ($zip->numFiles > 2000) {
            return false;
        }

        $written = 0;
        $maxBytes = 64 * 1024 * 1024;
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $stat = $zip->statIndex($i);
            $name = str_replace('\\', '/', (string)($stat['name'] ?? ''));
            if ($name === '' || strpos($name, "\0") !== false) {
                return false;
            }

            $parts = [];
            $hidden = false;
            foreach (explode('/', $name) as $part) {
                if ($part === '' || $part === '.') {
                    continue;
                }
                if ($this->isUnsafeName($part)) {
                    return false;
                }
                if (str_starts_with($part, '.')) {
                    $hidden = true;
                    break;
                }
                $parts[] = $part;
            }
            if ($hidden || $parts === []) {
                continue;
            }

            $parent = $destReal;
            $last = array_pop($parts);
            foreach ($parts as $part) {
                $parent .= DIRECTORY_SEPARATOR . $part;
                if (!is_dir($parent) && !mkdir($parent, 0755, true) && !is_dir($parent)) {
                    return false;
                }
            }
            $parentReal = realpath($parent);
            if (!$parentReal || !$this->isInside($destReal, $parentReal)) {
                return false;
            }

            if (str_ends_with($name, '/')) {
                $dir = $parentReal . DIRECTORY_SEPARATOR . $last;
                if (!$this->isInside($destReal, $dir)) {
                    return false;
                }
                if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
                    return false;
                }
                continue;
            }

            if (!$this->importFileAllowed($last)) {
                continue;
            }

            $size = $stat['size'] ?? null;
            if (!is_int($size) && !(is_float($size) && $size == (int)$size)) {
                return false;
            }
            $size = (int)$size;
            if ($size < 0 || $written + $size > $maxBytes) {
                return false;
            }
            $written += $size;

            $contents = $zip->getFromIndex($i);
            if ($contents === false) {
                return false;
            }
            $target = $parentReal . DIRECTORY_SEPARATOR . $last;
            if (!$this->isInside($destReal, $target) || file_put_contents($target, $contents) === false) {
                return false;
            }
        }

        return true;
    }

    protected function presentPost(array $header, string $folder): array
    {
        $title = $header['title'] ?? $folder;
        if (is_array($title)) {
            $title = implode(' ', array_map(static function ($part): string {
                return is_scalar($part) ? trim((string)$part) : '';
            }, $title));
        } elseif (is_scalar($title)) {
            $title = trim((string)$title);
        } else {
            $title = '';
        }
        if ($title === '') {
            $title = $folder;
        }

        $taxonomy = is_array($header['taxonomy'] ?? null) ? $header['taxonomy'] : [];
        $taxonomy['category'] = $this->stringList($taxonomy['category'] ?? null);
        $taxonomy['tag'] = $this->stringList($taxonomy['tag'] ?? null);

        $date = null;
        if (isset($header['date']) && $header['date'] !== '' && $header['date'] !== null) {
            $stamp = \Grav\Common\Utils::date2timestamp($header['date']);
            if ($stamp !== false) {
                $date = (int)$stamp;
            }
        }

        return [
            'title' => $title,
            'date' => $date,
            'taxonomy' => $taxonomy,
        ];
    }

    protected function stringList(mixed $value): array
    {
        if (is_scalar($value)) {
            $value = [$value];
        }
        if (!is_array($value)) {
            return [];
        }

        $items = [];
        foreach ($value as $item) {
            if (!is_scalar($item)) {
                continue;
            }
            $text = trim((string)$item);
            if ($text !== '') {
                $items[] = $text;
            }
        }

        return $items;
    }

    protected function importFileAllowed(string $filename): bool
    {
        $base = strtolower(basename(str_replace('\\', '/', $filename)));
        if ($base === '' || str_starts_with($base, '.')) {
            return false;
        }

        $extension = pathinfo($base, PATHINFO_EXTENSION);
        if ($extension === '' || $extension === 'defaults') {
            return false;
        }
        if ($extension === 'md') {
            return true;
        }

        $dangerous = array_map(
            'strtolower',
            (array)$this->grav['config']->get('security.uploads_dangerous_extensions', [])
        );
        if (in_array($extension, $dangerous, true)) {
            return false;
        }

        $types = $this->grav['config']->get('media.types');
        $spec = is_array($types) ? ($types[$extension] ?? null) : null;
        if (!is_array($spec)) {
            return false;
        }

        // SVG is a media type, and it is also markup the browser runs from the site origin.
        return ($spec['type'] ?? '') !== 'vector';
    }

    private function collectImportPostDirs(string $rootReal): array
    {
        $direct = [];
        $dirs = glob($rootReal . DIRECTORY_SEPARATOR . '*', GLOB_ONLYDIR) ?: [];
        foreach ($dirs as $dir) {
            if ($this->findItemFile($dir)) {
                $direct[] = $dir;
            }
        }
        if ($direct !== []) {
            return $direct;
        }

        $nested = [];
        foreach ($dirs as $dir) {
            $children = glob($dir . DIRECTORY_SEPARATOR . '*', GLOB_ONLYDIR) ?: [];
            foreach ($children as $child) {
                if ($this->findItemFile($child)) {
                    $nested[] = $child;
                }
            }
        }

        return $nested;
    }

    private function slugify(string $text): string
    {
        $text = preg_replace('~[^\pL\d]+~u', '-', $text);
        $text = iconv('utf-8', 'us-ascii//TRANSLIT', $text);
        $text = preg_replace('~[^-\w]+~', '', $text);
        $text = trim($text, '-');
        $text = preg_replace('~-+~', '-', $text);
        $text = strtolower($text);
        return empty($text) ? 'post' : $text;
    }

    private function addDirectoryToZip(\ZipArchive $zip, string $directory, string $zipPath): void
    {
        $items = array_diff(scandir($directory), ['.', '..']);

        foreach ($items as $item) {
            $sourcePath = $directory . '/' . $item;
            $targetPath = $zipPath ? $zipPath . '/' . $item : $item;

            if (is_dir($sourcePath)) {
                $this->addDirectoryToZip($zip, $sourcePath, $targetPath);
            } else {
                $zip->addFile($sourcePath, $targetPath);
            }
        }
    }
}
