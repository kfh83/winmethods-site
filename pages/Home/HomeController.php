<?php
namespace Custodesk\Page\Home;

use Custodesk\Page\Common\PageController;
use Custodesk\RequestMetadata;

class HomeController extends PageController
{
    public string $template = "home";

    public function onGet(RequestMetadata $request): bool
    {
        return true;
    }
}