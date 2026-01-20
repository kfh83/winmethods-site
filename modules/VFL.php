<?php
namespace Custodesk;

use function Custodesk\rootpath;

class VFL
{
    private static self $instance;

    public static function __initStatic()
    {
        self::$instance = new self();
    }

    public static function getInstance(): self
    {
        return self::$instance;
    }

    private object $map;

    public function __construct()
    {
        try
        {
            $this->map = json_decode(file_get_contents(rootpath("vfl.json")));
        }
        catch (\Throwable $e)
        {
            $this->map = (object)[];
        }
    }

    public function resolve(string $path): ?string
    {
        if (substr($path, 0, 1) == "/")
            $path = substr($path, 1);

        if (!isset($this->map->{$path}))
            return null;

        return "/" . $this->map->{$path};
    }
}