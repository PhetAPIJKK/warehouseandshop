<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2>แก้ไขโปรไฟล์</h2>
      <p class="subtitle">จัดการข้อมูลส่วนตัวของคุณ</p>

      <div v-if="pending">กำลังโหลดข้อมูล...</div>
      
      <form v-else @submit.prevent="handleUpdate">
        <div class="input-group">
          <label>ชื่อ-นามสกุล</label>
          <input v-model="profileData.full_name" type="text" required />
        </div>

        <div class="input-group">
          <label>เบอร์โทรศัพท์</label>
          <input v-model="profileData.phone" type="text" required />
        </div>

        <button type="submit" :disabled="loading" class="btn-primary">
          {{ loading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
const { getProfile, updateProfile } = useProfile() // เรียกใช้ Logic จาก composable
const { data: profile, pending } = await getProfile()
const loading = ref(false)

// เก็บข้อมูลใน Reactive state
const profileData = ref({
  full_name: profile.value?.full_name || '',
  phone: profile.value?.phone || ''
})

const handleUpdate = async () => {
  loading.value = true
  try {
    await updateProfile({
      full_name: profileData.value.full_name,
      phone: profileData.value.phone
    })
    alert('อัปเดตข้อมูลสำเร็จ!')
  } catch (err) {
    alert('เกิดข้อผิดพลาด: ' + err.message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* ใส่ CSS เดิมที่คุณมีได้เลยครับ */
.auth-container { display: flex; justify-content: center; align-items: center; min-height: 80vh; }
.auth-card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 100%; max-width: 400px; }
.input-group { margin-bottom: 1rem; }
.btn-primary { width: 100%; padding: 10px; background: #4f46e5; color: white; border: none; border-radius: 6px; cursor: pointer; }
</style>