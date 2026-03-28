<script setup>
definePageMeta({ layout: 'admin', middleware: 'admin' })

// ดึงฟังก์ชันมาจาก useInventory (!!! สมมติว่าใน useInventory มี addCategory เพิ่มมาแล้วนะ !!!)
const { addProduct, getCategories, uploadImage, addCategory /* ⭐️ 1. ดึงฟังก์ชันนี้มา */ } = useInventory()

const form = ref({
  sku: '',
  name: '',
  description: '',
  category_id: '',
  stock_qty: 0,
  sell_price: 0,
  image_url: ''
})

// ⭐️ 2. เพิ่ม refresh มาด้วย เพื่อเอาไว้โหลดลิสต์ categories ใหม่หลังเพิ่มเสร็จ
const { data: categories, refresh: refreshCategories } = await getCategories()
const loading = ref(false)

// ตัวแปรสำหรับจัดการไฟล์รูปภาพ
const selectedFile = ref(null)
const previewUrl = ref(null)

// ⭐️ 3. ตัวแปรสำหรับจัดการ "เพิ่มหมวดหมู่แบบด่วน" (Modal)
const showQuickCatModal = ref(false) // เปิด/ปิด Modal
const quickCatName = ref('') // เก็บชื่อหมวดหมู่ใหม่ที่จะพิมพ์
const catLoading = ref(false) // สถานะกำลังบันทึกหมวดหมู่

// ฟังก์ชันเมื่อมีการกดเลือกไฟล์รูปภาพ
const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
    previewUrl.value = URL.createObjectURL(file) // สร้าง URL จำลองเพื่อแสดงรูปพรีวิว
  }
}

// ⭐️ 4. ฟังก์ชันบันทึกหมวดหมู่แบบด่วน
const handleQuickSaveCategory = async () => {
  if (!quickCatName.value) return alert('กรุณาระบุชื่อหมวดหมู่')
  
  catLoading.value = true
  // ส่งข้อมูลไปบันทึกลงตาราง product_categories
  const { data, error } = await addCategory({ name: quickCatName.value })
  catLoading.value = false

  if (error) {
    return alert('เพิ่มหมวดหมู่ไม่สำเร็จ: ' + error.message)
  }

  // ถ้าสำเร็จ:
  alert('เพิ่มหมวดหมู่สำเร็จ!')
  await refreshCategories() // โหลด Dropdown ใหม่ให้มีอันที่เพิ่งเพิ่ม
  form.value.category_id = data[0].id // เลือกหมวดหมู่ที่เพิ่งเพิ่มให้ทันที
  
  // ล้างค่าและปิด Modal
  quickCatName.value = ''
  showQuickCatModal.value = false
}


// ฟังก์ชันบันทึกข้อมูลสินค้า
const save = async () => {
  loading.value = true

  // 1. ถ้ามีการเลือกไฟล์รูปภาพ ให้ทำการอัปโหลดขึ้น Supabase ก่อน
  if (selectedFile.value) {
    const { publicUrl, error: uploadError } = await uploadImage(selectedFile.value)

    if (uploadError) {
      alert('อัปโหลดรูปภาพไม่สำเร็จ: ' + uploadError.message)
      loading.value = false
      return
    }
    // เอา URL ที่ได้จาก Supabase มาใส่ใน form เพื่อบันทึกลงฐานข้อมูล
    form.value.image_url = publicUrl
  }

  // 2. ส่งข้อมูลทั้งหมดไปบันทึกลงตาราง products
  const { error } = await addProduct(form.value)
  loading.value = false

  if (error) {
    return alert('Error: ' + error.message)
  }
  
  alert('เพิ่มสินค้าสำเร็จ!')
  navigateTo('/admin/products')
}
</script>

<template>
  <div class="form-container">
    <div class="form-card relative"> <h1 class="title">📦 เพิ่มสินค้าใหม่</h1>

      <div class="form-group full-width">
        <label>รูปภาพสินค้า</label>
        <input type="file" @change="handleFileChange" accept="image/*" class="input-field" />

        <div v-if="previewUrl" class="image-preview-container">
          <img :src="previewUrl" alt="Preview" class="image-preview" />
        </div>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label>SKU (รหัสสินค้า)</label>
          <input v-model="form.sku" placeholder="เช่น PROD-001" class="input-field" />
        </div>

        <div class="form-group">
          <label>ชื่อสินค้า</label>
          <input v-model="form.name" placeholder="ระบุชื่อสินค้า" class="input-field" />
        </div>

        <div class="form-group relative">
          <label>หมวดหมู่</label>
          <div class="category-select-wrapper">
            <select v-model="form.category_id" class="input-field select-with-btn">
              <option value="">-- เลือกหมวดหมู่ --</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
            <button type="button" @click="showQuickCatModal = true" class="btn-quick-add" title="เพิ่มหมวดหมู่ด่วน">
              +
            </button>
          </div>
        </div>

        <div class="form-group">
          <label>จำนวนยอดยกมา (ชิ้น)</label>
          <input v-model.number="form.stock_qty" type="number" min="0" placeholder="0" class="input-field" />
        </div>

        <div class="form-group">
          <label>ราคาขาย (บาท)</label>
          <input v-model.number="form.sell_price" type="number" min="0" placeholder="0" class="input-field" />
        </div>

        <div class="form-group full-width">
          <label>คำอธิบายสินค้า</label>
          <textarea v-model="form.description" rows="3" placeholder="รายละเอียดเพิ่มเติม..."
            class="input-field"></textarea>
        </div>
      </div>
      

      <div class="form-actions">
        <NuxtLink to="/admin/products" class="btn-cancel">ยกเลิก</NuxtLink>
        <button @click="save" :disabled="loading" class="btn-primary">
          {{ loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูลสินค้า' }}
        </button>
      </div>

      <div v-if="showQuickCatModal" class="modal-overlay">
        <div class="modal-card">
          <h3 class="modal-title">📂 เพิ่มหมวดหมู่ด่วน</h3>
          <div class="form-group mt-4">
            <label>ชื่อหมวดหมู่สินค้าใหม่</label>
            <input v-model="quickCatName" placeholder="เช่น เครื่องเขียน, ของใช้ไฟฟ้า" class="input-field" />
          </div>
          <div class="modal-actions mt-6">
            <button @click="showQuickCatModal = false" class="btn-cancel-sm">ยกเลิก</button>
            <button @click="handleQuickSaveCategory" :disabled="catLoading" class="btn-primary-sm">
              {{ catLoading ? 'กำลังบันทึก...' : 'บันทึกหมวดหมู่' }}
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
@import '~/assets/css/admin-style.css';

/* ⭐️ 7. เพิ่ม CSS สำหรับส่วนที่แก้ไข (ถ้าใน admin-style.css ไม่มี) */

/* การจัดวาง dropdown + ปุ่ม + */
.category-select-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
}

.select-with-btn {
  flex: 1; /* ให้ select ขยายเต็มที่เหลือ */
}

.btn-quick-add {
  background: #f1f5f9; /* Slate 100 */
  color: #3b82f6; /* Blue 500 */
  border: 1px solid #e2e8f0; /* Slate 200 */
  padding: 0 16px;
  height: 40px; /* เท่ากับ input-field */
  border-radius: 8px;
  font-weight: 700;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-quick-add:hover {
  background: #e2e8f0;
  border-color: #cbd5e1;
}

/* Modal Styling */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5); /* พื้นหลังดำโปร่งแสง */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999; /* ให้อยู่บนสุด */
}

.modal-card {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* ปุ่มขนาดเล็กใน Modal */
.btn-cancel-sm, .btn-primary-sm {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
}

.btn-cancel-sm {
  background: white;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.btn-primary-sm {
  background: #0f172a;
  color: white;
  border: none;
}
</style>