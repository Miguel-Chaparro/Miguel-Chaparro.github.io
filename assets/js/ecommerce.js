const API_BASE_URL = 'https://billing.dommatos.com/api/public';

// State
let cart = JSON.parse(localStorage.getItem('dommatos_cart')) || [];
let products = [];
let currentPage = 1;

// DOM Elements
const cartCountBadge = document.getElementById('cart-count');
const carouselContainer = document.getElementById('categories-carousel');
const productsGrid = document.getElementById('products-grid');
const cartItemsContainer = document.getElementById('cart-items-container');

// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();

    // Check which page we are on
    if (document.getElementById('categories-carousel')) {
        initHome();
    }

    if (document.getElementById('products-grid')) {
        initStore();
    }

    if (document.getElementById('cart-items-container')) {
        initCart();
    }
});

async function initHome() {
    const categories = await fetchCategories();
    renderCarousel(categories);
}

async function initStore() {
    await fetchProducts();
}

function initCart() {
    renderCart();

    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckout);
    }
}

// --- API Calls ---

async function fetchCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categorias`);
        const result = await response.json();
        if (result.success) {
            return result.data;
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
    return [];
}

async function fetchProducts(page = 1) {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const categoryId = urlParams.get('category'); // From our own links

        let apiUrl = `${API_BASE_URL}/productos?page=${page}&limit=50`;

        // Map 'category' param to 'categoria_id' API param requested by user
        if (categoryId) {
            apiUrl += `&categoria_id=${categoryId}`;
        }

        // Pass through other potential filters if they exist in URL matching API params
        // User mentioned: nombre, marca, modelo, sku, codigo_barras
        const allowedFilters = ['nombre', 'marca', 'modelo', 'sku', 'codigo_barras', 'categoria_id'];
        allowedFilters.forEach(param => {
            // Avoid duplicating if we already mapped category -> categoria_id
            if (param === 'categoria_id' && categoryId) return;

            const value = urlParams.get(param);
            if (value) {
                apiUrl += `&${param}=${encodeURIComponent(value)}`;
            }
        });

        const response = await fetch(apiUrl);
        const result = await response.json();
        if (result.success) {
            products = result.data; // Store for local filtering if needed
            renderProductGrid(result.data);
            renderPagination(result.pagination);

            // Show active filter feedback if applicable
            if (categoryId || urlParams.toString()) {
                const header = document.querySelector('.layout-content-container h2') || document.querySelector('h1');
                if (header && !document.getElementById('filter-feedback')) {
                    const filterMsg = document.createElement('p');
                    filterMsg.id = 'filter-feedback';
                    filterMsg.className = 'text-primary text-sm font-bold mt-2 animate-fade-in';
                    filterMsg.innerHTML = `Filtrando por: ${categoryId ? 'Categoría' : 'Filtros activos'} <a href="productos.html" class="text-white hover:underline font-normal ml-2">(Limpiar filtros)</a>`;
                    header.parentElement.appendChild(filterMsg);
                }
            }
        }
    } catch (error) {
        console.error('Error loading products:', error);
        if (productsGrid) {
            productsGrid.innerHTML = '<div class="col-span-full text-center text-text-secondary py-10">No se pudieron cargar los productos. Por favor intente más tarde.</div>';
        }
    }
}

// --- Rendering ---

function renderCarousel(categories) {
    if (!carouselContainer || categories.length === 0) return;

    carouselContainer.innerHTML = categories.map(cat => `
        <div class="carousel-item min-w-[200px] md:min-w-[250px] p-4 snap-start">
            <div class="bg-surface-dark border border-surface-border rounded-xl p-6 flex flex-col gap-4 items-center text-center hover:border-primary/50 transition-colors h-full">
                <div class="h-16 w-16 rounded-full bg-surface-border/30 flex items-center justify-center text-primary">
                     <span class="material-symbols-outlined text-3xl">category</span>
                </div>
                <h3 class="text-white font-bold text-lg">${cat.nombre}</h3>
                <p class="text-text-secondary text-sm line-clamp-2">${cat.descripcion}</p>
                <a href="productos.html?category=${cat.id}" class="text-primary text-sm font-bold hover:underline mt-auto">Ver Productos</a>
            </div>
        </div>
    `).join('');
}

function renderProductGrid(productsList) {
    if (!productsGrid) return;

    if (productsList.length === 0) {
        productsGrid.innerHTML = '<p class="text-text-secondary text-center col-span-full">No se encontraron productos.</p>';
        return;
    }

    productsGrid.innerHTML = productsList.map(product => `
        <div class="bg-surface-dark border border-surface-border rounded-xl overflow-hidden hover:border-primary/50 transition-colors flex flex-col">
            <div class="h-48 bg-surface-border/50 bg-cover bg-center" style="background-image: url('${product.foto_url || 'assets/images/placeholder.png'}');">
                ${!product.foto_url ? '<div class="h-full w-full flex items-center justify-center text-text-secondary"><span class="material-symbols-outlined text-4xl">image_not_supported</span></div>' : ''}
            </div>
            <div class="p-6 flex flex-col gap-3 flex-1">
                <div class="flex justify-between items-start">
                    <span class="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded uppercase">${product.categoria_nombre || 'Producto'}</span>
                    <span class="text-text-secondary text-xs">${product.marca}</span>
                </div>
                <h3 class="cursor-pointer text-white font-bold text-lg leading-tight line-clamp-2 hover:text-primary transition-colors" title="${product.nombre}" onclick="openProductModal(${product.id})">
                    ${product.nombre}
                </h3>
                <p class="text-text-secondary text-sm line-clamp-2">${product.descripcion}</p>
                
                <div class="mt-auto pt-4 flex items-center justify-between border-t border-surface-border/50">
                    <span class="text-white font-bold text-xl">$${(product.precio_venta_base || 0).toLocaleString('es-CO')}</span>
                    <button onclick="openProductModal(${product.id})" class="h-10 w-10 rounded-full bg-surface-dark border border-primary text-primary flex items-center justify-center hover:bg-primary hover:text-slate-900 transition-all shadow-lg shadow-primary/10" title="Ver Detalle y Agregar">
                        <span class="material-symbols-outlined text-xl">add_shopping_cart</span>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function renderPagination(pagination) {
    const container = document.getElementById('pagination');
    if (!container || !pagination) return;

    let html = '';

    if (pagination.hasPrevPage) {
        html += `<button onclick="fetchProducts(${pagination.page - 1})" class="px-4 py-2 rounded-lg border border-surface-border text-white hover:bg-surface-border">Anterior</button>`;
    }

    html += `<span class="text-text-secondary px-4">Página ${pagination.page} de ${pagination.totalPages}</span>`;

    if (pagination.hasNextPage) {
        html += `<button onclick="fetchProducts(${pagination.page + 1})" class="px-4 py-2 rounded-lg border border-surface-border text-white hover:bg-surface-border">Siguiente</button>`;
    }

    container.innerHTML = html;
}

function renderCart() {
    if (!cartItemsContainer) return;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="bg-surface-dark border border-surface-border rounded-xl p-8 text-center">
                <span class="material-symbols-outlined text-4xl text-text-secondary mb-4">shopping_cart_off</span>
                <p class="text-text-secondary">Tu carrito está vacío.</p>
                <a href="productos.html" class="inline-block mt-4 text-primary font-bold hover:underline">Ir a la Tienda</a>
            </div>
        `;
        document.getElementById('checkout-btn').disabled = true;
        document.getElementById('cart-total').textContent = '$0';
        return;
    }

    let total = 0;

    cartItemsContainer.innerHTML = cart.map(item => {
        // Parse price: remove dots (thousands separator) and then parse to float
        let price = item.price;
        if (typeof item.price === 'string') {
            // Remove dots and replace comma with dot if present (though usually just integers in this context)
            // Assuming format "2.500.000" -> "2500000"
            price = parseFloat(item.price.replace(/\./g, '').replace(',', '.'));
        }

        const subtotal = price * item.quantity;
        total += subtotal;

        return `
        <div class="bg-surface-dark border border-surface-border rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center">
             <div class="h-20 w-20 bg-surface-border/50 rounded-lg bg-cover bg-center shrink-0" style="background-image: url('${item.image || 'assets/images/placeholder.png'}');"></div>
             
             <div class="flex-1 text-center sm:text-left">
                 <h3 class="text-white font-bold text-lg">${item.name}</h3>
                 <p class="text-primary font-bold">$${(price || 0).toLocaleString('es-CO')}</p>
             </div>
             
             <div class="flex items-center gap-3 bg-background-dark border border-surface-border rounded-lg px-2 py-1">
                 <button onclick="updateQuantity(${item.id}, -1)" class="text-text-secondary hover:text-white px-2">-</button>
                 <span class="text-white font-bold w-4 text-center">${item.quantity}</span>
                 <button onclick="updateQuantity(${item.id}, 1)" class="text-text-secondary hover:text-white px-2">+</button>
             </div>
             
             <div class="flex flex-col items-end gap-2">
                 <span class="text-white font-bold">$${(subtotal || 0).toLocaleString('es-CO')}</span>
                 <button onclick="removeFromCart(${item.id})" class="text-red-500 hover:text-red-400 text-sm flex items-center gap-1">
                     <span class="material-symbols-outlined text-sm">delete</span> Eliminar
                 </button>
             </div>
        </div>
        `;
    }).join('');

    document.getElementById('cart-total').textContent = `$${total.toLocaleString('es-CO')}`;
    document.getElementById('checkout-btn').disabled = false;
}

// --- Cart Logic ---

// --- Modal Logic ---

let currentModalProductId = null;

function openProductModal(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    currentModalProductId = productId;

    // Populate Modal Data
    document.getElementById('modal-image').src = product.foto_url || 'assets/images/placeholder.png';
    document.getElementById('modal-image-placeholder').style.display = product.foto_url ? 'none' : 'flex';
    document.getElementById('modal-category').textContent = product.categoria_nombre || 'Producto';
    document.getElementById('modal-brand').textContent = product.marca || '';
    document.getElementById('modal-title').textContent = product.nombre;
    document.getElementById('modal-sku').textContent = `SKU: ${product.sku || 'N/A'}`;
    document.getElementById('modal-description').textContent = product.descripcion || 'Sin descripción disponible.';
    document.getElementById('modal-price').textContent = `$${product.precio_venta_base.toLocaleString('es-CO')}`;
    document.getElementById('modal-quantity').value = 1;

    // Show Modal
    const modal = document.getElementById('product-modal');
    modal.classList.remove('hidden');
    setTimeout(() => {
        document.getElementById('modal-backdrop').classList.remove('opacity-0');
        document.getElementById('modal-panel').classList.remove('opacity-0', 'scale-95');
    }, 10);

    // Update Add Button Action
    const addBtn = document.getElementById('modal-add-btn');
    addBtn.onclick = () => {
        const qty = parseInt(document.getElementById('modal-quantity').value) || 1;
        addToCart(product.id, qty);
        closeProductModal();
    };
}

function closeProductModal() {
    const backdrop = document.getElementById('modal-backdrop');
    const panel = document.getElementById('modal-panel');

    if (backdrop && panel) {
        backdrop.classList.add('opacity-0');
        panel.classList.add('opacity-0', 'scale-95');

        setTimeout(() => {
            document.getElementById('product-modal').classList.add('hidden');
            currentModalProductId = null;
        }, 300);
    }
}

function updateModalQuantity(change) {
    const input = document.getElementById('modal-quantity');
    let val = parseInt(input.value) || 1;
    val += change;
    if (val < 1) val = 1;
    if (val > 99) val = 99;
    input.value = val;
}

// Close modal on backdrop click
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeProductModal();
});
if (document.getElementById('product-modal')) {
    // We need to wait for DOM or checking existence
    // But easier to add onclick to backdrop in HTML, or add listener here if element exists
}

// --- Cart Logic ---

function addToCart(productId, quantity = 1) {
    const product = products.find(p => p.id === productId);
    if (!product) {
        console.warn('Product not found in local cache');
        return;
    }

    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            name: product.nombre,
            price: product.precio_venta_base,
            image: product.foto_url,
            quantity: quantity
        });
    }

    saveCart();
    updateCartUI();
    showToast(`Agregado: ${product.nombre} (${quantity})`);
}

function updateQuantity(productId, change) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;

    item.quantity += change;

    if (item.quantity <= 0) {
        removeFromCart(productId);
        return;
    }

    saveCart();
    updateCartUI(); // Update badges
    renderCart(); // Update page
}

function removeFromCart(productId) {
    cart = cart.filter(i => i.id !== productId);
    saveCart();
    updateCartUI();
    renderCart();
}

function saveCart() {
    localStorage.setItem('dommatos_cart', JSON.stringify(cart));
}

function updateCartUI() {
    // Determine total count
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Update all badge instances (desktop/mobile)
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(badge => {
        badge.textContent = totalCount;
        badge.classList.toggle('hidden', totalCount === 0);
    });
}

function showToast(message) {
    // Simple toast implementation
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface-dark border border-primary text-white px-6 py-3 rounded-full shadow-2xl z-50 animate-fade-in flex items-center gap-3';
    toast.innerHTML = `<span class="material-symbols-outlined text-primary">check_circle</span> <span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// --- Checkout Logic ---

async function handleCheckout(e) {
    e.preventDefault();

    const btn = document.getElementById('checkout-btn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="animate-spin h-5 w-5 border-2 border-slate-900 border-t-transparent rounded-full mr-2"></span> Enviando...';

    const formData = {
        prospecto_nombre: document.getElementById('nombre').value,
        prospecto_email: document.getElementById('email').value,
        prospecto_telefono: document.getElementById('telefono').value,
        fecha_vencimiento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days validity
        notas_cliente: document.getElementById('notas').value,
        detalles: cart.map(item => ({
            producto_id: item.id,
            cantidad: item.quantity,
            precio_unitario_cotizado: typeof item.price === 'string' ? parseFloat(item.price.replace(/[^\d.]/g, '')) : item.price
        }))
    };

    try {
        const response = await fetch(`${API_BASE_URL}/cotizaciones`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success || response.ok) {
            // Clear cart
            cart = [];
            saveCart();
            updateCartUI();

            // Show success
            cartItemsContainer.innerHTML = `
                <div class="bg-surface-dark border border-green-500 rounded-xl p-8 text-center animate-fade-in">
                    <span class="material-symbols-outlined text-5xl text-green-500 mb-4">check_circle</span>
                    <h3 class="text-white text-2xl font-bold mb-2">¡Cotización Enviada!</h3>
                    <p class="text-text-secondary">Hemos recibido tu solicitud. Te contactaremos pronto al correo <strong>${formData.prospecto_email}</strong>.</p>
                    <a href="productos.html" class="inline-block mt-6 px-6 py-3 bg-primary text-slate-900 font-bold rounded-lg hover:bg-yellow-400 transition-colors">Volver a la Tienda</a>
                </div>
            `;
            document.getElementById('checkout-form').reset();
        } else {
            throw new Error(result.message || 'Error al enviar cotización');
        }

    } catch (error) {
        console.error('Checkout error:', error);
        showToast('Error al enviar. Intente nuevamente.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// Make functions global for onclick events
window.fetchProducts = fetchProducts;
window.addToCart = addToCart;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.updateModalQuantity = updateModalQuantity;
