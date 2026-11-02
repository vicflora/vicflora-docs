#!/bin/bash

# Configuration
PROJECT_ROOT="/var/www/vicflora-model"
APP_DOCS_DIR="$PROJECT_ROOT/vicflora-model/public/docs"
DOCS_DIR="/var/www/vicflora-docs"

JIGSAW_SOURCE="$DOCS_DIR/source"

# Helper function for usage
usage() {
    echo "Usage: $0 {test|github|prod|all}"
    echo "  test:   Build for test and sync to local Laravel app"
    echo "  github: Build for GitHub and push to gh-pages branch"
    echo "  prod:   Build for production and sync to local Laravel app"
    echo "  all:    Run all of the above"
    exit 1
}

# Check if an argument was provided
if [ -z "$1" ]; then
    usage
fi

echo "🔄 Updating shared resources..."
git submodule update --remote --merge

echo "📦 Compiling assets..."
NODE_NO_WARNINGS=1 npm run build 

cd "$DOCS_DIR"

# Helper function to linkify SVGs first, then generate un-linkified abstract figure
linkify_and_generate_abstract() {
    echo "🔗 Linkifying SVGs..."
    npm run linkify-erd

    echo "🎨 Generating un-linkified abstract ERD figure..."
    npx @mermaid-js/mermaid-cli@latest -c erd-config.json -p puppeteer-config.json --cssFile mermaid-style.css -i source/_mermaid/layer-1-syntax-abstract.mmd -o source/assets/images/erd/layer-1-syntax-abstract.svg
    node add-erd-layers.js source/assets/images/erd/layer-1-syntax-abstract.svg
}

case "$1" in
    test)
        git add . && git commit -m "Commit uncommitted changes before deployment"

        echo "🚀 Building for Staging (Test)..."

        php "$PROJECT_ROOT"/artisan docs:generate \
            --baseUrl="" \
            --output="$JIGSAW_SOURCE"

        npm run build-erd
        linkify_and_generate_abstract
        ./vendor/bin/jigsaw build staging
        ;;

    github)
        git add . && git commit -m "Commit uncommitted changes before deployment"

        echo "🌐 Building for GitHub Pages..."

        # 1. Generate Markdown directly into Jigsaw folders
        php "$PROJECT_ROOT"/artisan docs:generate \
            --baseUrl="/vicflora-docs" \
            --output="$JIGSAW_SOURCE"

        # 2. Build ERDs, Linkify SVGs, then generate Abstract Figure & Jigsaw
        npm run build-erd       
        linkify_and_generate_abstract
        ./vendor/bin/jigsaw build github

        echo "⬆️ Pushing to GitHub..."
        git add build_github -f
        git commit -m "Deploy docs to GitHub: $(date)"
        git subtree push --prefix build_github origin gh-pages
        ;;

    prod)
        git add . && git commit -m "Commit uncommitted changes before deployment"

        echo "💎 Building for Production..."

        php "$PROJECT_ROOT"/artisan docs:generate \
            --baseUrl="" \
            --output="$JIGSAW_SOURCE"

        npm run build-erd
        linkify_and_generate_abstract
        ./vendor/bin/jigsaw build production
        ;;

    all)
        $0 test
        $0 github
        $0 prod
        ;;

    *)
        usage
        ;;
esac

echo "✅ Done!"