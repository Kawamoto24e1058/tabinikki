<script lang="ts">
  import { Map, Camera, History, Settings } from 'lucide-svelte';

  let { activeTab = $bindable('map') } = $props();
</script>

<nav class="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 pb-safe z-50">
  <div class="flex justify-around items-center h-16">
    <button 
      class="flex flex-col items-center gap-1 transition-colors {activeTab === 'map' ? 'text-emerald-500' : 'text-gray-400'}"
      onclick={() => activeTab = 'map'}
    >
      <Map size={24} />
      <span class="text-xs font-medium">マップ</span>
    </button>
    
    <button 
      class="flex flex-col items-center gap-1 transition-colors {activeTab === 'photos' ? 'text-emerald-500' : 'text-gray-400'}"
      onclick={() => activeTab = 'photos'}
    >
      <Camera size={24} />
      <span class="text-xs font-medium">写真</span>
    </button>

    <button 
      class="flex flex-col items-center gap-1 transition-colors text-gray-400"
    >
      <History size={24} />
      <span class="text-xs font-medium">軌跡録</span>
    </button>

    <button 
      class="flex flex-col items-center gap-1 transition-colors {activeTab === 'settings' ? 'text-emerald-500' : 'text-gray-400'}"
      onclick={() => activeTab = 'settings'}
    >
      <Settings size={24} />
      <span class="text-xs font-medium">設定</span>
    </button>
  </div>
</nav>
