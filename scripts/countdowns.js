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

        return { totalDays, totalHours, totalMinutes, timeDiff };

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

                clone.addEventListener("click", function (e) {
                    e.stopImmediatePropagation(); // ✅ Prevent document click from firing right after
                    const confirmed = confirm(`Remove "${title}" from favorites?`);
                    if (confirmed) {
                        toggleFavorite(title);
                    }
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

    function findCategoryWrapper(categoryName) {
        const allCategories = document.querySelectorAll(".category");
        for (let cat of allCategories) {
            const heading = cat.querySelector("h3");
            if (heading && heading.textContent.trim().toLowerCase() === categoryName.toLowerCase()) {
                return cat.querySelector(".countdownWrapper");
            }
        }
    
        // If not found, create a new category
        const categoryContainer = document.querySelector(".categoryContainer");
    
        const newCategory = document.createElement("div");
        newCategory.classList.add("category");
    
        const heading = document.createElement("h3");
        heading.textContent = categoryName;
    
        const wrapper = document.createElement("div");
        wrapper.classList.add("countdownWrapper");
    
        newCategory.appendChild(heading);
        newCategory.appendChild(wrapper);
        categoryContainer.appendChild(newCategory);
    
        return wrapper;
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
            let targetDate;
            if (event.annual) {
              const hasYear = event.date.match(/^\d{4}-/); // e.g., starts with "2025-"
            
              if (hasYear) {
                // Annual countdown using full ISO format like "2025-03-14T22:14:00"
                const splitDate = event.date.split("T")[0]; // "2025-03-14"
                const timePart = event.date.split("T")[1] || "00:00:00";
                const [, month, day] = splitDate.split("-"); // ignore the year
                const thisYearDate = new Date(`${now.getFullYear()}-${month}-${day}T${timePart}`);
                targetDate = thisYearDate < now
                  ? new Date(`${now.getFullYear() + 1}-${month}-${day}T${timePart}`)
                  : thisYearDate;
              } else {
                // Annual countdown using format like "12-25T00:00:00"
                const [monthDay, timePart] = event.date.split("T");
                const [month, day] = monthDay.split("-");
                const thisYearDate = new Date(`${now.getFullYear()}-${month}-${day}T${timePart || "00:00:00"}`);
                targetDate = thisYearDate < now
                  ? new Date(`${now.getFullYear() + 1}-${month}-${day}T${timePart || "00:00:00"}`)
                  : thisYearDate;
              }
            } else {
              // One-time countdown
              targetDate = new Date(event.date);
            }
            
            

            if (event.annual && targetDate < now) {
                targetDate = new Date(`${now.getFullYear() + 1}-${event.date}`);
            }

            const countdown = getExactCountdown(targetDate, isGridView);
            if (!countdown) {
                if (!event.annual && targetDate < now) {
                    container.innerHTML = `
                        <h5>${event.title}</h5>
                        <p class="countdownEndedMessage">🎉 This countdown has ended!</p>
                    `;
                    container.classList.add("ended");
            
                    // Ensure overlay still shows so the user can delete it
                    container.onclick = function () {
                        showOverlay(event.title, container.dataset.countdownId || null, container);
                    };
            
                    return;
                }
                return;
            }
            
            

            container.querySelector(".days").innerHTML = `<div class="timerValue">${countdown.totalDays}</div><div class="timerLabel">Days</div>`;

            if (isGridView) {
                container.querySelector(".hours").innerHTML = "";
                container.querySelector(".minutes").innerHTML = "";
            } else {
                container.querySelector(".hours").innerHTML = `<div class="timerValue">${countdown.totalHours}</div><div class="timerLabel">Hours</div>`;
                container.querySelector(".minutes").innerHTML = `<div class="timerValue">${countdown.totalMinutes}</div><div class="timerLabel">Minutes</div>`;

            }
        });

        updateFavorites();
    }

    sortButton.addEventListener("click", toggleSort);
    if (gridViewBtn) gridViewBtn.addEventListener("click", () => toggleView(true));
    if (listViewBtn) listViewBtn.addEventListener("click", () => toggleView(false));

    document.querySelectorAll(".countdownContainer").forEach(container => {
        const title = container.querySelector("h5")?.textContent.trim();
        if (!title) return;
        const event = countdowns.find(e => e.title === title);
        if (!event) return;
    
        container.addEventListener("click", function () {
            showOverlay(title, null, this); // no id
          });
                   
    });

    document.addEventListener("click", function (e) {
        const activeOverlay = document.querySelector(".countdownOverlay");
    
        if (!activeOverlay) return;
    
        const isClickInsideOverlay = e.target.closest(".countdownOverlay");
        const isClickInsideCountdown = e.target.closest(".countdownContainer");
    
        // If the click is NOT inside either the overlay or a countdown, remove the overlay
        if (!isClickInsideOverlay && !isClickInsideCountdown) {
            activeOverlay.remove();
        }
    });
    
    

    updateCountdowns(isGridView);
    toggleView(isGridView);
    setInterval(() => updateCountdowns(categoryContainer.classList.contains("gridView")), 60000);

    window.renderUserCountdowns = function (userCountdowns) {
        userCountdowns.forEach(entry => {
            // Skip if already exists in hardcoded list (optional)
            if (countdowns.find(c => c.title === entry.label)) return;

            let timePart = entry.time && entry.time.trim() !== "" ? entry.time : "00:00";
            let fullDate = `${entry.date}T${timePart}`;

            console.log(`🛠️ Using full date string: ${fullDate}`);
            console.log(`⏱️ Parsing date for "${entry.label}":`, fullDate);
            console.log("Parsed value:", Date.parse(fullDate));
            
    
            // Add to the global countdowns array
            countdowns.push({
                title: entry.label,
                date: fullDate,
                annual: entry.annual
              });         
    
            // Render to appropriate category
            const categoryWrapper = findCategoryWrapper(entry.category);
    
            if (categoryWrapper) {
                const container = document.createElement("div");
                container.classList.add("countdownContainer");
                container.style.background = entry.backgroundCol || "#fff";
                container.style.color = entry.textColor || "#000";
                container.dataset.countdownId = entry.id;

            
                // Add delete button
                const deleteBtn = document.createElement("span");
                deleteBtn.classList.add("material-symbols-outlined", "deleteCountdown");
                deleteBtn.textContent = "delete";
                deleteBtn.title = "Delete Countdown";
                deleteBtn.style.position = "absolute";
                deleteBtn.style.top = "8px";
                deleteBtn.style.left = "8px";
                deleteBtn.style.display = "none";
                deleteBtn.style.cursor = "pointer";
            
                // Show/hide on hover
                container.addEventListener("mouseenter", () => deleteBtn.style.display = "block");
                container.addEventListener("mouseleave", () => deleteBtn.style.display = "none");
            
                deleteBtn.addEventListener("click", async (e) => {
                    e.stopPropagation();
                    const confirmed = confirm(`Delete countdown "${entry.label}"?`);
                    if (confirmed) {
                        await window.deleteCountdown(entry.id);
                        container.remove();
                    }
                });
            
                container.appendChild(deleteBtn);
            
                // Insert countdown content
                container.innerHTML += `
                    <h5>${entry.label}</h5>
                    <div class="timers">
                        <div class="days"></div>
                        <div class="hours"></div>
                        <div class="minutes"></div>
                    </div>
                `;

            
                categoryWrapper.appendChild(container);
            
                container.addEventListener("click", function () {
                    showOverlay(entry.label, entry.id, this); // ✅ 'this' refers to the clicked container
                  });
                  
                                    
            }
            
        });
    
        // Refresh all countdown timers
        updateCountdowns(isGridView);
    };

    const overlay = document.getElementById("countdownOverlay");
    const overlayLabel = document.getElementById("overlayLabel");
    const overlayFavoriteBtn = document.getElementById("overlayFavorite");
    const overlayDeleteBtn = document.getElementById("overlayDelete");
    let currentOverlayTitle = null;
    let currentOverlayId = null;

    function showOverlay(title, id = null, container) {
        // Remove any existing overlays first
        document.querySelectorAll(".countdownOverlay").forEach(el => el.remove());
    
        // Slight delay so the click event doesn't immediately close this new overlay
        setTimeout(() => {
            const overlay = document.createElement("div");
            overlay.classList.add("countdownOverlay");
    
            const label = document.createElement("h4");
            label.textContent = title;
    
            const favoriteBtn = document.createElement("button");
            favoriteBtn.className = "favoriteBtn";
            const isFavorite = favoriteCountdowns.includes(title);
            favoriteBtn.textContent = isFavorite ? "Remove from Favorites" : "Add to Favorites";
    
            favoriteBtn.onclick = () => {
                toggleFavorite(title);
                overlay.remove();
            };
    
            overlay.appendChild(label);
            overlay.appendChild(favoriteBtn);
    
            if (id) {
                const deleteBtn = document.createElement("button");
                deleteBtn.className = "deleteBtn";
                deleteBtn.textContent = "Delete Countdown";
    
                deleteBtn.onclick = async () => {
                    const confirmed = confirm(`Delete "${title}"?`);
                    if (confirmed) {
                        await window.deleteCountdown(id);
                        const toRemove = document.querySelector(`[data-countdown-id="${id}"]`);
                        if (toRemove) toRemove.remove();
                        overlay.remove();
                    }
                };
    
                overlay.appendChild(deleteBtn);
            }
    
            container.style.position = "relative";
            container.appendChild(overlay);
        }, 0);
    }
    
      
      
      

    overlayFavoriteBtn.onclick = () => {
        if (!currentOverlayTitle) return;
    
        const isCurrentlyFavorite = favoriteCountdowns.includes(currentOverlayTitle);
    
        const action = isCurrentlyFavorite ? "Remove from" : "Add to";

    
        toggleFavorite(currentOverlayTitle);
    
        // Update text label and UI
        const isNowFavorite = favoriteCountdowns.includes(currentOverlayTitle);
        overlayFavoriteBtn.textContent = isNowFavorite ? "Remove from Favorites" : "Add to Favorites";
    
        overlay.style.display = "none";
    };
    
    
    
      

    overlayDeleteBtn.onclick = async () => {
        if (currentOverlayId && confirm("Are you sure you want to delete this countdown?")) {
          await window.deleteCountdown(currentOverlayId);
      
          // Remove from DOM using data-id match
          const toRemove = document.querySelector(`[data-countdown-id="${currentOverlayId}"]`);
          if (toRemove) toRemove.remove();
      
          overlay.style.display = "none";
        }
      };
      

      document.addEventListener("click", (e) => {
        if (
          overlay.style.display === "flex" &&
          !overlay.contains(e.target) &&
          !e.target.closest(".countdownContainer")
        ) {
          overlay.style.display = "none";
        }
      });
      
      document.addEventListener("click", function (e) {
        setTimeout(() => {
            const isInsideOverlay = e.target.closest(".countdownOverlay");
            const isCountdownContainer = e.target.closest(".countdownContainer");
    
            if (!isInsideOverlay && !isCountdownContainer) {
                document.querySelectorAll(".countdownOverlay").forEach(el => el.remove());
            }
        }, 0);
    });
    
    
      

    
});
