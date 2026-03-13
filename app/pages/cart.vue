<template>
    <div class="cart-container">
        <h1 class="title">🛒 ตะกร้าสินค้าของคุณ</h1>

        <div v-if="cart.length === 0" class="empty-cart">
            <div class="empty-icon">🛍️</div>
            <h2>ยังไม่มีสินค้าในตะกร้า</h2>
            <p class="text-muted">ลองเลือกดูสินค้าที่น่าสนใจในร้านของเราสิครับ</p>
            <NuxtLink to="/" class="btn-primary" style="display: inline-block; margin-top: 1rem;">
                ไปเลือกซื้อสินค้าเลย
            </NuxtLink>
        </div>

        <div v-else class="cart-content">

            <div class="cart-items">
                <div v-for="item in cart" :key="item.product_id" class="cart-item-card">

                    <img v-if="item.image_url" :src="item.image_url" class="item-image" />
                    <div v-else class="no-image">ไม่มีรูป</div>

                    <div class="item-details">
                        <h3 class="item-name">{{ item.name }}</h3>
                        <p class="item-price">฿{{ item.price.toLocaleString() }} / ชิ้น</p>
                    </div>

                    <div class="qty-controls">
                        <button @click="updateQty(item.product_id, item.qty - 1)" class="btn-qty">-</button>
                        <span class="qty-number">{{ item.qty }}</span>
                        <button @click="updateQty(item.product_id, item.qty + 1)" class="btn-qty"
                            :disabled="item.qty >= item.max_stock">+</button>
                    </div>

                    <div class="item-total">
                        ฿{{ item.total_price.toLocaleString() }}
                    </div>

                    <button @click="removeFromCart(item.product_id)" class="btn-remove" title="ลบสินค้านี้">
                        🗑️
                    </button>
                </div>
            </div>

            <div class="cart-summary-card">
                <h3>สรุปคำสั่งซื้อ</h3>
                <div class="summary-row">
                    <span>จำนวนสินค้าทั้งหมด</span>
                    <span>{{ cartItemCount }} ชิ้น</span>
                </div>
                <div class="summary-row total-row">
                    <span>ยอดรวมทั้งสิ้น</span>
                    <span class="total-price">฿{{ cartTotal.toLocaleString() }}</span>
                </div>

                <div class="payment-method-section"
                    style="margin: 1.5rem 0; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
                    <h4 style="margin-top: 0; margin-bottom: 0.5rem; color: #1e293b;">ช่องทางการชำระเงิน</h4>

                    <label style="display: block; margin-bottom: 0.5rem; cursor: pointer;">
                        <input type="radio" v-model="paymentMethod" value="bank_transfer" />
                        โอนเงินผ่านบัญชีธนาคาร
                    </label>

                    <label style="display: block; cursor: pointer;">
                        <input type="radio" v-model="paymentMethod" value="promptpay" />
                        พร้อมเพย์ (PromptPay)
                    </label>
                </div>

                <button @click="handleCheckout" class="btn-checkout" :disabled="isCheckingOut">
                    💳 {{ isCheckingOut ? 'กำลังบันทึก...' : 'ยืนยันและดำเนินการชำระเงิน' }}
                </button>
            </div>

        </div>
    </div>
</template>

<script setup>
definePageMeta({ layout: 'default' })

// ✅ รวมการดึงค่าจาก useCart() ไว้ในที่เดียว เพื่อป้องกัน Error ประกาศตัวแปรซ้ำ
const { 
  cart, 
  updateQty, 
  removeFromCart, 
  cartTotal, 
  cartItemCount, 
  processCheckout 
} = useCart()

const paymentMethod = ref('bank_transfer')
const isCheckingOut = ref(false)

const handleCheckout = async () => {
    // ป้องกันการกดซ้ำ
    if (isCheckingOut.value) return

    // ตรวจสอบยอดรวม (เข้าถึงค่าด้วย .value เสมอใน script setup)
    const total = cartTotal.value || 0
    const confirmCheckout = confirm(`ยืนยันคำสั่งซื้อยอดรวม ฿${total.toLocaleString()} ใช่หรือไม่?`)
    if (!confirmCheckout) return

    isCheckingOut.value = true

    try {
        // ส่งวิธีชำระเงินไปให้ฟังก์ชันใน useCart
        const { error, data: order } = await processCheckout(paymentMethod.value)

        if (error) {
            alert('เกิดข้อผิดพลาดในการสั่งซื้อ: ' + error.message)
        } else if (order && order.id) {
            // สำเร็จแล้ว เด้งไปหน้าอัปโหลดสลิป พร้อมแนบ ID บิล
            navigateTo(`/payment/${order.id}`)
        }
    } catch (err) {
        console.error(err)
        alert('เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง')
    } finally {
        isCheckingOut.value = false
    }
}
</script>
<style scoped>
.cart-container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 2rem;
}

.title {
    font-size: 1.8rem;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 2rem;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 1rem;
}

/* Empty State */
.empty-cart {
    text-align: center;
    padding: 4rem 2rem;
    background: white;
    border-radius: 12px;
    border: 1px dashed #cbd5e1;
}

.empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
}

.text-muted {
    color: #64748b;
}

/* Layout Grid */
.cart-content {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 2rem;
    align-items: start;
}

@media (max-width: 768px) {
    .cart-content {
        grid-template-columns: 1fr;
    }
}

/* Items List */
.cart-items {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.cart-item-card {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

@media (max-width: 640px) {
    .cart-item-card {
        flex-wrap: wrap;
    }

    .item-total {
        width: 100%;
        text-align: right;
    }
}

.item-image {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}

.no-image {
    width: 80px;
    height: 80px;
    background: #f1f5f9;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    color: #94a3b8;
}

.item-details {
    flex-grow: 1;
}

.item-name {
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
    color: #1e293b;
}

.item-price {
    margin: 0;
    color: #64748b;
    font-size: 0.95rem;
}

/* Qty Controls */
.qty-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 0.25rem;
}

.btn-qty {
    width: 32px;
    height: 32px;
    border: none;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.btn-qty:hover:not(:disabled) {
    background: #e2e8f0;
}

.btn-qty:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.qty-number {
    min-width: 30px;
    text-align: center;
    font-weight: 600;
}

.item-total {
    font-weight: bold;
    color: #3b82f6;
    font-size: 1.2rem;
    min-width: 100px;
    text-align: right;
}

.btn-remove {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    opacity: 0.5;
    transition: opacity 0.2s;
    padding: 0.5rem;
}

.btn-remove:hover {
    opacity: 1;
    transform: scale(1.1);
}

/* Summary Card */
.cart-summary-card {
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    position: sticky;
    top: 2rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.cart-summary-card h3 {
    margin-top: 0;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 1rem;
    color: #1e293b;
}

.summary-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1rem;
    color: #475569;
}

.total-row {
    border-top: 1px solid #e2e8f0;
    padding-top: 1rem;
    margin-top: 1rem;
    align-items: center;
}

.total-price {
    font-size: 1.5rem;
    font-weight: 800;
    color: #0f172a;
}

.btn-checkout {
    width: 100%;
    background: #10b981;
    color: white;
    border: none;
    padding: 1rem;
    border-radius: 8px;
    font-weight: bold;
    font-size: 1.1rem;
    cursor: pointer;
    margin-top: 1rem;
    transition: background 0.2s;
}

.btn-checkout:hover {
    background: #059669;
}
</style>