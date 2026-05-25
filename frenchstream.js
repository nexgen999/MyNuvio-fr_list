function getStreams(tmdbId, mediaType, season, episode) {
    return new Promise((resolve) => {
        // Étape 1 : Obtenir l'URL valide du jour via le site de secours
        fetch("https://fstream.info/")
            .then(res => res.text())
            .then(html => {
                const domainRegex = /href="(https:\/\/french-stream\.[a-z]{2,4})\/"/;
                const matchDomain = html.match(domainRegex);
                const baseUrl = matchDomain ? matchDomain[1] : "https://french-stream.one";

                // Étape 2 : Chercher le titre sur TMDB
                return fetch("https://api.themoviedb.org/3/" + mediaType + "/" + tmdbId + "?api_key=844421298d0e70291c73878c0780f41d&language=fr-FR")
                    .then(res => res.json())
                    .then(meta => {
                        const title = mediaType === "movie" ? meta.title : meta.name;
                        if (!title) throw new Error();
                        const searchUrl = baseUrl + "/index.php?do=search&subaction=search&story=" + encodeURIComponent(title.toLowerCase());
                        return fetch(searchUrl);
                    })
                    .then(res => res.text())
                    .then(searchHtml => {
                        const pageRegex = new RegExp('href="(' + baseUrl.replace(/\./g, '\\.') + '\/[^"]+\.html)"');
                        const matchPage = searchHtml.match(pageRegex);
                        if (!matchPage) return resolve([]);
                        return fetch(matchPage[1]);
                    });
            })
            .then(res => res ? res.text() : "")
            .then(pageHtml => {
                if (!pageHtml) return resolve([]);
                const streams = [];
                const iframeRegex = /<iframe[^>]+src=["']([^"']+)["']/g;
                let match;
                while ((match = iframeRegex.exec(pageHtml)) !== null) {
                    let src = match[1];
                    if (src.includes('uqload') || src.includes('voe') || src.includes('vidmoly') || src.includes('upstream')) {
                        let host = src.includes('uqload') ? "Uqload" : src.includes('voe') ? "Voe" : "Lecteur Video";
                        streams.push({
                            name: "FrenchStream (" + host + ")",
                            title: host + " - " + (pageHtml.toLowerCase().includes('vostfr') ? "VOSTFR" : "VF"),
                            url: src,
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
