<!-- app/pages/user/[username].vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const username = computed(() => (route.params.username as string) || 'alexdpl')

const userProfile = ref({
  username: username.value,
  bio: 'Lead Engineer Architect & Core Creator of DevKernelPulse',
  avatar: 'https://github.com/alexdpl.png',
  github: 'https://github.com/alexdpl',
  twitter: 'https://x.com/alexdpl76',
  linkedin: 'https://linkedin.com/in/alexdpl',
  reddit: 'https://reddit.com/user/alexdpl',
  points: 1130,
  rank: 'Developer VIP Member'
})
</script>

<template>
  <div class="min-h-screen bg-[#020420] text-white py-12 px-4 flex justify-center">
    <div class="w-full max-w-[650px] bg-[#090d16] border border-[#1e293b] rounded-2xl p-8 flex flex-col gap-6">
      
      <!-- Header profilo -->
      <div class="flex items-center gap-6">
        <img 
          :src="userProfile.avatar" 
          alt="Avatar" 
          class="w-20 h-20 rounded-full border-2 border-[#00dc82] object-cover"
        />
        <div>
          <h1 class="text-2xl font-bold m-0">@{{ userProfile.username }}</h1>
          <span class="text-[#00dc82] font-bold text-sm">{{ userProfile.rank }}</span>
          <p class="text-slate-400 text-sm mt-1 mb-0">{{ userProfile.bio }}</p>
        </div>
      </div>

      <!-- ICONE SOCIAL -->
      <div class="flex flex-wrap gap-3">
        <!-- GitHub -->
        <a
          v-if="userProfile.github"
          :href="userProfile.github"
          target="_blank"
          class="social-btn group"
        >
          <img 
            src="https://img.icons8.com/ios-filled/50/ffffff/github.png" 
            alt="GitHub"
            class="w-7 h-7 transition-transform duration-200 group-hover:scale-110"
          />
          <span>GitHub</span>
        </a>

        <!-- Twitter / X -->
        <a
          v-if="userProfile.twitter"
          :href="userProfile.twitter"
          target="_blank"
          class="social-btn group"
        >
          <img 
            src="https://img.icons8.com/ios-filled/50/ffffff/twitterx.png" 
            alt="Twitter X"
            class="w-7 h-7 transition-transform duration-200 group-hover:scale-110"
          />
          <span>Twitter</span>
        </a>

        <!-- LinkedIn -->
        <a
          v-if="userProfile.linkedin"
          :href="userProfile.linkedin"
          target="_blank"
          class="social-btn group linkedin"
        >
          <img 
            src="https://img.icons8.com/color/48/linkedin.png" 
            alt="LinkedIn"
            class="w-7 h-7 transition-transform duration-200 group-hover:scale-110"
          />
          <span>LinkedIn</span>
        </a>

        <!-- Reddit -->
        <a
          v-if="userProfile.reddit"
          :href="userProfile.reddit"
          target="_blank"
          class="social-btn group reddit"
        >
          <img 
            src="https://img.icons8.com/color/48/reddit.png" 
            alt="Reddit"
            class="w-7 h-7 transition-transform duration-200 group-hover:scale-110"
          />
          <span>Reddit</span>
        </a>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-[#020420] border border-[#1e293b] rounded-lg p-4 flex flex-col gap-1">
          <span class="text-xs text-slate-500 uppercase tracking-wider">Punti DKP</span>
          <span class="text-xl font-extrabold">{{ userProfile.points }}</span>
        </div>
        <div class="bg-[#020420] border border-[#1e293b] rounded-lg p-4 flex flex-col gap-1">
          <span class="text-xs text-slate-500 uppercase tracking-wider">Stato Credenziali</span>
          <span class="text-xl font-extrabold text-[#00dc82]">Verificato</span>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* CSS normale (niente @apply) → niente errori PostCSS */
.social-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  width: 72px;
  height: 72px;
  background: #020420;
  border: 1px solid #1e293b;
  border-radius: 12px;
  color: #94a3b8;
  font-size: 0.7rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
}

.social-btn:hover {
  transform: translateY(-3px);
  border-color: #00dc82;
  color: #ffffff;
  box-shadow: 0 0 15px rgba(0, 220, 130, 0.25);
}

/* Colori ufficiali al hover */
.social-btn.linkedin:hover {
  border-color: #0A66C2;
  box-shadow: 0 0 15px rgba(10, 102, 194, 0.35);
}

.social-btn.reddit:hover {
  border-color: #FF4500;
  box-shadow: 0 0 15px rgba(255, 69, 0, 0.35);
}
</style>