<?php

use Illuminate\Container\Container;
use League\CommonMark\Environment\Environment;
use League\CommonMark\Extension\Attributes\AttributesExtension;
use League\CommonMark\Extension\CommonMark\CommonMarkCoreExtension;
use League\CommonMark\Extension\Footnote\FootnoteExtension;
use League\CommonMark\Extension\GithubFlavoredMarkdownExtension;
use League\CommonMark\Extension\HeadingPermalink\HeadingPermalinkExtension;
use League\CommonMark\MarkdownConverter;
use Mni\FrontYAML\Bridge\CommonMark\CommonMarkParser;

// 1. Suppress the 'convertToHtml' deprecation warning from the Jigsaw bridge
error_reporting(E_ALL & ~E_DEPRECATED);

$container = Container::getInstance();

$container->bind('markdownParser', function () {
    $config = [
        'html_input' => 'allow',
        'allow_unsafe_links' => false,
        'heading_permalink' => [
            'html_class' => 'heading-permalink',
            'id_prefix' => '', // No prefix so your slugs match exactly
            'fragment_prefix' => '',
            'insert' => 'none', // We don't want the visible '#' icon
            'apply_id_to_heading' => true, // CRITICAL: This puts id="" on the <h2>
            'heading_class' => '',
        ],
    ];

    $environment = new Environment($config);
    $environment->addExtension(new AttributesExtension());
    $environment->addExtension(new CommonMarkCoreExtension());
    $environment->addExtension(new FootnoteExtension());
    $environment->addExtension(new GithubFlavoredMarkdownExtension());
    $environment->addExtension(new HeadingPermalinkExtension());

    $converter = new MarkdownConverter($environment);

    return new CommonMarkParser($converter);
});

// Register the @markdown directive for Blade components
$container->make('bladeCompiler')->directive('markdown', function ($expression) {
    return "<?php echo \Illuminate\Container\Container::getInstance()->make('markdownParser')->parse($expression); ?>";
});

$container->make('bladeCompiler')->directive('inlineMarkdown', function ($expression) {
    return "<?php 
        \$content = \Illuminate\Container\Container::getInstance()->make('markdownParser')->parse($expression);
        echo preg_replace('/^<p>(.*)<\/p>$/s', '$1', trim(\$content)); 
    ?>";
});