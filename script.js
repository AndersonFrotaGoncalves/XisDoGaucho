const menu = document.getElementById("menu")
const cartBtn = document.getElementById("cart-btn")
const cartModal = document.getElementById("cart-modal")
const cartItemsContainer = document.getElementById("cart-items")
const cartTotal = document.getElementById("cart-total")
const checkoutBtn = document.getElementById("checkout-btn")
const closeModalBtn = document.getElementById("close-modal-btn")
const cartCounter = document.getElementById("cart-count")
const addressInput = document.getElementById("address")
const addressWarn = document.getElementById("address-warn")
const deliveryAddressContainer = document.getElementById("delivery-address-container")
const orderTypeInputs = document.querySelectorAll('input[name="order-type"]')
const customerNameInput = document.getElementById("customer-name")
const customerPhoneInput = document.getElementById("customer-phone")
const paymentMethodInput = document.getElementById("payment-method")
const orderNotesInput = document.getElementById("order-notes")

// Número do estabelecimento (formato internacional, sem + nem espaços)
const WHATSAPP_NUMBER = "351961620295";

const ORDER_COUNTER_KEY = "xis-gaucho-order-counter";
const ORDER_DATE_KEY = "xis-gaucho-order-date";
const CART_STORAGE_KEY = "xis-gaucho-cart";
const PHONE_PATTERN = /^[0-9\s()+-]{7,20}$/;
const MAX_NAME = 80;
const MAX_PHONE = 20;
const MAX_ADDRESS = 200;
const MAX_NOTES = 500;
const MAX_CART_QTY = 99;
const MAX_CART_ITEMS = 50;
const MAX_ITEM_PRICE = 1000;
const PAYMENT_METHODS = new Set(["Dinheiro", "MB WAY", "Cartão"]);

let cart = loadCart();

let checkoutInProgress = false;

function cleanText(value, maxLength) {
    return String(value ?? "")
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
        .trim()
        .slice(0, maxLength);
}

function notifyToast(config) {
    if (typeof window.Toastify === "function") {
        window.Toastify(config).showToast();
        return;
    }

    let toast = document.getElementById("fallback-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "fallback-toast";
        toast.className = "fallback-toast";
        toast.setAttribute("role", "status");
        document.body.appendChild(toast);
    }

    toast.textContent = config.text || "";
    toast.classList.add("show");
    clearTimeout(window.__xisToastTimer);
    window.__xisToastTimer = setTimeout(() => toast.classList.remove("show"), config.duration || 3000);
}


function loadCart() {
    try {
        const savedCart = JSON.parse(sessionStorage.getItem(CART_STORAGE_KEY));
        if (!Array.isArray(savedCart)) return [];

        return savedCart
            .map(item => {
                const name = cleanText(item?.name, MAX_NAME);
                const price = Number(item?.price);
                const quantity = Number(item?.quantity);

                if (
                    !name ||
                    !Number.isFinite(price) ||
                    price <= 0 ||
                    price > MAX_ITEM_PRICE ||
                    !Number.isInteger(quantity) ||
                    quantity < 1 ||
                    quantity > MAX_CART_QTY
                ) return null;

                return { name, price, quantity };
            })
            .filter(Boolean)
            .slice(0, MAX_CART_ITEMS);
    } catch {
        return [];
    }
}

function saveCart() {
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

//abrir o modal do carrinho
cartBtn.addEventListener("click", function () {
    cartModal.style.display = "flex"
    updateCartModal();
})

//fechar o modal do carrinho
cartModal.addEventListener("click", function (Event) {
    if (Event.target === cartModal) {
        cartModal.style.display = "none"
    }
})

closeModalBtn.addEventListener("click", function () {
    cartModal.style.display = "none"
})

// Alterar campos conforme a modalidade escolhida
orderTypeInputs.forEach(input => {
    input.addEventListener("change", function () {
        if (this.value === "Entrega") {
            deliveryAddressContainer.style.display = "block"
        } else {
            deliveryAddressContainer.style.display = "none"
            addressInput.value = ""
            addressWarn.classList.add("hidden")
            addressInput.classList.remove("border-red-500")
        }
    })
})

menu.addEventListener("click", function (Event) {
    let parentButton = Event.target.closest(".add-to-cart-btn")
    if (parentButton) {
        const name = parentButton.getAttribute("data-name")
        const price = parseFloat(parentButton.getAttribute("data-price"))
        addToCart(name, price)
    }
})

//funcao para adicionar no carrinho
function addToCart(name, price) {
    name = cleanText(name, MAX_NAME);
    price = Number(price);

    if (!name || !Number.isFinite(price) || price <= 0 || price > MAX_ITEM_PRICE) {
        notifyToast({
            text: "Não foi possível adicionar este produto ao carrinho.",
            duration: 2500,
            close: true,
            gravity: "top",
            position: "right"
        });
        return;
    }

    const existingItem = cart.find(item => item.name === name);

    if (existingItem) {
        if (existingItem.quantity >= MAX_CART_QTY) {
            notifyToast({
                text: `Limite de ${MAX_CART_QTY} unidades por produto atingido.`,
                duration: 2500,
                close: true,
                gravity: "top",
                position: "right"
            });
            return;
        }
        existingItem.quantity += 1;
    } else {
        if (cart.length >= MAX_CART_ITEMS) {
            notifyToast({
                text: "O carrinho atingiu o limite de produtos.",
                duration: 2500,
                close: true,
                gravity: "top",
                position: "right"
            });
            return;
        }

        cart.push({ name, price, quantity: 1 });
    }

    saveCart();
    updateCartModal();
}

//atualizar o carrinho
function updateCartModal() {
    cartItemsContainer.replaceChildren();
    let total = 0;
    let totalQuantity = 0;

    cart.forEach(item => {
        const row = document.createElement("div");
        row.className = "cart-item-row";

        const details = document.createElement("div");
        const name = document.createElement("p");
        const qty = document.createElement("p");
        const price = document.createElement("p");

        name.className = "item-name";
        qty.className = "item-qty";
        price.className = "item-price";

        name.textContent = item.name;
        qty.textContent = `Qtd: ${item.quantity}`;
        price.textContent = `€ ${((item.price || 0) * item.quantity).toFixed(2)}`;

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "remove-from-cart-btn";
        remove.dataset.name = item.name;
        remove.textContent = "Remover";
        remove.setAttribute("aria-label", `Remover ${item.name}`);

        details.append(name, qty, price);
        row.append(details, remove);
        cartItemsContainer.appendChild(row);

        total += item.price * item.quantity;
        totalQuantity += item.quantity;
    });

    cartTotal.textContent = total.toLocaleString("pt-PT", {
        style: "currency",
        currency: "EUR"
    });
    cartCounter.innerText = totalQuantity;
    saveCart();
}

//funcao remover item do carrinho
cartItemsContainer.addEventListener("click", function (Event) {
    if (Event.target.classList.contains("remove-from-cart-btn")) {
        const name = Event.target.getAttribute("data-name")
        removeItemCart(name);
    }
})

function removeItemCart(name) {
    const index = cart.findIndex(item => item.name === name);

    if (index !== -1) {
        const item = cart[index];

        if (item.quantity > 1) {
            item.quantity -= 1;
            saveCart();
            updateCartModal();
            return;
        }
        cart.splice(index, 1);
        saveCart();
        updateCartModal();
    }
}

// Limpar o contorno de erro assim que o cliente corrige cada campo
addressInput.addEventListener("input", function (Event) {
    if (Event.target.value !== "") {
        addressInput.classList.remove("border-red-500");
        addressWarn.classList.add("hidden")
    }
})

customerNameInput.addEventListener("input", function () {
    if (this.value.trim() !== "") {
        this.classList.remove("border-red-500");
    }
})

customerPhoneInput.addEventListener("input", function () {
    if (PHONE_PATTERN.test(this.value.trim())) {
        this.classList.remove("border-red-500");
    }
})

paymentMethodInput.addEventListener("change", function () {
    if (this.value !== "") {
        this.classList.remove("border-red-500");
    }
})

function generateOrderNumber() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    const currentDate = `${year}/${month}/${day}`;

    let counter = Number(localStorage.getItem(ORDER_COUNTER_KEY)) || 0;
    const savedDate = localStorage.getItem(ORDER_DATE_KEY);

    // Se for um novo dia, reinicia a sequência
    if (savedDate !== currentDate) {
        counter = 1;
        localStorage.setItem(ORDER_DATE_KEY, currentDate);
    } else {
        counter += 1;
    }

    localStorage.setItem(ORDER_COUNTER_KEY, counter);

    const orderNumber = String(counter).padStart(4, "0");

    return `${currentDate}-${orderNumber}`;
}

//finalizar pedido usando link do WhatsApp (wa.me)
checkoutBtn.addEventListener("click", function () {

    if (checkoutInProgress) return;

    const selectedOrderType = document.querySelector('input[name="order-type"]:checked').value;
    const customerName = cleanText(customerNameInput.value, MAX_NAME);
    const customerPhone = cleanText(customerPhoneInput.value, MAX_PHONE);
    const address = cleanText(addressInput.value, MAX_ADDRESS);
    const notes = cleanText(orderNotesInput.value, MAX_NOTES);
    const phoneDigits = customerPhone.replace(/\D/g, "");

    // Validação: cada campo assinala só o próprio erro
    let hasError = false;

    if (customerName.length < 2) {
        customerNameInput.classList.add("border-red-500");
        hasError = true;
    }

    if (!PHONE_PATTERN.test(customerPhone) || phoneDigits.length < 7 || phoneDigits.length > 15) {
        customerPhoneInput.classList.add("border-red-500");
        hasError = true;
    }

    if (!PAYMENT_METHODS.has(paymentMethodInput.value)) {
        paymentMethodInput.classList.add("border-red-500");
        hasError = true;
    }

    if (selectedOrderType === "Entrega" && address.length < 5) {
        addressInput.classList.add("border-red-500");
        addressWarn.classList.remove("hidden");
        hasError = true;
    }

    if (hasError) {
        notifyToast({
            text: "Preencha corretamente os campos obrigatórios antes de finalizar.",
            duration: 2500,
            close: true,
            gravity: "top",
            position: "right",
            stopOnFocus: true,
            style: { background: "#ef4444" }
        });
        return;
    }

    const isOpen = checkRestaurantOpen();
    if (!isOpen) {
        notifyToast({
            text: "Lamentamos, mas o restaurante encontra-se fechado no momento. Volte a visitar-nos em breve!",
            duration: 3000,
            close: true,
            gravity: "top",
            position: "right",
            stopOnFocus: true,
            style: { background: "#ef4444" },
        });
        return;
    }

    if (cart.length === 0) {
        notifyToast({
            text: "O seu carrinho está vazio!",
            duration: 2500,
            close: true,
            gravity: "top",
            position: "right",
            stopOnFocus: true,
            style: { background: "#ef4444" }
        });
        return;
    }

    // Abrir primeiro para detectar bloqueio de pop-up antes de consumir o número.
    const whatsappWindow = window.open("", "_blank");
    if (!whatsappWindow) {
        notifyToast({
            text: "Não foi possível abrir o WhatsApp. Verifique se o bloqueador de pop-ups está ativo.",
            duration: 3000,
            close: true,
            gravity: "top",
            position: "right"
        });
        return;
    }

    // Gerar número do pedido somente depois de a janela ter sido criada.
    const orderNumber = generateOrderNumber();

    // Montar mensagem do pedido
    const cartItems = cart
        .map(item => `· ${item.name} (x${item.quantity}) — €${(item.price * item.quantity).toFixed(2)}`)
        .join("\n");
    const totalValue = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

    let deliveryInformation = "";

    if (selectedOrderType === "Entrega") {
        deliveryInformation =
            `🚗 *MODALIDADE: ENTREGA*\n\n` +
            `👤 *Cliente:*\n${customerName}\n\n` +
            `📞 *Telefone:*\n${customerPhone}\n\n` +
            `📍 *ENDEREÇO DE ENTREGA:*\n${address}`;
    } else {
        deliveryInformation =
            `🏪 *MODALIDADE: RETIRADA NO LOCAL*\n\n` +
            `👤 *Cliente:*\n${customerName}\n\n` +
            `📞 *Telefone:*\n${customerPhone}\n\n` +
            `📍 O cliente irá buscar o pedido no estabelecimento.`;
    }

    const message =
        `🍔 *NOVO PEDIDO - XIS DO GAÚCHO*\n\n` +
        `🔖 *Nº do Pedido:* ${orderNumber}\n\n` +
        `📦 *PEDIDO:*\n${cartItems}\n\n` +
        `💰 *TOTAL: €${totalValue.toFixed(2)}*\n\n` +
        `${deliveryInformation}\n\n` +
        `💳 *FORMA DE PAGAMENTO:*\n${paymentMethodInput.value}\n\n` +
        `📝 *OBSERVAÇÕES:*\n${notes || "Nenhuma"}`;

    // Gera o link do WhatsApp com a mensagem já preenchida
    const whatsappUrl =
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

    // Navegar a janela já autorizada pelo navegador.
    try {
        whatsappWindow.opener = null;
        whatsappWindow.location.href = whatsappUrl;
    } catch {
        whatsappWindow.close();
        checkoutInProgress = false;
        checkoutBtn.disabled = false;
        checkoutBtn.removeAttribute("aria-disabled");
        checkoutBtn.innerHTML = '<i class="fa-brands fa-whatsapp"></i> Finalizar pedido';
        notifyToast({
            text: "Não foi possível abrir o WhatsApp.",
            duration: 3000,
            close: true,
            gravity: "top",
            position: "right"
        });
        return;
    }

    // Limpar carrinho e fechar modal
    cart = [];
    saveCart();
    updateCartModal();

    customerNameInput.value = "";
    customerPhoneInput.value = "";
    addressInput.value = "";
    paymentMethodInput.value = "";
    orderNotesInput.value = "";

    document.querySelector('input[name="order-type"][value="Entrega"]').checked = true;
    deliveryAddressContainer.style.display = "block";

    cartModal.style.display = "none";

    window.setTimeout(() => {
        checkoutInProgress = false;
        checkoutBtn.disabled = false;
        checkoutBtn.removeAttribute("aria-disabled");
        checkoutBtn.innerHTML = '<i class="fa-brands fa-whatsapp"></i> Finalizar pedido';
    }, 1000);
})

//Verificar se o restaurante esta aberto (Sex a Dom, 18:00 as 23:00)
function checkRestaurantOpen() {
    const data = new Date();
    const dia = data.getDay();   // 0 = domingo ... 6 = sábado
    const hora = data.getHours();

    const diaAberto = dia === 0 || dia === 5 || dia === 6; // domingo, sexta, sábado
    const horaAberta = hora >= 18 && hora < 23;

    return diaAberto && horaAberta;
}

const spanItem = document.getElementById("date-span")
const isOpen = checkRestaurantOpen();

if (isOpen) {
    spanItem.classList.remove("is-closed");
    spanItem.classList.add("is-open")
} else {
    spanItem.classList.remove("is-open");
    spanItem.classList.add("is-closed")
}
