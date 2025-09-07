document.addEventListener('DOMContentLoaded', () => {
    const botCards = document.querySelectorAll('.clickable-bot-card');

    botCards.forEach(card => {
        card.addEventListener('click', () => {
            const botName = card.getAttribute('data-bot-name');
            if (botName) {
                // Redirect to the bot-builder page with the bot name as a query parameter
                window.location.href = `bot-builder.html?bot=${encodeURIComponent(botName)}`;
            }
        });
    });
});