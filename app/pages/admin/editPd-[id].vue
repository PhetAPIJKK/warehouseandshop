<template>
  <div class="form-container">
    <header class="page-header">
      <h1 class="title">✏️ แก้ไขสินค้า</h1>
      <NuxtLink to="/admin" class="btn-cancel">กลับหน้ารายการ</NuxtLink>
    </header>

    <div v-if="loading" class="loading-state">กำลังโหลดข้อมูล...</div>
    
    <div v-else class="form-card">
      <div class="form-grid">

        
        <div class="form-group full-width">
          <div v-if="previewUrl" class="image-preview-container">
            <img :src="previewUrl" alt="Preview" class="image-preview" />
          </div>
          <label>รูปภาพสินค้า</label>
          <input type="file" @change="handleFileChange" accept="image/*" class="input-field" />
        </div>

        <div class="form-group">
          <label>SKU (รหัสสินค้า)</label>
          <input v-model="form.sku" type="text" class="input-field" placeholder="เช่น PROD-001" />
        </div>

        <div class="form-group">
          <label>ชื่อสินค้า</label>
          <input v-model="form.name" type="text" class="input-field" />
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
          <label>ราคาขาย (บาท)</label>
          <input v-model.number="form.sell_price" type="number" class="input-field" />
        </div>

        <div class="form-group full-width">
          <label>รายละเอียดสินค้า</label>
          <textarea v-model="form.description" class="input-field" rows="4"></textarea>
        </div>


        <div class="form-group">
          <label>จำนวนคงเหลือ (ไม่อนุญาตให้แก้ไขที่หน้านี้)</label>
          <input 
            v-model="form.stock_qty" 
            type="number" 
            class="input-field disabled-input" 
            disabled 
          />
        </div>
      </div>

      <div class="form-actions">
        <button @click="saveUpdate" :disabled="saving" class="btn-primary">
          {{ saving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
// ⭐️ อย่าลืมเรียกใช้ uploadImage ด้วย
const { getProductById, updateProduct, getCategories, uploadImage } = useInventory()

const form = ref({
  sku: '',
  name: '',
  category_id: '',
  description: '',
  sell_price: 0,
  stock_qty: 0,
  image_url: '' // ⭐️ เพิ่มฟิลด์รูปภาพ
})

const categories = ref([])
const loading = ref(true)
const saving = ref(false)

// ⭐️ ตัวแปรสำหรับรูปภาพ
const selectedFile = ref(null)
const previewUrl = ref(null)

onMounted(async () => {
  const { data: catData } = await getCategories()
  if (catData) categories.value = catData

  const { data: product } = await getProductById(route.params.id)
  if (product) {
    form.value = {
      sku: product.sku || '',
      name: product.name || '',
      category_id: product.category_id || '',
      description: product.description || '',
      sell_price: product.sell_price || 0,
      stock_qty: product.stock_qty || 0,
      image_url: product.image_url || '' // ⭐️ ดึง URL รูปเดิมมาเก็บไว้
    }
    // ⭐️ นำรูปเดิมมาแสดงที่หน้าจอ
    previewUrl.value = product.image_url || null
  }
  loading.value = false
})

// ⭐️ ฟังก์ชันเมื่อแอดมินเลือกรูปใหม่
const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
    previewUrl.value = URL.createObjectURL(file) // เปลี่ยนรูปพรีวิวทันที
  }
}

const saveUpdate = async () => {
  saving.value = true

  let finalImageUrl = form.value.image_url

  // ⭐️ ถ้ามีการกดเลือกรูปใหม่ ให้ทำการอัปโหลดรูปก่อน
  if (selectedFile.value) {
    const { publicUrl, error: uploadError } = await uploadImage(selectedFile.value)
    
    if (uploadError) {
      alert('อัปโหลดรูปภาพใหม่ไม่สำเร็จ: ' + uploadError.message)
      saving.value = false
      return
    }
    finalImageUrl = publicUrl // ใช้ URL ใหม่ที่เพิ่งอัปโหลด
  }

  const payloadToUpdate = {
    sku: form.value.sku,
    name: form.value.name,
    category_id: form.value.category_id || null,
    description: form.value.description,
    sell_price: form.value.sell_price,
    image_url: finalImageUrl // ⭐️ แนบรูป (เก่าหรือใหม่) ไปบันทึกด้วย
  }

  const { error } = await updateProduct(route.params.id, payloadToUpdate)
  saving.value = false

  if (error) {
    alert('เกิดข้อผิดพลาดในการอัปเดต: ' + error.message)
  } else {
    alert('บันทึกการแก้ไขสำเร็จ!')
    navigateTo('/admin/products') 
  }
}
</script>

<style scoped>
@import '~/assets/css/admin-style.css';
</style>