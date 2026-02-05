<script setup lang="ts">
const route = useRoute()
const id = route.params.id as string

await navigateTo(`/${id}`, { redirectCode: 301 })
</script>
