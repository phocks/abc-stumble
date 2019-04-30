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
  const getNextStoryLink = (stories, alreadyOpened) => {
    for (let story of stories) {
      if (alreadyOpened.includes(story.link)) continue;
      else return story.link;
    }
  };

  const nextStory = getNextStoryLink(stories, openedStories);

  openedStories.push(nextStory);

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
