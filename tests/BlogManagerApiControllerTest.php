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
        $this->assertFalse($this->call('deleteTree', [$sibling, $blog]));
        $this->assertDirectoryExists($sibling);
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

    public function testRequestBodyPrefersParsedJsonAndRouteParams(): void
    {
        $request = (new ServerRequest('POST', '/api/v1/blog-manager/export'))
            ->withHeader('Content-Type', 'application/json')
            ->withBody(\Nyholm\Psr7\Stream::create(''))
            ->withAttribute('json_body', ['folders' => ['01.hello']]);

        $body = $this->call('getRequestBody', [$request]);
        $this->assertSame(['01.hello'], $body['folders']);

        $image = (new ServerRequest('GET', '/api/v1/blog-manager/posts/01.hello/image'))
            ->withAttribute('route_params', ['folder' => '01.hello']);
        $this->assertSame('01.hello', $this->call('folderFromRequest', [$image]));
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
