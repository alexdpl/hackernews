import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  // Feed di storie del Kernel v2.3 (sincronizzabile con Neon DB)
  return [
    {
      id: 1,
      title: 'Ollaya – Ollama for open-source, Jev-style decision models',
      url: 'https://ollaya.dev',
      domain: 'ollaya.dev',
      points: 18,
      author: 'alexdpl',
      timeAgo: '22h fa',
      voted: false
    },
    {
      id: 2,
      title: 'Yes, Claude can do Nine Loops',
      url: 'https://anthropic.com',
      domain: 'anthropic.com',
      points: 35,
      author: 'alexdpl',
      timeAgo: '23h fa',
      voted: false
    },
    {
      id: 3,
      title: 'Show HN: Doom or Bloom, map your AI worldview with Jev',
      url: 'https://doom-or-bloom.com',
      domain: 'doom-or-bloom.com',
      points: 17,
      author: 'alexdpl',
      timeAgo: '1g fa',
      voted: false
    },
    {
      id: 4,
      title: 'Classified Estimates Show the NSA Is Paying Billions to Test AI Models',
      url: 'https://washingtonsun.com',
      domain: 'washingtonsun.com',
      points: 139,
      author: 'alexdpl',
      timeAgo: '1g fa',
      voted: false
    },
    {
      id: 5,
      title: 'Allow Carriers on Planes',
      url: 'https://jefftk.com',
      domain: 'jefftk.com',
      points: 31,
      author: 'alexdpl',
      timeAgo: '1g fa',
      voted: false
    }
  ]
})