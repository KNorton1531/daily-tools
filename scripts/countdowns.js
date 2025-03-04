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
        { title: "Easter", date: "2025-04-20T00:00:00", annual: false }
    ];

    const categoryContainer = document.querySelector(".categoryContainer");
    const gridViewBtn = document.querySelector(".sortItems span:nth-child(1)");
    const listViewBtn = document.querySelector(".sortItems span:nth-child(2)");

    function getExactCountdown(targetDate, isGridView) {
        const now = new Date();
        let timeDiff = targetDate - now;
    
        if (timeDiff < 0) return null; // Event has passed
    
        // Use Math.ceil() for grid view to include today, but Math.floor() for list view
        const totalDays = isGridView
            ? Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) // Include today
            : Math.floor(timeDiff / (1000 * 60 * 60 * 24)); // Normal calculation
    
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
                        // Grid View: Show only total days, including today
                        container.querySelector(".days").innerHTML = `
                            <div class="timerValue">${countdown.totalDays}</div> 
                            <div class="timerLabel">Days</div>`;
                        container.querySelector(".hours").innerHTML = "";
                    } else {
                        // List View: Show days, hours, minutes, and seconds
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
