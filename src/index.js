const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const helper = require('./helper');





// Создаем экземпляр бота
const bot = new TelegramBot(config.TOKEN, { polling: true });
helper.logStart()



// Обработка команды /start
bot.onText(/\/start/, (msg) => {
    const firstName = msg.from.first_name;

    // Отправка приветственного сообщения
    bot.sendMessage(helper.getChatId(msg), `Привет, ${firstName}! Добро пожаловать в наш бот. Выберите услугу которая вас интересует`,{
        reply_markup: {

        }
    });
});



// Обработка всех сообщений
bot.on('message', (msg) => {
    console.log('Работает');
});


