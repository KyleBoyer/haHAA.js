[Kappa]: http://static-cdn.jtvnw.net/emoticons/v1/25/1.0
[haHAA]: https://cdn.betterttv.net/emote/555981336ba1901877765555/2x

# ![haHAA Emote][haHAA] haHAA.js
haHAA.js is a fork of [Kappa.js](https://github.com/SimulatedGREG/Kappa.js) by SimulatedGREG.  In addition to the functionality of Kappa.js, 
haHAA.js also finds and replaces [Better Twitch TV](http://nightdev.com/betterttv/) emote text with icons.

## Usage
Presently the jQuery plugin interface is unchanged.
```html
        <p class="hahaa">haHAA nice meme haHAA</p>
        <script src="hahaa.js"></script>
        <script>
            $(document).ready(function() {
              $('.hahaa').kappa();
            });
        </script>
    </body>
</html>
```
## How it works
haHAA.js uses the [BetterTTV emote API](https://api.betterttv.net/2/emotes/) to get a current list of supported emotes.

It can also cache data in local storage to avoid making API calls, making the script
more responsive. 
The cache is refreshed every 3 days to see if there new emotes from the API.