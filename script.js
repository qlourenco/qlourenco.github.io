document.addEventListener("DOMContentLoaded", () => {
    const playerForm = document.getElementById("player-form");
    const playerSetup = document.getElementById("player-setup");
    const gameScreen = document.getElementById("game-screen");
    const playersList = document.getElementById("players-list");
    const roundWonBtn = document.getElementById("round-won");
    const roundLostBtn = document.getElementById("round-lost");

    const roundDisplay = document.createElement("h3");
    roundDisplay.id = "round-display";
    gameScreen.insertBefore(roundDisplay, playersList);

    const economyDisplay = document.createElement("h4");
    economyDisplay.id = "economy-display";
    gameScreen.insertBefore(economyDisplay, playersList);

    const resetBtn = document.createElement("button");
    resetBtn.id = "reset-game";
    resetBtn.textContent = "Réinitialiser la partie";
    resetBtn.style.marginTop = "20px";
    gameScreen.appendChild(resetBtn);

    const newGameBtn = document.createElement("button");
    newGameBtn.id = "new-game";
    newGameBtn.textContent = "Nouvelle partie";
    newGameBtn.style.marginTop = "20px";
    newGameBtn.style.display = "none";
    gameScreen.appendChild(newGameBtn);

    const summaryTable = document.createElement("div");
    summaryTable.id = "summary-table";
    summaryTable.style.marginTop = "40px";
    summaryTable.style.marginBottom = "80px";
    summaryTable.style.display = "none";
    document.body.appendChild(summaryTable);

    // Ajouter la logique pour détecter les champs remplis
    const inputs = document.querySelectorAll('#player-form input[type="text"]');
    inputs.forEach(input => {
        input.addEventListener("input", () => {
            if (input.value.trim() !== "") {
                input.classList.add("filled");
            } else {
                input.classList.remove("filled");
            }
        });
    });

    let players = [];
    let economyScore = 100;
    let roundNumber = 1;
    const maxRounds = 24;
    let history = [];

    const weaponPools = {
        eco: ["Glock-18/USP-S", "P250", "Five-SeveN", "Dual Baretta", "Deagle", "Tec-9"],
        force: ["Deagle", "Tec-9", "MAC-10", "MP9", "UMP-45", "FAMAS/Galil AR", "SSG"],
        complet: ["AK-47/M4A1-S", "AK-47/M4A4", "AWP", "SSG", "SG 553/AUG", "P90", "Negev", "FAMAS/Galil AR"]
    };

    playerForm.addEventListener("submit", (event) => {
        event.preventDefault();
        players = [];
        history = [];
        economyScore = 100;
        roundNumber = 1;
        summaryTable.style.display = "none";
        summaryTable.innerHTML = "";

        for (let i = 1; i <= 5; i++) {
            const playerInput = document.getElementById(`player${i}`);
            if (playerInput.value.trim() !== "") {
                players.push({ name: playerInput.value, weapon: "", isDead: false });
            }
        }

        if (players.length > 0) {
            playerSetup.classList.add("hidden");
            gameScreen.classList.remove("hidden");
            assignRandomWeapons(true);
        }
    });

    function assignRandomWeapons(forceAll = false) {
        playersList.innerHTML = "";
        roundDisplay.textContent = `Round ${roundNumber}`;
        economyDisplay.textContent = `💰 Économie : ${economyScore}/100`;

        players.forEach((player, index) => {
            const shouldUpdateWeapon = player.shouldUpdate || roundNumber === 13 || forceAll;
            if (shouldUpdateWeapon) {
                player.weapon = getRandomWeapon();
                player.shouldUpdate = false;
            }

            const playerDiv = document.createElement("div");
            playerDiv.classList.add("player-card");
            playerDiv.dataset.index = index;
            playerDiv.innerHTML = `<strong>${player.name}</strong>: ${player.weapon}`;

            if (player.isDead) {
                playerDiv.classList.add("dead");
            }

            playerDiv.addEventListener("click", () => {
                player.isDead = !player.isDead;
                playerDiv.classList.toggle("dead");
            });

            playersList.appendChild(playerDiv);
        });
    }

    function saveRoundToHistory(outcome) {
        const roundData = players.map(player => ({
            name: player.name,
            weapon: player.weapon,
            isDead: player.isDead
        }));

        history.push({
            round: roundNumber,
            outcome: outcome,
            players: roundData
        });
    }

    function displaySummary() {
        summaryTable.innerHTML = "<h2>Récapitulatif de la partie</h2>";

        const table = document.createElement("table");
        table.style.margin = "0 auto";
        table.style.borderCollapse = "collapse";
        table.style.border = "1px solid #555";
        table.style.backgroundColor = "#1e1e2e";
        table.style.color = "white";

        const thead = document.createElement("thead");
        const headRow = document.createElement("tr");
        headRow.innerHTML = `<th style='padding:6px; border:1px solid #555;'>Round</th><th style='padding:6px; border:1px solid #555;'>Résultat</th>` +
            players.map(p => `<th style='padding:6px; border:1px solid #555;'>${p.name}</th>`).join("");
        thead.appendChild(headRow);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");

        history.forEach(entry => {
            const row = document.createElement("tr");
            const bgColor = entry.outcome === "win" ? "#2d4a2d" : "#4a2d2d";

            row.innerHTML = `
                <td style='padding:6px; text-align:center; border:1px solid #555;'>${entry.round}</td>
                <td style='padding:6px; text-align:center; background-color:${bgColor}; border:1px solid #555;'>${entry.outcome === "win" ? "Gagné" : "Perdu"}</td>
                ` +
                entry.players.map(p => `
                    <td style='padding:6px; text-align:center; border:1px solid #555; background-color:${p.isDead ? "#802e2e" : "#2e2e3e"};'>${p.weapon}</td>
                `).join("");

            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        summaryTable.appendChild(table);
        summaryTable.style.display = "block";
    }

    function getRandomWeapon() {
        if (roundNumber === 1 || roundNumber === 13) {
            const pool = weaponPools["eco"];
            return pool[Math.floor(Math.random() * pool.length)];
        }

        let probabilities;
        if (economyScore <= 30) {
            probabilities = [0.95, 0.05, 0];
        } else if (economyScore <= 60) {
            probabilities = [0.15, 0.80, 0.05];
        } else {
            probabilities = [0.05, 0.15, 0.80];
        }

        const rand = Math.random();
        let weaponCategory;
        if (rand < probabilities[0]) {
            weaponCategory = "eco";
        } else if (rand < probabilities[0] + probabilities[1]) {
            weaponCategory = "force";
        } else {
            weaponCategory = "complet";
        }

        const pool = weaponPools[weaponCategory];
        return pool[Math.floor(Math.random() * pool.length)];
    }

    function nextRound(updateEconomy) {
        const outcome = updateEconomy > 0 ? "win" : "lose";
        saveRoundToHistory(outcome);

        if (roundNumber >= maxRounds) {
            gameScreen.classList.add("hidden");
            playerSetup.classList.remove("hidden");
            displaySummary();
            return;
        }

        players.forEach(player => {
            player.shouldUpdate = player.isDead || roundNumber === 12;
            player.isDead = false;
        });

        roundNumber++;
        if (updateEconomy > 0) economyScore = Math.min(100, economyScore + updateEconomy);
        if (updateEconomy < 0) economyScore = Math.max(0, economyScore + updateEconomy);
        assignRandomWeapons();
    }

    roundWonBtn.addEventListener("click", () => nextRound(30));
    roundLostBtn.addEventListener("click", () => nextRound(-30));

    resetBtn.addEventListener("click", resetGame);
    newGameBtn.addEventListener("click", resetGame);

    function resetGame() {
        players = [];
        economyScore = 100;
        roundNumber = 1;
        history = [];
        roundWonBtn.disabled = false;
        roundLostBtn.disabled = false;
        newGameBtn.style.display = "none";
        gameScreen.classList.add("hidden");
        playerSetup.classList.remove("hidden");
        summaryTable.style.display = "none";
        summaryTable.innerHTML = "";
        document.getElementById("player-form").reset();
    }
});
