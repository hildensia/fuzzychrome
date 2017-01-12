var Helper = (function () {
  var values = function(dict) {
    return Object.keys(dict).map(function(v) { return dict[v]; });
  };

  return {
    values: values
  };
})();

var FuzzyChrome = (function () {
  var tabs = {};
  var defaultTabId = 1;
  var fuse_opts = {
    include: ["score","matches"],
    shouldSort: true,
    threshold: 0.6,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    keys: [
      "title",
      "url",
      "id"
    ]
  };
  var fuse = new Fuse(Helper.values(tabs), fuse_opts);

  var init = function() {
    chrome.tabs.query({}, function(tabs) {
      tabs.forEach(function(tab) {
        updateTab(tab.id, {url: tab.url, titel: tab.title}, tab);
      });  
    });

    chrome.tabs.onUpdated.addListener(updateTab);
    chrome.omnibox.onInputChanged.addListener(search);
    chrome.omnibox.onInputEntered.addListener(entered);

  };

  var updateTab = function(tabId, changeInfo, tab) {
    if(changeInfo.url != "" || changeInfo.title != "") {
      tabs[tabId] = 
        { "id": tabId,
          "url": tab.url,
          "title": tab.title
        };
      fuse.set(Helper.values(tabs));
    }
  };

  var search = function(search_string, suggest) {
    results = fuse.search(search_string);
    suggestions = [];
    results.forEach(function(result) {
       suggestions.push({ content: result.item.url + " # " + result.item.id, 
                          description: result.item.title })
    });
    defaultTabId = results[0].item.id;
    suggest(suggestions);
  };
  
  var entered = function(text, disposition) {
    re = /(.*) # (\d*)/;
    match = re.exec(text);
    if(match == null) {
      tabId = parseInt(defaultTabId);
    }
    else {
      tabId = parseInt(match[2]);
    }
    chrome.tabs.update(tabId, {'active': true});
  };

  return {
    init: init,
  };
})();

FuzzyChrome.init();
