<template>
  <div class="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
    <div class="flex items-center gap-4 mb-8">
      <div class="bg-pink-100 p-3 rounded-xl text-[#ff8fa3]">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <div>
        <h2 class="text-xl font-bold text-gray-800">ข้อมูลส่วนตัว</h2>
        <p class="text-gray-500 text-sm mt-0.5">จัดการชื่อและเบอร์โทรศัพท์ของคุณ</p>
      </div>
    </div>

    <div v-if="isProfileLoading" class="text-center py-8 text-pink-500 font-medium animate-pulse">
      กำลังโหลดข้อมูล...
    </div>

    <form v-else @submit.prevent="handleUpdate" class="space-y-6 max-w-xl">
      
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-2">ระดับสิทธิ์ผู้ใช้งาน (Role)</label>
        <div class="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold bg-pink-50 text-pink-600 border border-pink-100">
          <span v-if="isRoleLoading">กำลังตรวจสอบ...</span>
          <span v-else-if="role">{{ role.toUpperCase() }}</span>
          <span v-else class="text-red-500">ไม่พบข้อมูลสิทธิ์</span>
        </div>
      </div>

      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-2">ชื่อ-นามสกุล</label>
        <input 
          v-model="profileData.full_name" 
          type="text" 
          required 
          class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-pink-300 outline-none transition bg-gray-50 focus:bg-white"
        />
      </div>

      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-2">เบอร์โทรศัพท์</label>
        <input 
          v-model="profileData.phone" 
          type="text" 
          required 
          class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-pink-300 outline-none transition bg-gray-50 focus:bg-white"
        />
      </div>

      <button 
        type="submit" 
        :disabled="loading" 
        class="w-full md:w-auto px-8 bg-[#ff8fa3] hover:bg-pink-500 text-white font-bold py-3 rounded-xl transition disabled:opacity-50 mt-4 shadow-sm hover:shadow-md"
      >
        {{ loading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const { getProfile, updateProfile } = useProfile()
const { role, isRoleLoading } = useUserRole()

const profileData = ref({ full_name: '', phone: '' })
const isProfileLoading = ref(true)
const loading = ref(false)

onMounted(async () => {
  const { data } = await getProfile()
  if (data.value) {
    profileData.value.full_name = data.value.full_name || ''
    profileData.value.phone = data.value.phone || ''
  }
  isProfileLoading.value = false
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