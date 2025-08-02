// Timer management
let activeTimers = new Map();
let studyTimer = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeWellnessTasks();
    initializeStudyTimer();
    initializeAvatarSelection();
    initializeMostUsedApp();
});

// Wellness Tasks Functionality
function initializeWellnessTasks() {
    const tasks = document.querySelectorAll('.wellness-task');
    
    tasks.forEach(task => {
        const taskId = task.dataset.taskId;
        const startBtn = task.querySelector('.start-task-btn');
        const stopBtn = task.querySelector('.stop-task-btn');
        const timerInput = task.querySelector('.timer-input');
        const timerDisplay = task.querySelector('.task-timer');
        const completedDisplay = task.querySelector('.task-completed');
        const controls = task.querySelector('.task-controls');
        
        startBtn.addEventListener('click', () => {
            const duration = parseInt(timerInput.value) || 5;
            startWellnessTask(taskId, duration, task);
        });
        
        stopBtn.addEventListener('click', () => {
            stopWellnessTask(taskId, task);
        });
    });
}

function startWellnessTask(taskId, duration, taskElement) {
    // Hide start controls, show timer
    const controls = taskElement.querySelector('.task-controls');
    controls.querySelector('.timer-input').style.display = 'none';
    controls.querySelector('.start-task-btn').style.display = 'none';
    controls.querySelector('.task-timer').classList.remove('hidden');
    
    let timeLeft = duration * 60; // Convert to seconds
    const timerDisplay = taskElement.querySelector('.timer-display');
    
    // Store original duration for point calculation
    taskElement.dataset.originalDuration = duration;
    
    // Update display immediately
    updateTimerDisplay(timerDisplay, timeLeft);
    
    // Start countdown
    const timerId = setInterval(() => {
        timeLeft--;
        updateTimerDisplay(timerDisplay, timeLeft);
        
        if (timeLeft <= 0) {
            clearInterval(timerId);
            completeWellnessTask(taskId, taskElement, duration);
        }
    }, 1000);
    
    activeTimers.set(taskId, timerId);
}

function stopWellnessTask(taskId, taskElement) {
    if (activeTimers.has(taskId)) {
        clearInterval(activeTimers.get(taskId));
        activeTimers.delete(taskId);
    }
    
    resetWellnessTaskDisplay(taskElement);
}

function completeWellnessTask(taskId, taskElement, duration) {
    if (activeTimers.has(taskId)) {
        clearInterval(activeTimers.get(taskId));
        activeTimers.delete(taskId);
    }
    
    // Show completion message with points earned
    const controls = taskElement.querySelector('.task-controls');
    controls.querySelector('.task-timer').classList.add('hidden');
    const completedElement = controls.querySelector('.task-completed');
    completedElement.classList.remove('hidden');
    
    // Award points
    fetch('/complete_task', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            task_id: parseInt(taskId),
            duration: duration
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updatePointsDisplay(data.points);
            updateWellnessTimeDisplay(data.total_wellness_time);
            
            // Update completion message with actual points earned
            const completionText = completedElement.querySelector('.completion-text');
            completionText.textContent = `✅ COMPLETED! +${data.points_earned} PTS`;
            
            // Check for avatar unlock
            checkAvatarUnlock(data.points);
            
            // Reset task after 4 seconds
            setTimeout(() => {
                resetWellnessTaskDisplay(taskElement);
            }, 4000);
        }
    })
    .catch(error => console.error('Error completing task:', error));
}

function resetWellnessTaskDisplay(taskElement) {
    const controls = taskElement.querySelector('.task-controls');
    controls.querySelector('.timer-input').style.display = 'inline-block';
    controls.querySelector('.start-task-btn').style.display = 'inline-block';
    controls.querySelector('.task-timer').classList.add('hidden');
    controls.querySelector('.task-completed').classList.add('hidden');
}

// Study Timer Functionality
function initializeStudyTimer() {
    const startBtn = document.getElementById('start-study-btn');
    const stopBtn = document.getElementById('stop-study-btn');
    const resetBtn = document.getElementById('reset-study-btn');
    const durationInput = document.getElementById('study-duration');
    
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            const duration = parseInt(durationInput.value) || 25;
            startStudySession(duration);
        });
    }
    
    if (stopBtn) {
        stopBtn.addEventListener('click', stopStudySession);
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', resetStudyTimer);
    }
}

function startStudySession(duration) {
    const controls = document.querySelector('.study-controls');
    const timerDisplay = document.getElementById('study-timer-display');
    const completedDisplay = document.getElementById('study-completed');
    
    // Hide controls, show timer
    controls.style.display = 'none';
    timerDisplay.classList.remove('hidden');
    completedDisplay.classList.add('hidden');
    
    let timeLeft = duration * 60; // Convert to seconds
    const timerText = document.getElementById('study-timer-text');
    
    // Update display immediately
    updateTimerDisplay(timerText, timeLeft);
    
    // Start countdown
    studyTimer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay(timerText, timeLeft);
        
        if (timeLeft <= 0) {
            clearInterval(studyTimer);
            studyTimer = null;
            completeStudySession();
        }
    }, 1000);
}

function stopStudySession() {
    if (studyTimer) {
        clearInterval(studyTimer);
        studyTimer = null;
    }
    
    // Deduct points for stopping early
    fetch('/stop_study', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updatePointsDisplay(data.points);
        }
    })
    .catch(error => console.error('Error stopping study:', error));
    
    resetStudyTimer();
}

function completeStudySession() {
    const timerDisplay = document.getElementById('study-timer-display');
    const completedDisplay = document.getElementById('study-completed');
    
    // Show completion message
    timerDisplay.classList.add('hidden');
    completedDisplay.classList.remove('hidden');
    
    // Award points
    fetch('/complete_study', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            duration: 0
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updatePointsDisplay(data.points);
        }
    })
    .catch(error => console.error('Error completing study:', error));
}

function resetStudyTimer() {
    const controls = document.querySelector('.study-controls');
    const timerDisplay = document.getElementById('study-timer-display');
    const completedDisplay = document.getElementById('study-completed');
    
    // Show controls, hide others
    controls.style.display = 'flex';
    timerDisplay.classList.add('hidden');
    completedDisplay.classList.add('hidden');
    
    if (studyTimer) {
        clearInterval(studyTimer);
        studyTimer = null;
    }
}

// Avatar Selection
function initializeAvatarSelection() {
    const avatarBoxes = document.querySelectorAll('.avatar-unlock-box');
    
    avatarBoxes.forEach(box => {
        const avatarId = parseInt(box.dataset.avatarId);
        const unlockedAvatar = box.querySelector('.avatar-pixel-small.unlocked');
        
        if (unlockedAvatar) {
            box.addEventListener('click', () => {
                changeAvatar(avatarId);
            });
        }
    });
}

function changeAvatar(avatarId) {
    fetch('/change_avatar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            avatar_id: avatarId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update current avatar display
            const currentAvatar = document.querySelector('.avatar-pixel-large');
            if (currentAvatar) {
                currentAvatar.className = `avatar-pixel-large avatar-${avatarId} animated`;
            }
            
            // Show feedback
            showMessage('Avatar changed successfully!', 'success');
        } else {
            showMessage('Avatar not unlocked yet!', 'error');
        }
    })
    .catch(error => {
        console.error('Error changing avatar:', error);
        showMessage('Error changing avatar', 'error');
    });
}

// Most Used App
function initializeMostUsedApp() {
    const updateBtn = document.getElementById('update-app-btn');
    const appInput = document.getElementById('most-used-app');
    
    if (updateBtn && appInput) {
        updateBtn.addEventListener('click', () => {
            const appName = appInput.value.trim();
            if (appName) {
                updateMostUsedApp(appName);
            }
        });
        
        appInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const appName = appInput.value.trim();
                if (appName) {
                    updateMostUsedApp(appName);
                }
            }
        });
    }
}

function updateMostUsedApp(appName) {
    fetch('/update_most_used_app', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            app_name: appName
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updatePointsDisplay(data.points);
            
            // Check if bonus was awarded
            if (appName.toLowerCase().includes('wellness') || 
                appName.toLowerCase().includes('this app') || 
                appName.toLowerCase() === 'this one') {
                showMessage('Bonus +20 points for choosing this wellness app!', 'success');
            } else {
                showMessage('App updated successfully!', 'success');
            }
        }
    })
    .catch(error => {
        console.error('Error updating app:', error);
        showMessage('Error updating app', 'error');
    });
}

// Utility Functions
function updateTimerDisplay(element, seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    element.textContent = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function updatePointsDisplay(points) {
    const pointsElement = document.getElementById('points-value');
    if (pointsElement) {
        pointsElement.textContent = points;
        
        // Add animation effect
        pointsElement.style.transform = 'scale(1.2)';
        pointsElement.style.color = '#fbbf24';
        setTimeout(() => {
            pointsElement.style.transform = 'scale(1)';
        }, 300);
    }
}

function updateWellnessTimeDisplay(totalTime) {
    const timeElements = document.querySelectorAll('.stat-value');
    timeElements.forEach(el => {
        if (el.textContent.includes('min') && el.parentElement.querySelector('label').textContent.includes('Total Wellness Time')) {
            el.textContent = `${totalTime} min`;
        }
    });
}

function checkAvatarUnlock(currentPoints) {
    const avatarsToUnlock = Math.floor(currentPoints / 50);
    const unlockBoxes = document.querySelectorAll('.avatar-unlock-box');
    
    // Check for newly unlocked avatars (avatar IDs 4-10)
    for (let i = 4; i <= Math.min(10, 3 + avatarsToUnlock); i++) {
        const avatarBox = document.querySelector(`[data-avatar-id="${i}"]`);
        if (avatarBox && avatarBox.querySelector('.avatar-locked')) {
            // Unlock this avatar
            const lockedElement = avatarBox.querySelector('.avatar-locked');
            lockedElement.remove();
            
            // Add unlocked avatar
            const unlockedAvatar = document.createElement('div');
            unlockedAvatar.className = `avatar-pixel-small avatar-${i} unlocked`;
            unlockedAvatar.title = `Avatar ${i}`;
            avatarBox.appendChild(unlockedAvatar);
            
            // Add click handler
            avatarBox.addEventListener('click', () => {
                changeAvatar(i);
            });
            
            // Show unlock notification
            showMessage(`🎉 New Avatar Unlocked!`, 'success');
            
            // Add unlock animation
            avatarBox.style.animation = 'bounce 1s ease-in-out';
            setTimeout(() => {
                avatarBox.style.animation = '';
            }, 1000);
        }
    }
}

function showMessage(message, type) {
    // Create temporary message element
    const messageEl = document.createElement('div');
    messageEl.textContent = message;
    messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#059669' : '#dc2626'};
        color: #e0f2e7;
        padding: 15px 20px;
        border: 2px solid ${type === 'success' ? '#4ade80' : '#ef4444'};
        font-family: 'Press Start 2P', cursive;
        font-size: 10px;
        z-index: 1000;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    document.body.appendChild(messageEl);
    
    // Remove after 3 seconds
    setTimeout(() => {
        if (messageEl.parentNode) {
            messageEl.parentNode.removeChild(messageEl);
        }
    }, 3000);
}

// Add some interactive effects
document.addEventListener('DOMContentLoaded', function() {
    // Add floating animation to current avatar on load
    const currentAvatar = document.querySelector('.avatar-pixel-large');
    if (currentAvatar) {
        // Add click effect
        currentAvatar.addEventListener('click', function() {
            this.style.animation = 'bounce 0.6s ease-in-out';
            setTimeout(() => {
                this.style.animation = 'float 3s ease-in-out infinite';
            }, 600);
        });
    }
    
    // Add hover effects to unlock boxes
    const unlockBoxes = document.querySelectorAll('.avatar-unlock-box');
    unlockBoxes.forEach(box => {
        box.addEventListener('mouseenter', function() {
            if (this.querySelector('.avatar-pixel-small.unlocked')) {
                this.style.transform = 'scale(1.1)';
            }
        });
        
        box.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
});
