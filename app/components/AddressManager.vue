<template>
  <div class="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
    <div class="flex items-center justify-between mb-8">
      <div class="flex items-center gap-4">
        <div class="bg-pink-100 p-3 rounded-xl text-[#ff8fa3]">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-800">สมุดที่อยู่จัดส่ง</h2>
          <p class="text-gray-500 text-sm mt-0.5">เพิ่มได้สูงสุด 5 รายการ</p>
        </div>
      </div>
      <span class="text-sm bg-gray-100 px-4 py-1.5 rounded-full text-gray-700 font-bold border border-gray-200">
        {{ addresses.length }}/5
      </span>
    </div>

    <div class="space-y-4 mb-8">
      <div v-for="addr in addresses" :key="addr.id" class="border border-gray-200 rounded-xl p-5 relative hover:border-pink-300 transition group bg-white">
        <div class="font-bold text-[#ff8fa3] text-lg">{{ addr.label }}</div>
        <div class="text-gray-600 mt-2 leading-relaxed">{{ addr.address_detail }}</div>
        <div class="text-gray-500 mt-3 font-medium flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          {{ addr.phone }}
        </div>
        
        <button @click="handleDeleteAddress(addr.id)" class="absolute top-5 right-5 text-gray-300 hover:text-red-500 transition opacity-100 md:opacity-0 md:group-hover:opacity-100" title="ลบที่อยู่นี้">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <div v-if="addresses.length === 0" class="text-center py-10 bg-gray-50 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
        ยังไม่มีข้อมูลที่อยู่จัดส่ง
      </div>
    </div>

    <div v-if="addresses.length < 5" class="bg-pink-50/50 p-6 rounded-xl border border-pink-100">
      <h3 class="font-bold mb-5 text-gray-800 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[#ff8fa3]" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        เพิ่มที่อยู่ใหม่
      </h3>
      <form @submit.prevent="handleAddAddress" class="space-y-4 max-w-xl">
        <input v-model="addressForm.label" placeholder="ป้ายกำกับ (เช่น บ้าน, ที่ทำงาน)" required class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-300 outline-none bg-white" />
        <textarea v-model="addressForm.address_detail" placeholder="รายละเอียดที่อยู่แบบเต็ม" required class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm h-28 resize-none focus:ring-2 focus:ring-pink-300 outline-none bg-white"></textarea>
        <input v-model="addressForm.phone" placeholder="เบอร์โทรศัพท์สำหรับที่อยู่นี้" required class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-300 outline-none bg-white" />
        
        <button type="submit" :disabled="isSubmitting" class="w-full md:w-auto px-8 bg-gray-800 hover:bg-gray-900 text-white py-3 rounded-xl font-bold transition disabled:opacity-50 mt-2 shadow-sm">
          {{ isSubmitting ? 'กำลังบันทึก...' : 'บันทึกที่อยู่ใหม่' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const { fetchAddresses, addAddress, deleteAddress } = useAddress()
const addresses = ref([])
const addressForm = ref({ label: '', address_detail: '', phone: '' })
const isSubmitting = ref(false)

const loadAddresses = async () => {
  addresses.value = await fetchAddresses()
}

onMounted(() => {
  loadAddresses()
})

const handleAddAddress = async () => {
  isSubmitting.value = true
  const result = await addAddress(addressForm.value)
  if (result.error) {
    alert(result.error)
  } else {
    addressForm.value = { label: '', address_detail: '', phone: '' } 
    await loadAddresses() 
  }
  isSubmitting.value = false
}

const handleDeleteAddress = async (id) => {
  if (!confirm('ต้องการลบที่อยู่นี้ใช่หรือไม่?')) return
  await deleteAddress(id)
  await loadAddresses() 
}
</script>