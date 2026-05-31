// sw.js - Service Worker for PWA
self.addEventListener('install', (event) => {
    self.skipWaiting();
    console.log('Service Worker: Installed');
});

self.addEventListener('activate', (event) => {
    return self.clients.claim();
});

// fetch ইভেন্টটি PWA ইনস্টল প্রম্পট আসার জন্য বাধ্যতামূলক
self.addEventListener('fetch', (event) => {
    event.respondWith(fetch(event.request).catch(() => {
        return new Response('অফলাইন মোডে আছেন। দয়া করে ইন্টারনেট কানেকশন চেক করুন।');
    }));
});