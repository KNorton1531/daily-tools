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
    const gridViewBtn = document.querySelector(".gridButton");
    const listViewBtn = document.querySelector(".listButton");

    let favoriteCountdowns = JSON.parse(localStorage.getItem("favorites")) || [];

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

        return { totalDays, totalHours, totalMinutes, totalSeconds };
    }

    function updateCountdowns(isGridView) {
        console.log("🔄 Updating countdowns...");

        countdowns.forEach(({ title, date, annual }) => {
            const now = new Date();
            let targetDate = new Date(`${now.getFullYear()}-${date}`);

            if (annual && targetDate < now) {
                targetDate = new Date(`${now.getFullYear() + 1}-${date}`);
            } else if (!annual) {
                targetDate = new Date(date);
            }

            if (isNaN(targetDate.getTime())) {
                console.error(`❌ Invalid date for "${title}": ${date}`);
                return;
            }

            const countdown = getExactCountdown(targetDate, isGridView);
            if (!countdown) {
                console.log(`⏳ ${title} has already passed.`);
                return;
            }

            document.querySelectorAll(".countdownContainer").forEach(container => {
                const h5 = container.querySelector("h5");

                if (h5 && h5.textContent.trim() === title) {
                    if (isGridView) {
                        container.querySelector(".days").innerHTML = `
                            <div class="timerValue">${countdown.totalDays}</div> 
                            <div class="timerLabel">Days</div>`;
                        container.querySelector(".hours").innerHTML = "";
                    } else {
                        container.querySelector(".days").innerHTML = `
                            <div class="timerValue">${countdown.totalDays}</div> 
                            <div class="timerLabel">Days</div>`;
                        container.querySelector(".hours").innerHTML = `
                            <div class="timerValue">${countdown.totalHours}</div> 
                            <div class="timerLabel">Hours</div>`;
                        container.querySelector(".minutes").innerHTML = `
                            <div class="timerValue">${countdown.totalMinutes}</div> 
                            <div class="timerLabel">Minutes</div>`;
                        container.querySelector(".seconds").innerHTML = `
                            <div class="timerValue">${countdown.totalSeconds}</div> 
                            <div class="timerLabel">Seconds</div>`;
                    }
                }
            });
        });

        console.log("✅ Countdowns updated");
    }

    function toggleView(isGrid) {
        categoryContainer.classList.toggle("gridView", isGrid);
        categoryContainer.classList.toggle("listView", !isGrid);
        document.querySelector(".gridButton").style.background = isGrid ? "#c5c5c5" : "#fff";
        document.querySelector(".listButton").style.background = isGrid ? "#fff" : "#c5c5c5";
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

    function updateFavorites() {
        favoritesContainer.innerHTML = "";
    
        favoriteCountdowns.forEach(title => {
            const originalCountdown = Array.from(document.querySelectorAll(".countdownContainer")).find(container => 
                container.querySelector("h5")?.textContent.trim() === title
            );
    
            if (originalCountdown) {
                const clone = originalCountdown.cloneNode(true);
                clone.classList.add("favorite");
                clone.addEventListener("click", () => toggleFavorite(title));
                favoritesContainer.appendChild(clone);
            }
        });
    
        document.querySelector(".addMessage").style.display = favoriteCountdowns.length > 0 ? "none" : "block";
    }    

    document.querySelectorAll(".countdownContainer").forEach(container => {
        container.addEventListener("click", function () {
            const title = this.querySelector("h5").textContent.trim();
            toggleFavorite(title);
        });
    });

    gridViewBtn.addEventListener("click", () => toggleView(true));
    listViewBtn.addEventListener("click", () => toggleView(false));

    updateCountdowns(false);
    updateFavorites();
    setInterval(() => updateCountdowns(categoryContainer.classList.contains("gridView")), 1000);
});
