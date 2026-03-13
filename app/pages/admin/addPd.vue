<script setup>
definePageMeta({ layout: 'admin', middleware: 'admin' })

// ดึงฟังก์ชันมาจาก useInventory (ต้องมี uploadImage ด้วย)
const { addProduct, getCategories, uploadImage } = useInventory()

const form = ref({
  sku: '',
  name: '',
  description: '',
  category_id: '',
  stock_qty: 0,
  sell_price: 0,
  image_url: ''
})

const { data: categories } = await getCategories()
const loading = ref(false)

// ตัวแปรสำหรับจัดการไฟล์รูปภาพ
const selectedFile = ref(null)
const previewUrl = ref(null)

// ฟังก์ชันเมื่อมีการกดเลือกไฟล์รูปภาพ
const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
    previewUrl.value = URL.createObjectURL(file) // สร้าง URL จำลองเพื่อแสดงรูปพรีวิว
  }
}

// ฟังก์ชันบันทึกข้อมูล
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
    <div class="form-card">
      <h1 class="title">📦 เพิ่มสินค้าใหม่</h1>

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

        <div class="form-group">
          <label>หมวดหมู่</label>
          <select v-model="form.category_id" class="input-field">
            <option value="">-- เลือกหมวดหมู่ --</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </option>
          </select>
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
    </div>
  </div>
</template>

<style scoped>
@import '~/assets/css/admin-style.css';
</style>