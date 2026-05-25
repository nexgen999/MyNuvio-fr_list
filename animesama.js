function getStreams(tmdbId, mediaType, season, episode) {
    return new Promise((resolve) => {
        if (mediaType !== "tv") return resolve([]);

        // On appelle le domaine de secours qui gère lui-même sa redirection
        fetch("https://anime-sama.pw/")
            .then(res => {
                // On récupère le domaine final effectif (ex: anime-sama.to)
                const finalUrl = res.url || "https://anime-sama.to/";
                
                return fetch("https://api.themoviedb.org/3/tv/" + tmdbId + "?api_key=844421298d0e70291c73878c0780f41d&language=fr-FR")
                    .then(resMeta => resMeta.json())
                    .then(meta => {
                        const cleanName = meta.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
                        // Format standard des dossiers Anime-Sama
                        const targetPage = finalUrl + "catalogue/" + cleanName + "/";
                        return fetch(targetPage);
                    });
            })
            .then(res => res ? res.text() : "")
            .then(html => {
                if (!html) return resolve([]);
                const streams = [];
                // Extraction basique des scripts de lecteurs (ex: Sibnet, Sendvid)
                const scriptRegex = /episodes\s*=\s*\[([^\]]+)\]/;
                const match = html.match(scriptRegex);
                if (match) {
                    const links = match[1].split(',');
                    const targetEp = (episode || 1) - 1;
                    if (links[targetEp]) {
                        let cleanUrl = links[targetEp].replace(/['" ]/g, '');
                        streams.push({
                            name: "Anime-Sama Player",
                            title: "Épisode " + episode,
                            url: cleanUrl,
                            quality: "1080p"
                        });
                    }
                }
                resolve(streams);
            })
            .catch(() => resolve([]));
    });
}
globalThis.getStreams = getStreams;
