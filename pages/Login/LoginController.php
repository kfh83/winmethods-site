<?php
namespace CustoDesk\Page\Login;

use CustoDesk\Page\Common\PageController;
use CustoDesk\RequestMetadata;

class LoginController extends PageController
{
    public string $template = "login";

    public function onGet(RequestMetadata $request): bool
    {
        return true;
    }
}