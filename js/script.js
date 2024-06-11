let numInputType = "none";
let isBasketModify = false;
let products = [["商品名", 1234]];
let receipts = [
  [
    [
      ["商品名", 1234, 3],
      ["商品名", 2345, 1],
    ],
    7000,
  ],
];
let basketProducts = [];
let updatedAt = "1970-1-1-9-0-0";
window.onload = setup();
async function setup() {
  (await checkResolution()) ? removeClass("#overlay", "show") : addClass("#overlay", "show");
  addClassBulk(".Cell:not(.no-border)", "border");
  // addClassBulk(".Cell:not(.no-border)", "border-secondary");
  document.querySelector("html").dataset.bsTheme = colorScheme("light", "dark");
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (_) => {
    document.querySelector("html").dataset.bsTheme = colorScheme("light", "dark");
  });
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
  buttonState(".numpad", false);
  buttonState("#b_addToBasket", false);
  buttonState("#b_checkout", false);
  buttonState("#b_payment", false);
  buttonState("#b_new", false);
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
  Cookies.set("products", JSON.stringify(products), { expires: 100 });
  Cookies.set("receipts", JSON.stringify(receipts), { expires: 100 });
  Cookies.set("updatedAt", datetimeStr("e", new Date()), { expires: 100 });
  Logger("Data saved to storage.");
  loadData();
}
function deleteData(param) {
  let c;
  if (param == "force") {
    c = true;
  } else {
    c = confirm("すべてのデータを消去しますか？");
  }
  if (c) {
    Logger("Removing data from storage...", "warn");
    Cookies.set("products", "", { expires: 0 });
    Cookies.set("receipts", "", { expires: 0 });
    Cookies.set("updatedAt", "", { expires: 0 });
    Logger("Removing data from cache...", "warn");
    products = [];
    receipts = [];
    basketProducts = [];
    updatedAt = "1970-1-1-9-0-0";
    Logger("Initialization completed.", "warn");
    dataSync();
  }
}
function addProduct(name, price) {
  products.push([uuidv7(), name, price, true]);
  saveData();
}
function purchaseSelect(e) {
  if (e.dataset.productId == product.dataset.selectedId) {
    buttonState(".numpad,#b_addToBasket", false);
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
  buttonState(".numpad,#b_addToBasket", true);
  basketDisplay(false);
  // console.log(e);
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
  basketProducts.push([product.dataset.selectedId, count]);
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
    if (e[1] == 1) [...element.querySelectorAll(".on-multiple")].forEach((e) => (e.style.display = "none"));
    basket.append(element);
    _total += e[1] * price;
  });
  total.dataset.total = _total;
  total.textContent = "¥" + _total.toLocaleString("en-us");
  receiptScroll();
}
function receiptScroll() {
  receipt.scrollIntoView({ behavior: "smooth", block: "end" });
}
function addExampleProduct(c = 1) {
  for (let i = 0; i < c; i++) addProduct(randomName(), randomNumber(10, 1200));
}
function payment() {
  if (isBasketModify) {
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
      product.dataset.count = "";
      product.querySelector(".active #productPrice").textContent = 1;
      break;
    case "payment":
      t_payment.dataset.payment = "";
      t_payment.textContent = "¥" + Number(0).toLocaleString("en-us");
      break;
    case "none":
      modifyBasket();
      break;
  }
}
function buttonState(target, state) {
  [...document.querySelectorAll(target)].forEach((e) => {
    state ? e.classList.contains("disabled") && e.classList.remove("disabled") : e.classList.contains("disabled") || e.classList.add("disabled");
  });
}
function newPurchase() {
  receipts.push([basketProducts, Number(t_payment.dataset.payment)]);
  saveData();
  basketDisplay(true);
  buttonState("#b_cancel", true);
  receipt.querySelector(".payment").classList.add("hidden");
  t_payment.dataset.payment = "";
  t_payment.textContent = "¥" + Number(0).toLocaleString("en-us");
  receipt.querySelector(".change").classList.add("hidden");
  t_change.textContent = "¥" + Number(0).toLocaleString("en-us");
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

function debug() {
  deleteData("force");
  addExampleProduct(10);
  let _i = 0;
  [...product.children].forEach((e) => {
    purchaseSelect(e);
    addToBasket();
  });
}
