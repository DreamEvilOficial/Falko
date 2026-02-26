import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartItem {
  id: string
  cartItemId?: string // Unique identifier for cart management (id + variants)
  nombre: string
  precio: number
  cantidad: number
  imagen_url?: string
  talle?: string
  color?: string
  stock?: number
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (cartItemId: string) => void
  updateQuantity: (cartItemId: string, cantidad: number) => void
  clearCart: () => void
  total: () => number
  coupon: any | null
  applyCoupon: (coupon: any) => void
  removeCoupon: () => void
  getDiscount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => set((state) => {
        // Generate a consistent unique key based on product content
        const generateKey = (i: CartItem) => `${i.id}-${i.talle || ''}-${i.color || ''}`
        const newItemKey = item.cartItemId || generateKey(item)
        
        const existingItemIndex = state.items.findIndex(i => {
           const key = i.cartItemId || generateKey(i)
           return key === newItemKey
        })
        
        if (existingItemIndex !== -1) {
          const newItems = [...state.items]
          newItems[existingItemIndex] = {
             ...newItems[existingItemIndex],
             cantidad: newItems[existingItemIndex].cantidad + item.cantidad
          }
          return { items: newItems }
        }
        
        // Ensure new item has the key
        return { items: [...state.items, { ...item, cartItemId: newItemKey }] }
      }),
      
      removeItem: (cartItemId) => set((state) => ({
        items: state.items.filter(i => (i.cartItemId || `${i.id}-${i.talle || ''}-${i.color || ''}`) !== cartItemId)
      })),
      
      updateQuantity: (cartItemId, cantidad) => set((state) => {
        if (cantidad <= 0) {
          return { items: state.items.filter(i => (i.cartItemId || `${i.id}-${i.talle || ''}-${i.color || ''}`) !== cartItemId) }
        }
        
        return {
          items: state.items.map(i =>
            (i.cartItemId || `${i.id}-${i.talle || ''}-${i.color || ''}`) === cartItemId ? { ...i, cantidad } : i
          )
        }
      }),
      
      clearCart: () => set({ items: [], coupon: null }),
      
      total: () => {
        const { items } = get()
        return items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0)
      },

      coupon: null,

      applyCoupon: (coupon) => set({ coupon }),

      removeCoupon: () => set({ coupon: null }),

      getDiscount: () => {
        const { items, coupon } = get()
        if (!coupon) return 0
        
        const subtotal = items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0)
        
        if (coupon.tipo === 'porcentaje') {
          return (subtotal * (coupon.valor / 100))
        } else if (coupon.tipo === 'fijo') {
          return coupon.valor
        }
        
        return 0
      }
    }),
    {
      name: 'cart-storage',
    }
  )
)
