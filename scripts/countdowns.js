document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ Countdown Script Loaded");

    const countdowns = [
        { title: "Spring", date: "03-01T00:00:00", annual: true },
        { title: "Summer", date: "06-01T00:00:00", annual: true },
        { title: "Autumn", date: "09-01T00:00:00", annual: true },
        { title: "Winter", date: "12-01T00:00:00", annual: true },
        { title: "Christmas", date: "12-25T00:00:00", annual: true },
        { title: "December", date: "12-01T00:00:00", annual: true },
        { title: "Halloween", date: "10-31T00:00:00", annual: true },
        { title: "Easter", date: "2025-04-20T00:00:00", annual: false },
        { title: "The Finals Season 6", date: "2025-03-20T10:00:00", annual: false },
        { title: "My Birthday", date: "04-22T00:00:00", annual: true }
    ];

    const categoryContainer = document.querySelector(".categoryContainer");
    const favoritesContainer = document.querySelector(".favoritesCategory .countdownWrapper");
    const favoritesCategory = document.querySelector(".favoritesCategory");
    const addMessage = document.querySelector(".favoritesCategory .addMessage");
    const sortButton = document.querySelector(".favoritesCategory h3 span");
    const sortingMessage = document.querySelector(".favoritesCategory .sortingMessage");
    const gridViewBtn = document.querySelector(".gridButton");
    const listViewBtn = document.querySelector(".listButton");

    let favoriteCountdowns = JSON.parse(localStorage.getItem("favorites")) || [];
    let isSortedByTime = localStorage.getItem("favoritesSorting") !== null 
        ? JSON.parse(localStorage.getItem("favoritesSorting")) 
        : true;
    let isGridView = localStorage.getItem("isGridView") === "true";

    function getExactCountdown(targetDate, isGridView) {
        const now = new Date();
        let timeDiff = targetDate - now;

        if (timeDiff < 0) return null;

        const totalDays = isGridView
            ? Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
            : Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const totalHours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const totalMinutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const totalSeconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

        return { totalDays, totalHours, totalMinutes, totalSeconds, timeDiff };
    }

    function updateFavorites() {
        favoritesContainer.innerHTML = "";

        let favoriteElements = favoriteCountdowns.map(title => {
            const event = countdowns.find(item => item.title === title);
            if (!event) return null;

            const now = new Date();
            let targetDate;

            if (event.annual) {
                targetDate = new Date(`${now.getFullYear()}-${event.date}`);
                if (targetDate < now) {
                    targetDate = new Date(`${now.getFullYear() + 1}-${event.date}`);
                }
            } else {
                targetDate = new Date(event.date);
            }

            const timeDiff = targetDate - now;

            const originalCountdown = Array.from(document.querySelectorAll(".countdownContainer")).find(container =>
                container.querySelector("h5")?.textContent.trim() === title
            );

            if (originalCountdown) {
                const clone = originalCountdown.cloneNode(true);
                clone.classList.add("favorite");

                // ✅ Clicking a favorite should remove it
                clone.addEventListener("click", function () {
                    toggleFavorite(title);
                });

                return { element: clone, timeDiff };
            }
            return null;
        }).filter(item => item !== null);

        favoriteElements.sort((a, b) => isSortedByTime ? a.timeDiff - b.timeDiff : b.timeDiff - a.timeDiff);

        favoriteElements.forEach(item => favoritesContainer.appendChild(item.element));

        addMessage.style.display = favoriteCountdowns.length > 0 ? "none" : "block";

        sortButton.style.background = isSortedByTime ? "#c5c5c5" : "#fff";
        sortingMessage.textContent = isSortedByTime ? "Closest Dates" : "Furthest Dates";
    }

    function toggleView(isGrid) {
        localStorage.setItem("isGridView", isGrid);
        categoryContainer.classList.remove("gridView", "listView");
        categoryContainer.classList.add(isGrid ? "gridView" : "listView");

        if (gridViewBtn && listViewBtn) {
            gridViewBtn.style.background = isGrid ? "#c5c5c5" : "#fff";
            listViewBtn.style.background = isGrid ? "#fff" : "#c5c5c5";
        }

        updateCountdowns(isGrid);
    }

    function toggleFavorite(title) {
        const index = favoriteCountdowns.indexOf(title);

        if (index === -1) {
            favoriteCountdowns.push(title);
        } else {
            favoriteCountdowns.splice(index, 1);
        }

        localStorage.setItem("favorites", JSON.stringify(favoriteCountdowns));
        updateFavorites();
    }

    function toggleSort() {
        isSortedByTime = !isSortedByTime;
        localStorage.setItem("favoritesSorting", JSON.stringify(isSortedByTime));

        sortButton.style.background = isSortedByTime ? "#c5c5c5" : "#fff";
        sortingMessage.textContent = isSortedByTime ? "Closest Dates" : "Furthest Dates";

        updateFavorites();
    }

    function updateCountdowns(isGridView) {
        console.log("🔄 Updating countdowns...");

        document.querySelectorAll(".countdownContainer").forEach(container => {
            const title = container.querySelector("h5")?.textContent.trim();
            const event = countdowns.find(e => e.title === title);
            if (!event) return;

            const now = new Date();
            let targetDate = event.annual
                ? new Date(`${now.getFullYear()}-${event.date}`)
                : new Date(event.date);

            if (event.annual && targetDate < now) {
                targetDate = new Date(`${now.getFullYear() + 1}-${event.date}`);
            }

            const countdown = getExactCountdown(targetDate, isGridView);
            if (!countdown) return;

            container.querySelector(".days").innerHTML = `<div class="timerValue">${countdown.totalDays}</div><div class="timerLabel">Days</div>`;

            if (isGridView) {
                container.querySelector(".hours").innerHTML = "";
                container.querySelector(".minutes").innerHTML = "";
                container.querySelector(".seconds").innerHTML = "";
            } else {
                container.querySelector(".hours").innerHTML = `<div class="timerValue">${countdown.totalHours}</div><div class="timerLabel">Hours</div>`;
                container.querySelector(".minutes").innerHTML = `<div class="timerValue">${countdown.totalMinutes}</div><div class="timerLabel">Minutes</div>`;
                container.querySelector(".seconds").innerHTML = `<div class="timerValue">${countdown.totalSeconds}</div><div class="timerLabel">Seconds</div>`;
            }
        });

        updateFavorites();
    }

    sortButton.addEventListener("click", toggleSort);
    if (gridViewBtn) gridViewBtn.addEventListener("click", () => toggleView(true));
    if (listViewBtn) listViewBtn.addEventListener("click", () => toggleView(false));

    document.querySelectorAll(".countdownContainer").forEach(container => {
        container.addEventListener("click", function () {
            toggleFavorite(this.querySelector("h5").textContent.trim());
        });
    });

    updateCountdowns(isGridView);
    toggleView(isGridView);
    setInterval(() => updateCountdowns(categoryContainer.classList.contains("gridView")), 100000);
});
