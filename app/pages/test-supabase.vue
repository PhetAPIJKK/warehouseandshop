<template>
  <div class="p-10">
    <button @click="testFetch" class="p-2 bg-blue-500 text-white">ทดสอบดึงข้อมูล</button>
    <pre>{{ result }}</pre>
  </div>
</template>

<script setup>
const client = useSupabaseClient()
const result = ref(null)

const testFetch = async () => {
  // ลองดึงจากตาราง payment_types ที่คุณมีอยู่
  const { data, error } = await client.from('payment_types').select('*')
  if (error) result.value = error.message
  else result.value = data
}
</script>