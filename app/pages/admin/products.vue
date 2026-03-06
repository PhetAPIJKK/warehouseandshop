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
      <table class="product-table">
        <thead>
          <tr>
            <th>ชื่อสินค้า</th>
            <th>จำนวนคงเหลือ</th>
            <th>ราคาขาย</th>
            <th>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in products" :key="item.id">
            <td class="font-bold">{{ item.name }}</td>
            <td :class="{ 'stock-warning': item.stock_qty < 5 }">
              {{ item.stock_qty }} ชิ้น
            </td>
            <td>฿{{ item.sell_price.toLocaleString() }}</td>
            <td>
              <NuxtLink :to="`/admin/stock-${item.id}`" class="btn-edit">ปรับสต็อก</NuxtLink>,
              <NuxtLink :to="`/admin/editPd-${item.id}`" class="btn-edit">แก้ไข</NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
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
.products-container { padding: 1rem; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.title { font-size: 1.5rem; font-weight: 900; margin: 0; }
.subtitle { color: #64748b; margin-top: 4px; }
.btn-primary { background: #0f172a; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; }

.table-card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
.product-table { width: 100%; border-collapse: collapse; text-align: left; }
.product-table th { background: #f8fafc; padding: 1rem; color: #475569; border-bottom: 1px solid #e2e8f0; }
.product-table td { padding: 1rem; border-bottom: 1px solid #f1f5f9; }

/* Visual feedback */
.stock-warning { color: #ef4444; font-weight: 700; }
.btn-edit { color: #38bdf8; text-decoration: none; font-weight: 600; }
.btn-edit:hover { text-decoration: underline; }

.loading-state, .error-state, .empty-state { padding: 3rem; text-align: center; color: #64748b; background: white; border-radius: 8px; border: 1px dashed #cbd5e1; }
</style>