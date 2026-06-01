// sw.js - Service Worker for PWA (ESCS)
const CACHE_NAME = 'escs-cache-v3'; // ভার্সন পরিবর্তন করা হয়েছে ক্যাশ রিলোডের জন্য

// গিটহাব সাব-ডিরেক্টরির (/sgloan/) পাথগুলো নির্দিষ্ট করা হয়েছে
const ASSETS_TO_CACHE = [
    '/sgloan/',
    '/sgloan/index.html',
    '/sgloan/manifest.json',
    '/sgloan/icon-192.png',
    '/sgloan/icon-512.png'
];

// ১. ইনস্টল ইভেন্ট: প্রথমবার সব কোর ফাইল ক্যাশে জমা করা
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Service Worker: Blazing fast cache initialized!');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// ২. অ্যাক্টিভেট ইভেন্ট: অ্যাপের নতুন ভার্সন আসলে পুরনো ক্যাশ সাথে সাথে ডিলিট করা
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

// ৩. ফেচ ইভেন্ট: ন্যানোসেকেন্ড লোডিং স্পিডের আসল ম্যাজিক (Stale-While-Revalidate)
self.addEventListener('fetch', (event) => {
    // শুধুমাত্র GET রিকোয়েস্ট ক্যাশ করা হবে
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.match(event.request).then((cachedResponse) => {
                
                // ব্যাকগ্রাউন্ডে নেটওয়ার্ক থেকে ফাইল আপডেট করার প্রমিস
                const fetchPromise = fetch(event.request).then((networkResponse) => {
                    // যদি নেটওয়ার্ক রেসপন্স ঠিক থাকে, তবে ক্যাশ আপডেট করে নাও
                    if (networkResponse && networkResponse.status === 200) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(() => {
                    // নেটওয়ার্ক না থাকলে ক্যাশড ফাইলই রিটার্ন করবে, কোনো এরর দেবে না
                    return cachedResponse;
                });

                // যদি ক্যাশে ফাইল অলরেডি থাকে, তবে সেকেন্ডের মধ্যে সেটা ইউজারকে দেখিয়ে দাও (Instant Load)
                // আর ক্যাশে না থাকলে নেটওয়ার্কের জন্য অপেক্ষা করো
                return cachedResponse || fetchPromise;
            });
        }).catch(() => {
            // একদম অফলাইন এবং ক্যাশেও ফাইল নেই এমন চরম মূহুর্তের ফলব্যাক
            if (event.request.mode === 'navigate') {
                return caches.match('/sgloan/index.html') || caches.match('/sgloan/');
            }
        })
    );
});