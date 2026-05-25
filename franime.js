function getStreams(tmdbId, mediaType, season, episode) {
    return new Promise((resolve) => {
        if (mediaType !== "tv") return resolve([]); // Filtre d'optimisation
        
        fetch("https://api.themoviedb.org/3/tv/" + tmdbId + "?api_key=844421298d0e70291c73878c0780f41d&language=fr-FR")
            .then(res => res.json())
            .then(meta => {
                // Recherche par le nom de l'anime simplifié
                const animeName = encodeURIComponent(meta.name.split(':')[0]);
                return fetch("https://franime.fr/api/anime/search?q=" + animeName);
            })
            .then(res => res.json())
            .then(data => {
                if (!data || data.length === 0) return resolve([]);
                // Récupération de l'ID interne FrAnime
                const slug = data[0].slug;
                // Épisode par défaut à 1 si non spécifié par Nuvio
                const epNum = episode || 1;
                return fetch("https://franime.fr/api/anime/" + slug + "/episode/" + epNum);
            })
            .then(res => res ? res.json() : null)
            .then(epData => {
                if (!epData || !epData.players) return resolve([]);
                const streams = [];
                // FrAnime renvoie directement un dictionnaire de players (Voe, Sendvid, etc)
                for (let p in epData.players) {
                    streams.push({
                        name: "FrAnime (" + p + ")",
                        title: "Épisode " + episode,
                        url: epData.players[p],
                        quality: "720p"
                    });
                }
                resolve(streams);
            })
            .catch(() => resolve([]));
    });
}
globalThis.getStreams = getStreams;
