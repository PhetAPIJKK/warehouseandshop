<script setup>
definePageMeta({ layout: 'admin', middleware: 'admin' })
const { addProduct, getCategories } = useInventory()

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

const save = async () => {
  loading.value = true
  const { error } = await addProduct(form.value)
  loading.value = false
  
  if (error) return alert('Error: ' + error.message)
  alert('เพิ่มสินค้าสำเร็จ!')
  navigateTo('/admin/products')
}
</script>

<template>
  <div class="form-card">
    <h1>เพิ่มสินค้าใหม่</h1>
    <input v-model="form.sku" placeholder="SKU (รหัสสินค้า)" class="input-field" />
    <input v-model="form.name" placeholder="ชื่อสินค้า" class="input-field" />
    
    <select v-model="form.category_id" class="input-field">
      <option value="">เลือกหมวดหมู่</option>
      <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
    </select>

    <textarea v-model="form.description" placeholder="คำอธิบายสินค้า" class="input-field"></textarea>
    <input v-model.number="form.stock_qty" type="number" placeholder="จำนวนคงเหลือ" class="input-field" />
    <input v-model.number="form.sell_price" type="number" placeholder="ราคาขาย" class="input-field" />
    
    <button @click="save" :disabled="loading" class="btn-primary">
      {{ loading ? 'กำลังบันทึก...' : 'บันทึก' }}
    </button>
  </div>
</template>