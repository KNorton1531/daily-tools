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

    // Ensure sorting defaults to "Closest Dates" for first-time users
    let isSortedByTime = localStorage.getItem("favoritesSorting") !== null 
        ? JSON.parse(localStorage.getItem("favoritesSorting")) 
        : true; // Default to Closest Dates

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
                // Annual events assume the current year
                targetDate = new Date(`${now.getFullYear()}-${event.date}`);

                // If the event has already passed this year, move it to next year
                if (targetDate < now) {
                    targetDate = new Date(`${now.getFullYear() + 1}-${event.date}`);
                }
            } else {
                // Non-annual events use the specified year
                targetDate = new Date(event.date);
            }

            const timeDiff = targetDate - now;

            const originalCountdown = Array.from(document.querySelectorAll(".countdownContainer")).find(container =>
                container.querySelector("h5")?.textContent.trim() === title
            );

            if (originalCountdown) {
                const clone = originalCountdown.cloneNode(true);
                clone.classList.add("favorite");
                clone.addEventListener("click", () => toggleFavorite(title));

                return { element: clone, timeDiff };
            }
            return null;
        }).filter(item => item !== null);

        // Apply sorting: Closest first if sorted, otherwise furthest first
        favoriteElements.sort((a, b) => isSortedByTime ? a.timeDiff - b.timeDiff : b.timeDiff - a.timeDiff);

        // Add elements in sorted order
        favoriteElements.forEach(item => favoritesContainer.appendChild(item.element));

        // Show/hide the "addMessage" text based on favorite count
        addMessage.style.display = favoriteCountdowns.length > 0 ? "none" : "block";

        // Ensure the sorting button and message are correct on first load
        sortButton.style.background = isSortedByTime ? "#c5c5c5" : "#fff";
        sortingMessage.textContent = isSortedByTime ? "Closest Dates" : "Furthest Dates";
    }

    function toggleFavorite(title) {
        const index = favoriteCountdowns.indexOf(title);

        if (index === -1) {
            favoriteCountdowns.push(title);
        } else {
            favoriteCountdowns.splice(index, 1);
        }

        localStorage.setItem("favorites", JSON.stringify(favoriteCountdowns));
        updateFavorites(); // Ensure immediate correct ordering when adding/removing
    }

    function toggleSort() {
        isSortedByTime = !isSortedByTime;
        localStorage.setItem("favoritesSorting", JSON.stringify(isSortedByTime));

        // Update the sort button style and message
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
            if (!isGridView) {
                container.querySelector(".hours").innerHTML = `<div class="timerValue">${countdown.totalHours}</div><div class="timerLabel">Hours</div>`;
                container.querySelector(".minutes").innerHTML = `<div class="timerValue">${countdown.totalMinutes}</div><div class="timerLabel">Minutes</div>`;
                container.querySelector(".seconds").innerHTML = `<div class="timerValue">${countdown.totalSeconds}</div><div class="timerLabel">Seconds</div>`;
            }
        });

        updateFavorites();
    }

    sortButton.addEventListener("click", toggleSort);
    document.querySelectorAll(".countdownContainer").forEach(container => {
        container.addEventListener("click", function () {
            toggleFavorite(this.querySelector("h5").textContent.trim());
        });
    });

    updateFavorites();
    updateCountdowns(false);
    setInterval(() => updateCountdowns(categoryContainer.classList.contains("gridView")), 1000);
});
