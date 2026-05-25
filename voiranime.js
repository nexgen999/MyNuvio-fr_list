function getStreams(tmdbId, mediaType, season, episode) {
    return new Promise((resolve) => {
        if (mediaType !== "tv") return resolve([]);

        // Résolution dynamique du bon sous-domaine de VoirAnime
        fetch("https://voiranime.ws/")
            .then(res => {
                const currentBase = res.url || "https://v10.voiranime.ws/";
                
                return fetch("https://api.themoviedb.org/3/tv/" + tmdbId + "?api_key=844421298d0e70291c73878c0780f41d&language=fr-FR")
                    .then(resMeta => resMeta.json())
                    .then(meta => {
                        const cleanName = encodeURIComponent(meta.name.toLowerCase());
                        return fetch(currentBase + "?s=" + cleanName);
                    });
            })
            .then(res => res ? res.text() : "")
            .then(searchHtml => {
                const linkRegex = /href="(https:\/\/[a-z0-9]+\.voiranime\.ws\/anime\/[^"]+)"/;
                const match = searchHtml.match(linkRegex);
                if (!match) return resolve([]);
                return fetch(match[1]); // Charge la page de l'anime
            })
            .then(res => res ? res.text() : "")
            .then(pageHtml => {
                if (!pageHtml) return resolve([]);
                const streams = [];
                const iframeRegex = /<iframe[^>]+src=["']([^"']+)["']/g;
                let match;
                while ((match = iframeRegex.exec(pageHtml)) !== null) {
                    if (!match[1].includes('ads')) {
                        streams.push({
                            name: "VoirAnime Stream",
                            title: "Lecteur Épisode " + (episode || 1),
                            url: match[1],
                            quality: "720p"
                        });
                    }
                }
                resolve(streams);
            })
            .catch(() => resolve([]));
    });
}
globalThis.getStreams = getStreams;
