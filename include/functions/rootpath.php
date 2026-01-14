<?php
namespace Custodesk;

/* Returns a path relative to the server root. */
function rootpath(string $path): string
{
    return $_SERVER["DOCUMENT_ROOT"] . "/" . $path;
}