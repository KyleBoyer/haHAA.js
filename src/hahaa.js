(($) => {

  //if (typeof(localStorage) !== undefined)
  let previousStorage = localStorage.getItem("hahaa-js");

  function getApiPromise() {
    return Promise.all([new Promise(getTwitchEmotes), new Promise(getBTTVEmotes)]);
  }

  /**
   * Get global.json from TwitchEmotes API using a Promise
   * @param  {resolve} res Promise resolver
   * @param  {reject} rej Promise rejector
   */
  function getTwitchEmotes(res, rej) {
    $.get('https://twitchemotes.com/api_cache/v2/global.json',
      (data) => {
        res(data);
      });
  }

  function getBTTVEmotes(res, rej) {
    $.get('https://api.betterttv.net/2/emotes/',
      (data, status) => {
        res(data);
      });
  }

  /**
   * Default handler for promise rejection
   */
  function cannotUpdate() {
    console.log("Could not get emote list, you will only have Kappas Kappa");

    window.KappaJS = { 
      "timestamp": 0,
      "twitch": {
        "meta":{"generated_at":"2016-09-10T19:40:04Z"},
        "template":{
          "small":"https:\/\/static-cdn.jtvnw.net\/emoticons\/v1\/{image_id}\/1.0",
          "medium":"https:\/\/static-cdn.jtvnw.net\/emoticons\/v1\/{image_id}\/2.0",
          "large":"https:\/\/static-cdn.jtvnw.net\/emoticons\/v1\/{image_id}\/3.0"
        },
        "emotes": {
          "Kappa" : {"description":"This is the face of Josh, a former Justin.tv employee. Kappa is generally used to indicate sarcasm or trolling.","image_id":25,"first_seen":null}
        }
      },
      "bttv": {
        "emotes": {}
      }
    }
    twitchEmotesRegExp = new RegExp("\\b(" + Object.keys( KappaJS.twitch.emotes ).join("|") + ")\\b", "g");
  }
  /**
   * Generates a regex for the default twich tv emotes
   */
  function emotesRegex(obj) {
    return new RegExp("\\b(" + Object.keys(obj.emotes).join("|") + ")\\b", "g");
  }

  
  function betterTwichEmotesRegex(obj) {
    return new RegExp("\\b(" + Object.keys(obj.emotes).map((e) => {
      return e.replace(/([(\')])/g, '\\$1'); // escape parenthesis and single quotes
    }).join("|") + ")\\b", "g"); // FIXME :tf: (puke) and others are not being matched due to word break (\b) behavior
  }

  /**
   * Coerce the BTTV data into an object with emote names as keys
   */
  function buildBttvObject(data) {
    var out = {
      urlTemplate: data.urlTemplate,
      emotes: {}
    };
    data.emotes.forEach((emote) => {
      out.emotes[emote.code] = emote;
    })
    return out;
  }

  /**
   * Creates the app data object and regexes
   */
  function buildAppObjects() {
    getApiPromise().then((data) => {
      window.KappaJS = {
        timestamp: new Date().getTime() // keep the time to implement expiration
      };
      window.KappaJS.twitch = data[0];
      window.KappaJS.bttv = buildBttvObject(data[1]);
      localStorage.setItem("hahaa-js", JSON.stringify(window.KappaJS));
      twitchEmotesRegExp = emotesRegex(window.KappaJS.twitch);
      bttvEmotesRegex = betterTwichEmotesRegex(window.KappaJS.bttv);
    }, cannotUpdate); // reject
  }

  var twitchEmotesRegExp = /\\b(Kappa)\\b/g;
  var bttvEmotesRegex = /\\b(haHAA|LUL)\\b/g;
  
  const expireTime = 2.592E8; // 3 Days

  function cacheExpired() {
    // this is faster than parsing the JSON
    var start = previousStorage.indexOf('"timestamp":') + '"timestamp":'.length;
    var end = previousStorage.indexOf(',', start);
    var timestamp = parseInt(previousStorage.substring(start, end));
    return (new Date().getTime() - timestamp > expireTime);
  }

  if (previousStorage !== null) {
    if (cacheExpired()) {
      // rebuild the cache every 3 days
      console.log('Rebuilding Emote data cache')
      buildAppObjects();
    } else {
      window.KappaJS = JSON.parse(previousStorage);
      twitchEmotesRegExp = emotesRegex(window.KappaJS.twitch);
      bttvEmotesRegex = betterTwichEmotesRegex(window.KappaJS.bttv);
    }
  } else {
     buildAppObjects();
  }


  /**
   * Initialize jQuery Plugin
   * @return {this} DOM element
   */
  $.fn.kappa = function(settings) {

    /**
     * Hoist `this`
     * Needed if KappaJS is not ready
     */
    let self = this;

    /**
     * Define default plugin configuration
     * @param  {String} {customClass} Custom class to added to generatated <img> tags
     * @param  {String} {emoteSize} Template size for emotes
     */
    let config = $.extend({
      customClass: null,
      emoteSize: 'small'
    }, settings);

    /**
     * Generator <img> tag
     * @param  {String} {image_id} Emote Id
     * @return {String} Generated <img> tag
     */
    function generateImgTag({image_id}, name) {
      return [
        '<img src="',
        KappaJS.twitch.template[config.emoteSize].replace('{image_id}', image_id),
        '" ',
        (config.customClass === null) ? '' : `class="${config.customClass}" `,
        'alt="',
        name,
        '">'
      ].join(''); // nice concatenation LUL
    }

    function generateBTTVImg({id, code}) {
      return '<img src="https:'+KappaJS.bttv.urlTemplate.replace('{{id}}/{{image}}', id+'/1x"')
      +' alt="'+code+'">'; // TODO implement size options
    }

    /**
     * Wait for KappaJS to be attached to window
     * Replace text with emotes once attached
     */
    function waitKappaJS() {
      let watch = setInterval(() => {
        if(typeof window.KappaJS !== 'undefined') {
          replaceTextWithEmotes();
          clearInterval(watch);
        }
      }, 500);
    }

    /**
     * Loop through all emoteSize
     * Find known emotes using RegExp
     * Replace with generated <img> tag
     */
    function replaceTextWithEmotes() {
      $(self).each((i, el) => {
        $(el).html(
          $(el).html().replace(
            twitchEmotesRegExp,
            function(all, emote){ return generateImgTag(KappaJS.twitch.emotes[emote], emote) }
          )
        );
        $(el).html($(el).html().replace(
          bttvEmotesRegex,
          function(all, emote){ return generateBTTVImg(KappaJS.bttv.emotes[emote], emote) }
        )
      );
      })
    }

    /**
     * Check for KappaJS
     * Start watcher if not ready
     * Replace if ready
     */
    if(typeof window.KappaJS === 'undefined') {
      waitKappaJS();
    } else replaceTextWithEmotes();

  };

})(jQuery);
