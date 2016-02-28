### Trakt.tv OnDeck
Extends https://github.com/vankasteelj/trakt.tv node module, in order to get the equalivalent of "on deck to watch"

NOTICE: requires trakt.tv module! Load this plugin directly through `trakt.tv` module.

1) Install:

```npm install trakt.tv trakt.tv-ondeck```

2) Load the plugin:

```js
var Trakt = require('trakt.tv');
var trakt = new Trakt({
    client_id: '',
    client_secret: '',
    plugins: ['ondeck']
});
```

3) Log in with trakt.tv, then call "ondeck":
```js
trakt.ondeck.getAll().then(function (results) {
    console.log(results)
});
```

License MIT, (c) vankasteelj