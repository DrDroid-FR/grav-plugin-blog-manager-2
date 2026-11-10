<?php

declare(strict_types=1);

use Grav\Common\Grav;
use Grav\Common\Utils;
use Grav\Framework\Acl\Permissions;
use Grav\Plugin\BlogManager\BlogManagerApiController;
use Grav\Plugin\BlogManagerPlugin;
use Grav\Events\PermissionsRegisterEvent;
use Nyholm\Psr7\ServerRequest;
use PHPUnit\Framework\TestCase;
use ZipArchive;

final class BlogManagerApiControllerTest extends TestCase
{
    private BlogManagerApiController $controller;

    /** @var list<string> */
    private array $trees = [];

    protected function setUp(): void
    {
        $grav = Grav::instance();
        $this->controller = new BlogManagerApiController($grav, $grav['config']);
    }

    public function testItemFileLanguageUsesTheDefaultCode(): void
    {
        $root = $this->makeTree();
        $plain = $root . DIRECTORY_SEPARATOR . 'plain';
        $translated = $root . DIRECTORY_SEPARATOR . 'translated';
        mkdir($plain);
        mkdir($translated);
        file_put_contents($plain . DIRECTORY_SEPARATOR . 'item.md', "---\ntitle: Bonjour\n---\n");
        file_put_contents($translated . DIRECTORY_SEPARATOR . 'item.en.md', "---\ntitle: Hello\n---\n");

        $default = $this->call('findItemFile', [$plain]);
        $english = $this->call('findItemFile', [$translated]);

        $this->assertSame($this->call('defaultContentLanguage', []), $default['lang']);
        $this->assertNotSame('', $default['lang']);
        $this->assertSame('en', $english['lang']);
    }

    public function testFindItemFilesListsEveryLanguage(): void
    {
        $root = $this->makeTree();
        $post = $root . DIRECTORY_SEPARATOR . 'post';
        mkdir($post);
        file_put_contents($post . DIRECTORY_SEPARATOR . 'item.md', "---\ntitle: Bonjour\n---\n");
        file_put_contents($post . DIRECTORY_SEPARATOR . 'item.en.md', "---\ntitle: Hello\n---\n");
        file_put_contents($post . DIRECTORY_SEPARATOR . 'item.de.md', "---\ntitle: Hallo\n---\n");

        $files = $this->call('findItemFiles', [$post]);
        $langs = array_column($files, 'lang');

        $this->assertSame([$this->call('defaultContentLanguage', []), 'de', 'en'], $langs);
        $this->assertSame('en', $this->call('itemFileForLanguage', [$post, 'en'])['lang']);
        $this->assertNull($this->call('itemFileForLanguage', [$post, 'es']));
    }

    public function testSiblingPrefixIsOutsideTheBlogDirectory(): void
    {
        $root = $this->makeTree();
        $blog = $root . DIRECTORY_SEPARATOR . 'blog';
        $sibling = $root . DIRECTORY_SEPARATOR . 'blog-other';
        mkdir($blog);
        mkdir($sibling);

        $this->assertTrue($this->call('isInside', [$blog, $blog]));
        $this->assertFalse($this->call('isInside', [$blog, $sibling]));
        $this->assertNull($this->call('resolvePath', [$blog, '..']));
        $this->assertTrue($this->call('isUnsafeSegment', ['../secret']));
        $this->assertNull($this->call('folderForSlug', ['../secret']));
        $this->assertNull($this->call('folderForSlug', ['blog/../secret']));
        $this->assertNull($this->call('normalizeBlogRoute', ['news//blog']));
        $this->assertNull($this->call('normalizeBlogRoute', ['']));
        $this->assertFalse($this->call('deleteTree', [$sibling, $blog]));
        $this->assertDirectoryExists($sibling);
    }

    public function testBlogRouteMatchesAnyDeclaredPageFolder(): void
    {
        $root = $this->makeTree();
        $nested = $root . DIRECTORY_SEPARATOR . '01.news' . DIRECTORY_SEPARATOR . '02.blog';
        $post = $nested . DIRECTORY_SEPARATOR . '03.hello';
        mkdir($post, 0755, true);
        file_put_contents($post . DIRECTORY_SEPARATOR . 'item.md', "---\ntitle: Hello\n---\n");
        $top = $root . DIRECTORY_SEPARATOR . '04.journal';
        mkdir($top);

        $found = $this->call('folderForRoute', [$root, 'news/blog']);
        $this->assertNotNull($found);
        $this->assertSame(realpath($nested), realpath($found));
        $this->assertSame(realpath($top), realpath($this->call('folderForRoute', [$root, 'journal'])));
        $this->assertNull($this->call('folderForRoute', [$root, 'news/missing']));
        $this->assertNull($this->call('folderForRoute', [$root, 'news/../blog']));

        Grav::instance()['config']->set('plugins.blog-manager.blog_path', '/news/blog');
        $url = $this->call('adminEditUrl', $this->call('blogEditSegments', ['my-post']));
        $this->assertStringContainsString('/pages/edit/news/blog/my-post', $url);
        $this->assertStringNotContainsString('news%2Fblog', $url);
        Grav::instance()['config']->set('plugins.blog-manager.blog_path', '/blog');
    }

    public function testFolderNamesUseTheSlugAndThenANumber(): void
    {
        $root = $this->makeTree();
        $blog = $root . DIRECTORY_SEPARATOR . 'blog';
        mkdir($blog . DIRECTORY_SEPARATOR . '01.hello', 0755, true);
        mkdir($blog . DIRECTORY_SEPARATOR . 'hello-2', 0755, true);

        $this->assertSame('hello-3', $this->call('uniquePostFolder', [$blog, 'hello']));
        $this->assertSame('other', $this->call('uniquePostFolder', [$blog, 'other']));
        $this->assertSame('hello-copy', $this->call('uniquePostFolder', [$blog, 'hello-copy']));
        mkdir($blog . DIRECTORY_SEPARATOR . 'hello-copy');
        $this->assertSame('hello-copy-2', $this->call('uniquePostFolder', [$blog, 'hello-copy']));
    }

    public function testFrontmatterLineEditKeepsTheRestOfTheHeader(): void
    {
        $source = "---\ntitle: Hello\ndate: '13:34 07/23/2017'\npublished: true\n# keep me\nvisible: true\n---\n\nBody stays\n";
        $toggled = $this->call('setFrontmatterLine', [$source, 'published', false]);

        $this->assertIsString($toggled);
        $this->assertStringContainsString("date: '13:34 07/23/2017'", $toggled);
        $this->assertStringContainsString('# keep me', $toggled);
        $this->assertStringContainsString('title: Hello', $toggled);
        $this->assertStringContainsString('published: false', $toggled);
        $this->assertStringContainsString('Body stays', $toggled);
        $this->assertStringNotContainsString('published: true', $toggled);

        $copied = $this->call('setFrontmatterLine', [$toggled, 'title', 'Hello (Copy)']);
        $this->assertStringContainsString('Hello (Copy)', $copied);
        $this->assertStringContainsString("date: '13:34 07/23/2017'", $copied);
        $this->assertStringContainsString('# keep me', $copied);
        $this->assertStringContainsString('published: false', $copied);
    }

    public function testFrontmatterReplacementKeepsDollarAndBackslash(): void
    {
        $source = "---\ntitle: Hello\ndate: '13:34 07/23/2017'\n---\n\nBody\n";
        $title = 'Save $5 on \\1 deal (Copy)';
        $updated = $this->call('setFrontmatterLine', [$source, 'title', $title]);

        $this->assertIsString($updated);
        $this->assertSame(1, preg_match('/^---\s*\n(.*?\n)---\s*\n/s', $updated, $matches));
        $header = \Symfony\Component\Yaml\Yaml::parse($matches[1]);
        $this->assertSame($title, $header['title']);
        $this->assertSame('13:34 07/23/2017', $header['date']);
    }

    public function testQuotedFalsePublishesOnToggle(): void
    {
        $this->assertFalse($this->call('frontmatterFlag', ['false']));
        $this->assertFalse($this->call('frontmatterFlag', ['off']));
        $this->assertTrue($this->call('frontmatterFlag', ['true']));
        $this->assertTrue($this->call('frontmatterFlag', [true]));
        $this->assertFalse($this->call('frontmatterFlag', [false]));
    }

    public function testCopyAndDeleteStayInsideTheAllowedRoot(): void
    {
        $root = $this->makeTree();
        $blog = $root . DIRECTORY_SEPARATOR . 'blog';
        $post = $blog . DIRECTORY_SEPARATOR . '01.hello';
        mkdir($post . DIRECTORY_SEPARATOR . 'nested', 0755, true);
        file_put_contents($post . DIRECTORY_SEPARATOR . 'item.md', "---\ntitle: Hello\n---\n");
        file_put_contents($post . DIRECTORY_SEPARATOR . 'nested' . DIRECTORY_SEPARATOR . 'pic.jpg', 'jpeg');

        $dest = $blog . DIRECTORY_SEPARATOR . '02.hello-copy';
        $this->assertTrue($this->call('copyTree', [$post, $dest, $blog]));
        $this->assertFileExists($dest . DIRECTORY_SEPARATOR . 'nested' . DIRECTORY_SEPARATOR . 'pic.jpg');

        $export = $root . DIRECTORY_SEPARATOR . 'export';
        mkdir($export);
        $this->assertTrue($this->call('copyTree', [$post, $export . DIRECTORY_SEPARATOR . '01.hello', $export]));
        $this->assertFileExists($export . DIRECTORY_SEPARATOR . '01.hello' . DIRECTORY_SEPARATOR . 'item.md');

        $this->assertTrue($this->call('deleteTree', [$dest, $blog]));
        $this->assertDirectoryDoesNotExist($dest);
        $this->assertDirectoryExists($post);
    }

    public function testZipImportRejectsTraversalAndFindsPostFolders(): void
    {
        $root = $this->makeTree();
        $dest = $root . DIRECTORY_SEPARATOR . 'extract';
        mkdir($dest);

        $zipPath = $root . DIRECTORY_SEPARATOR . 'bad.zip';
        $zip = new ZipArchive();
        $zip->open($zipPath, ZipArchive::CREATE);
        $zip->addFromString('../escape.txt', 'nope');
        $zip->close();
        $opened = new ZipArchive();
        $this->assertTrue($opened->open($zipPath) === true);
        $this->assertFalse($this->call('extractZipSafely', [$opened, $dest]));
        $opened->close();
        $this->assertFileDoesNotExist(dirname($dest) . DIRECTORY_SEPARATOR . 'escape.txt');

        $good = $root . DIRECTORY_SEPARATOR . 'good.zip';
        $zip = new ZipArchive();
        $zip->open($good, ZipArchive::CREATE);
        $zip->addFromString('01.hello/item.md', "---\ntitle: Hello\n---\n");
        $zip->addFromString('wrapped/02.there/item.fr.md', "---\ntitle: There\n---\n");
        $zip->close();
        $extract = $root . DIRECTORY_SEPARATOR . 'good';
        mkdir($extract);
        $opened = new ZipArchive();
        $opened->open($good);
        $this->assertTrue($this->call('extractZipSafely', [$opened, $extract]));
        $opened->close();

        $posts = $this->call('collectImportPostDirs', [$extract]);
        $this->assertCount(1, $posts);
        $this->assertSame('01.hello', basename($posts[0]));
    }

    public function testWrappedZipIsImportedOneLevelDown(): void
    {
        $root = $this->makeTree();
        $extract = $root . DIRECTORY_SEPARATOR . 'extract';
        mkdir($extract . DIRECTORY_SEPARATOR . 'bundle' . DIRECTORY_SEPARATOR . '01.hello', 0755, true);
        file_put_contents(
            $extract . DIRECTORY_SEPARATOR . 'bundle' . DIRECTORY_SEPARATOR . '01.hello' . DIRECTORY_SEPARATOR . 'item.md',
            "---\ntitle: Hello\n---\n"
        );

        $posts = $this->call('collectImportPostDirs', [$extract]);
        $this->assertCount(1, $posts);
        $this->assertSame('01.hello', basename($posts[0]));
    }

    public function testRequestBodyPrefersParsedJson(): void
    {
        $request = (new ServerRequest('POST', '/api/v1/blog-manager/export'))
            ->withHeader('Content-Type', 'application/json')
            ->withBody(\Nyholm\Psr7\Stream::create(''))
            ->withAttribute('json_body', ['folders' => ['01.hello']]);

        $body = $this->call('getRequestBody', [$request]);
        $this->assertSame(['01.hello'], $body['folders']);
    }

    public function testImportKeepsAFreeFolderAndRenamesATakenSlug(): void
    {
        $root = $this->makeTree();
        $blog = $root . DIRECTORY_SEPARATOR . 'blog';
        mkdir($blog);

        $this->assertSame('02.news', $this->call('importedFolderName', [$blog, '02.news']));
        $this->assertSame('hello', $this->call('importedFolderName', [$blog, 'hello']));

        mkdir($blog . DIRECTORY_SEPARATOR . '01.hello');
        $this->assertSame('hello-2', $this->call('importedFolderName', [$blog, '01.hello']));
        $this->assertSame('hello-2', $this->call('importedFolderName', [$blog, 'hello']));
        $this->assertNull($this->call('importedFolderName', [$blog, '../secret']));
    }

    public function testDuplicateMarksEveryLanguageUnpublished(): void
    {
        $root = $this->makeTree();
        $post = $root . DIRECTORY_SEPARATOR . '01.hello';
        mkdir($post);
        $article = "---\ntitle: Hello\ndate: '13:34 07/23/2017'\npublished: true\n# keep me\n---\n\nBody\n";
        file_put_contents($post . DIRECTORY_SEPARATOR . 'item.md', $article);
        file_put_contents($post . DIRECTORY_SEPARATOR . 'item.en.md', str_replace('title: Hello', 'title: Hello EN', $article));

        $this->call('markDuplicateArticles', [$post]);

        $default = file_get_contents($post . DIRECTORY_SEPARATOR . 'item.md');
        $english = file_get_contents($post . DIRECTORY_SEPARATOR . 'item.en.md');
        $this->assertStringContainsString('Hello (Copy)', $default);
        $this->assertStringContainsString('Hello EN (Copy)', $english);
        $this->assertStringContainsString('published: false', $default);
        $this->assertStringContainsString('published: false', $english);
        $this->assertStringContainsString("date: '13:34 07/23/2017'", $default);
        $this->assertStringContainsString('# keep me', $english);
        $this->assertStringNotContainsString('published: true', $default);
        $this->assertStringNotContainsString('published: true', $english);
    }

    public function testEditUrlUsesTheAdmin2Route(): void
    {
        $url = $this->call('adminEditUrl', ['blog', 'hello']);
        $this->assertStringContainsString('/pages/edit/blog/hello', $url);

        $encoded = $this->call('adminEditUrl', ['my post']);
        $this->assertStringContainsString('/pages/edit/my%20post', $encoded);
    }

    public function testPermissionsAreSubscribed(): void
    {
        $events = BlogManagerPlugin::getSubscribedEvents();
        $this->assertArrayHasKey(PermissionsRegisterEvent::class, $events);
        $this->assertArrayHasKey('onApiRegisterRoutes', $events);
        $this->assertArrayHasKey('onApiSidebarItems', $events);
        $this->assertArrayHasKey('onApiPluginPageInfo', $events);

        $permissions = new Permissions();
        $plugin = new BlogManagerPlugin('blog-manager', Grav::instance(), Grav::instance()['config']);
        $plugin->onRegisterPermissions(new PermissionsRegisterEvent($permissions));

        $this->assertTrue($permissions->hasAction('blog-manager.posts.read'));
        $this->assertTrue($permissions->hasAction('blog-manager.posts.write'));
        $this->assertTrue($permissions->hasAction('blog-manager.posts.delete'));
        $this->assertTrue($permissions->hasAction('blog-manager.posts.export'));
    }

    public function testPresentPostNormalizesSkeletonFrontMatter(): void
    {
        $presented = $this->call('presentPost', [[
            'title' => 12,
            'date' => 20240301,
            'taxonomy' => [
                'category' => 'blog',
                'tag' => 7,
            ],
        ], 'my-post']);

        $this->assertSame('12', $presented['title']);
        $this->assertSame(['blog'], $presented['taxonomy']['category']);
        $this->assertSame(['7'], $presented['taxonomy']['tag']);
        $this->assertSame(Utils::date2timestamp(20240301), $presented['date']);

        $gravDate = $this->call('presentPost', [[
            'title' => 'Hello',
            'date' => '13:34 07/23/2017',
            'taxonomy' => ['category' => ['News']],
        ], 'hello']);
        $this->assertSame(Utils::date2timestamp('13:34 07/23/2017'), $gravDate['date']);
        $this->assertIsInt($gravDate['date']);
    }

    public function testZipImportSkipsDangerousFilesAndKeepsMedia(): void
    {
        $root = $this->makeTree();
        $zipPath = $root . DIRECTORY_SEPARATOR . 'mixed.zip';
        $zip = new ZipArchive();
        $zip->open($zipPath, ZipArchive::CREATE);
        $zip->addFromString('01.hello/item.md', "---\ntitle: Hello\n---\n");
        $zip->addFromString('01.hello/cover.jpg', 'jpeg');
        $zip->addFromString('01.hello/shell.php', '<?php echo 1;');
        $zip->addFromString('01.hello/.htaccess', 'Deny from all');
        $zip->addFromString('01.hello/icon.svg', '<svg></svg>');
        $zip->addFromString('01.hello/page.html', '<script></script>');
        $zip->close();

        $extract = $root . DIRECTORY_SEPARATOR . 'out';
        mkdir($extract);
        $opened = new ZipArchive();
        $this->assertTrue($opened->open($zipPath) === true);
        $this->assertTrue($this->call('extractZipSafely', [$opened, $extract]));
        $opened->close();

        $post = $extract . DIRECTORY_SEPARATOR . '01.hello';
        $this->assertFileExists($post . DIRECTORY_SEPARATOR . 'item.md');
        $this->assertFileExists($post . DIRECTORY_SEPARATOR . 'cover.jpg');
        $this->assertFileDoesNotExist($post . DIRECTORY_SEPARATOR . 'shell.php');
        $this->assertFileDoesNotExist($post . DIRECTORY_SEPARATOR . '.htaccess');
        $this->assertFileDoesNotExist($post . DIRECTORY_SEPARATOR . 'icon.svg');
        $this->assertFileDoesNotExist($post . DIRECTORY_SEPARATOR . 'page.html');
    }

    private function call(string $method, array $args): mixed
    {
        $reflection = new ReflectionMethod($this->controller, $method);
        $reflection->setAccessible(true);

        return $reflection->invokeArgs($this->controller, $args);
    }

    private function makeTree(): string
    {
        $root = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'bm-test-' . uniqid();
        mkdir($root);
        $this->trees[] = $root;

        return $root;
    }

    protected function tearDown(): void
    {
        foreach ($this->trees as $root) {
            if (!is_dir($root)) {
                continue;
            }
            $it = new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS),
                RecursiveIteratorIterator::CHILD_FIRST
            );
            foreach ($it as $file) {
                $file->isDir() ? rmdir($file->getPathname()) : unlink($file->getPathname());
            }
            rmdir($root);
        }
    }
}
