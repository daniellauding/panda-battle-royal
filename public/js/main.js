// Initialize the game when the page loads
let game;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, creating game instance...');
    
    // Check if Three.js is loaded
    if (typeof THREE === 'undefined') {
        console.error('THREE.js is not loaded!');
        return;
    } else {
        console.log('THREE.js version:', THREE.REVISION);
    }
    
    // Create the game instance
    game = new Game();
    console.log('Game instance created:', game);

    // Handle join game button
    const joinButton = document.getElementById('join-game');
    const playerNameInput = document.getElementById('player-name');
    const characterSelect = document.getElementById('character-select');

    joinButton.addEventListener('click', () => {
        const playerName = playerNameInput.value.trim();
        const character = characterSelect.value;

        if (!playerName) {
            alert('Please enter a player name!');
            return;
        }

        if (playerName.length > 20) {
            alert('Player name must be 20 characters or less!');
            return;
        }

        // Start the game
        game.startGame(playerName, character);
    });

    // Allow Enter key to join game
    playerNameInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            joinButton.click();
        }
    });

    // Focus on name input initially
    playerNameInput.focus();
});

// Handle tab visibility changes (pause/resume game)
document.addEventListener('visibilitychange', () => {
    if (game && game.gameStarted) {
        if (document.hidden) {
            // Game is hidden, you might want to pause certain activities
            console.log('Game paused (tab hidden)');
        } else {
            // Game is visible again
            console.log('Game resumed (tab visible)');
        }
    }
});

// Handle window beforeunload to clean up connections
window.addEventListener('beforeunload', () => {
    if (game && game.socket) {
        game.socket.disconnect();
    }
});
