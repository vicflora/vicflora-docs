#!/bin/bash

# Configuration
PROJECT_ROOT="/var/www/vicflora-model"
DOCS_DIR="$PROJECT_ROOT/vicflora-docs"
APP_DOCS_DIR="$PROJECT_ROOT/vicflora-model/public/docs"

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
npm run build 

cd "$DOCS_DIR"

case "$1" in
    test)
        echo "🚀 Building for Staging (Test)..."
        ./vendor/bin/jigsaw build test
        echo "📂 Syncing to Laravel..."
        rm -rf "$APP_DOCS_DIR"/*
        cp -R build_test/. "$APP_DOCS_DIR/"
        ;;

    github)
        echo "🌐 Building for GitHub Pages..."
        ./vendor/bin/jigsaw build github
        echo "⬆️ Pushing to GitHub..."
        git add build_github -f
        git commit -m "Deploy docs to GitHub: $(date)"
        git subtree push --prefix build_github origin gh-pages
        ;;

    prod)
        echo "💎 Building for Production..."
        ./vendor/bin/jigsaw build production
        echo "📂 Syncing to Laravel..."
        rm -rf "$APP_DOCS_DIR"/*
        cp -R build_production/. "$APP_DOCS_DIR/"
        ;;

    all)
        $0 test
        $0 github
        ;;

    *)
        usage
        ;;
esac

echo "✅ Done!"