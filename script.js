// ---------------------------
// 1. Persistent User ID
// ---------------------------
function getUserId() {
    let userId = localStorage.getItem('toiletSignGameUserId');
    if (!userId) {
        userId = generateUUID();
        localStorage.setItem('toiletSignGameUserId', userId);
    }
    return userId;
}

function generateUUID() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

// ---------------------------
// 2. Fetch IP and Country
// ---------------------------
function fetchIpAndCountry() {
    fetch('https://ipapi.co/json/')
        .then(response => response.json())
        .then(data => {
            userIP = data.ip;
            userCountry = data.country;
            console.log('IP:', userIP, 'Country:', userCountry);
        })
        .catch(error => console.error('Error retrieving IP info:', error));
}
fetchIpAndCountry();

// ---------------------------
// 3. Fetch and Process CSV Data
// ---------------------------
function fetchAndProcessResults() {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQVltDe1h0P48QUpRyYMqbbrg-tyWasFEJl77VdF_RiP5WRY7EZflkUXlcUjkxBPsWTjIzGPIf-idD3/pub?gid=1801092186&single=true&output=csv';
    fetch(csvUrl)
        .then(response => response.text())
        .then(csvText => {
            parseCSVAndComputeMajority(csvText);
            preloadPunnettSquares();
        })
        .catch(err => console.error("Error fetching CSV:", err));
}

function parseCSVAndComputeMajority(csvText) {
    const lines = csvText.split("\n").filter(line => line.trim().length > 0);
    if (lines.length < 2) return;
    const header = lines[0].split(",").map(s => s.trim());
    const questionIdx = header.indexOf("question");
    const genderIdx = header.indexOf("gender");
    const answerIdx = header.indexOf("answer");
    const userIdIdx = header.indexOf("userId");
    
    // Structure: counts[question][gender]["A" or "B"]
    const counts = {};
    const seen = {};
    
    for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(",").map(s => s.trim());
        const question = row[questionIdx];
        const gender = row[genderIdx];
        const answer = row[answerIdx];
        const userId = userIdIdx >= 0 ? row[userIdIdx] : null;
        if (!counts[question]) {
            counts[question] = { male: { A: 0, B: 0 }, female: { A: 0, B: 0 } };
            seen[question] = new Set();
        }
        if (userId && seen[question].has(userId)) continue;
        if (userId) seen[question].add(userId);
        if ((gender === "male" || gender === "female") && (answer === "A" || answer === "B")) {
            counts[question][gender][answer]++;
        }
    }
    globalCounts = counts;
    console.log("Counts:", counts);
    
    // Compute majority answers with normalization and tie-breaking.
    for (const question in counts) {
        correctAnswers[question] = {};
        const result = {};
        for (const gender of ["male", "female"]) {
            const aCount = counts[question][gender]["A"];
            const bCount = counts[question][gender]["B"];
            const total = aCount + bCount;
            const ratio = total > 0 ? aCount / total : 0.5;
            result[gender] = ratio >= 0.5 ? "A" : "B";
            result[gender + "_excess"] = Math.abs(ratio - 0.5);
        }
        if (result["male"] === result["female"]) {
            if (result["male_excess"] === result["female_excess"]) {
                correctAnswers[question]["male"] = result["male"];
                correctAnswers[question]["female"] = result["male"] === "A" ? "B" : "A";
            } else if (result["male_excess"] > result["female_excess"]) {
                correctAnswers[question]["male"] = result["male"];
                correctAnswers[question]["female"] = result["male"] === "A" ? "B" : "A";
            } else {
                correctAnswers[question]["female"] = result["female"];
                correctAnswers[question]["male"] = result["female"] === "A" ? "B" : "A";
            }
        } else {
            correctAnswers[question]["male"] = result["male"];
            correctAnswers[question]["female"] = result["female"];
        }
    }
    console.log("Normalized majority answers computed:", correctAnswers);
}

// Preload Punnett squares for each question using the raw counts.
// This version adds a header icon for each option.
function preloadPunnettSquares() {
    for (const question in globalCounts) {
        const counts = globalCounts[question];
        let html = '<table>';
        // Use small icons for Option A and Option B in the header.
        html += `<tr>
                    <th></th>
                    <th><img src="assets/${question}_a.png" alt="Option A" style="max-width:50px;"></th>
                    <th><img src="assets/${question}_b.png" alt="Option B" style="max-width:50px;"></th>
                 </tr>`;
        ["male", "female"].forEach(gender => {
            const aCount = (counts[gender] && counts[gender]["A"]) || 0;
            const bCount = (counts[gender] && counts[gender]["B"]) || 0;
            html += `<tr>
                        <th>${gender.charAt(0).toUpperCase() + gender.slice(1)}</th>
                        <td>${aCount}</td>
                        <td>${bCount}</td>
                     </tr>`;
        });
        html += '</table>';
        punnettSquares[question] = html;
    }
    console.log("Preloaded Punnett squares:", punnettSquares);
}
fetchAndProcessResults();

// ---------------------------
// 4. Game Logic & UI
// ---------------------------
function selectGender(gender) {
    userGender = gender;
    document.getElementById('genderSection').classList.add('hidden');
    document.getElementById('gameContainer').classList.remove('hidden');
    loadLevel(currentLevel);
}

function loadLevel(level) {
    const imageContainer = document.getElementById('imageContainer');
    const resultDiv = document.getElementById('result');
    imageContainer.innerHTML = '';
    resultDiv.textContent = '';
    const summaryDiv = document.getElementById('summary');
    if (summaryDiv) summaryDiv.innerHTML = '';
    const existingNext = document.getElementById('nextBtn');
    if (existingNext) existingNext.remove();
    
    if (level >= totalLevels) {
        imageContainer.innerHTML = '<p>Game Over! Thanks for playing.</p>';
        return;
    }
    
    const imageA = `assets/${level}_a.png`;
    const imageB = `assets/${level}_b.png`;
    const images = [
        { gender: 'male', src: imageA },
        { gender: 'female', src: imageB }
    ];
    images.sort(() => Math.random() - 0.5);
    
    const table = document.createElement('table');
    const row = document.createElement('tr');
    
    images.forEach(imgObj => {
        const cell = document.createElement('td');
        const button = document.createElement('button');
        button.className = 'image-button';
        const img = document.createElement('img');
        img.src = imgObj.src;
        img.alt = `Toilet Sign ${imgObj.gender}`;
        button.appendChild(img);
        // Determine the side by checking the index of the parent cell.
        button.addEventListener('click', function() {
            const cellIndex = Array.from(this.parentNode.parentNode.children).indexOf(this.parentNode);
            const side = (cellIndex === 0) ? "left" : "right";
            handleChoice(imgObj.gender, this, side);
        });
        cell.appendChild(button);
        row.appendChild(cell);
    });
    table.appendChild(row);
    imageContainer.appendChild(table);
}

function handleChoice(selectedGender, buttonElement, side) {
    // Disable all answer buttons to prevent changes.
    document.querySelectorAll('.image-button').forEach(btn => btn.disabled = true);
    
    const resultDiv = document.getElementById('result');
    const img = buttonElement.querySelector('img');
    let result;
    
    const majorityAnswer = correctAnswers[currentLevel] && correctAnswers[currentLevel][userGender];
    if (majorityAnswer) {
        if (selectedGender === majorityAnswer) {
            resultDiv.textContent = 'You win!';
            img.style.border = '2px solid green';
            result = "A";
        } else {
            resultDiv.textContent = 'You lose!';
            img.style.border = '2px solid red';
            result = "B";
        }
    } else {
        if (selectedGender === userGender) {
            resultDiv.textContent = 'You win!';
            img.style.border = '2px solid green';
            result = "A";
        } else {
            resultDiv.textContent = 'You lose!';
            img.style.border = '2px solid red';
            result = "B";
        }
    }
    img.style.transform = 'scale(1.1)';
    
    // Send result including the side information.
    sendResultToSheet(currentLevel, userGender, result, side);
    displayPunnettSquare(currentLevel);
    
    // Add a Next button.
    const nextBtn = document.createElement('button');
    nextBtn.id = 'nextBtn';
    nextBtn.textContent = 'Next';
    nextBtn.addEventListener('click', function() {
        const summaryDiv = document.getElementById('summary');
        if (summaryDiv) summaryDiv.innerHTML = '';
        this.remove();
        currentLevel++;
        loadLevel(currentLevel);
    });
    document.getElementById('gameContainer').appendChild(nextBtn);
}

function displayPunnettSquare(question) {
    const summaryDiv = document.getElementById('summary');
    summaryDiv.innerHTML = '';
    if (punnettSquares[question]) {
        summaryDiv.innerHTML = punnettSquares[question];
    } else {
        summaryDiv.textContent = "No summary available.";
    }
}

// ---------------------------
// 5. Submit Data to Endpoint
// ---------------------------
function sendResultToSheet(level, gender, answer, side) {
    const url = 'https://script.google.com/macros/s/AKfycbxiN2kF-qfoYdD0OcbNn_FaYHvuLBkdDcXVnQAQFjpB6JlJ2MCmecO59EOlql3Hr3Ox/exec?gid=1801092186';
    const userId = getUserId();
    const formData = new URLSearchParams();
    formData.append('gender', gender);
    formData.append('question', level.toString());
    formData.append('answer', answer);
    formData.append('side', side); // Include side information ("left" or "right")
    formData.append('ip', userIP);
    formData.append('country', userCountry);
    formData.append('userId', userId);
    
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
    })
    .then(response => response.text())
    .then(data => console.log('Response:', data))
    .catch(error => console.error('Error submitting form:', error));
}
