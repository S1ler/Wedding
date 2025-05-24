document.addEventListener('DOMContentLoaded', function() {
    // Вкажіть кінцеву дату та час
    // Формат: "Рік-Місяць-ДеньТГодина:Хвилина:Секунда"
    // Місяці в JavaScript починаються з 0 (січень = 0, лютий = 1, ...)
    const targetDate = new Date("2025-06-21T16:00:00").getTime();

    // Отримуємо елементи для відображення
    const daysSpan = document.getElementById('days');
    const hoursSpan = document.getElementById('hours');
    const minutesSpan = document.getElementById('minutes');
    const secondsSpan = document.getElementById('seconds');
    const messageParagraph = document.getElementById('message');

    function updateCountdown() {
        const now = new Date().getTime();
        const distance = targetDate - now;

        // Якщо зворотний відлік закінчився
        if (distance < 0) {
            clearInterval(countdownInterval);
            document.getElementById('countdown').innerHTML = "ПОДІЯ ВЖЕ НАСТАЛА!";
            messageParagraph.textContent = "Вітаємо з подією!";
            return;
        }

        // Розрахунки часу
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Додаємо нуль спереду, якщо число менше 10
        daysSpan.textContent = String(days).padStart(2, '0');
        hoursSpan.textContent = String(hours).padStart(2, '0');
        minutesSpan.textContent = String(minutes).padStart(2, '0');
        secondsSpan.textContent = String(seconds).padStart(2, '0');
    }

    // Оновлюємо таймер кожну секунду
    const countdownInterval = setInterval(updateCountdown, 1000);

    // Викликаємо функцію відразу, щоб уникнути затримки на 1 секунду при першому відображенні
    updateCountdown();
});