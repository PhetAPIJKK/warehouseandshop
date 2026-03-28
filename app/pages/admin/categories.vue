<template>
  <div class="p-6 md:p-8 bg-slate-50 min-h-screen">
    <header class="mb-8">
      <h1 class="text-2xl font-bold text-slate-900 flex items-center gap-2">
        📁 จัดการหมวดหมู่สินค้า
      </h1>
      <p class="text-slate-500 text-sm">เพิ่มหรือลบประเภทสินค้าสำหรับใช้ในระบบ Warehouse & Shop</p>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <div class="lg:col-span-1">
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-8">
          <h2 class="font-bold text-lg mb-4 text-slate-800 flex items-center gap-2">
            <span class="text-blue-600">➕</span> เพิ่มหมวดหมู่ใหม่
          </h2>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">ชื่อหมวดหมู่</label>
              <input 
                v-model="form.name" 
                type="text" 
                placeholder="เช่น เครื่องใช้ไฟฟ้า, ไอที"
                class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
            
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">คำอธิบาย (ไม่บังคับ)</label>
              <textarea 
                v-model="form.description" 
                rows="3" 
                placeholder="ระบุรายละเอียดสั้นๆ..."
                class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              ></textarea>
            </div>

            <button 
              @click="handleSave" 
              :disabled="loading"
              class="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:bg-slate-300 transition-all shadow-lg shadow-slate-200"
            >
              {{ loading ? 'กำลังบันทึก...' : 'บันทึกหมวดหมู่' }}
            </button>
          </div>
        </div>
      </div>

      <div class="lg:col-span-2">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 class="font-bold text-lg text-slate-800">📋 รายการปัจจุบัน</h2>
            <span class="text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-full">
              ทั้งหมด {{ categories?.length || 0 }} รายการ
            </span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-sm text-left">
              <thead class="bg-slate-50 text-slate-500 font-semibold">
                <tr>
                  <th class="p-4">ชื่อหมวดหมู่</th>
                  <th class="p-4">รายละเอียด</th>
                  <th class="p-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                <tr v-for="cat in categories" :key="cat.id" class="hover:bg-slate-50/50 transition">
                  <td class="p-4 font-bold text-slate-700">{{ cat.name }}</td>
                  <td class="p-4 text-slate-500 max-w-xs truncate">{{ cat.description || '-' }}</td>
                  <td class="p-4 text-center">
                    <button 
                      @click="handleDelete(cat.id)" 
                      class="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors font-semibold"
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
                <tr v-if="!categories?.length">
                  <td colspan="3" class="p-12 text-center text-slate-400 italic">
                    ยังไม่มีข้อมูลหมวดหมู่ในขณะนี้
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', middleware: 'admin' })

const { getCategories, addCategory, deleteCategory } = useInventory()
const user = useSupabaseUser()
// ดึงข้อมูลหมวดหมู่
const { data: categories, refresh } = await getCategories()

const loading = ref(false)
const form = ref({
  name: '',
  description: ''
})

// ฟังก์ชันบันทึก
const handleSave = async () => {
  if (!form.value.name) return alert('กรุณาระบุชื่อหมวดหมู่')
  
  loading.value = true
  const { error } = await addCategory(form.value)
  loading.value = false

  if (error) {
    alert('เกิดข้อผิดพลาด: ' + error.message)
  } else {
    form.value = { name: '', description: '' } // ล้างฟอร์ม
    await refresh() // โหลดข้อมูลใหม่
  }
}

// ฟังก์ชันลบ
const handleDelete = async (id) => {
  if (confirm('คุณแน่ใจหรือไม่ที่จะลบหมวดหมู่นี้? (หากมีสินค้าใช้หมวดหมู่นี้อยู่อาจเกิดปัญหาได้)')) {
    const { error } = await deleteCategory(id)
    if (error) {
      alert('ลบไม่สำเร็จ: ' + error.message)
    } else {
      await refresh()
    }
  }
}
</script>

<style scoped>
/* คุณสามารถเพิ่ม CSS พิเศษที่นี่ได้หากต้องการ */
</style>