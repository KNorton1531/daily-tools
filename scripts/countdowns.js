document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ Countdown Script Loaded");

    const countdowns = [
        { title: "Spring", date: "03-20T00:00:00", annual: true },
        { title: "Summer", date: "06-20T00:00:00", annual: true },
        { title: "Autumn", date: "09-22T00:00:00", annual: true },
        { title: "Winter", date: "12-21T00:00:00", annual: true },
        { title: "Christmas", date: "12-25T00:00:00", annual: true },
        { title: "December", date: "12-01T00:00:00", annual: true },
        { title: "Halloween", date: "10-31T00:00:00", annual: true },
        { title: "Easter", date: "2025-04-20T00:00:00", annual: false }
    ];

    const categoryContainer = document.querySelector(".categoryContainer");
    const gridViewBtn = document.querySelector(".sortItems span:nth-child(1)");
    const listViewBtn = document.querySelector(".sortItems span:nth-child(2)");

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

            const timeDiff = targetDate - now;
            if (timeDiff < 0) {
                console.log(`⏳ ${title} has already passed.`);
                return;
            }

            let months = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 30));
            let weeks = Math.floor((timeDiff % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24 * 7));
            let days = Math.floor((timeDiff % (1000 * 60 * 60 * 24 * 7)) / (1000 * 60 * 60 * 24));
            let hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

            if (isGridView) {
                // Convert months and weeks to total days
                days += months * 30 + weeks * 7;
                months = 0;
                weeks = 0;
            }

            document.querySelectorAll(".countdownContainer").forEach(container => {
                const h5 = container.querySelector("h5");

                if (h5 && h5.textContent.trim() === title) {
                    container.querySelector(".months").innerHTML = isGridView ? "" : `<div class="timerValue">${months}</div> <div class="timerLabel">Months</div>`;
                    container.querySelector(".weeks").innerHTML = isGridView ? "" : `<div class="timerValue">${weeks}</div> <div class="timerLabel">Weeks</div>`;
                    container.querySelector(".days").innerHTML = `<div class="timerValue">${days}</div> <div class="timerLabel">Days</div>`;
                    container.querySelector(".hours").innerHTML = isGridView ? "" : `<div class="timerValue">${hours}</div> <div class="timerLabel">Hours</div>`;
                }
            });
        });

        console.log("✅ Countdowns updated");
    }

    function toggleView(isGrid) {
        if (isGrid) {
            categoryContainer.classList.add("gridView");
            categoryContainer.classList.remove("listView");
            document.querySelector(".gridButton").style.background = "#c5c5c5";
            document.querySelector(".listButton").style.background = "#fff";
        } else {
            categoryContainer.classList.add("listView");
            categoryContainer.classList.remove("gridView");
            document.querySelector(".listButton").style.background = "#c5c5c5";
            document.querySelector(".gridButton").style.background = "#fff";
        }

        updateCountdowns(isGrid);
    }

    gridViewBtn.addEventListener("click", () => toggleView(true));
    listViewBtn.addEventListener("click", () => toggleView(false));

    // Initial load
    updateCountdowns(false);
    setInterval(() => updateCountdowns(categoryContainer.classList.contains("gridView")), 1000);
});
