<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { LocateFixed } from 'lucide-svelte';
  import type { LocationPoint, PhotoMarker } from '$lib/db';

  let { 
    path = [], 
    markers = [], 
    currentPos = null,
    isTracking = false
  } = $props();

  let mapElement: HTMLElement;
  let map: any;
  let L: any;
  let polyline: any;
  let currentMarker: any;
  let leafletMarkers: any[] = [];

  onMount(async () => {
    L = (await import('leaflet')).default;
    await import('leaflet/dist/leaflet.css');

    map = L.map(mapElement).setView([34.48, 135.42], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    polyline = L.polyline([], { 
      color: '#FF0033', 
      weight: 12,
      className: 'neon-polyline',
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);
    
    updateMap();
  });

  $effect(() => {
    if (map && (path || markers || currentPos || isTracking !== undefined)) {
      updateMap();
    }
  });

  function updateMap() {
    if (!L || !map) return;

    // Update Polyline
    const latLngs = path.map(p => [p.lat, p.lng]);
    polyline.setLatLngs(latLngs);

    // Update Current Position Marker
    if (currentPos) {
      const pulseHtml = `
        <div class="pulse-container ${isTracking ? 'is-tracking' : ''}">
          <div class="pulse-dot"></div>
          ${isTracking ? '<div class="pulse-ring"></div>' : ''}
        </div>
      `;

      if (!currentMarker) {
        const pulseIcon = L.divIcon({
          className: 'current-pos-wrapper',
          html: pulseHtml,
          iconSize: [200, 200],
          iconAnchor: [100, 100]
        });
        currentMarker = L.marker([currentPos.lat, currentPos.lng], { icon: pulseIcon }).addTo(map);
      } else {
        const pulseIcon = L.divIcon({
          className: 'current-pos-wrapper',
          html: pulseHtml,
          iconSize: [200, 200],
          iconAnchor: [100, 100]
        });
        currentMarker.setLatLng([currentPos.lat, currentPos.lng]);
        currentMarker.setIcon(pulseIcon);
      }
      
      // Auto-pan only on first lock or if it's the very first update
      if (path.length <= 1 && isTracking) {
        map.panTo([currentPos.lat, currentPos.lng]);
      }
    }

    // Update Photo Markers
    leafletMarkers.forEach(m => map.removeLayer(m));
    leafletMarkers = markers.map(m => {
      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="w-10 h-10 border-2 border-white rounded-lg shadow-lg overflow-hidden bg-emerald-100 flex items-center justify-center">
                <img src="${URL.createObjectURL(m.photoBlob)}" class="w-full h-full object-cover">
              </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });
      const marker = L.marker([m.lat, m.lng], { icon }).addTo(map);
      if (m.shopName) {
        marker.bindPopup(`<b>${m.shopName}</b>`);
      }
      return marker;
    });
  }

  function centerOnCurrentLocation() {
    if (map && currentPos) {
      map.flyTo([currentPos.lat, currentPos.lng], 16, {
        animate: true,
        duration: 1.5
      });
    }
  }

  onDestroy(() => {
    if (map) map.remove();
  });
</script>

<div class="relative w-full h-full z-0">
  <div bind:this={mapElement} class="w-full h-full"></div>

  {#if currentPos}
    <button 
      onclick={centerOnCurrentLocation}
      title="現在地に戻る"
      class="absolute top-24 right-4 z-[1000] p-3 bg-white/90 backdrop-blur-md text-emerald-600 rounded-2xl shadow-[0_8px_20px_-4px_rgba(0,0,0,0.2)] hover:bg-white active:scale-90 transition-all cursor-pointer"
    >
      <LocateFixed size={26} strokeWidth={2.5} />
    </button>
  {/if}
</div>

<style>
  :global(.leaflet-container) {
    height: 100%;
    width: 100%;
  }

  :global(.neon-polyline) {
    filter: drop-shadow(0 0 8px rgba(255, 0, 51, 0.8)) drop-shadow(0 0 12px rgba(255, 0, 51, 0.5));
  }

  :global(.pulse-container) {
    position: relative;
    width: 200px;
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :global(.pulse-dot) {
    width: 24px;
    height: 24px;
    background: #0033cc;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 0 15px rgba(0, 51, 204, 0.8);
    z-index: 2;
    transition: transform 0.3s ease;
  }

  :global(.pulse-container.is-tracking .pulse-dot) {
    transform: scale(1.1);
  }

  :global(.pulse-ring) {
    position: absolute;
    width: 30px;
    height: 30px;
    background: rgba(0, 102, 255, 0.5);
    border-radius: 50%;
    z-index: 1;
    animation: -global-pulse-anim 1.5s infinite cubic-bezier(0.21, 0.53, 0.56, 0.8);
  }

  @keyframes -global-pulse-anim {
    0% {
      transform: scale(1);
      opacity: 0.9;
    }
    100% {
      transform: scale(8); /* 30px * 8 = 240px spread */
      opacity: 0;
    }
  }
</style>
