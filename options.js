function saveOptions(e) {
  e.preventDefault();
  browser.storage.sync.set({
    newtab: document.querySelector("#newtab").value,
    count: document.querySelector("#count").value
  });
}

function restoreOptions() {
  function setNewTab(result) {
    document.querySelector("#newtab").value = result.newtab || "false";
  }

  function setCount(result) {
    document.querySelector("#count").value = result.count || "true";
  }

  function onError(error) {
    console.log(`Error: ${error}`);
  }

  const newtab = browser.storage.sync.get("newtab");
  newtab.then(setNewTab, onError);

  const count = browser.storage.sync.get("count");
  count.then(setCount, onError);
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
