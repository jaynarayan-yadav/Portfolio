<template>
  <div class="product-card rounded-2xl p-4 shadow-md">
    <h3 class="text-xl font-bold">{{ title }}</h3>
    <p>{{ price }}</p>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  price: String
});
</script>
