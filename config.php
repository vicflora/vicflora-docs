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
    'intro' => ['path' => $path, 'sort' => 'order'],
    'layers' => ['path' => $path, 'sort' => 'order'],
    'resources' => ['path' => $path, 'sort' => 'order'],
    'vocabularies' => ['path' => $path, 'sort' => 'order'],
];

return [
    'baseUrl' => '',
    'appUrl' => '',
    'siteName' => 'VicFlora Data Model',
    'siteLogo' => '/assets/images/rbgv-logo.svg',
    'siteMenu' => [
        ['title' => 'Search', 'link' => '/flora/search?q=%2a'],
        ['title' => 'Browse classifications', 'link' => '/flora/classification/6abc498a-70de-11e6-a989-005056b0018f'],
        [
            'title' => 'Keys', 
            'link' => '#',
            'children' => [
                ['title' => 'Key to the main groups of vascular plants', 'link' => '/flora/keys/1903'],
                ['title' => 'Multi-access keys', 'link' => '/flora/matrix-keys'],
            ],

            
        ],
        ['title' => 'Checklists', 'link' => '/checklist'],
        ['title' => 'Glossary', 'link' => '/flora/glossary'],
        ['title' => 'Docs', 'link' => '/docs'],
    ],
    'collections' => $collections,
    'navigation' => $navigation,
];