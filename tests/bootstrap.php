<?php

declare(strict_types=1);

define('GRAV_CLI', true);
define('GRAV_REQUEST_TIME', microtime(true));

$root = dirname(__DIR__, 4);
chdir($root);

$loader = require $root . '/vendor/autoload.php';
Grav\Common\Grav::instance(['loader' => $loader]);

require $root . '/user/plugins/api/classes/Api/Controllers/AbstractApiController.php';
require dirname(__DIR__) . '/classes/BlogManagerApiController.php';
require dirname(__DIR__) . '/blog-manager.php';
