<?php
namespace CustoDesk;

class TemplateUtilsDelegate
{
    public VFL $vfl;

    public function __construct()
    {
        $this->vfl = VFL::getInstance();
    }
}