let isDebug = Searchs()["debug"] == "true";
iziToast.settings({
  timeout: 2500,
});
function checkResolution() {
  let widthIncomplete = [screen.width - 1440, window.outerWidth - 1440, window.innerWidth - 1440].filter((e) => e < 0).length,
    heightIncomplete = [screen.height - 900, window.outerHeight - 900, window.innerHeight - 900].filter((e) => e < 0).length;
  if (widthIncomplete + heightIncomplete == 0) return true;
  else return false;
}
function addClass(selector, _class) {
  document.querySelector(selector).classList.add(_class);
}
function addClassBulk(selector, _class) {
  [...document.querySelectorAll(selector)].forEach((e) => e.classList.add(_class));
}
function removeClass(selector, _class) {
  let e = document.querySelector(selector + "." + _class);
  e && e.classList.remove(_class);
}
function removeClassBulk(selector, _class) {
  let e = [...document.querySelectorAll(selector + "." + _class)];
  e.length && e.forEach((e) => e.classList.remove(_class));
}
function colorScheme(light, dark) {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? dark : light;
}
function avoidBlank(selector) {
  [...document.querySelectorAll(selector)].forEach((e) => {
    if (e.innerHTML == "") e.textContent = "Lorem ipsum dolor sit amet no lorem...";
  });
}
function datetimeStr(mode, data) {
  let returnData = "";
  switch (mode) {
    case "e":
      let datetime = [data.getFullYear(), data.getMonth() + 1, data.getDate(), data.getHours(), data.getMinutes(), data.getSeconds()].join("-");
      returnData = datetime;
      break;
    case "c":
      returnData = [
        [String(data.getFullYear()).padStart(4, 0), String(data.getMonth() + 1).padStart(2, 0), String(data.getDate()).padStart(2, 0) + " "].join("/"),
        [String(data.getHours()).padStart(2, 0), String(data.getMinutes()).padStart(2, 0), String(data.getSeconds()).padStart(2, 0)].join(":"),
        "." + String(data.getMilliseconds()).padStart(3, 0),
      ].join("");
      break;
    case "d":
      let datetimeArr = data.split("-").map(Number);
      datetimeArr[1]--;
      returnData = new Date(...datetimeArr);
      break;
    default:
      returnData = Logger("modeに予期せぬ値が与えられました", "e");
  }
  return returnData;
}
function Logger(content, type = "log") {
  switch (type) {
    case "debug":
    case "d":
      console.debug(datetimeStr("c", new Date()) + " | " + content);
      isDebug &&
        iziToast.show({
          color: "blue",
          title: "Debug",
          message: content,
        });
      break;
    case "log":
    case "l":
      console.log(datetimeStr("c", new Date()) + " | " + content);
      isDebug &&
        iziToast.show({
          title: "",
          message: content,
        });
      break;
    case "warn":
    case "w":
      console.warn(datetimeStr("c", new Date()) + " | " + content);
      isDebug &&
        iziToast.warning({
          title: "Warning",
          message: content,
        });
      break;
    case "error":
    case "e":
    case "err":
      console.error(datetimeStr("c", new Date()) + " | " + content);
      isDebug &&
        iziToast.error({
          title: "Error",
          message: content,
        });
      break;
    case "info":
    case "i":
      console.info(datetimeStr("c", new Date()) + " | " + content);
      isDebug &&
        iziToast.info({
          title: "Info",
          message: content,
        });
      break;
  }
}
function cloneTemplate(name) {
  return document.querySelector("template#" + name).content.cloneNode(true).children[0];
}
function randomItemFromArray(array) {
  if (typeof array != "object") return Logger("不正な値です", "e");
  return array[Math.floor(Math.random() * array.length)];
}
function randomName() {
  const adjective =
    "amazing,bad,beautiful,brave,bright,busy,cheap,common,delicious,fast,final,foolish,fresh,funny,general,golden,happy,heavy,honest,hungry,kind,lonely,lucky,new,original,patient,poor,pretty,proud,real,sharp,sweet,wild,ancient,awful,bitter,brilliant,colorful,compact,crazy,dangerous"
      .split(",")
      .map((e) => e[0].toUpperCase() + e.slice(1));
  const noun =
    "apple,pear,peach,plum,apricot,cherry,prune,olive,chestnut,walnut,peanut,almond,mandarin,orange,dekopon,pomelo,lemon,lime,strawberries,grape,blueberry,raspberry,melon,pumpkin,cucumber,paprika,tomato,eggplant,corn,banana,mango,papaya,avocado,guava,acerola,acai,coconut,dog,cat,dolphin,rabbit,cow,ox,wolf"
      .split(",")
      .map((e) => e[0].toUpperCase() + e.slice(1));
  return randomItemFromArray(adjective) + randomItemFromArray(noun);
}
function randomNumber(min, max) {
  return Math.floor(Math.random() * (max + 1 - min)) + min;
}
function countloop(f, t) {
  for (let i = 0; i < t; i++) f();
}
function Searchs() {
  let url = new URL(location.href);
  let b = {};
  url.searchParams.forEach((v, k) => (b[k] = v));
  return b;
}
function arrayRemove(array, index) {
  delete array[index];
  return array.filter(Boolean);
}
