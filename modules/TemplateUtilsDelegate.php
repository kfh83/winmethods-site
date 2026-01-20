<?php
namespace Custodesk;

class TemplateUtilsDelegate
{
    public VFL $vfl;

    public function __construct()
    {
        $this->vfl = VFL::getInstance();
    }
}