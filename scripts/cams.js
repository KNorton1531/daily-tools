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
                `https://www.googleapis.com/youtube/v3/videos?id=${videoIds.join(",")}&part=liveStreamingDetails&key=${API_KEY}`
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
            statusWarning.style.display = "flex";
            return null; 
        }
    }

    async function updateLiveIndicators() {
        let videoIdsToCheck = [];
        let hasUnknownStatus = false;

        for (const camName in camStreams) {
            const videoId = camStreams[camName];
            if (videoId) {
                videoIdsToCheck.push(videoId);
            }
        }

        let liveStatusMap = await batchCheckLiveStatus(videoIdsToCheck);

        if (liveStatusMap === null) {
            hasUnknownStatus = true;
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

    updateLiveIndicators();
    setInterval(updateLiveIndicators, 60000);

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
