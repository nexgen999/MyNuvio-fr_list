async function getStreams(tmdbId, mediaType, season, episode) {
    const streams = [];
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36',
        'Referer': 'https://fstream.info/'
    };

    try {
        // 1. Récupération de l'URL valide du jour via le site miroir
        const mirrorRes = await fetch("https://fstream.info/", { headers });
        const mirrorHtml = await mirrorRes.text();
        const domainMatch = mirrorHtml.match(/href="(https:\/\/french-stream\.[a-z]{2,4})\/"/);
        const baseUrl = domainMatch ? domainMatch[1] : "https://french-stream.one";

        // 2. Recherche du titre en Français sur TMDB
        const tmdbRes = await fetch(`https://api.themoviedb.org/3/${mediaType}/${tmdbId}?api_key=844421298d0e70291c73878c0780f41d&language=fr-FR`);
        const meta = await tmdbRes.json();
        const title = mediaType === "movie" ? meta.title : meta.name;
        if (!title) return [];

        // 3. Recherche sur le site
        const searchUrl = `${baseUrl}/index.php?do=search&subaction=search&story=${encodeURIComponent(title.toLowerCase())}`;
        const searchRes = await fetch(searchUrl, { headers });
        const searchHtml = await searchRes.text();
        
        const pageRegex = new RegExp(`href="(${baseUrl.replace(/\./g, '\\.')}\/[^"]+\.html)"`);
        const pageMatch = searchHtml.match(pageRegex);
        if (!pageMatch) return [];

        // 4. Lecture de la page du film/série
        const pageRes = await fetch(pageMatch[1], { headers });
        const pageHtml = await pageRes.text();

        // 5. Extraction et Résolution des lecteurs (Uqload / Voe)
        const iframeRegex = /<iframe[^>]+src=["']([^"']+)["']/g;
        let match;

        while ((match = iframeRegex.exec(pageHtml)) !== null) {
            let embedUrl = match[1];
            
            // Si c'est un lien Uqload, on extrait le mp4 direct caché dans leur code
            if (embedUrl.includes('uqload')) {
                try {
                    const uqRes = await fetch(embedUrl, { headers: { 'User-Agent': headers['User-Agent'], 'Referer': baseUrl } });
                    const uqHtml = await uqRes.text();
                    const videoMatch = uqHtml.match(/sources:\s*\["([^"]+)"\]/);
                    if (videoMatch && videoMatch[1]) {
                        streams.push({
                            name: "👑 FrenchStream (Uqload Premium)",
                            url: videoMatch[1],
                            quality: "1080p",
                            title: "Fichier Direct MP4 - VF"
                        });
                    }
                } catch (e) {}
            }
            
            // Si c'est un lien Voe
            if (embedUrl.includes('voe')) {
                try {
                    const voeRes = await fetch(embedUrl, { headers });
                    const voeHtml = await voeRes.text();
                    // Voe cache sa vidéo en Base64 ou dans un fichier de configuration HLS (.m3u8)
                    const hlsMatch = voeHtml.match(/'file':\s*'([^']+)'/);
                    if (hlsMatch && hlsMatch[1]) {
                        streams.push({
                            name: "👑 FrenchStream (Voe HighSpeed)",
                            url: hlsMatch[1],
                            quality: "1080p",
                            title: "Fichier Direct HLS - VF"
                        });
                    }
                } catch (e) {}
            }
        }
    } catch (error) {
        // En cas d'erreur sauvage, on ne fait pas crasher Nuvio
    }

    return streams;
}

globalThis.getStreams = getStreams;
