let numInputType = "none";
let isBasketModify = false;
let isProductModify = false;
let isEarnings = false;
let products = [];
let receipts = [0, 0, []];
let basketProducts = [];
let updatedAt = "1970-1-1-9-0-0";
window.onload = setup();
async function setup() {
  if (!checkResolution()) {
    addClass("#overlay", "show");
    return false;
  }
  initData();
  addClassBulk(".Cell:not(.no-border)", "border");
  // addClassBulk(".Cell:not(.no-border)", "border-secondary");
  document.querySelector("html").dataset.bsTheme = colorScheme("light", "dark");
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (_) => {
    document.querySelector("html").dataset.bsTheme = colorScheme("light", "dark");
  });
  window.addEventListener(
    "wheel",
    (e) => {
      !!(e.deltaY % 1) && e.preventDefault();
    },
    {
      passive: false,
    }
  );
  avoidBlank(".Cell:not([keep-blank]):not(.keep-blank)");
  dataSync();
  setInterval(dataSync, 1000 * 30);
  Searchs()["debug"] == "true" && removeClass("#b_debug", "hidden");
  b_addToBasket.addEventListener("click", addToBasket);
  [...document.querySelectorAll(".numpad")].forEach((e) => e.addEventListener("click", (e) => inputNum(e.target.dataset.num)));
  b_debug.addEventListener("click", debug);
  b_payment.addEventListener("click", payment);
  b_checkout.addEventListener("click", checkout);
  b_cancel.addEventListener("click", cancel);
  b_new.addEventListener("click", newPurchase);
  b_reset.addEventListener("click", (e) => deleteData(""));
  b_modifyProduct.addEventListener("click", (_) => {
    toggleModifyProduct("enable");
  });
  b_backToMainFromProducts.addEventListener("click", (_) => {
    toggleModifyProduct("disable");
  });
  b_earnings.addEventListener("click", (_) => {
    toggleEarnings("enable");
  });
  b_backToMainFromEarnings.addEventListener("click", (_) => {
    toggleEarnings("disable");
  });
  b_receiptForward.addEventListener("click", () => {
    switchReceipt("f");
  });
  b_receiptBackward.addEventListener("click", () => {
    switchReceipt("b");
  });
  buttonState(".numpad", false);
  buttonState("#b_addToBasket", false);
  buttonState("#b_checkout", false);
  buttonState("#b_payment", false);
  buttonState("#b_new", false);
  buttonState("#b_cancel", false);
  drawReceipt(receipts[2].length - 1);
}

function dataSync() {
  Logger("Syncing data...");
  if (document.cookie == "") {
    Logger("Initializing storage data...");
    saveData();
  }
  let cookieUpdateAt = Cookies.get("updatedAt");
  if (datetimeStr("d", updatedAt).getTime() < datetimeStr("d", cookieUpdateAt).getTime()) {
    loadData();
  } else if (datetimeStr("d", updatedAt).getTime() > datetimeStr("d", cookieUpdateAt).getTime()) {
    saveData();
  } else {
    Logger("Data is up-to-date.");
  }
}

function loadData() {
  products = JSON.parse(Cookies.get("products"));
  drawProducts();
  receipts = JSON.parse(Cookies.get("receipts"));
  updatedAt = Cookies.get("updatedAt");
  basketProducts = [];
  drawBasket();
  Logger("Data loaded from storage.");
}

function saveData() {
  Cookies.set("products", JSON.stringify(products), {
    expires: 100,
  });
  Cookies.set("receipts", JSON.stringify(receipts), {
    expires: 100,
  });
  Cookies.set("updatedAt", datetimeStr("e", new Date()), {
    expires: 100,
  });
  Logger("Data saved to storage.");
  loadData();
}

function initData() {
  products = [];
  receipts = [0, 0, []];
  basketProducts = [];
  updatedAt = "1970-1-1-9-0-0";
}

function deleteData(param) {
  let c;
  if (param == "force") {
    c = true;
  } else {
    c = confirm("すべてのデータを消去しますか？");
  }
  if (c) {
    toggleEarnings("disable");
    Logger("Removing data from storage...", "warn");
    Cookies.set("products", "", {
      expires: 0,
    });
    Cookies.set("receipts", "", {
      expires: 0,
    });
    Cookies.set("updatedAt", "", {
      expires: 0,
    });
    Logger("Removing data from cache...", "warn");
    products = [];
    receipts = [0, 0, []];
    basketProducts = [];
    updatedAt = "1970-1-1-9-0-0";
    Logger("Initialization completed.", "warn");
    dataSync();
    location.reload();
  }
}

function addProduct(name, price) {
  products.push([uuidv7(), name, price, true]);
  saveData();
}

function purchaseSelect(e) {
  if (e.dataset.productId == product.dataset.selectedId) {
    buttonState(".numpad,#b_addToBasket", false);
    if (basketProducts.length == 0) {
      buttonState("#b_modifyProduct,#b_earnings", true);
      buttonState("#b_cancel", false);
    }
    purchaseSelectionReset();
    numInputType = "none";
    basketDisplay(true);
    return false;
  }
  purchaseSelectionReset();
  e.classList.add("active");
  product.dataset.selectedId = e.dataset.productId;
  e.querySelector("#productPrice").textContent = 1;
  numInputType = "count";
  buttonState("#b_modifyProduct,#b_earnings", false);
  buttonState(".numpad,#b_addToBasket,#b_cancel", true);
  basketDisplay(false);
}

function purchaseSelectionReset() {
  product.querySelector(".active") &&
    [...product.querySelectorAll(".active")].forEach((e) => {
      e.classList.remove("active");
      e.querySelector("#productPrice").textContent = e.querySelector("#productPrice").dataset.price;
    });
  product.dataset.count = "";
  product.dataset.selectedId = "";
  numInputType = "none";
}

function basketSelect(e) {
  if (e.classList.contains("active")) {
    e.classList.remove("active");
    e.querySelector("#checkbox").innerHTML = "";
    e.querySelector("#checkbox").append(cloneTemplate("basketUncheck"));
    return false;
  }
  e.classList.add("active");
  e.querySelector("#checkbox").innerHTML = "";
  e.querySelector("#checkbox").append(cloneTemplate("basketCheck"));
}

function inputNum(num) {
  switch (numInputType) {
    case "count":
      product.dataset.count += num;
      product.querySelector(".active #productPrice").textContent = product.dataset.count;
      break;
    case "payment":
      t_payment.dataset.payment += num;
      t_payment.textContent = "¥" + Number(t_payment.dataset.payment).toLocaleString("en-us");
      break;
  }
}

function addToBasket() {
  let count = product.dataset.count ? Number(product.dataset.count) : 1;
  if (count > 50) {
    product.dataset.count = "";
    product.querySelector(".active #productPrice").textContent = 1;
    return alert("50を超える点数は指定できません");
  }
  if (count == 0) {
    product.dataset.count = "";
    product.querySelector(".active #productPrice").textContent = 1;
    return alert("選択を取り消す場合は製品をもう一度選択してください");
  }
  if (product.dataset.selectedId == "") return alert("商品が選択されていません");
  basketProducts.push([product.dataset.selectedId, count, uuidv7()]);
  purchaseSelectionReset();
  drawBasket();
  buttonState(".numpad,#b_addToBasket", false);
  buttonState("#b_payment", true);
  basketDisplay(true);
}

function drawProducts() {
  document.querySelector("#product").hasChildNodes() && [...document.querySelector("#product").children].forEach((e) => e.remove());
  products.forEach((e, i) => {
    let [id, name, price, enable] = e;
    if (enable) {
      let element = cloneTemplate("purchasableProductItem");
      element.querySelector("#productName").textContent = name;
      element.querySelector("#productPrice").textContent = price.toLocaleString("en-us");
      element.querySelector("#productPrice").dataset.price = price.toLocaleString("en-us");
      element.dataset.productId = id;
      element.addEventListener("click", (e) => purchaseSelect(e.target));
      document.querySelector("#product").append(element);
    }
  });
  purchaseSelectionReset();
}

function drawAllProducts() {
  f_allProducts.hasChildNodes() && [...f_allProducts.children].forEach((e) => e.remove());
  products.forEach((e, i) => {
    let [id, name, price, enable] = e;
    let element = cloneTemplate("productItem");
    element.querySelector("#productName").value = name;
    element.querySelector("#productPrice").value = price;
    element.dataset.productId = id;
    element.querySelector("#productState").addEventListener("click", (e) => {
      toggleProductState(e.target);
    });
    element.querySelector("#productName").addEventListener("change", (e) => editProductName(e.target));
    element.querySelector("#productPrice").addEventListener("change", (e) => editProductPrice(e.target));
    element.querySelector("#productName").setAttribute("disabled", "");
    element.querySelector("#productPrice").setAttribute("disabled", "");
    if (!enable) {
      element.querySelector("#productState").classList.remove("btn-danger");
      element.querySelector("#productState").classList.add("btn-success");
      element.querySelector("#productState").innerHTML = "";
      element.querySelector("#productState").append(cloneTemplate("productEnable"));
      element.classList.add("disabled");
    } else {
      element.querySelector("#productState").classList.remove("btn-success");
      element.querySelector("#productState").classList.add("btn-danger");
      element.querySelector("#productState").innerHTML = "";
      element.querySelector("#productState").append(cloneTemplate("productDisable"));
      element.classList.remove("disabled");
    }
    f_allProducts.append(element);
  });
  let addbutton = cloneTemplate("productAdd");
  addbutton.querySelector("#b_addProduct").addEventListener("click", addTemplateProduct);
  f_allProducts.append(addbutton);
}

function addTemplateProduct() {
  addProduct("商品名", 100);
  let [id, name, price, enable] = products[products.length - 1];
  let element = cloneTemplate("productItem");
  element.querySelector("#productName").value = name;
  element.querySelector("#productPrice").value = price;
  element.dataset.productId = id;
  element.querySelector("#productState").addEventListener("click", (e) => {
    toggleProductState(e.target);
  });
  element.querySelector("#productName").addEventListener("change", (e) => editProductName(e.target));
  element.querySelector("#productPrice").addEventListener("change", (e) => editProductPrice(e.target));
  if (!enable) {
    element.querySelector("#productState").classList.remove("btn-danger");
    element.querySelector("#productState").classList.add("btn-success");
    element.querySelector("#productState").innerHTML = "";
    element.querySelector("#productState").append(cloneTemplate("productEnable"));
  } else {
    element.querySelector("#productState").classList.remove("btn-success");
    element.querySelector("#productState").classList.add("btn-danger");
    element.querySelector("#productState").innerHTML = "";
    element.querySelector("#productState").append(cloneTemplate("productDisable"));
  }
  b_addProduct.parentElement.before(element);
  saveData();
}

function drawBasket() {
  basket.hasChildNodes() && [...basket.children].forEach((e) => e.remove());
  let _total = 0;
  basketProducts.forEach((e) => {
    let element = cloneTemplate("basketProductItem");
    let [, name, price] = products.filter((item) => item[0] == e[0])[0];
    element.querySelector("#name").textContent = name;
    element.querySelector("#price").textContent = "¥" + (e[1] * price).toLocaleString("en-us");
    element.querySelector("#count").textContent = e[1] + "点";
    element.querySelector("#productPrice").textContent = "@" + price.toLocaleString("en-us");
    element.dataset.cacheId = e[2];
    if (e[1] == 1) [...element.querySelectorAll(".on-multiple")].forEach((e) => (e.style.display = "none"));
    element.addEventListener("click", (e) => basketSelect(e.target));
    basket.append(element);
    _total += e[1] * price;
  });
  total.dataset.total = _total;
  total.textContent = "¥" + _total.toLocaleString("en-us");
  receiptScroll();
}

function receiptScroll() {
  receipt.scrollIntoView({
    behavior: "smooth",
    block: "end",
  });
}

function addExampleProduct(c = 1) {
  for (let i = 0; i < c; i++) addProduct(randomName(), randomNumber(10, 1200));
}

function payment() {
  if (isBasketModify) {
    [...basket.querySelectorAll(".active")].forEach((e) => {
      basketProducts = arrayRemove(
        basketProducts,
        basketProducts.findIndex((v) => v[2] == e.dataset.cacheId)
      );
    });
    drawBasket();
    toggleBasketEditable("disable");
    if (basketProducts.length == 0) {
      buttonState("#b_cancel,#b_payment", false);
      buttonState("#b_modifyProduct,#b_earnings", true);
    }
  } else {
    numInputType = "payment";
    // buttonState("#b_payment,#product>.list-group-item", false);
    buttonState("#b_payment", false);
    toggleProductsAvailable("disable");
    buttonState(".numpad,#b_checkout", true);
    receipt.querySelector(".payment").classList.remove("hidden");
    basketDisplay(false);
    receiptScroll();
  }
}

function checkout() {
  let change = Number(t_payment.dataset.payment) - Number(total.dataset.total);
  if (change < 0) {
    return alert("預り金が合計より少ないです");
  }
  numInputType = "none";
  receipt.querySelector(".change").classList.remove("hidden");
  receiptScroll();
  t_change.textContent = "¥" + change.toLocaleString("en-us");
  buttonState("#b_checkout,.numpad,#b_cancel", false);
  buttonState("#b_new", true);
}

function cancel() {
  switch (numInputType) {
    case "count":
      if (product.dataset.count == "") {
        return alert("選択を取り消す場合は製品をもう一度選択してください");
      }
      product.dataset.count = "";
      product.querySelector(".active #productPrice").textContent = 1;
      break;
    case "payment":
      t_payment.dataset.payment = "";
      t_payment.textContent = "¥" + Number(0).toLocaleString("en-us");
      break;
    case "none":
      toggleBasketEditable();
      break;
  }
}

function buttonState(target, state) {
  [...document.querySelectorAll(target)].forEach((e) => {
    state ? e.classList.contains("disabled") && e.classList.remove("disabled") : e.classList.contains("disabled") || e.classList.add("disabled");
  });
}

function newPurchase() {
  receipts[2].length > 9 && receipts[2].shift();
  receipts[2].push([uuidv7(), basketProducts.map((e) => (e = arrayRemove(e, 2))), Number(t_payment.dataset.payment)]);
  let _total = receipts[0];
  let count = receipts[1] + 1;
  receipts[1] = count;
  receipts[0] = Number(total.dataset.total) + _total;
  saveData();
  basketDisplay(true);
  buttonState("#b_cancel,#b_modifyProduct,#b_earnings", true);
  buttonState("#b_new,#b_cancel", false);
  receipt.querySelector(".payment").classList.add("hidden");
  t_payment.dataset.payment = "";
  t_payment.textContent = "¥" + Number(0).toLocaleString("en-us");
  receipt.querySelector(".change").classList.add("hidden");
  t_change.textContent = "¥" + Number(0).toLocaleString("en-us");
  drawReceipt[receipts[2].length - 1];
}

function basketDisplay(isbasket) {
  if (isbasket) {
    addClass("#b_cancel", "-\\2lines");
    b_cancel.innerHTML = "カゴ<br />取消";
  } else {
    removeClass("#b_cancel", "-\\2lines");
    b_cancel.innerHTML = "取消";
  }
}

function toggleProductsAvailable(force = "") {
  switch (["disable", "enable"].indexOf(force.toLowerCase())) {
    case 0:
      addClassBulk("#product>.list-group-item", "list-group-item-secondary");
      addClassBulk("#product>.list-group-item", "pe-none");
      removeClassBulk("#product>.list-group-item", "list-group-item-primary");
      break;
    case 1:
      removeClassBulk("#product>.list-group-item", "list-group-item-secondary");
      removeClassBulk("#product>.list-group-item", "pe-none");
      addClassBulk("#product>.list-group-item", "list-group-item-primary");
      break;
    default:
      product.querySelector(".list-group-item").classList.contains("pe-none") ? toggleProductsAvailable("enable") : toggleProductsAvailable("disable");
      break;
  }
}

function toggleBasketEditable(force = "") {
  switch (["disable", "enable"].indexOf(force.toLowerCase())) {
    case 0:
      isBasketModify = false;
      removeClassBulk("#basket>.list-group-item", "list-group-item-danger");
      removeClassBulk("#basket>.list-group-item", "active");
      addClassBulk("#basket>.list-group-item", "pe-none");
      toggleProductsAvailable("enable");
      [...basket.querySelectorAll("#checkbox")].forEach((e) => {
        e.innerHTML = "";
        e.append(cloneTemplate("basketLock"));
      });
      break;
    case 1:
      isBasketModify = true;
      removeClassBulk("#basket>.list-group-item", "pe-none");
      addClassBulk("#basket>.list-group-item", "list-group-item-danger");
      toggleProductsAvailable("disable");
      [...basket.querySelectorAll("#checkbox")].forEach((e) => {
        e.innerHTML = "";
        e.append(cloneTemplate("basketUncheck"));
      });
      break;
    default:
      isBasketModify ? toggleBasketEditable("disable") : toggleBasketEditable("enable");
      break;
  }
}

function toggleModifyProduct(force = "") {
  switch (["disable", "enable"].indexOf(force.toLowerCase())) {
    case 0:
      isProductModify = false;
      removeClass("#s_main", "hidden");
      addClass("#s_products", "hidden");
      drawProducts();
      drawAllProducts();
      break;
    case 1:
      isProductModify = true;
      addClass("#s_main", "hidden");
      removeClass("#s_products", "hidden");
      drawProducts();
      drawAllProducts();
      break;
    default:
      isProductModify ? toggleModifyProduct("disable") : toggleModifyProduct("enable");
      break;
  }
}

function toggleEarnings(force = "") {
  switch (["disable", "enable"].indexOf(force.toLowerCase())) {
    case 0:
      isEarnings = false;
      removeClass("#s_main", "hidden");
      addClass("#s_earnings", "hidden");
      break;
    case 1:
      isEarnings = true;
      addClass("#s_main", "hidden");
      removeClass("#s_earnings", "hidden");
      drawReceipt(receipts[2].length - 1);
      break;
    default:
      isEarnings ? toggleEarnings("disable") : toggleEarnings("enable");
      break;
  }
}

function toggleProductState(target) {
  let index = products.findIndex((v) => v[0] == target.parentElement.dataset.productId);
  if (target.classList.contains("btn-danger")) {
    target.classList.remove("btn-danger");
    target.classList.add("btn-success");
    target.parentElement.classList.add("disabled");
    target.innerHTML = "";
    target.append(cloneTemplate("productEnable"));
    products[index][3] = false;
  } else {
    target.classList.remove("btn-success");
    target.classList.add("btn-danger");
    target.parentElement.classList.remove("disabled");
    target.innerHTML = "";
    target.append(cloneTemplate("productDisable"));
    products[index][3] = true;
  }
  saveData();
}

function editProductName(target) {
  let val = target.value == "" ? randomName() : target.value;
  let index = products.findIndex((v) => v[0] == target.parentElement.dataset.productId);
  products[index][1] = val;
  saveData();
}

function editProductPrice(target) {
  let val = target.value == "" ? randomNumber(100, 900) : target.value;
  let index = products.findIndex((v) => v[0] == target.parentElement.dataset.productId);
  products[index][2] = Number(val);
  saveData();
}

function switchReceipt(dir = "f") {
  let currentReceiptIndex = receipts[2].findIndex((e) => e[0] == e_receipt.dataset.receiptId);
  if (dir == "f") {
    currentReceiptIndex++;
  } else if (dir == "b") {
    currentReceiptIndex--;
  } else {
    return switchReceipt();
  }
  if (currentReceiptIndex < 0) currentReceiptIndex = receipts[2].length - 1;
  if (currentReceiptIndex >= receipts[2].length) currentReceiptIndex = 0;
  drawReceipt(currentReceiptIndex);
}

function drawReceipt(index) {
  if (receipts[2].length == 0) {
    receiptPagination.textContent = "0 / 0";
    return (e_products.innerHTML = "<span>データなし</span>");
  }
  let currentReceipt = receipts[2][index];
  receiptPagination.textContent = [index + 1, receipts[2].length].join(" / ");
  // checkoutCount.textContent = receipts[2].length.toLocaleString("en-us") + "回";
  checkoutCount.textContent = receipts[1].toLocaleString("en-us") + "回";
  let _totalEarning = 0;
  _totalEarning = receipts[2]
    .map((e) => {
      let _total = 0;
      e[1].forEach((a) => {
        let p = products.find((v) => v[0] == a[0]);
        _total += a[1] * p[2];
      });
      return _total;
    })
    .reduce((acc, crr) => acc + crr, _totalEarning);
  // totalEarning.textContent = "¥" + _totalEarning.toLocaleString("en-us");
  totalEarning.textContent = "¥" + receipts[0].toLocaleString("en-us");
  let _total = 0;
  e_receipt.dataset.receiptId = currentReceipt[0];
  e_products.innerHTML = "";
  currentReceipt[1].forEach((e) => {
    let element = cloneTemplate("basketProductItem");
    let product = products.find((v) => v[0] == e[0]);
    element.querySelector("#name").textContent = product[1];
    element.querySelector("#price").textContent = "¥" + (e[1] * product[2]).toLocaleString("en-us");
    element.querySelector("#count").textContent = e[1] + "点";
    element.querySelector("#productPrice").textContent = "@" + product[2].toLocaleString("en-us");
    element.dataset.cacheId = e[2];
    if (e[1] == 1) [...element.querySelectorAll(".on-multiple")].forEach((e) => (e.style.display = "none"));
    element.querySelector("#checkbox").innerHTML = "";
    e_products.append(element);
    _total += e[1] * product[2];
    e_total.textContent = "¥" + _total.toLocaleString("en-us");
    e_payment.textContent = "¥" + currentReceipt[2].toLocaleString("en-us");
    e_change.textContent = "¥" + (currentReceipt[2] - _total).toLocaleString("en-us");
  });
}

function debug() {
  deleteData("force");
  addExampleProduct(10);
  let _i = 0;
  [...product.children].forEach((e) => {
    purchaseSelect(e);
    addToBasket();
  });
}

function receiptDebug() {
  let a = Math.ceil(Math.random() * 10);
  for (let i = 0; i < a; i++) {
    let b = [...product.children][Math.floor(Math.random() * [...product.children].length)];
    purchaseSelect(b);
    product.dataset.count = Math.ceil(Math.random() * 10);
    addToBasket();
  }
  payment();
  t_payment.dataset.payment = Number(total.dataset.total) + Math.floor(Math.random() * 1500);
  checkout();
  newPurchase();
}

function multipleReceiptDebug(c) {
  for (let i = 0; i < c; i++) {
    receiptDebug();
  }
  Logger("Added " + c + " random receipt");
}
