const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const config = require('./config');
const helper = require('./helper');
const kb = require('./keyboard_buttons');
const kb_text = require('./keyboard_text.js');




// Подключаемся к MongoDB
mongoose.connect(config.DB_URL)
.then(function () {
    console.log('Мы подключились к БД бота!!!');
})
.catch(function (error) {
    console.log(error);
});






// Создаем экземпляр бота
const bot = new TelegramBot(config.TOKEN, { polling: true });
helper.logStart()






// Обработка команды /start
bot.onText(/\/start/, (msg) => {
    const firstName = msg.from.first_name;

    console.log(msg.from);
    

    // Отправка приветственного сообщения
    bot.sendMessage(helper.getChatId(msg), `Привет, ${firstName}! Добро пожаловать в наш бот. Выберите услугу которая вас интересует`,{
        reply_markup: {
            keyboard: kb_text.home[0]
        }
    });
});






// Обработка всех сообщений
bot.on('message', (msg) => {
    const chatId = helper.getChatId(msg);


    switch(msg.text){
        case kb.home.buy:
            bot.sendMessage(chatId, `Выберите что хотите заказать:`,{
                reply_markup: {
                    keyboard: kb_text.buy[0]
                }
            });
            console.log('Нажата кнопка заказать');
            break
        case kb.home.consulting:
            console.log('Нажата кнопка консультация');
            break
        case kb.home.repair:
            console.log('Нажата кнопка ремонт');
            break
        case kb.home.agreement:
            console.log('Нажата кнопка Согласование');
            break
        case kb.back:
            bot.sendMessage(chatId, `Выберите услугу которая вас интересует:`,{
                reply_markup: {
                    keyboard: kb_text.home[0]
                }
            });
            console.log('Нажата кнопка назад');
            break
    }
});


