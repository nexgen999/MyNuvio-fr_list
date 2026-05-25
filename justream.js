function getStreams(tmdbId, mediaType, season, episode) {
    return new Promise((resolve) => {
        const baseUrl = "https://juststream.pics";
        fetch("https://api.themoviedb.org/3/" + mediaType + "/" + tmdbId + "?api_key=844421298d0e70291c73878c0780f41d&language=fr-FR")
            .then(res => res.json())
            .then(meta => {
                const title = mediaType === "movie" ? meta.title : meta.name;
                return fetch(baseUrl + "/index.php?do=search&subaction=search&story=" + encodeURIComponent(title));
            })
            .then(res => res.text())
            .then(html => {
                const pageRegex = /href="(https:\/\/juststream\.pics\/[^"]+\.html)"/;
                const match = html.match(pageRegex);
                if (!match) return resolve([]);
                return fetch(match[1]);
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
                            name: "JustStream Source",
                            title: "Player",
                            url: match[1],
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
