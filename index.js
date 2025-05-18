let OnDeck = module.exports = {}; // Skeleton
let Trakt = {}; // the main API for trakt (npm: 'trakt.tv')

// Initialize the module
OnDeck.init = (trakt) => {
    Trakt = trakt;
};

const findLargest = (arr) => {
    var largest = arr[0];
    for (var i = 0; i < arr.length; i++) {
        if (largest < arr[i] ) largest = arr[i];
    }
    return largest;
};

OnDeck.getAll = (watchedArray = []) => {
    let timestamp = null, temp = [], ondeck = [], hidden = [], watched = {};

    return Trakt.sync.last_activities().then((lastActivities) => {
        Trakt._debug('Get new timestamp from sync/last_activities');
        timestamp = findLargest([lastActivities.episodes.watched_at, lastActivities.seasons.watched_at, lastActivities.shows.watched_at]);
    }).then(() => {
        if (watchedArray.length) {
            return watchedArray;
        } else {
            Trakt._debug('Get sync/watched/shows');
            return Trakt.sync.watched({
                type:'shows',
                extended:'full,noseasons'
            });
        }
    }).then((watchedShows) => {
        watched = watchedShows; // store sync/watched/shows in 'watched'
        Trakt._debug('Get hidden items from users/me/hidden/progress_watched');
        return Trakt.users.hidden.get({
            section: 'progress_watched',
            type: 'show',
            limit: 100
        });
    }).then((hiddenItems) => {
        return Promise.all(hiddenItems.map((item) => {
            hidden.push(item.show.ids.slug);
        }));
    }).then(() => {
        Trakt._debug('Get hidden items from users/me/hidden/dropped');
        return Trakt.users.hidden.get({
            section: 'dropped',
            type: 'show',
            limit: 100
        });
    }).then((hiddenItems) => {
        return Promise.all(hiddenItems.map((item) => {
            hidden.push(item.show.ids.slug);
        }));
    }).then(() => {
        Trakt._debug('Remove hidden items from watched shows');
        return Promise.all(watched.map((show) => {
            if (hidden.indexOf(show.show.ids.slug) === -1) {
                temp.push(show); // store non-hidden shows in 'temp'
            } else {
                Trakt._debug('Remove hidden show: ' + show.show.title);
            }
        }));
    }).then(() => {
        return Promise.all(temp.map((show) => {
            Trakt._debug('Get shows/id/progress/watched for: ' + show.show.title);
            return Trakt.shows.progress.watched({
                extended: 'full',
                id: show.show.ids.slug,
                hidden: false,
                specials: false
            }).then((progress) => {
                if (progress.next_episode && progress.aired > progress.completed) {                    
                    ondeck.push({
                        show: show.show,
                        next_episode: progress.next_episode,
                        unseen: progress.aired - progress.completed
                    }); // store shows with next_episode in 'ondeck'
                }
            }).catch((err) => {
                return {};
            });
        }));
    }).then(() => {
        Trakt._debug('Get watchlisted shows from sync/watchlist/shows');
        return Trakt.sync.watchlist.get({
            extended: 'full',
            type:'shows'
        });
    }).then((watchlisted) => {
        return Promise.all(watchlisted.map((show) => {
            Trakt._debug('Get details of s01e01 for: ' + show.show.title);
            return Trakt.episodes.summary({
                extended: 'full',
                id: show.show.ids.slug,
                season: 1,
                episode: 1
            }).then((episode) => {
                if (show.show.aired_episodes) { // some shows dont have aired episodes yet
                    ondeck.push({
                        show: show.show,
                        next_episode: episode,
                        unseen: show.show.aired_episodes
                    }); // store formatted shows from watchlist in 'ondeck'
                }
            }).catch((err) => {
                return {};
            });
        }));
    }).then(() => {
        return {
            shows: ondeck,
            last_watched: timestamp
        };
    });
};

OnDeck.updateOne = (input, slug) => {
    if (!input) throw new Error('Missing input, use .ondeck.getAll()');
    if (!slug) throw new Error('Missing trakt slug');

    let timestamp = null, output = [];
    return Trakt.sync.last_activities().then((lastActivities) => {
        timestamp = findLargest([lastActivities.episodes.watched_at, lastActivities.seasons.watched_at, lastActivities.shows.watched_at]);
        // if one of the watched_at is more recent than the stored one
        if (input.last_watched < timestamp) {
            return Promise.all(input.shows.map((show, index) => {
                // verify slug was indeed in input
                if ([
                    show.show.ids.slug,
                    show.show.ids.imdb,
                    show.show.ids.tmdb,
                    show.show.ids.trakt,
                    show.show.ids.tvdb,
                    show.show.ids.tvrage
                ].indexOf(slug) !== -1) {
                    // get new next_episode
                    Trakt._debug('Get new next_episode for', slug);
                    return Trakt.shows.progress.watched({
                        extended: 'full',
                        id: slug,
                        hidden: false,
                        specials: false
                    }).then((progress) => {
                        if (progress.next_episode && (new Date(progress.next_episode.first_aired).getTime() < Date.now())) {
                            output.push({
                                show: input.shows[index].show,
                                next_episode: progress.next_episode,
                                unseen: input.shows[index].unseen - 1
                            });
                        }
                    }).catch((err) => {
                        return {};
                    });
                } else {
                    output.push(show);
                }
            }));
        } else {
            Trakt._debug('No update');
            output = input.shows;
        }
    }).then(() => {
        return {
            shows: output,
            last_watched: timestamp
        };
    });
};
