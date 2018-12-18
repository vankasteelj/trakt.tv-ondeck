### Trakt.tv OnDeck
Extends https://github.com/vankasteelj/trakt.tv node module, in order to get the equivalent of "on deck to watch"

NOTICE: requires trakt.tv module! Load this plugin directly through `trakt.tv` module.

1) Install:

```npm install trakt.tv trakt.tv-ondeck```

2) Load the plugin:

```js
const Trakt = require('trakt.tv');
let trakt = new Trakt({
    client_id: '',
    client_secret: '',
    plugins: {
        ondeck: require('trakt.tv-ondeck')
    }
});
```

3) Log in with trakt.tv, then call "ondeck":
```js
let onDeckToWatch = {};
trakt.ondeck.getAll().then(function (results) {
    onDeckToWatch = results;
    console.log(onDeckToWatch);
});
```
*Note: you can bypass the builtin `trakt.sync.watched({type:'shows'})` by passing the resulting array as an argument, i.e. `trakt.ondeck.getAll(watchedArray)`*

4) To avoid calling getAll() everytime, you can use updateOne() after an episode was seen:
```js
// let's say we just watched Arrow 01x01 - Pilot that was on the 'on deck' propositions
trakt.ondeck.updateOne(onDeckToWatch, 'arrow').then(function (updatedResults) {
    onDeckToWatch = updatedResults;
    console.log(updatedResults);
});
```
_note: 'arrow' is the slug, you can also use an ID like imdb if you want. onDeckToWatch is the exact object you recieved from getAll()_

---
License MIT, (c) vankasteelj
