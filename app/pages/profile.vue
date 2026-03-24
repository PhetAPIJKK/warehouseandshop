<template>
  <div class="max-w-3xl mx-auto p-4 md:p-8 min-h-screen">
    
    <div class="mb-8 border-b border-gray-200 pb-6">
      <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight">จัดการบัญชีผู้ใช้</h1>
      <p class="text-gray-500 mt-2 text-sm md:text-base">อัปเดตข้อมูลส่วนตัวและจัดการสมุดที่อยู่จัดส่งของคุณ</p>
    </div>

    <div class="flex flex-col space-y-8">
       <AddressManager />



       <ProfileForm />
    </div>

  </div>
</template>

<script setup>
// ดักจับคนยังไม่ล็อกอิน
definePageMeta({
  middleware: [
    function (to, from) {
      const user = useSupabaseUser()
      if (!user.value) {
        return navigateTo('/login')
      }
    }
  ]
})
</script>