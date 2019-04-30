const parser = require('fast-xml-parser');

let stories;
let openedStories = [];

const getLatest = () => {
  // Fetches latest story and sets it in global
  fetch('https://newsy.glitch.me/api/rss')
    .then(res => res.text())
    .then(text => {
      const jsonObj = parser.parse(text);
      stories = jsonObj.rss.channel.item;
    });
};

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

  browser.tabs
    .create({
      url: nextStory
    })
    .then(onCreated, onError);
});

browser.alarms.create('get-stories', { periodInMinutes: 5 });

browser.alarms.onAlarm.addListener(alarmInfo => {
  getLatest();
});

// Initial grab of stories on load
getLatest();
