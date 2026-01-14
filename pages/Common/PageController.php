<?php
namespace Custodesk\Page\Common;

use Custodesk\Controller;
use Custodesk\RequestMetadata;

class PageController
{
    public string $template = "404";
    protected object $data;

    public function get(RequestMetadata $request): void
    {
        $this->data = (object)[];
        if (!$this->onGet($request))
        {
            $this->template = "404";
            http_response_code(404);
        }
        
        Controller::$twig->addGlobal("data", $this->data);
        echo Controller::$twig->render($this->template . ".twig", []);
        exit();
    }

    public function onGet(RequestMetadata $request): bool
    {
        return false;
    }
}