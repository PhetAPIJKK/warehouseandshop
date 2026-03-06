<script setup>
definePageMeta({
  layout: 'admin',      // ใช้ Layout admin
  middleware: 'admin'   // เชื่อมต่อกับ middleware/admin.ts ที่เราทำไว้
})

const client = useSupabaseClient()

const logout = async () => {
  await client.auth.signOut()
  clearNuxtData() // ล้างแคชเพื่อให้แน่ใจว่า Role จะถูกรีเซ็ต
  navigateTo('/login')
}
</script>

<template>
  <div>
    <h2 class="page-title">สรุปภาพรวมคลังสินค้า</h2>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="label">ยอดขายเดือนนี้</div>
        <div class="value">฿45,678.90</div>
      </div>
    </div>

  
  </div>
</template>

<style scoped>
/* สไตล์เดิมของคุณ */
.page-title { margin-bottom: 2rem; font-size: 1.5rem; color: #334155; }
/* ... สไตล์อื่นๆ ... */
</style>