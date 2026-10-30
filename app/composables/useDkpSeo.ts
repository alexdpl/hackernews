// app/composables/useDkpSeo.ts
import { unref } from "vue";
import type { Ref, ComputedRef } from "vue";

type MaybeRef<T> = T | Ref<T> | ComputedRef<T>;

export function useDkpSeo(options: {
  title: MaybeRef<string>;
  description?: MaybeRef<string>;
  image?: string;
  type?: "website" | "article";
}) {
  const route = useRoute();

  const siteName = "DevKernelPulse";

  useHead(() => {
    const title = unref(options.title);

    const description =
      unref(options.description) ||
      "DevKernelPulse - Ecosistema SaaS per Nuxt 4, API Gateway crittografato, Neural Playground e Proof-of-Code Vault.";

    const image =
      options.image ||
      "https://devkernelpulse.org/public/dkp-logo.svg";

    const url =
      `https://devkernelpulse.org${route.fullPath}`;

    return {
      title,

      meta: [
        {
          name: "description",
          content: description,
        },

        {
          name: "keywords",
          content:
            "DevKernelPulse, DKP, Nuxt 4, OpenRouter, Neon DB, Drizzle ORM, AI Gateway, Proof of Code",
        },

        {
          name: "author",
          content: "Alexdpl",
        },

        {
          name: "robots",
          content:
            "index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1",
        },

        {
          property: "og:site_name",
          content: siteName,
        },
        {
          property: "og:title",
          content: title,
        },
        {
          property: "og:description",
          content: description,
        },
        {
          property: "og:image",
          content: image,
        },
        {
          property: "og:url",
          content: url,
        },
        {
          property: "og:type",
          content: options.type || "website",
        },
        {
          property: "og:locale",
          content: "it_IT",
        },

        {
          name: "twitter:card",
          content: "summary_large_image",
        },
        {
          name: "twitter:title",
          content: title,
        },
        {
          name: "twitter:description",
          content: description,
        },
        {
          name: "twitter:image",
          content: image,
        },
      ],

      link: [
        {
          rel: "canonical",
          href: url,
        },
      ],
    };
  });
}