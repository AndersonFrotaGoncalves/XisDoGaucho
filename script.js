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
        //se o otem ja esxistir, aumentar a quantidade
        existingItem.quantity += 1;

        //se o item nao existir, adcionar ao carrinho
    } else {
        cart.push({
            name,
            price,
            quantity: 1,
        })

    }

    updateCartModal()
}

//atualizar o carrinho
function updateCartModal() {
    cartItemsContainer.innerHTML = "";
    let total = 0;

    cart.forEach(item => {
        const cartItemElement = document.createElement("div")
        cartItemElement.classList.add("flex", "justify-between", "mb-4", "flex-col")

        cartItemElement.innerHTML = `
        <div class="flex items-center justify-between">
        <div>
        <p class="font-medium" >${item.name}</p>
        <p>Qtd:  ${item.quantity}</p>
        <p class="font-medium mt-2">€ ${item.price.toFixed(2)}</p>
        </div>
       
        <button class="remove-from-cart-btn" data-name="${item.name}"> Remover </button>
        
        </div>
        `

        total += item.price * item.quantity;

        cartItemsContainer.appendChild(cartItemElement)
    })

    cartTotal.textContent = total.toLocaleString("pt-PT", {
        style: "currency",
        currency: "EUR"
    });

    cartCounter.innerText = cart.length;

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

//finalizar pedido "posso comentar aqui para testar o carrinho"
checkoutBtn.addEventListener("click", function () {


    // const isOpen = checkRestaurantOpen();
    // if(!isOpen){
    //    Toastify({
    //     text: "Lamentamos, mas o restaurante encontra-se fechado no momento. Volte a visitar-nos em breve!",
    //     duration: 3000,
    //     close: true,
    //     gravity: "top", // `top` or `bottom`
    //     position: "right", // `left`, `center` or `right`
    //     stopOnFocus: true, // Prevents dismissing of toast on hover
    //     style: {
    //       background: "#ef4444",
    //     },
    //    }).showToast();
       
    //     return;
    // }

    if (cart.length === 0) return;
    if (addressInput.value === "") {
        addressWarn.classList.remove("hidden");
        addressInput.classList.add("border-red-500");
        return;
    }

    //Enviar o pedido para api 
    const cartItems = cart.map((item) => {
        return (
            `${item.name} Quantidade: (${item.quantity}) preço: €${item.price.toFixed(2)} |`
        )
    }).join("")

    // Calcular valor total das compras
    const totalValue = cart.reduce((acc, item) => {
        return acc + item.price * item.quantity;
    }, 0);
    
    
    // Montar mensagem com o total
    const message = encodeURIComponent(`${cartItems} Total:€ ${totalValue.toFixed(2)}`)

    const phone = "351961619937"
    window.open(`https://wa.me/${phone}?text=${message} | Endereço: ${addressInput.value}`, "_blank")

    cart = [];
    updateCartModal();
})


//Veririfcar se o restaurante esta aberto
function checkRestaurantOpen() {
    const data = new Date();
    const hora = data.getHours();
    return hora >= 18 && hora < 23;
}

const spanItem = document.getElementById("date-span")
const isOpen = checkRestaurantOpen();

if (isOpen) {
    spanItem.classList.remove("bg-red-500");
    spanItem.classList.add("bg-green-600")
} else {
    spanItem.classList.remove("bg-green-600");
    spanItem.classList.add("bg-red-500")
}