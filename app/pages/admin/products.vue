<template>
  <div class="products-container">
    <header class="page-header">
      <div>
        <h1 class="title">📦 จัดการสินค้า</h1>
        <p class="subtitle">แสดงรายการสินค้าทั้งหมดในโกดัง</p>
      </div>
      <NuxtLink to="/admin/addPd" class="btn-primary">+ เพิ่มสินค้าใหม่</NuxtLink>
    </header>

    <div v-if="pending" class="loading-state">
      กำลังโหลดข้อมูลสินค้า...
    </div>

    <div v-else-if="error" class="error-state">
      เกิดข้อผิดพลาดในการโหลดข้อมูล: {{ error.message }}
    </div>

    <div v-else-if="!products || products.length === 0" class="empty-state">
      ยังไม่มีสินค้าในระบบ ลองเพิ่มสินค้าใหม่ดูครับ
    </div>

    <div v-else class="table-card">
      <div class="table-responsive"> <table class="data-table"> <thead>
            <tr>
              <th style="width: 70px;">รูปภาพ</th>
              <th>SKU</th>
              <th>ชื่อสินค้า</th>
              <th class="text-right">จำนวนคงเหลือ</th> <th class="text-right">ราคาขาย</th>
              <th class="text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in products" :key="item.id">
              <td>
                <img 
                  v-if="item.image_url" 
                  :src="item.image_url" 
                  alt="Product Image" 
                  style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0;"
                />
                <div v-else style="width: 50px; height: 50px; background: #f1f5f9; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; color: #94a3b8;">
                  ไม่มีรูป
                </div>
              </td>
              
              <td>{{ item.sku || '-' }}</td>
              <td class="font-bold">{{ item.name }}</td>
              
              <td class="text-right" :class="{ 'stock-warning': item.stock_qty < 5 }">
                {{ item.stock_qty || 0 }} ชิ้น
              </td>
              
              <td class="text-right">฿{{ item.sell_price ? item.sell_price.toLocaleString() : '0' }}</td>
              
              <td class="text-center">
                <NuxtLink :to="`/admin/stock-${item.id}`" class="btn-edit" style="margin-right: 12px;">ปรับสต็อก</NuxtLink>
                <NuxtLink :to="`/admin/editPd-${item.id}`" class="btn-edit">แก้ไข</NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin', 
  middleware: 'admin'
})

const { getInventoryData } = useInventory()

const { data: products, pending, error } = await getInventoryData()
</script>

<style scoped>
/* หมายเหตุ: ถ้าคุณนำ @import นี้ไปใส่ในไฟล์ app/layouts/admin.vue ตามที่เราคุยกันแล้ว 
  คุณสามารถลบแท็ก <style scoped> ด้านล่างนี้ทิ้งได้เลยครับ แต่ถ้ายังไม่ได้ย้าย ก็ปล่อยไว้แบบนี้ได้ครับ 
*/
@import '~/assets/css/admin-style.css';
</style>