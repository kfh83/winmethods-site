<?php
namespace Custodesk\Page;

require "vendor/autoload.php";
require "include/autoload.php";

use Custodesk\Controller;

Controller::route([
    "get" => [
        "/" => Home\HomeController::class,
        "/index.php" => Home\HomeController::class,
        "default" => Common\PageController::class,
    ]
]);

Controller::run();