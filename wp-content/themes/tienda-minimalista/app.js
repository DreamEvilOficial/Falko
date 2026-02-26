// === CART MANAGEMENT ===
let cart = JSON.parse(localStorage.getItem("tienda_cart")) || [];

// === THEME MANAGEMENT ===
function initTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  const themeIcon = document.querySelector(".theme-icon");
  if (themeIcon) {
    themeIcon.textContent = theme === "light" ? "🌙" : "☀️";
  }
}

// === SETTINGS MANAGEMENT ===
function loadSettings() {
  const storeName = localStorage.getItem("store_name") || "Mi Tienda";
  const faviconUrl =
    localStorage.getItem("favicon_url") ||
    "wp-content/themes/tienda-minimalista/favicon.png";

  // Update store name
  const logoElements = document.querySelectorAll("#site-logo");
  logoElements.forEach((el) => (el.textContent = storeName));

  // Update page title
  document.getElementById("page-title").textContent = storeName;

  // Update favicon
  document.getElementById("favicon-link").href = faviconUrl;
}

function openSettings() {
  const modal = document.getElementById("settings-modal");
  const storeNameInput = document.getElementById("store-name-input");
  const faviconInput = document.getElementById("favicon-input");

  // Load current values
  storeNameInput.value = localStorage.getItem("store_name") || "Mi Tienda";
  faviconInput.value = localStorage.getItem("favicon_url") || "";

  modal.classList.add("active");
  modal.style.display = "flex";
}

function closeSettings() {
  const modal = document.getElementById("settings-modal");
  modal.classList.remove("active");
  modal.style.display = "none";
}

function saveSettings() {
  const storeName = document.getElementById("store-name-input").value.trim();
  const faviconUrl = document.getElementById("favicon-input").value.trim();

  if (storeName) {
    localStorage.setItem("store_name", storeName);
  }

  if (faviconUrl) {
    localStorage.setItem("favicon_url", faviconUrl);
  }

  loadSettings();
  closeSettings();
  showNotification("✅ Configuración guardada correctamente");
}

// === CART FUNCTIONS ===
function updateCartUI() {
  const cartCount = document.getElementById("cart-count");
  const cartItems = document.getElementById("cart-items");
  const cartTotal = document.getElementById("cart-total");

  // Update counter
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = totalItems;
  cartCount.style.display = totalItems > 0 ? "flex" : "none";

  // Update list
  if (cart.length === 0) {
    cartItems.innerHTML =
      '<p style="text-align: center; padding: 2rem; opacity: 0.6;">El carrito está vacío</p>';
    cartTotal.textContent = "$0.00";
    return;
  }

  let html = "";
  let total = 0;

  cart.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    html += `
            <div class="cart-item">
                <div class="cart-item-emoji">${item.icon}</div>
                <div class="cart-item-info">
                    <h4>${item.title}</h4>
                    <p>$${item.price.toLocaleString()}</p>
                </div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="updateQuantity(${index}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${index}, 1)">+</button>
                </div>
                <button class="remove-btn" onclick="removeFromCart(${index})">🗑️</button>
            </div>
        `;
  });

  cartItems.innerHTML = html;
  cartTotal.textContent = "$" + total.toLocaleString();
}

function addProductToCart(id, title, price, icon) {
  const existingItem = cart.find((item) => item.id === id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ id, title, price, icon, quantity: 1 });
  }

  localStorage.setItem("tienda_cart", JSON.stringify(cart));
  updateCartUI();
  showNotification("✅ Producto agregado al carrito");
}

function updateQuantity(index, change) {
  cart[index].quantity += change;
  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }
  localStorage.setItem("tienda_cart", JSON.stringify(cart));
  updateCartUI();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  localStorage.setItem("tienda_cart", JSON.stringify(cart));
  updateCartUI();
  showNotification("🗑️ Producto eliminado del carrito");
}

function showNotification(message) {
  const notification = document.createElement("div");
  notification.textContent = message;
  notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: var(--accent-color);
        color: var(--bg-primary);
        padding: 1rem 1.5rem;
        border-radius: 12px;
        z-index: 10001;
        font-weight: 600;
        box-shadow: var(--shadow-lg);
        animation: slideIn 0.3s ease;
    `;
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transform = "translateX(400px)";
    notification.style.transition = "all 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// === EVENT LISTENERS ===
document.addEventListener("DOMContentLoaded", () => {
  // Initialize theme
  initTheme();

  // Load settings
  loadSettings();

  // Initialize cart
  updateCartUI();

  // Theme toggle
  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }

  // Cart toggle
  const cartToggle = document.getElementById("cart-toggle");
  const miniCart = document.getElementById("mini-cart");
  const closeCart = document.getElementById("close-cart");

  if (cartToggle) {
    cartToggle.addEventListener("click", () => {
      miniCart.classList.add("active");
      miniCart.style.display = "flex";
    });
  }

  if (closeCart) {
    closeCart.addEventListener("click", () => {
      miniCart.classList.remove("active");
      miniCart.style.display = "none";
    });
  }

  if (miniCart) {
    miniCart.addEventListener("click", (e) => {
      if (e.target.id === "mini-cart") {
        miniCart.classList.remove("active");
        miniCart.style.display = "none";
      }
    });
  }

  // Checkout button
  const checkoutBtn = document.getElementById("checkout-btn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      if (cart.length === 0) {
        showNotification("⚠️ El carrito está vacío");
        return;
      }
      const total = cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      showNotification("💳 Redirigiendo a MercadoPago...");
      setTimeout(() => {
        alert(
          `En producción, esto te redigiría a MercadoPago para completar el pago.\n\nTotal a pagar: $${total.toLocaleString()}`
        );
      }, 1000);
    });
  }

  // Settings modal - close on outside click
  const settingsModal = document.getElementById("settings-modal");
  if (settingsModal) {
    settingsModal.addEventListener("click", (e) => {
      if (e.target.id === "settings-modal") {
        closeSettings();
      }
    });
  }

  // Scroll animations
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("fade-in-up");
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll(".product-card, .glass-card").forEach((el) => {
    observer.observe(el);
  });

  // Fire effect for hot products
  const hotProducts = document.querySelectorAll(".hot-product");
  hotProducts.forEach((product) => {
    product.addEventListener("mouseenter", () => {
      const fireEffect = product.querySelector(".fire-effect");
      if (fireEffect) {
        fireEffect.style.opacity = "1";
      }
    });

    product.addEventListener("mouseleave", () => {
      const fireEffect = product.querySelector(".fire-effect");
      if (fireEffect) {
        fireEffect.style.opacity = "0";
      }
    });
  });
});

// === KEYBOARD SHORTCUTS ===
document.addEventListener("keydown", (e) => {
  // ESC to close modals
  if (e.key === "Escape") {
    closeSettings();
    const miniCart = document.getElementById("mini-cart");
    if (miniCart && miniCart.classList.contains("active")) {
      miniCart.classList.remove("active");
      miniCart.style.display = "none";
    }
  }

  // Ctrl/Cmd + K to open settings
  if ((e.ctrlKey || e.metaKey) && e.key === "k") {
    e.preventDefault();
    openSettings();
  }

  // Ctrl/Cmd + D to toggle theme
  if ((e.ctrlKey || e.metaKey) && e.key === "d") {
    e.preventDefault();
    toggleTheme();
  }
});
