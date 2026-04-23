const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Helper: Create spans for typewriter effect - Exact match to working code
function createSpan(parent, className = "line-text") {
    const span = document.createElement('span');
    span.className = className;
    parent.appendChild(span);
    return span;
}

// Helper: Inject the floating icon - Exact match to working code
function injectIcon(parent) {
    const iconWrap = document.createElement('div');
    iconWrap.className = 'inline-alert-float';
    iconWrap.style.color = (CONFIG.nudgeType === RED_ICON) ? 'var(--accent-red)' : 'var(--text-secondary)';
    iconWrap.innerHTML = `<i data-lucide="${CONFIG.alertIconName}" size="22"></i>`;
    parent.appendChild(iconWrap);
    lucide.createIcons();
}

async function typeIntoSpan(spanElement, text) {
    for (let char of text) {
        spanElement.textContent += char;
        await sleep(CONFIG.typingSpeed);
    }
}

function showCompletionMessage() {
    document.getElementById('task-header').style.display = 'none';
    document.getElementById('chat-container').style.display = 'none';
    const thanksDiv = document.getElementById('thank-you');
    document.getElementById('thanks-message').innerText = "Thank you! Task was completed successfully. You will be redirected to next task shortly.";
    thanksDiv.style.display = 'flex';
    lucide.createIcons();
}

async function runUsabilityTest() {
    const input = document.getElementById('user-input');
    if (!input.value.trim()) return;

    localStorage.setItem('user_query', input.value);
    document.getElementById('prompt-heading').style.display = 'none';
    document.getElementById('response-area').style.display = 'block';
    input.disabled = true;
    document.getElementById('send-btn').style.visibility = 'hidden';

    const area = document.getElementById('response-area');

    for (let line of CONFIG.aiResponse) {
        const lineDiv = document.createElement('div');
        lineDiv.className = 'response-line';
        area.appendChild(lineDiv);

        const cleanLine = line.replace(/--/g, '\u2014').replace(/[\uFFFD]/g, "--");
        const highlightRegex = /\[ALERT\](.*?)\[\/ALERT\]/;
        const highlightMatch = cleanLine.match(highlightRegex);

        if (highlightMatch) {
            const parts = cleanLine.split(highlightRegex);
            // Part 1: Text before icon
            await typeIntoSpan(createSpan(lineDiv), parts[0]);
            
            // Icon injection logic
            if (CONFIG.nudgeType === GREY_ICON || CONFIG.nudgeType === RED_ICON) {
                injectIcon(lineDiv);
            }

            // Part 2: Highlighted warning text
            await typeIntoSpan(createSpan(lineDiv, "alert-warn"), parts[1]);
            
            // Part 3: Remaining text
            if (parts[2]) await typeIntoSpan(createSpan(lineDiv), parts[2]);
        } 
        else if (cleanLine.includes("[ALERT]")) {
            const parts = cleanLine.split("[ALERT]");
            await typeIntoSpan(createSpan(lineDiv), parts[0]);
            if (CONFIG.nudgeType === GREY_ICON || CONFIG.nudgeType === RED_ICON) injectIcon(lineDiv);
            if (parts[1]) await typeIntoSpan(createSpan(lineDiv), parts[1]);
        } 
        else {
            await typeIntoSpan(createSpan(lineDiv), cleanLine);
        }
    }

    // Likert Rendering
    const likertContainer = document.getElementById('likert-container');
    CONFIG.likertQuestions.forEach(q => {
        const row = document.createElement('div');
        row.className = 'likert-row';
        row.innerHTML = `<div class="likert-question">${q.text}</div><div class="likert-options"></div>`;
        const optionsContainer = row.querySelector('.likert-options');
        CONFIG.likertLabels.forEach((label, index) => {
            const opt = document.createElement('label');
            opt.className = 'likert-option';
            opt.innerHTML = `<input type="radio" name="${q.id}" value="${index + 1}"><span>${label}</span>`;
            optionsContainer.appendChild(opt);
        });
        likertContainer.appendChild(row);
    });

    document.getElementById('feedback-section').style.display = 'block';
    document.getElementById('save-continue-btn').style.display = 'block';
    document.getElementById('copyright-notice').innerHTML = `Source: ${CONFIG.copyrightText} Used for usability research purposes only.`;
    document.getElementById('copyright-notice').style.display = 'block';

    const nudge = document.getElementById('bottom-nudge');
    if (CONFIG.nudgeType === GRAY_BOTTOM || CONFIG.nudgeType === RED_BOTTOM) {
        nudge.innerText = CONFIG.nudgeText;
        nudge.style.display = 'block';
        nudge.style.color = (CONFIG.nudgeType === RED_BOTTOM) ? 'var(--accent-red)' : 'var(--text-secondary)';
    }
}
function saveToServer() {
    const results = {
        meta: { 
            studyId: CONFIG.studyId, 
            participant: CONFIG.participantId, 
            date: new Date().toLocaleString() 
        },
        input: localStorage.getItem('user_query'),
        answer: document.getElementById('feedback-text').value,
        likert: {}
    };

    CONFIG.likertQuestions.forEach(q => {
        const val = document.querySelector(`input[name="${q.id}"]:checked`);
        results.likert[q.id] = val ? val.value : "none";
    });

    // Send data to your PHP API
    fetch('save_results.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(results)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        // Once saved, you can trigger the "Thank You" screen
        document.getElementById('chat-container').style.display = 'none';
        document.getElementById('thank-you').style.display = 'block';
    })
    .catch((error) => {
        console.error('Error:', error);
        alert("Error saving data. Please notify the researcher.");
    });
}
/**
 * Sends survey data to the PHP API
 * Tobii browser session data is cleared after recording, so we send it immediately.
 */
function saveDataToExternalServer(results) {
    fetch('https://takku.fi/hti-301-chat-ai-api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(results)
    })
    .then(response => {
        if (!response.ok) throw new Error('API request failed');
        return response.json();
    })
    .then(data => {
        console.log('Success:', data);
    })
    .catch(error => {
        // Log the error for the researcher, but don't stop the UI transition
        console.error('Data saving error:', error);
    })
    .finally(() => {
        // This block runs REGARDLESS of success or failure
        if (CONFIG.afterSubmitForwardToNextWindowLocation && CONFIG.nextWindowLocationHref) {
            window.location.href = CONFIG.nextWindowLocationHref;
        } else {
            showCompletionMessage();
        }
    });
}
window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('task-title').innerText = CONFIG.taskTitle;
    document.getElementById('task-desc').innerText = CONFIG.taskDescription;
    document.getElementById('prompt-heading').innerText = CONFIG.promptHeadingText;
    document.getElementById('feedback-label').innerText = CONFIG.feedbackQuestion;
    
    // Safety check for Lucide icons within the Tobii browser environment
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    document.getElementById('send-btn').addEventListener('click', runUsabilityTest);
    document.getElementById('user-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') runUsabilityTest();
    });
    
    document.getElementById('save-continue-btn').addEventListener('click', () => {
        // Tobii-issue
        // if (!confirm("Do you really want to save answers and continue to the next task?")) return; 
        
        const results = {
            meta: { 
                studyId: CONFIG.studyId, 
                participant: CONFIG.participantId, 
                date: new Date().toLocaleString() 
            },
            input: localStorage.getItem('user_query'),
            answer: document.getElementById('feedback-text').value,
            likert: {}
        };

        CONFIG.likertQuestions.forEach(q => {
            const val = document.querySelector(`input[name="${q.id}"]:checked`);
            results.likert[q.id] = val ? val.value : "none";
        });

        saveDataToExternalServer(results);

        if (CONFIG.afterSubmitForwardToNextWindowLocation && CONFIG.nextWindowLocationHref) {
            window.location.href = CONFIG.nextWindowLocationHref;
        } else {
            showCompletionMessage();
        }
    });
});
