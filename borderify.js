function onError(error) {
  console.log(`Error: ${error}`);
}

function onGot(item) {
  var color = "blue";
  if (item.color) {
    color = item.color;
  }
  console.log(color)
  document.body.style.border = "10px solid " + color;
}

var getting = browser.storage.sync.get("color");
getting.then(onGot, onError);

