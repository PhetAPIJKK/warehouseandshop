<script setup>
definePageMeta({
  middleware: 'auth'
})




const client = useSupabaseClient()

const logout = async () => {
  await client.auth.signOut()
  navigateTo('/login')
}
</script>

<template>
  <button @click="logout">ออกจากระบบ</button>
</template>