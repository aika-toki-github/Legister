let mode = "purchase"; // purchase, checkout, cancelPurchase, product, receipt
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
    updatedAt = "1970-1-1-9-0-0";
    Logger("Initialization completed.", "warn");
    dataSync();
  }
}
function drawProducts() {
  document.querySelector("#product").hasChildNodes() && [...document.querySelector("#product").children].forEach((e) => e.remove());
  products.forEach((e, i) => {
    let [id, name, price, enable] = e;
    if (enable) {
      let element = cloneTemplate("purchasableProductItem");
      element.querySelector("#productName").textContent = name;
      element.querySelector("#productPrice").textContent = price.toLocaleString("en-us");
      element.dataset.productId = id;
      element.addEventListener("click", (e) => purchaseSelect(e.target));
      document.querySelector("#product").append(element);
    }
  });
}
function addProduct(name, price) {
  products.push([uuidv7(), name, price, true]);
  saveData();
}
function purchaseSelect(e) {
  [...product.querySelectorAll(".btn-primary")].forEach((e) => {
    e.classList.add("btn-secondary");
    e.classList.remove("btn-primary");
  });
  e.classList.remove("btn-secondary");
  e.classList.add("btn-primary");
  product.dataset.selectedId = e.dataset.productId;
  console.log(e);
}
