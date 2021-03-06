// @ts-nocheck
const parser = require("fast-xml-parser");
const _ = require("lodash");

const TIME_BETWEEN_FETCH_STORIES = 5; // In minutes

let stories;
let openedStories = [];
let newStoryCount = 1;

// Set some defaults
let options = { count: "true", newTab: "false" };

const getLatest = () => {
  // Fetches latest story and sets it in global
  // (cached if no change detected)
  fetch("https://www.abc.net.au/news/feed/51120/rss.xml")
    .then((res) => res.text())
    .then((text) => {
      console.log(text);
      const jsonObj = parser.parse(text);
      stories = jsonObj.rss.channel.item;

      // Wait till we get the stories otherwise it doesn't
      // seem to get storage
      const storage = browser.storage.sync.get();
      storage.then(
        (gotOptions) => {
          if (!_.isEmpty(gotOptions)) options = gotOptions;

          if (options.count === "true") {
            updateStoryCount();
          } else {
            browser.browserAction.setBadgeText({ text: "" });
          }
        },
        () => console.error("Error getting options")
      );
    });
};

// Counts how many new stories since last story
function updateStoryCount() {
  if (openedStories.length > 0) {
    newStoryCount = 0;
    for (let story of stories) {
      if (openedStories.includes(story.link)) break;
      else newStoryCount++;
    }
  }

  if (newStoryCount === 0) browser.browserAction.setBadgeText({ text: "" });
  else browser.browserAction.setBadgeText({ text: newStoryCount.toString() });
}

function onCreated(tab) {}

function onError(error) {
  console.error(`Error: ${error}`);
}

browser.browserAction.onClicked.addListener(function () {
  // Loops through recent articals and returns the first one
  // that hasn't been stumbled before
  const getNextStoryLink = (stories, alreadyOpened) => {
    for (let story of stories) {
      if (alreadyOpened.includes(story.link)) continue;
      else return story.link;
    }
    // If all articles have been seen:
    // clear seen stories and return back to start
    openedStories = [];
    return stories[0];
  };

  const nextStory = getNextStoryLink(stories, openedStories);

  openedStories.push(nextStory);

  // Don't let array get too big
  if (openedStories.length > 256) openedStories.shift();

  if (options.newtab === "true") {
    browser.tabs
      .create({
        url: nextStory,
      })
      .then(onCreated, onError);
  } else {
    var updating = browser.tabs.update({ url: nextStory });
    updating.then(
      () => {},
      () => {}
    );
  }

  // Only update if we want to show article count
  if (options.count === "true") {
    newStoryCount--;
    if (newStoryCount < 0) newStoryCount = 0;
    if (newStoryCount === 0) browser.browserAction.setBadgeText({ text: "" });
    else browser.browserAction.setBadgeText({ text: newStoryCount.toString() });
  }
});

browser.alarms.create("get-stories", { periodInMinutes: TIME_BETWEEN_FETCH_STORIES });

browser.alarms.onAlarm.addListener((alarmInfo) => {
  getLatest();
});

const getChangedOptions = (changes, area) => {
  var changedItems = Object.keys(changes);

  for (var item of changedItems) {
    options = { ...options, [item]: changes[item].newValue };
  }

  getLatest();
};

// Initial grab of stories on load
getLatest();

// Set listener for changed options
browser.storage.onChanged.addListener(getChangedOptions);
