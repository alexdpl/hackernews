<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  comment: {
    type: Object,
    required: true,
  },
})

const SENTINEL_BOTS = new Set(['sentinel_ai', 'guardian_bot', 'snippet_master', 'security_watch'])

const isSentinelBot = computed(() =>
  Boolean(props.comment?.authorIsBot) || SENTINEL_BOTS.has(String(props.comment?.user || '').toLowerCase())
)

const open = ref(true)

function pluralize(n: number) {
  return n + (n === 1 ? ' reply' : ' replies')
}
</script>

<template>
  <li
    v-if="comment && comment.user"
    :class="['comment', isSentinelBot ? 'sentinel-bot-comment' : '']"
  >
    <div class="by">
      <NuxtLink :to="'/user/' + comment.user">
        {{ comment.user }}
      </NuxtLink>
      <span
        v-if="isSentinelBot"
        class="sentinel-bot-badge"
        :title="comment.authorBotSpecialty || 'DKP Autonomous Sentinel'"
      >
        [BOT // SENTINEL]
      </span>
      {{ timeAgo(comment.time) }} ago
    </div>
    <div
      class="text"
      v-html="comment.content"
    />
    <div
      v-if="comment.comments && comment.comments.length"
      :class="{ open }"
      class="toggle"
    >
      <a @click="open = !open">{{ open ? '[-]' : '[+] ' + pluralize(comment.comments.length) + ' collapsed' }}
      </a>
    </div>
    <ul
      v-show="open"
      class="comment-children"
    >
      <PostComment
        v-for="childComment in comment.comments"
        :key="childComment.id"
        :comment="childComment"
      />
    </ul>
  </li>
</template>

<style lang="postcss">
.comment-children {
  .comment-children {
    margin-left: 1.5em;
  }
}

.comment {
  border-top: 1px solid #eee;
  position: relative;

  &.sentinel-bot-comment {
    background: rgba(16, 185, 129, 0.06);
    border-left: 3px solid #10b981;
    padding-left: 0.75em;
  }

  .sentinel-bot-badge {
    display: inline-block;
    margin: 0 0.45em;
    padding: 0.1em 0.45em;
    border-radius: 4px;
    background: #0f172a;
    color: #34d399;
    border: 1px solid rgba(16, 185, 129, 0.4);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.78em;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  .by, .text, .toggle {
    font-size: 0.9em;
    margin: 1em 0;
  }

  .by {
    color: #222;

    & a {
      color: #222;
      text-decoration: underline;
    }
  }

  .text {
    overflow-wrap: break-word;

    & a:hover {
      color: #111;
    }

    & pre {
      white-space: pre-wrap;
    }
  }

  .toggle {
    background-color: #fffbf2;
    padding: 0.3em 0.5em;
    border-radius: 4px;

    & a {
      color: #222;
      cursor: pointer;
    }

    &.open {
      padding: 0;
      background-color: transparent;
      margin-bottom: -0.5em;
    }
  }
}
</style>