document.addEventListener("DOMContentLoaded", function () {
    const camLinks = document.querySelectorAll(".camItem a");
    const camContainer = document.querySelector(".camContainer");
    const statusWarning = document.querySelector(".statusWarning");

    const API_KEY = "AIzaSyAo-o567HiVj-EVWiMLGQuU9K8iTnof44o";

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
        "Heathrow Airport": null ,
        "Manchester Airport": null,
    };

    const channelIds = {
        "Heathrow Airport": "UC6q_hfBThkGdmQ5Vb4kWjWA",
        "Manchester Airport": "UCMT8bf9CCfdLb_DTwJidOng"
    };

    const twentyFourHourStreams = [
        "Rovaniemi", "Rolling World Cam", "Wildlife In The Forest", "Disney XD", "Deer Cam", "Ducks", "Levi Zero Point", "Kilpisjärvi Aurora"
    ];

    let apiAvailable = true;
    statusWarning.style.display = "none";

    async function batchCheckLiveStatus(videoIds) {
        if (videoIds.length === 0) return {};
        try {
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?id=${videoIds.join(",")}&part=liveStreamingDetails&key=AIzaSyAo-o567HiVj-EVWiMLGQuU9K8iTnof44o`
            );
            
            if (!response || !response.ok) {
                throw new Error(`HTTP Error: ${response?.status || "Unknown error"}`);
            }
    
            const data = await response.json();
            let statusMap = {};
            for (const item of data.items) {
                statusMap[item.id] = item.liveStreamingDetails ? true : false;
            }
            return statusMap;
        } catch (error) {
            console.error("Error checking live status:", error);
            return null; 
        }
    }

    async function getLiveVideoFromChannel(channelId) {
        try {
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&eventType=live&key=AIzaSyAo-o567HiVj-EVWiMLGQuU9K8iTnof44o`
            );
    
            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }
    
            const data = await response.json();
            
            // If API returns a live stream, return its video ID
            if (data.items.length > 0) {
                return data.items[0].id.videoId;
            }
    
            // If API returns nothing, assume the stream is offline
            return false;
        } catch (error) {
            console.error("Error fetching live stream from channel:", error);
            return null; // Return null to indicate an API failure
        }
    }    
    

    async function updateLiveIndicators() {
        let videoIdsToCheck = [];
        let hasUnknownStatus = false;
        let liveStatusMap = {};
        let channelIdsToCheck = [];
        let apiWorked = false; // Track if API returned valid data
    
        let storedData = JSON.parse(localStorage.getItem("liveStatuses")) || {};
        let currentTime = Date.now();
        let unknownCheckInterval = 10 * 60 * 1000; // 10 minutes
    
        for (const camName in camStreams) {
            const videoId = camStreams[camName];
    
            if (videoId) {
                if (storedData[videoId]) {
                    let { status, timestamp } = storedData[videoId];
    
                    if (status === "unknown" && currentTime - timestamp > unknownCheckInterval) {
                        videoIdsToCheck.push(videoId);
                    } else if (currentTime - timestamp < 300000) {
                        liveStatusMap[videoId] = status;
                    } else {
                        videoIdsToCheck.push(videoId);
                    }
                } else {
                    videoIdsToCheck.push(videoId);
                }
            } else if (channelIds[camName]) {
                channelIdsToCheck.push({ camName, channelId: channelIds[camName] });
            }
        }
    
        // Fetch status for video IDs
        if (videoIdsToCheck.length > 0) {
            const apiResults = await batchCheckLiveStatus(videoIdsToCheck);
    
            if (apiResults !== null) {
                apiWorked = true; // API returned valid data
    
                for (const [videoId, status] of Object.entries(apiResults)) {
                    if (status === undefined) {
                        // API responded but returned nothing, assume offline
                        storedData[videoId] = { status: false, timestamp: Date.now() };
                        liveStatusMap[videoId] = false;
                    } else {
                        storedData[videoId] = { status, timestamp: Date.now() };
                        liveStatusMap[videoId] = status;
                    }
                }
    
                localStorage.setItem("liveStatuses", JSON.stringify(storedData));
            } else {
                // If the API completely fails, mark everything unknown
                hasUnknownStatus = true;
            }
        }
    
        // Fetch live video for channels if needed
        if (channelIdsToCheck.length > 0) {
            for (const { camName, channelId } of channelIdsToCheck) {
                const liveVideoId = await getLiveVideoFromChannel(channelId);
    
                if (liveVideoId === false) {
                    // No live stream found → OFFLINE
                    storedData[channelId] = { status: false, timestamp: Date.now() };
                    liveStatusMap[channelId] = false;
                } else if (liveVideoId) {
                    // Live stream found, update mapping
                    camStreams[camName] = liveVideoId;
                    storedData[liveVideoId] = { status: true, timestamp: Date.now() };
                    liveStatusMap[liveVideoId] = true;
                } else {
                    // API completely failed, keep unknown
                    hasUnknownStatus = true;
                }
            }
    
            localStorage.setItem("liveStatuses", JSON.stringify(storedData));
        }
    
        // Final check: If the API worked but some streams are still unknown, set them to offline
        if (apiWorked) {
            for (const videoId in storedData) {
                if (storedData[videoId].status === "unknown") {
                    storedData[videoId] = { status: false, timestamp: Date.now() };
                    liveStatusMap[videoId] = false;
                }
            }
            localStorage.setItem("liveStatuses", JSON.stringify(storedData));
        }
    
        statusWarning.style.display = hasUnknownStatus ? "flex" : "none";
    
        document.querySelectorAll(".camItem a").forEach(link => {
            if (!link.dataset.camName) {
                link.dataset.camName = link.textContent.trim();
            }
            const camName = link.dataset.camName;
    
            const videoId = camStreams[camName] || null;
            const liveStatus = liveStatusMap?.[videoId] ?? "unknown";
    
            let statusText = "UNKNOWN";
            let indicatorClass = "unknown-indicator";
    
            if (liveStatus === true) {
                statusText = "LIVE";
                indicatorClass = "live-indicator";
            } else if (liveStatus === false) {
                statusText = "OFFLINE";
                indicatorClass = "offline-indicator";
            }
    
            link.innerHTML = `${camName} 
                <div class="indicatorWrapper">
                    <div class="${indicatorClass}"></div>
                    <p>${statusText}</p>
                </div>`;
    
            link.addEventListener("click", function (event) {
                event.preventDefault();
                if (videoId) {
                    camContainer.innerHTML = `
                        <div class="videoWrapper">
                            <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1" 
                                frameborder="0" allow="autoplay; encrypted-media" allowfullscreen>
                            </iframe>
                        </div>`;
                }
            });
        });
    }
    
    // Run updateLiveIndicators on page load
    updateLiveIndicators();
    
    // Check unknown statuses every 10 minutes
    setInterval(() => {
        let storedData = JSON.parse(localStorage.getItem("liveStatuses")) || {};
        let needsUpdate = Object.values(storedData).some(entry => entry.status === "unknown");
    
        if (needsUpdate) {
            updateLiveIndicators();
        }
    }, 10 * 60 * 1000);
    
    
    

    const style = document.createElement("style");
    style.innerHTML = `
        .videoWrapper {
            position: relative;
            padding-bottom: 56.25%; 
            height: 0;
            overflow: hidden;
            max-width: 100%;
            background: black;
        }
        .videoWrapper iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }
        .unknown-indicator {
            background: gray;
        }
    `;
    document.head.appendChild(style);
});
