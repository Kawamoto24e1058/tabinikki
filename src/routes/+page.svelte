<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Map from '$lib/components/Map.svelte';
  import BottomNav from '$lib/components/BottomNav.svelte';
  import { Camera, MapPin, Trash2 } from 'lucide-svelte';
  import { addLocation, getLocations, addMarker, getMarkers, clearAllData, type LocationPoint, type PhotoMarker } from '$lib/db';

  let path = $state<LocationPoint[]>([]);
  let markers = $state<PhotoMarker[]>([]);
  let isTracking = $state(false);
  let currentPos = $state<{ lat: number; lng: number } | null>(null);
  let watchId: number | null = null;
  let activeTab = $state<'map' | 'photos' | 'settings'>('map');
  let toastMessage = $state<string | null>(null);

  function showToast(message: string) {
    toastMessage = message;
    setTimeout(() => {
      if (toastMessage === message) toastMessage = null;
    }, 5000);
  }

  function handleGeoError(err: GeolocationPositionError) {
    let message = '位置情報の取得に失敗しました';
    switch (err.code) {
      case err.PERMISSION_DENIED:
        message = '位置情報の利用が許可されていません';
        break;
      case err.POSITION_UNAVAILABLE:
        message = '位置情報が利用不可能です';
        break;
      case err.TIMEOUT:
        message = '位置情報の取得がタイムアウトしました';
        break;
    }
    showToast(message);
    if (isTracking) {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      watchId = null;
      isTracking = false;
    }
  }

  onMount(async () => {
    // Load initial data
    path = await getLocations();
    markers = await getMarkers();
    
    // Check for Secure Context (Required for Geolocation in many browsers)
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      showToast('⚠️ 非セキュアな接続 (HTTP) のため、位置情報が利用できない可能性があります。HTTPS を使用してください。');
    }

    // Check current position
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          currentPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        },
        (err) => {
          console.error('Initial Pos Error:', err);
          handleGeoError(err);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      showToast('⚠️ お使いのブラウザ、または接続環境では位置情報がサポートされていません。');
    }
  });

  function toggleTracking() {
    if (isTracking) {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      watchId = null;
      isTracking = false;
    } else {
      isTracking = true;
      watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const point = { 
            lat: pos.coords.latitude, 
            lng: pos.coords.longitude, 
            timestamp: Date.now() 
          };
          currentPos = { lat: point.lat, lng: point.lng };
          await addLocation(point);
          path = [...path, point];
        },
        handleGeoError,
        { enableHighAccuracy: true, distanceFilter: 10 } as any
      );
    }
  }

  async function takePhoto() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file || !currentPos) return;

      const shopName = prompt('店舗名を入力してください（任意）');
      const marker: PhotoMarker = {
        lat: currentPos.lat,
        lng: currentPos.lng,
        photoBlob: file,
        shopName: shopName || undefined,
        timestamp: Date.now()
      };

      await addMarker(marker);
      markers = [...markers, marker];
    };
    
    input.click();
  }

  async function clearData() {
    if (confirm('すべてのデータを消去しますか？')) {
      await clearAllData();
      path = [];
      markers = [];
    }
  }

  onDestroy(() => {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
  });
</script>

<div class="h-screen w-screen flex flex-col bg-emerald-50 overflow-hidden font-sans">
  <!-- Header -->
  <header class="p-4 bg-white/80 backdrop-blur-md shadow-sm z-10 flex justify-between items-center">
    <div>
      <h1 class="text-xl font-extrabold text-emerald-600 tracking-tight">TabiNikki</h1>
      <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Travel Log PWA</p>
    </div>
    <div class="flex gap-2">
      <button 
        onclick={clearData}
        class="p-2 text-gray-400 hover:text-red-500 transition-colors"
      >
        <Trash2 size={20} />
      </button>
    </div>
  </header>

  <!-- Toast Notification -->
  {#if toastMessage}
    <div 
      class="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-rose-500 text-white px-6 py-3 rounded-full shadow-2xl font-bold text-sm flex items-center gap-2 animate-bounce"
    >
      <span>⚠️ {toastMessage}</span>
      <button onclick={() => toastMessage = null} class="ml-2 hover:opacity-70">×</button>
    </div>
  {/if}

  <!-- Main Content -->
  <main class="flex-1 relative overflow-hidden">
    {#if activeTab === 'map'}
      <Map {path} {markers} {currentPos} />
      
      <!-- Fixed Gradient Overlay for Buttons -->
      <div class="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-emerald-50/80 to-transparent pointer-events-none z-30"></div>

      <!-- Action Buttons Overlay -->
      <div class="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-6 z-40 px-6">
        {#if !isTracking}
          <button 
            onclick={toggleTracking}
            class="flex flex-col items-center gap-2 group"
          >
            <div class="w-18 h-18 bg-emerald-500 text-white rounded-full shadow-[0_10px_25px_-5px_rgba(16,185,129,0.5)] flex items-center justify-center active:scale-95 transition-all group-hover:bg-emerald-600">
              <span class="text-3xl">✈️</span>
            </div>
            <span class="text-xs font-extrabold text-emerald-700 bg-white/80 px-3 py-1 rounded-full backdrop-blur-sm shadow-sm">旅行開始</span>
          </button>
        {:else}
          <button 
            onclick={takePhoto}
            class="flex flex-col items-center gap-2 group"
          >
            <div class="w-16 h-16 bg-amber-500 text-white rounded-full shadow-[0_10px_25px_-5px_rgba(245,158,11,0.5)] flex items-center justify-center active:scale-95 transition-all group-hover:bg-amber-600">
              <Camera size={28} />
            </div>
            <span class="text-xs font-extrabold text-amber-700 bg-white/80 px-3 py-1 rounded-full backdrop-blur-sm shadow-sm">撮影</span>
          </button>

          <button 
            onclick={toggleTracking}
            class="flex flex-col items-center gap-2 group"
          >
            <div class="w-16 h-16 bg-rose-500 text-white rounded-full shadow-[0_10px_25px_-5px_rgba(244,63,94,0.5)] flex items-center justify-center active:scale-95 transition-all group-hover:bg-rose-600">
              <div class="w-4 h-4 bg-white rounded-sm"></div>
            </div>
            <span class="text-xs font-extrabold text-rose-700 bg-white/80 px-3 py-1 rounded-full backdrop-blur-sm shadow-sm">旅行終了</span>
          </button>
        {/if}
      </div>
    {:else if activeTab === 'photos'}
      <div class="h-full overflow-y-auto p-4 pb-24">
        <h2 class="text-2xl font-bold mb-6 text-gray-800">旅の思い出</h2>
        <div class="grid grid-cols-2 gap-4">
          {#each markers as marker}
            <div class="bg-white rounded-2xl shadow-sm overflow-hidden border border-emerald-100">
              <img src={URL.createObjectURL(marker.photoBlob)} alt="思い出の写真" class="w-full h-32 object-cover" />
              <div class="p-3">
                <p class="text-sm font-bold text-gray-800 truncate">{marker.shopName || '名称なし'}</p>
                <p class="text-[10px] text-gray-400 mt-1">{new Date(marker.timestamp).toLocaleDateString()}</p>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {:else}
      <div class="p-6">
        <h2 class="text-2xl font-bold mb-6 text-gray-800">設定</h2>
        <div class="space-y-4">
          <div class="p-4 bg-white rounded-2xl shadow-sm border border-emerald-50">
            <h3 class="font-bold text-gray-700">プロトタイプ情報</h3>
            <p class="text-sm text-gray-500 mt-2">TabiNikki v1.0.0 (SvelteKit Edition)</p>
          </div>
          <a 
            href="https://github.com" 
            target="_blank"
            class="flex items-center justify-center p-4 bg-gray-900 text-white rounded-2xl shadow-lg"
          >
            <span class="font-bold">View Source</span>
          </a>
        </div>
      </div>
    {/if}
  </main>

  <BottomNav bind:activeTab />
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
</style>
