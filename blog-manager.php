<?php
namespace Grav\Plugin;

use Composer\Autoload\ClassLoader;
use Grav\Common\Plugin;
use Grav\Events\PermissionsRegisterEvent;
use Grav\Framework\Acl\PermissionsReader;
use RocketTheme\Toolbox\Event\Event;

/**
 * Blog Manager plugin for Grav CMS
 */
class BlogManagerPlugin extends Plugin
{
    public static function getSubscribedEvents()
    {
        return [
            'onApiRegisterRoutes' => ['onApiRegisterRoutes', 0],
            'onApiSidebarItems' => ['onApiSidebarItems', 0],
            'onApiPluginPageInfo' => ['onApiPluginPageInfo', 0],
            PermissionsRegisterEvent::class => ['onRegisterPermissions', 0],
        ];
    }

    public function autoload(): ClassLoader
    {
        $loader = new ClassLoader();
        $loader->addPsr4('Grav\\Plugin\\BlogManager\\', __DIR__ . '/classes');

        return $loader;
    }

    public function onRegisterPermissions(PermissionsRegisterEvent $event): void
    {
        $actions = PermissionsReader::fromYaml('plugin://blog-manager/permissions.yaml');
        $event->permissions->addActions($actions);
    }

    public function onApiRegisterRoutes(Event $event)
    {
        $routes = $event['routes'];

        $routes->get('/blog-manager/posts', ['Grav\Plugin\BlogManager\BlogManagerApiController', 'listPosts']);
        $routes->post('/blog-manager/posts/new', ['Grav\Plugin\BlogManager\BlogManagerApiController', 'newPost']);
        $routes->post('/blog-manager/posts/delete', ['Grav\Plugin\BlogManager\BlogManagerApiController', 'deletePost']);
        $routes->post('/blog-manager/posts/toggle', ['Grav\Plugin\BlogManager\BlogManagerApiController', 'toggleField']);
        $routes->post('/blog-manager/posts/duplicate', ['Grav\Plugin\BlogManager\BlogManagerApiController', 'duplicatePost']);
        $routes->post('/blog-manager/scan', ['Grav\Plugin\BlogManager\BlogManagerApiController', 'scanBlog']);
        $routes->post('/blog-manager/export', ['Grav\Plugin\BlogManager\BlogManagerApiController', 'exportPosts']);
        $routes->post('/blog-manager/import', ['Grav\Plugin\BlogManager\BlogManagerApiController', 'importPosts']);
        $routes->get('/blog-manager/posts/{folder}/image', ['Grav\Plugin\BlogManager\BlogManagerApiController', 'getPostImage']);
    }

    public function onApiSidebarItems(Event $event): void
    {
        $items = $event['items'];

        $label = $this->grav['language']->translate('PLUGIN_BLOG_MANAGER.MENU_TITLE');

        $items[] = [
            'id'       => 'blog-manager',
            'plugin'   => 'blog-manager',
            'label'    => $label,
            'icon'     => 'fa-book',
            'route'    => '/plugin/blog-manager',
            'priority' => 4,
        ];

        $event['items'] = $items;
    }

    public function onApiPluginPageInfo(Event $event): void
    {
        if ($event['plugin'] !== 'blog-manager') {
            return;
        }

        $event['definition'] = [
            'id'        => 'blog-manager',
            'plugin'    => 'blog-manager',
            'title'     => $this->grav['language']->translate('PLUGIN_BLOG_MANAGER.MENU_TITLE'),
            'icon'      => 'fa-book',
            'page_type' => 'component',
            'component' => 'blog-manager',
        ];
    }
}
