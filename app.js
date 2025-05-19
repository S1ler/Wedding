const express = require('express');
const path = require('path');
const app = express();

// Надаємо доступ до статичних файлів (CSS, JS, зображень)
app.use(express.static(path.join(__dirname, 'public')));

// Маршрут для головної сторінки
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Запуск сервера на порті, який може бути заданий у середовищі або стандартно 6000
const PORT = process.env.PORT || 6000;
app.listen(PORT, () => {
    console.log(`Сервер запущено на порті ${PORT}`);
});
