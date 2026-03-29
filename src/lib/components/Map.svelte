<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { LocationPoint, PhotoMarker } from '$lib/db';

  let { 
    path = [], 
    markers = [], 
    currentPos = null 
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

    polyline = L.polyline([], { color: '#3b82f6', weight: 5 }).addTo(map);
    
    updateMap();
  });

  $effect(() => {
    if (map && (path || markers || currentPos)) {
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
      if (!currentMarker) {
        const pulseIcon = L.divIcon({
          className: 'current-pos-wrapper',
          html: `<div class="pulse-container">
                  <div class="pulse-ring"></div>
                  <div class="pulse-dot"></div>
                 </div>`,
          iconSize: [60, 60],
          iconAnchor: [30, 30]
        });
        currentMarker = L.marker([currentPos.lat, currentPos.lng], { icon: pulseIcon }).addTo(map);
      } else {
        currentMarker.setLatLng([currentPos.lat, currentPos.lng]);
      }
      map.panTo([currentPos.lat, currentPos.lng]);
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

  onDestroy(() => {
    if (map) map.remove();
  });
</script>

<div bind:this={mapElement} class="w-full h-full z-0"></div>

<style>
  :global(.leaflet-container) {
    height: 100%;
    width: 100%;
  }

  :global(.pulse-container) {
    position: relative;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :global(.pulse-dot) {
    width: 14px;
    height: 14px;
    background: #3b82f6;
    border: 2px solid white;
    border-radius: 50%;
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
    z-index: 2;
  }

  :global(.pulse-ring) {
    position: absolute;
    width: 16px;
    height: 16px;
    background: rgba(59, 130, 246, 0.4);
    border-radius: 50%;
    z-index: 1;
    animation: pulse 2s infinite ease-out;
  }

  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 0.8;
    }
    100% {
      transform: scale(4);
      opacity: 0;
    }
  }
</style>
