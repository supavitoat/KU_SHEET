/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { paymentsAPI } from '../services/api';

// Initial state
const initialState = {
  items: [],
  total: 0,
  itemCount: 0,
};

// Action types
const actionTypes = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  CLEAR_CART: 'CLEAR_CART',
  LOAD_CART: 'LOAD_CART',
};

// Helper function to calculate totals
const calculateTotals = (items) => {
  const total = items.reduce((sum, item) => {
    // ตรวจสอบว่า price เป็น number และไม่ใช่ NaN
    let price = 0;
    
    if (typeof item.price === 'number' && !isNaN(item.price)) {
      price = item.price;
    } else if (typeof item.price === 'string' && item.price !== '') {
      const parsed = parseFloat(item.price);
      price = isNaN(parsed) ? 0 : parsed;
    } else {
      price = 0;
    }
    
    return sum + price;
  }, 0);
  
  const itemCount = items.length;
  
  return { total, itemCount };
};

// Helper function to validate cart item
const validateCartItem = (item) => {
  return item && 
         typeof item.id !== 'undefined' && 
         typeof item.price === 'number';
};

// Reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.ADD_ITEM: {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      
      if (existingItem) {
        // ถ้ามีสินค้านี้อยู่แล้ว ให้แจ้งเตือนและไม่เพิ่ม
  return state;
      } else {
        // ถ้าไม่มี ให้เพิ่มสินค้าใหม่ (1 อันเท่านั้น)
        const updatedItems = [...state.items, action.payload];
        const { total, itemCount } = calculateTotals(updatedItems);
        
        // // ));
        
        return {
          ...state,
          items: updatedItems,
          total,
          itemCount,
        };
      }
    }
    
    case actionTypes.REMOVE_ITEM: {
      const updatedItems = state.items.filter(item => item.id !== action.payload);
      const { total, itemCount } = calculateTotals(updatedItems);
      
      return {
        ...state,
        items: updatedItems,
        total,
        itemCount,
      };
    }
    
    case actionTypes.CLEAR_CART:
      return {
        ...state,
        items: [],
        total: 0,
        itemCount: 0,
      };
    
    case actionTypes.LOAD_CART: {
      // Validate and clean the loaded data
      const loadedItems = action.payload.items || [];
      const validItems = loadedItems.filter(validateCartItem);
      
      // Recalculate totals to ensure consistency
      const { total, itemCount } = calculateTotals(validItems);
      
      return {
        ...state,
        items: validItems,
        total,
        itemCount,
      };
    }
    
    default:
      return state;
  }
};

// Helper function to get cart key for current user
const getCartKey = (userId) => {
  return userId ? `cart_${userId}` : 'cart_guest';
};

  // Create context
  const CartContext = createContext();
  
  // Expose clearCart function globally for OrderHistoryPage to use
  if (typeof window !== 'undefined') {
    window.clearCartFromContext = null;
  }

// Cart provider component
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [currentUserId, setCurrentUserId] = React.useState(null);
  const stateRef = React.useRef(state);
  const [discountInfo, setDiscountInfo] = useState({ code: '', amount: 0, meta: null });

  // Keep a ref of the latest cart state to safely read inside effects without adding state as dependency
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Load cart from localStorage on mount and when user changes
  // Intentionally only run on user change. Using state here is for snapshotting before switch.
  useEffect(() => {
    // Get current user from localStorage
    // The effect intentionally depends only on currentUserId to avoid feedback loops when state changes.
    const user = localStorage.getItem('user');
    let userId = null;
    
    if (user) {
      try {
        const userData = JSON.parse(user);
        userId = userData.id;
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    
    // If user changed, save current cart and load new user's cart
  if (currentUserId !== null && currentUserId !== userId && stateRef.current.items.length > 0) {
      const cartData = {
    items: stateRef.current.items,
    total: stateRef.current.total,
    itemCount: stateRef.current.itemCount,
      };
      const currentCartKey = getCartKey(currentUserId);
      localStorage.setItem(currentCartKey, JSON.stringify(cartData));
    }
    
    setCurrentUserId(userId);
    
    // If no user (guest), load guest cart
    if (!userId) {
      // Load guest cart
      const cartKey = getCartKey(null); // 'cart_guest'
      const savedCart = localStorage.getItem(cartKey);
      
      if (savedCart) {
        try {
          const cartData = JSON.parse(savedCart);
          if (cartData && typeof cartData === 'object') {
            dispatch({ type: actionTypes.LOAD_CART, payload: cartData });
          } else {
            dispatch({ type: actionTypes.CLEAR_CART });
          }
        } catch (error) {
          console.error('Error loading guest cart from localStorage:', error);
          dispatch({ type: actionTypes.CLEAR_CART });
        }
      } else {
        dispatch({ type: actionTypes.CLEAR_CART });
      }
      
      setIsLoaded(true);
      return;
    }
    
    // Load cart for current user
    const cartKey = getCartKey(userId);
    const savedCart = localStorage.getItem(cartKey);
    
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart);
        // // Validate cart data structure
        if (cartData && typeof cartData === 'object') {
          dispatch({ type: actionTypes.LOAD_CART, payload: cartData });
        } else {
          // Invalid cart data structure in localStorage, clearing...
          localStorage.removeItem(cartKey);
        }
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        localStorage.removeItem(cartKey);
      }
    } else {
      // Clear current cart state if no saved cart for this user
      dispatch({ type: actionTypes.CLEAR_CART });
    }
    
    setIsLoaded(true);
  }, [currentUserId]);

  // Listen for localStorage changes to detect user changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        // User changed, reload cart
        const user = e.newValue;
        let userId = null;
        
        if (user) {
          try {
            const userData = JSON.parse(user);
            userId = userData.id;
          } catch (error) {
            console.error('Error parsing user data:', error);
          }
        }
        
        if (userId !== currentUserId) {
          setCurrentUserId(userId);
          
          // If no user (guest), load guest cart
          if (!userId) {
            const cartKey = getCartKey(null); // 'cart_guest'
            const savedCart = localStorage.getItem(cartKey);
            
            if (savedCart) {
              try {
                const cartData = JSON.parse(savedCart);
                if (cartData && typeof cartData === 'object') {
                  dispatch({ type: actionTypes.LOAD_CART, payload: cartData });
                } else {
                  dispatch({ type: actionTypes.CLEAR_CART });
                }
              } catch (error) {
                console.error('Error loading guest cart:', error);
                dispatch({ type: actionTypes.CLEAR_CART });
              }
            } else {
              dispatch({ type: actionTypes.CLEAR_CART });
            }
            return;
          }
          
          // Load cart for new user
          const cartKey = getCartKey(userId);
          const savedCart = localStorage.getItem(cartKey);
          
          if (savedCart) {
            try {
              const cartData = JSON.parse(savedCart);
              
              if (cartData && typeof cartData === 'object') {
                dispatch({ type: actionTypes.LOAD_CART, payload: cartData });
              } else {
                dispatch({ type: actionTypes.CLEAR_CART });
              }
            } catch (error) {
              console.error('Error loading cart for new user:', error);
              dispatch({ type: actionTypes.CLEAR_CART });
            }
          } else {
            dispatch({ type: actionTypes.CLEAR_CART });
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentUserId]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isLoaded) return; // Don't save until initial load is complete
    
    const cartData = {
      items: state.items,
      total: state.total,
      itemCount: state.itemCount,
    };
    
    const cartKey = getCartKey(currentUserId);
    localStorage.setItem(cartKey, JSON.stringify(cartData));
  }, [state.items, state.total, state.itemCount, isLoaded, currentUserId]);

  // Invalidate discount if cart items change
  const itemsKey = React.useMemo(() => state.items.map(i => i.id).join(','), [state.items]);
  useEffect(() => {
    setDiscountInfo(prev => ({ ...prev, amount: 0, code: '', meta: null }));
  }, [itemsKey, state.total]);

  // Add item to cart
  const addToCart = (item) => {
    // ตรวจสอบว่าสินค้านี้มีอยู่ในตะกร้าแล้วหรือไม่
    const existingItem = state.items.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      // ยกเลิก toast notification เพื่อไม่ให้รบกวน UX
      // toast.error(`⚠️ "${item.title}" มีอยู่ในตระกร้าแล้ว`);
      return;
    }
    
    // ตรวจสอบและทำความสะอาดข้อมูลก่อนเพิ่ม
    let price = 0;
    
    if (typeof item.price === 'number') {
      price = item.price;
    } else if (typeof item.price === 'string') {
      price = parseFloat(item.price) || 0;
    } else {
      price = 0;
    }
    
    const cleanItem = {
      ...item,
      price: price,
      isFree: item.isFree || price === 0
    };
    
    // ลด console log เพื่อความชัดเจน
    dispatch({ type: actionTypes.ADD_ITEM, payload: cleanItem });
    
    // แสดง toast notification
    toast.success("เพิ่มชีทลงในตระกร้าแล้ว");
  };

  // Remove item from cart
  const removeFromCart = (itemId) => {
    const item = state.items.find(item => item.id === itemId);
    dispatch({ type: actionTypes.REMOVE_ITEM, payload: itemId });
    if (item) {
      // แสดง toast notification
      toast.success("ลบชีทออกจากตระกร้าแล้ว");
    }
  };

  // Clear cart
  const clearCart = () => {
    dispatch({ type: actionTypes.CLEAR_CART });
    // ยกเลิก toast ล้างตะกร้าเพื่อไม่ให้รบกวน UX กรณีได้ชีทฟรี
    
    // ล้างตระกร้าใน localStorage ด้วย
    const cartKey = getCartKey(currentUserId);
    localStorage.removeItem(cartKey);
  setDiscountInfo({ code: '', amount: 0, meta: null });
  };

  // Clear cart for specific user (used when logging out or changing user)
  const clearCartForUser = (userId) => {
    const cartKey = getCartKey(userId);
    localStorage.removeItem(cartKey);
  };

  // Change user and load their cart
  const changeUser = (userId) => {
    // Save current cart before changing user
    if (state.items.length > 0) {
      const cartData = {
        items: state.items,
        total: state.total,
        itemCount: state.itemCount,
      };
      const currentCartKey = getCartKey(currentUserId);
      localStorage.setItem(currentCartKey, JSON.stringify(cartData));
    }
    
    // Update current user ID
    setCurrentUserId(userId);
    
    // Load cart for new user (or guest)
    const cartKey = getCartKey(userId);
    const savedCart = localStorage.getItem(cartKey);
    
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart);
        if (cartData && typeof cartData === 'object') {
          dispatch({ type: actionTypes.LOAD_CART, payload: cartData });
        } else {
          dispatch({ type: actionTypes.CLEAR_CART });
        }
      } catch (error) {
        console.error('Error loading cart for new user:', error);
        dispatch({ type: actionTypes.CLEAR_CART });
      }
    } else {
      // Clear cart if no saved cart for new user
      dispatch({ type: actionTypes.CLEAR_CART });
    }
  };

  // Get cart item count
  const getCartCount = () => state.itemCount;

  // Get cart total
  const getCartTotal = () => state.total;

  // Check if cart is empty
  const isCartEmpty = () => state.items.length === 0;

  // Get cart items
  const getCartItems = () => state.items;

  // Check if item is in cart
  const isInCart = (itemId) => {
    return state.items.some(item => item.id === itemId);
  };

  // Calculate discount (ตัวอย่าง: ส่วนลด 10% เมื่อซื้อมากกว่า 500 บาท)
  const getDiscount = () => {
  return Math.max(0, Number(discountInfo.amount) || 0);
  };

  // Get final total after discount
  const getFinalTotal = () => {
    return Math.max(0, state.total - getDiscount());
  };

  // Apply discount by calling backend validation
  const applyDiscount = async (code) => {
    const trimmed = (code || '').trim();
    if (!trimmed) { toast.error('กรุณากรอกโค้ดส่วนลด'); return { success: false }; }
    if (state.items.length === 0) { toast.error('ไม่มีรายการในตะกร้า'); return { success: false }; }
    try {
      const payload = { code: trimmed, items: state.items.map(i => ({ id: i.id, quantity: i.quantity || 1 })) };
      const { data } = await paymentsAPI.validateDiscount(payload);
      if (data?.success) {
        setDiscountInfo({ code: data.data.code, amount: data.data.amount, meta: data.data });
        toast.success(`ใช้โค้ด ${data.data.code} สำเร็จ`);
        return { success: true, data: data.data };
      }
      toast.error(data?.message || 'โค้ดไม่ถูกต้อง');
      return { success: false };
    } catch (e) {
      const msg = e?.response?.data?.message || 'โค้ดไม่สามารถใช้งานได้';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const clearDiscount = () => setDiscountInfo({ code: '', amount: 0, meta: null });

  const value = {
    items: state.items,
    total: state.total,
    itemCount: state.itemCount,
    addToCart,
    removeFromCart,
    clearCart,
    clearCartForUser,
    changeUser,
    getCartCount,
    getCartTotal,
    isCartEmpty,
    getCartItems,
    isInCart,
    getDiscount,
    getFinalTotal,
  discountInfo,
  applyDiscount,
  clearDiscount,
  };
  
  // Expose clearCart function globally
  if (typeof window !== 'undefined') {
    window.clearCartFromContext = clearCart;
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
