const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const app = express();

// Надаємо доступ до статичних файлів (CSS, JS, зображень)
app.use(express.static(path.join(__dirname, 'public')));

// Маршрут для головної сторінки
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Запуск сервера на порті, який може бути заданий у середовищі або стандартно 3001
const PORT = process.env.PORT || 3001;

// Middleware для обробки даних форми
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // Для подачі статичних файлів (HTML)

// Шлях до JSON-файлу облікових даних облікового запису служби
const KEYFILEPATH = path.join(__dirname, 'credentials.json'); // Переконайтеся, що цей файл існує
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// ID вашої Google Таблиці
const SPREADSHEET_ID = '16bb0oxmja3WQ7XlNOTFn7d08LJTMAjsV0yPH06RTCzo'; // Замініть на ID вашої таблиці
const MAIN_SHEET_NAME = 'Data1'; // <--- ЗАМІНІТЬ ЦЕ НА РЕАЛЬНУ НАЗВУ ВАШОГО ОСНОВНОГО АРКУША
const LOG_SHEET_NAME = 'Data2';

async function getAuthSheets() {
    const auth = new google.auth.GoogleAuth({
        keyFile: KEYFILEPATH,
        scopes: SCOPES,
    });
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    return { sheets };
}

app.post('/submit-rsvp', async (req, res) => {
    const { name, surname, phone, willAttend } = req.body;
    const currentTime = new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' }); // Час у Києві

    if (!name || !phone || !willAttend) {
        return res.status(400).send('Будь ласка, заповніть всі поля форми.');
    }

    try {
        const { sheets } = await getAuthSheets();

        const normalizedInputPhone = phone.replace(/\D/g, ''); // Нормалізуємо вхідний номер

        // 1. Прочитати всі дані з основного аркуша, щоб знайти номер телефону
        const mainSheetDataResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${MAIN_SHEET_NAME}!A:C`, // Читаємо всі стовпці, що нас цікавлять
        });

        const mainSheetRows = mainSheetDataResponse.data.values || [];
        let rowToUpdate = -1;
        let oldValues = null;

        // Пошук існуючого номера телефону та його рядка
        for (let i = 0; i < mainSheetRows.length; i++) {
            const row = mainSheetRows[i];
            // Припускаємо, що номер телефону знаходиться в стовпці C (індекс 2)
            if (row[2]) { // Перевіряємо, що стовпець не порожній
                const normalizedExistingPhone = String(row[2]).replace(/\D/g, '');
                if (normalizedExistingPhone === normalizedInputPhone) {
                    rowToUpdate = i; // Знайдено рядок, який потрібно оновити
                    oldValues = row;
                    break;
                }
            }
        }

        const newValues = [name, surname, phone, willAttend === 'yes' ? 'Так' : 'Ні'];

        if (rowToUpdate !== -1) {
            // Номер телефону знайдено, оновлюємо існуючий рядок
            const updateRange = `${MAIN_SHEET_NAME}!A${rowToUpdate + 1}:D${rowToUpdate + 1}`;
            await sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: updateRange,
                valueInputOption: 'RAW',
                resource: {
                    values: [newValues],
                },
            });

            // Запис зміни в журнал
            const logEntry = [
                currentTime,
                normalizedInputPhone,
                'Оновлення',
                `Ім'я: ${oldValues[0] || ''}, Прізвище: ${oldValues[1] || ''}, Телефон: ${oldValues[2] || ''}, Присутність: ${oldValues[3] || ''}`,
                `Ім'я: ${newValues[0]}, Прізвище: ${newValues[1]}, Телефон: ${newValues[2]}, Присутність: ${newValues[3]}`
            ];
            await sheets.spreadsheets.values.append({
                spreadsheetId: SPREADSHEET_ID,
                range: `${LOG_SHEET_NAME}!A:E`,
                valueInputOption: 'RAW',
                resource: {
                    values: [logEntry],
                },
            });

            res.send('Ваша відповідь оновлена! Дякуємо.');

        } else {
            // Номер телефону не знайдено, додаємо новий рядок
            const appendRange = `${MAIN_SHEET_NAME}!A:D`;
            await sheets.spreadsheets.values.append({
                spreadsheetId: SPREADSHEET_ID,
                range: appendRange,
                valueInputOption: 'RAW',
                resource: {
                    values: [newValues],
                },
            });

            // Запис додавання в журнал
            const logEntry = [
                currentTime,
                normalizedInputPhone,
                'Додавання',
                '', // Попередні значення відсутні
                `Ім'я: ${newValues[0]}, Прізвище: ${newValues[1]}, Телефон: ${newValues[2]}, Присутність: ${newValues[3]}`
            ];
            await sheets.spreadsheets.values.append({
                spreadsheetId: SPREADSHEET_ID,
                range: `${LOG_SHEET_NAME}!A:E`,
                valueInputOption: 'RAW',
                resource: {
                    values: [logEntry],
                },
            });

            res.send('Ваша відповідь прийнята! Дякуємо.');
        }

    } catch (error) {
        console.error('Помилка при обробці запиту:', error);
        if (error.response && error.response.data && error.response.data.error) {
            console.error('Деталі помилки API:', error.response.data.error);
        }
        res.status(500).send('Виникла помилка під час обробки вашої відповіді. Будь ласка, спробуйте пізніше.');
    }
});



app.listen(PORT, () => {
    console.log(`Сервер запущено на порті ${PORT}`);
});
