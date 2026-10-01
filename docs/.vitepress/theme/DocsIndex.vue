<script setup lang="ts">
import { useData, withBase } from "vitepress";

const { theme } = useData();
</script>

<template>
  <section id="docs" class="docs-index">
    <h2 class="docs-index__title">All documents</h2>
    <div class="docs-index__grid">
      <a
        v-for="doc in theme.docs"
        :key="doc.link"
        class="docs-index__card"
        :href="withBase(doc.link)"
      >
        <span class="docs-index__name">{{ doc.text }}</span>
        <span class="docs-index__text">{{ doc.description }}</span>
      </a>
    </div>
  </section>
</template>
