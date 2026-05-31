// sw.js - Service Worker for PWA (ESCS)
const CACHE_NAME = 'escs-cache-v2';

// গিটহাব সাব-ডিরেক্টরির (/sgloan/) পাথগুলো নির্দিষ্ট করা হয়েছে
const ASSETS_TO_CACHE = [
    '/sgloan/',
    '/sgloan/index.html',
    '/sgloan/manifest.json',
    '/sgloan/icon-192.png',
    '/sgloan/icon-512.png'
];

// ১. ইনস্টল ইভেন্ট: প্রয়োজনীয় ফাইলগুলো ব্রাউজার ক্যাশে জমা করা
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Service Worker: Caching core assets for /sgloan/');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// ২. অ্যাক্টিভেট ইভেন্ট: অ্যাপ আপডেট হলে পুরনো ক্যাশ ডিলিট করা
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Clearing Old Cache');
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// ৩. ফেচ ইভেন্ট: অনলাইন থাকলে লাইভ ডেটা আনবে, অফলাইন থাকলে ক্যাশ থেকে অ্যাপ দেখাবে
self.addEventListener('fetch', (event) => {
    // PWA-এর start_url বা অ্যাপ নেটিভলি ওপেন করার জন্য অফলাইন হ্যান্ডলিং
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match('/sgloan/index.html') || caches.match('/sgloan/');
            })
        );
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => response)
            .catch(() => {
                // ইন্টারনেট না থাকলে প্রথমে ক্যাশ ফাইলগুলো চেক করবে
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // যদি ক্যাশেও না থাকে তখন এই মেসেজ দেখাবে
                    return new Response('অফলাইন মোডে আছেন। দয়া করে ইন্টারনেট কানেকশন চেক করুন।', {
                        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                    });
                });
            })
    );
});