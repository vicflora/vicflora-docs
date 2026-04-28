<!DOCTYPE html>
<html lang="en">
  <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>KeyBase | {{ $page->title }}</title>
      <meta name="description" content="KeyBase provides interactive identification keys for botanical research and education, featuring comprehensive flora databases and taxonomic tools." />
      <link rel="preconnect" href="https://fonts.bunny.net" />
      <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
      <link rel="icon" href="/favicon.ico" sizes="any">
      @viteRefresh()
      <link rel="stylesheet" href="{{ vite('source/assets/css/main.css') }}">
      <script src="https://cdn.jsdelivr.net/npm/svg-pan-zoom@3.6.1/dist/svg-pan-zoom.min.js"></script>
      
  </head>
  
  <body class="fade-in min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900 font-sans">
      @include('_partials.header')
      <div class="container mx-auto grid grid-cols-1 gap-4 lg:gap-8 lg:grid-cols-4 py-6 px-4 h-full">
          @include('_partials.sidebar')
          <main class="lg:col-span-3 prose prose-sm max-w-none dark:prose-invert">
              <div class="bg-white border border-gray-200 rounded-xl mt-2 p-6 pt-8 dark:bg-black dark:border-gray-700">
                  {{-- 1. The Dynamic Page Title --}}
                  <div class="mb-8">
                      @include('_partials.breadcrumbs')

                      <h1 class="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white tracking-tight">
                          {{ $page->title }}
                      </h1>
                      
                      @if($page->description)
                          <p class="mt-2 text-lg text-gray-500 dark:text-gray-400">
                              {{ $page->description }}
                          </p>
                      @endif
                  </div>

                  {{-- 2. The Table of Contents --}}
                  @if($page->getFilename() !== 'introduction')
                      @include('_partials.toc', ['maxLevel' => $page->tocLevel ?? 3])
                  @endif

                  {{-- 3. The Markdown Content --}}
                  <div class="prose dark:prose-invert max-w-none">
                      @yield('content')
                  </div>
              </div>
          </main>
      </div>

      @include('_partials.mobile-menu')

      <script type="module" src="{{ vite('source/assets/js/main.js') }}"></script>
      <script>
          document.addEventListener('DOMContentLoaded', function () {
              const toggleButton = document.getElementById('mobile-menu-toggle');
              const mobileMenu = document.getElementById('mobile-menu-dropdown');
              const menuIcon = document.getElementById('menu-icon');
              const closeIcon = document.getElementById('close-icon');

              if (toggleButton && mobileMenu && menuIcon && closeIcon) {
                  toggleButton.addEventListener('click', function () {
                      const isHidden = mobileMenu.classList.contains('hidden');
                      if (isHidden) {
                          mobileMenu.classList.remove('hidden');
                          mobileMenu.classList.add('flex');
                          menuIcon.classList.add('hidden');
                          closeIcon.classList.remove('hidden');
                      } else {
                          mobileMenu.classList.add('hidden');
                          mobileMenu.classList.remove('flex');
                          menuIcon.classList.remove('hidden');
                          closeIcon.classList.add('hidden');
                      }
                  });

                  // Close mobile menu when a link is clicked
                  mobileMenu.querySelectorAll('a').forEach(link => {
                      link.addEventListener('click', () => {
                          mobileMenu.classList.add('hidden');
                          mobileMenu.classList.remove('flex');
                          menuIcon.classList.remove('hidden');
                          closeIcon.classList.add('hidden');
                      });
                  });
              }

              // Scroll active sidebar link into view
              // We use 'nearest' so it only scrolls if the link is actually off-screen
              const activeLink = document.querySelector('aside .bg-emerald-50, aside .bg-emerald-900\\/30');
              if (activeLink) {
                  // A tiny timeout ensures the browser has finished its initial paint
                  setTimeout(() => {
                      activeLink.scrollIntoView({
                          behavior: 'smooth',
                          block: 'nearest'
                      });
                  }, 100);
              }

              // 2. NEW Sidebar Toggle Logic
              const sidebarToggle = document.getElementById('sidebar-toggle');
              const sidebarMenu = document.getElementById('sidebar-menu');
              const sidebarArrow = document.getElementById('sidebar-arrow');

              if (sidebarToggle && sidebarMenu) {
                  sidebarToggle.addEventListener('click', function () {
                      const isHidden = sidebarMenu.classList.toggle('hidden');
                      
                      // Rotate the arrow icon if it exists
                      if (sidebarArrow) {
                          sidebarArrow.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
                      }
                  });
              }
          });
      </script>
      @stack('scripts')
  </body>
</html>