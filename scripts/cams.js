document.addEventListener("DOMContentLoaded", function () {
    const camLinks = document.querySelectorAll(".camItem a");
    const camContainer = document.querySelector(".camContainer");
    const statusWarning = document.querySelector(".statusWarning"); // Select API error warning

    // YouTube API Key (Replace with your own)
    const API_KEY = "AIzaSyAo-o567HiVj-EVWiMLGQuU9K8iTnof44o";

    // Predefined YouTube Live Streams (Fallback if no live stream found)
    const camStreams = {
        "Rovaniemi": "Cp4RRAEgpeU",
        "Levi Zero Point": "LwihxyJ4V20",
        "Hollywood Beach Broadwalk": "cmkAbDUEoyA",
        "Rolling World Cam": "z7SiAaN4ogw",
        "Kilpisjärvi Aurora": "ccTVAhJU5lg",
        "Ducks": "aSjZ0-NzFqA",
        "Deer Cam": "ASu9sqOT_Xk",
        "Wildlife In The Forest": "F0GOOP82094",
        "Disney XD": "Jo_R1pHp24E",
        "Heathrow Airport": "rIs6MLrP1B0"
    };

    // Channel IDs for auto-fetching live streams
    const channelIds = {
        "Heathrow Airport": "UC6q_hfBThkGdmQ5Vb4kWjWA"
    };

    let apiAvailable = true;

    // Hide status warning initially
    statusWarning.style.display = "none";

    // Function to fetch latest live stream for a channel if the stored stream ID is offline
    async function fetchLatestLiveStream(camName, channelId) {
        if (!apiAvailable) return null;
        try {
            const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&eventType=live&key=${API_KEY}`);
            if (response.status === 403) {
                apiAvailable = false;
                statusWarning.style.display = "block"; // Show API error message
                console.warn("YouTube API quota exceeded or restricted. Disabling API calls.");
                return null;
            }
            const data = await response.json();
            
            if (data.items.length > 0) {
                return data.items[0].id.videoId;
            }
        } catch (error) {
            console.error(`Error fetching live stream for ${camName}:`, error);
            apiAvailable = false;
            statusWarning.style.display = "block"; // Show API error message
        }
        return null;
    }

    // Function to check if a stream is live
    async function checkLiveStatus(videoId) {
        if (!apiAvailable || !videoId) return true;
        try {
            const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=liveStreamingDetails&key=${API_KEY}`);
            if (response.status === 403) {
                apiAvailable = false;
                statusWarning.style.display = "flex"; // Show API error message
                console.warn("YouTube API quota exceeded or restricted. Disabling API calls.");
                return true;
            }
            const data = await response.json();
            return data.items.length > 0 && data.items[0].liveStreamingDetails;
        } catch (error) {
            console.error("Error checking live status:", error);
            apiAvailable = false;
            statusWarning.style.display = "flex"; // Show API error message
        }
        return true;
    }

    // Function to update live indicators and sort cams
    async function updateLiveIndicators() {
        const categories = document.querySelectorAll(".camCategory");
        
        for (const category of categories) {
            let liveCams = [];
            let offlineCams = [];
            
            const camItems = category.querySelectorAll(".camItem");
            for (const item of camItems) {
                const link = item.querySelector("a");
                const camName = link.textContent.trim().replace("LIVE", "").replace("OFFLINE", "").trim();
                let videoId = camStreams[camName] || "";
                
                let isLive = await checkLiveStatus(videoId);
                
                // If the current video ID is offline, try fetching the latest live stream from the channel
                if (!isLive && channelIds[camName]) {
                    const newVideoId = await fetchLatestLiveStream(camName, channelIds[camName]);
                    if (newVideoId) {
                        camStreams[camName] = newVideoId;
                        videoId = newVideoId;
                        isLive = await checkLiveStatus(videoId);
                    }
                }
                
                link.innerHTML = `${camName} <div class="indicatorWrapper"><div class="${isLive ? 'live-indicator' : 'offline-indicator'}"></div><p>${isLive ? 'LIVE' : 'OFFLINE'}</p></div>`;
                
                if (isLive) {
                    item.classList.remove("offline");
                    liveCams.push(item);
                } else {
                    item.classList.add("offline");
                    offlineCams.push(item);
                }
            }
            
            // Sort by moving offline cams to the bottom
            category.innerHTML = `<h3>${category.querySelector("h3").textContent}</h3>`;
            liveCams.forEach(cam => category.appendChild(cam));
            offlineCams.forEach(cam => category.appendChild(cam));
        }
    }

    // Load selected camera
    camLinks.forEach(link => {
        link.addEventListener("click", function (event) {
            event.preventDefault();
            
            const camName = this.textContent.trim().replace("LIVE", "").replace("OFFLINE", "").trim();
            const videoId = camStreams[camName] || "";
            
            if (videoId) {
                camContainer.innerHTML = `
                    <iframe width="100%" height="500px"
                        src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1"
                        frameborder="0" allow="autoplay; encrypted-media" allowfullscreen>
                    </iframe>
                `;
            }
        });
    });

    // Update live stream IDs first, then check live status indicators every 60 seconds
    updateLiveIndicators();
    setInterval(updateLiveIndicators, 60000);
});
