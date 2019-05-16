const parser = require('fast-xml-parser');

let stories;
let openedStories = [];
let options = {};
let newStoryCount = 0;

const getLatest = () => {
  // Fetches latest story and sets it in global
  fetch('https://newsy.glitch.me/api/rss')
    .then(res => res.text())
    .then(text => {
      const jsonObj = parser.parse(text);
      stories = jsonObj.rss.channel.item;

      updateStoryCount();
    });
};

function updateStoryCount() {
  newStoryCount = 0;

  if (openedStories > 0) {
    for (let story of stories) {
      if (story.link === openedStories[openedStories.length - 1]) break;
      else newStoryCount++;
    }
  }

  console.log(newStoryCount);
  console.log(openedStories[openedStories.length - 1]);
  console.log(stories[0].link);

  if (newStoryCount === 0)
    browser.browserAction.setBadgeText({
      text: '0'
    });
  else browser.browserAction.setBadgeText({ text: newStoryCount.toString() });
}

function onCreated(tab) {}

function onError(error) {
  console.log(`Error: ${error}`);
}

browser.browserAction.onClicked.addListener(function() {
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

  if (options.newtab === 'true') {
    browser.tabs
      .create({
        url: nextStory
      })
      .then(onCreated, onError);
  } else {
    var updating = browser.tabs.update({ url: nextStory });
    updating.then(() => {}, () => {});
  }

  newStoryCount = 0;
});

browser.alarms.create('get-stories', { periodInMinutes: 1 });

browser.alarms.onAlarm.addListener(alarmInfo => {
  getLatest();
});

const getOptions = (changes, area) => {
  var changedItems = Object.keys(changes);

  for (var item of changedItems) {
    options = { ...options, [item]: changes[item].newValue };
  }
};

// Initial grab of stories on load
getLatest();
browser.storage.onChanged.addListener(getOptions);

// function decrementNewStoryCount() {
//   if (newStoryCount > 0) {
//     browser.browserAction.setBadgeText({ text: (--newStoryCount).toString() });
//   }
// }

// browser.browserAction.onClicked.addListener(decrementNewStoryCount);
