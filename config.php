<?php

$navigation = require('navigation.php');

$path = function ($page) {
    $collection = $page->collection ?? $page->getCollection();

    $folder = \Illuminate\Support\Str::replace('_', '-', (string) $collection);
    
    return $page->getFilename() === 'introduction' 
        ? $folder
        : $folder . '/' . Illuminate\Support\Str::slug($page->getFilename());
};

$collections = [
    'using_keys' => ['path' => $path, 'sort' => 'order'],
    'editor_guides' => ['path' => $path, 'sort' => 'order'],
    'api_docs' => ['path' => $path, 'sort' => 'order'],
    'theory' => ['path' => $path,'sort' => 'order'],
    'style_guide' => ['path' => $path, 'sort' => 'order'],
    'layers' => ['path' => $path, 'sort' => 'order'],
];

return [
    'baseUrl' => 'http://keybase-docs.test',
    'collections' => $collections,
    'navigation' => $navigation,
];