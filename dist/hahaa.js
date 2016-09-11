'use strict';

(function ($) {

  function init() {
    return Promise.all([new Promise(getTwitchEmotesPromise), new Promise(getBTTVEmotes)]);
  }

  /**
   * Get global.json from TwitchEmotes API using a Promise
   * @param  {resolve} res Promise resolver
   * @param  {reject} rej Promise rejector
   */
  function getTwitchEmotesPromise(res, rej) {
    $.get('https://twitchemotes.com/api_cache/v2/global.json', function (data) {
      res(data);
    });
  }

  function getBTTVEmotes(res, rej) {
    $.get('https://api.betterttv.net/2/emotes/', function (data, status) {
      res(data);
    });
  }

  /**
   * Default handler for promise rejection
   */
  function cannotUpdate() {
    console.log("Could not get emote list, you will only have Kappas Kappa");

    window.KappaJS = {
      "twitch": {
        "meta": { "generated_at": "2016-09-10T19:40:04Z" },
        "template": {
          "small": "https:\/\/static-cdn.jtvnw.net\/emoticons\/v1\/{image_id}\/1.0",
          "medium": "https:\/\/static-cdn.jtvnw.net\/emoticons\/v1\/{image_id}\/2.0",
          "large": "https:\/\/static-cdn.jtvnw.net\/emoticons\/v1\/{image_id}\/3.0"
        },
        "emotes": {
          "Kappa": { "description": "This is the face of Josh, a former Justin.tv employee. Kappa is generally used to indicate sarcasm or trolling.", "image_id": 25, "first_seen": null }
        }
      },
      "bttv": {
        "emotes": {}
      }
    };
    twitchEmotesRegExp = new RegExp("\\b(" + Object.keys(KappaJS.twitch.emotes).join("|") + ")\\b", "g");
  }
  /**
   * Generates a regex for the default twich tv emotes
   */
  function emotesRegex(obj) {
    return new RegExp("\\b(" + Object.keys(KappaJS.twitch.emotes).join("|") + ")\\b", "g");
  }

  function betterTwichEmotesRegex(obj) {
    return new RegExp("\\b(" + obj.emotes.map(function (e) {
      return e.code.replace(/([(\')])/g, '\\$1'); // escape parenthesis and single quotes
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
    console.log(data);
    data.emotes.forEach(function (emote) {
      out.emotes[emote.code] = emote;
    });
    return out;
  }

  var twitchEmotesRegExp = /\\b(Kappa)\\b/g;
  var bttvEmotesRegex = /\\b(haHAA|LUL)\\b/g;

  init().then(function (data) {
    window.KappaJS = {};
    window.KappaJS.twitch = data[0];
    window.KappaJS.bttv = buildBttvObject(data[1]);
    twitchEmotesRegExp = emotesRegex(data[0]);
    bttvEmotesRegex = betterTwichEmotesRegex(data[1]);
  }, cannotUpdate); // reject 

  console.log(twitchEmotesRegExp);

  /**
   * Initialize jQuery Plugin
   * @return {this} DOM element
   */
  $.fn.kappa = function (settings) {

    /**
     * Hoist `this`
     * Needed if KappaJS is not ready
     */
    var self = this;

    /**
     * Define default plugin configuration
     * @param  {String} {customClass} Custom class to added to generatated <img> tags
     * @param  {String} {emoteSize} Template size for emotes
     */
    var config = $.extend({
      customClass: null,
      emoteSize: 'small'
    }, settings);

    /**
     * Generator <img> tag
     * @param  {String} {image_id} Emote Id
     * @return {String} Generated <img> tag
     */
    function generateImgTag(_ref, name) {
      var image_id = _ref.image_id;

      return ['<img src="', KappaJS.twitch.template[config.emoteSize].replace('{image_id}', image_id), '" ', config.customClass === null ? '' : 'class="' + config.customClass + '" ', 'alt="', name, '">'].join(''); // nice concatenation LUL
    }

    function generateBTTVImg(_ref2) {
      var id = _ref2.id;
      var code = _ref2.code;

      return '<img src="https:' + KappaJS.bttv.urlTemplate.replace('{{id}}/{{image}}', id + '/1x"') + ' alt="' + code + '">'; // TODO implement size options
    }

    /**
     * Wait for KappaJS to be attached to window
     * Replace text with emotes once attached
     */
    function waitKappaJS() {
      var watch = setInterval(function () {
        if (typeof window.KappaJS !== 'undefined') {
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
      $(self).each(function (i, el) {
        $(el).html($(el).html().replace(twitchEmotesRegExp, function (all, emote) {
          return generateImgTag(KappaJS.twitch.emotes[emote], emote);
        }));
        $(el).html($(el).html().replace(bttvEmotesRegex, function (all, emote) {
          return generateBTTVImg(KappaJS.bttv.emotes[emote], emote);
        }));
      });
    }

    /**
     * Check for KappaJS
     * Start watcher if not ready
     * Replace if ready
     */
    if (typeof window.KappaJS === 'undefined') {
      waitKappaJS();
    } else replaceTextWithEmotes();
  };
})(jQuery);