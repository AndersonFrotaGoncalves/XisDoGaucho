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
const customerNameInput = document.getElementById("customer-name")
const customerPhoneInput = document.getElementById("customer-phone")
const paymentMethodInput = document.getElementById("payment-method")
const orderNotesInput = document.getElementById("order-notes")
// Número do estabelecimento (formato internacional, sem + nem espaços)
const WHATSAPP_NUMBER = "351961620295";

const ORDER_COUNTER_KEY = "xis-gaucho-order-counter";
const ORDER_DATE_KEY = "xis-gaucho-order-date";

let cart = [];

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
    const existingItem = cart.find(item => item.name === name)

    if (existingItem) {
        //se o item ja existir, aumentar a quantidade
        existingItem.quantity += 1;
    } else {
        cart.push({
            name,
            price,
            quantity: 1,
        })
    }

    updateCartModal()

    Toastify({
        text: `${name} adicionado ao carrinho!`,
        duration: 1500,
        close: true,
        gravity: "top",
        position: "right",
        stopOnFocus: true,
        style: { background: "#22c55e" }
    }).showToast();
}

//atualizar o carrinho
function updateCartModal() {
    cartItemsContainer.innerHTML = "";
    let total = 0;
    let totalQuantity = 0;

    cart.forEach(item => {
        const cartItemElement = document.createElement("div")
        cartItemElement.classList.add("cart-item-row")

        cartItemElement.innerHTML = `
        <div>
        <p class="item-name">${item.name}</p>
        <p class="item-qty">Qtd: ${item.quantity}</p>
        <p class="item-price">€ ${item.price.toFixed(2)}</p>
        </div>
        <button class="remove-from-cart-btn" data-name="${item.name}">Remover</button>
        `

        total += item.price * item.quantity;
        totalQuantity += item.quantity;

        cartItemsContainer.appendChild(cartItemElement)
    })

    cartTotal.textContent = total.toLocaleString("pt-PT", {
        style: "currency",
        currency: "EUR"
    });

    // Mostra a quantidade total de itens, não o número de produtos diferentes
    cartCounter.innerText = totalQuantity;
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
            updateCartModal();
            return;
        }
        cart.splice(index, 1);
        updateCartModal();
    }
}

addressInput.addEventListener("input", function (Event) {
    let inputValue = Event.target.value;

    if (inputValue !== "") {
        addressInput.classList.remove("border-red-500");
        addressWarn.classList.add("hidden")
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

    const isOpen = checkRestaurantOpen();
    if (!isOpen) {
        Toastify({
            text: "Lamentamos, mas o restaurante encontra-se fechado no momento. Volte a visitar-nos em breve!",
            duration: 3000,
            close: true,
            gravity: "top",
            position: "right",
            stopOnFocus: true,
            style: {
                background: "#ef4444",
            },
        }).showToast();

        return;
    }

    if (cart.length === 0) {
        Toastify({
            text: "O seu carrinho está vazio!",
            duration: 2500,
            close: true,
            gravity: "top",
            position: "right",
            stopOnFocus: true,
            style: { background: "#ef4444" }
        }).showToast();
        return;
    }

    if (
    customerNameInput.value.trim() === "" ||
    customerPhoneInput.value.trim() === "" ||
    addressInput.value.trim() === "" ||
    paymentMethodInput.value === ""
) {
    addressWarn.classList.remove("hidden");

    if (customerNameInput.value.trim() === "") {
        customerNameInput.classList.add("border-red-500");
    }

    if (customerPhoneInput.value.trim() === "") {
        customerPhoneInput.classList.add("border-red-500");
    }

    if (addressInput.value.trim() === "") {
        addressInput.classList.add("border-red-500");
    }

    if (paymentMethodInput.value === "") {
        paymentMethodInput.classList.add("border-red-500");
    }

    return;
}

   // Gerar número do pedido
const orderNumber = generateOrderNumber();

// Montar mensagem do pedido
const cartItems = cart
    .map(item => `· ${item.name} (x${item.quantity}) — €${(item.price * item.quantity).toFixed(2)}`)
    .join("\n");
    const totalValue = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

 const message =
    `🍔  XIS DO GAÚCHO\n` +
    `🔢 *Nº DO PEDIDO: ${orderNumber}*\n\n` +

    `👤 *Cliente:*\n` +
    `${customerNameInput.value.trim()}\n\n` +

    `📞 *Telefone:*\n` +
    `${customerPhoneInput.value.trim()}\n\n` +

    `📦 *PEDIDO:*\n` +
    `${cartItems}\n\n` +

    `💰 *TOTAL: €${totalValue.toFixed(2)}*\n\n` +

    `📍 *ENDEREÇO DE ENTREGA:*\n` +
    `${addressInput.value.trim()}\n\n` +

    `💳 *FORMA DE PAGAMENTO:*\n` +
    `${paymentMethodInput.value}\n\n` +

    `📝 *OBSERVAÇÕES:*\n` +
    `${orderNotesInput.value.trim() || "Nenhuma"}`;

    // Gera o link do WhatsApp com a mensagem já preenchida
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

    // Abre o WhatsApp (app no telemóvel, ou WhatsApp Web no PC) numa nova aba
    window.open(whatsappUrl, "_blank");

    // Limpar carrinho e fechar modal
    cart = [];
updateCartModal();

customerNameInput.value = "";
customerPhoneInput.value = "";
addressInput.value = "";
paymentMethodInput.value = "";
orderNotesInput.value = "";

cartModal.style.display = "none";
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