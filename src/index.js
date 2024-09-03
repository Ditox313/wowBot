const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const config = require('./config');
const helper = require('./helper');
const kb = require('./keyboard_buttons');
const kb_text = require('./keyboard_text.js');
const User = require('./models/User.js');

// Подключаемся к MongoDB
mongoose.connect(config.DB_URL)
    .then(() => {
        console.log('Мы подключились к БД бота!!!');
    })
    .catch((error) => {
        console.log(error);
    });

// Создаем экземпляр бота
const bot = new TelegramBot(config.TOKEN, { polling: true });
helper.logStart();

// Состояния диалога
const states = {};

// Обработка команды /start
bot.onText(/\/start/, async (msg) => {
    const firstName = msg.from.first_name;

    // Сохраняем пользователя
    const user = {
        tgId: msg.from.id,
        is_bot: msg.from.is_bot,
        first_name: msg.from.first_name,
        username: msg.from.username,
        language_code: msg.from.language_code,
    };

    try {
        // Проверяем, существует ли пользователь с таким tgId
        const existingUser = await User.findOne({ tgId: user.tgId });
        if (!existingUser) {
            await new User(user).save();
            console.log('User saved:', user);
        } else {
            console.log('User already exists:', existingUser);
        }
    } catch (error) {
        console.error('Error saving user:', error);
    }

    // Отправка приветственного сообщения
    bot.sendMessage(helper.getChatId(msg), `Привет, ${firstName}! Добро пожаловать в наш бот. Выберите услугу которая вас интересует`, {
        reply_markup: {
            keyboard: kb_text.home[0],
            resize_keyboard: true
        }
    });
});

// Обработка всех сообщений
bot.on('message', (msg) => {
    const chatId = helper.getChatId(msg);

    // Инициализация состояния пользователя, если оно еще не существует
    if (!states[chatId]) {
        states[chatId] = { state: 'start' };
    }

    // Обработка сообщения в зависимости от текущего состояния
    switch (states[chatId].state) {
        case 'start':
            handleStart(msg);
            break;
        case 'ask_layout':
            handleAskLayout(msg);
            break;
        case 'ask_size':
            handleAskSize(msg);
            break;
        case 'collect_data':
            handleCollectData(msg);
            break;
        case 'ask_address':
            handleAskAddress(msg);
            break;
        case 'ask_photo':
            handleAskPhoto(msg);
            break;
        case 'collect_photo':
            handleCollectPhoto(msg);
            break;
        default:
            handleStart(msg);
    }
});

// Обработка начального состояния
function handleStart(msg) {
    const chatId = helper.getChatId(msg);

    switch (msg.text) {
        case kb.home.buy:
            bot.sendMessage(chatId, `Выберите что хотите заказать:`, {
                reply_markup: {
                    keyboard: kb_text.buy[0].concat([[kb.back]]),
                    resize_keyboard: true
                }
            });
            console.log('Нажата кнопка заказать');
            states[chatId].state = 'select_service';
            break;

        case kb.home.consulting:
            console.log('Нажата кнопка консультация');
            forwardToOperator(chatId, msg.from, 'Консультация');
            break;

        case kb.home.repair:
            console.log('Нажата кнопка ремонт');
            bot.sendMessage(chatId, `Пожалуйста, укажите адрес для ремонта/обслуживания.`, {
                reply_markup: {
                    keyboard: [[kb.back]],
                    resize_keyboard: true
                }
            });
            states[chatId].state = 'ask_address';
            break;

        case kb.home.agreement:
            console.log('Нажата кнопка Согласование');
            states[chatId].state = 'agreement';
            break;

        case kb.back:
            bot.sendMessage(chatId, `Выберите услугу которая вас интересует:`, {
                reply_markup: {
                    keyboard: kb_text.home[0],
                    resize_keyboard: true
                }
            });
            console.log('Нажата кнопка назад');
            states[chatId].state = 'start';
            break;

        case kb.buy.viveska_fasad:
        case kb.buy.viveska_interier:
        case kb.buy.viveska_neon:
        case kb.buy.tabl:
        case kb.buy.banner:
        case kb.buy.stella:
        case kb.buy.vizitki:
        case kb.buy.list:
        case kb.buy.art:
            bot.sendMessage(chatId, `Есть ли у вас макет?`, {
                reply_markup: {
                    keyboard: [[kb.back]],
                    resize_keyboard: true
                }
            });
            console.log('Нажата кнопка фассадная вывеска');
            states[chatId].state = 'ask_layout';
            states[chatId].selectedService = msg.text;
            break;
    }
}

// Обработка вопроса о наличии макета
function handleAskLayout(msg) {
    const chatId = helper.getChatId(msg);

    if (msg.text.toLowerCase() === 'да') {
        bot.sendMessage(chatId, `Пожалуйста, пришлите ваш макет.`, {
            reply_markup: {
                keyboard: [[kb.back]],
                resize_keyboard: true
            }
        });
        states[chatId].state = 'collect_data';
        states[chatId].nextQuestion = 'ask_size';
        states[chatId].hasLayout = true;
    } else if (msg.text.toLowerCase() === 'нет') {
        bot.sendMessage(chatId, `Знаете ли вы размер?`, {
            reply_markup: {
                keyboard: [[kb.back]],
                resize_keyboard: true
            }
        });
        states[chatId].state = 'ask_size';
        states[chatId].hasLayout = false;
    } else if (msg.text === kb.back) {
        bot.sendMessage(chatId, `Выберите услугу которая вас интересует:`, {
            reply_markup: {
                keyboard: kb_text.home[0],
                resize_keyboard: true
            }
        });
        states[chatId].state = 'start';
    } else {
        bot.sendMessage(chatId, `Пожалуйста, ответьте "да" или "нет".`, {
            reply_markup: {
                keyboard: [[kb.back]],
                resize_keyboard: true
            }
        });
    }
}

// Обработка вопроса о размере
function handleAskSize(msg) {
    const chatId = helper.getChatId(msg);

    if (msg.text.toLowerCase() === 'да' || msg.text.toLowerCase() === 'знаю') {
        bot.sendMessage(chatId, `Пожалуйста, укажите размер.`, {
            reply_markup: {
                keyboard: [[kb.back]],
                resize_keyboard: true
            }
        });
        states[chatId].state = 'collect_data';
        states[chatId].nextQuestion = 'forward_to_operator';
    } else if (msg.text.toLowerCase() === 'нет' || msg.text.toLowerCase() === 'не знаю') {
        states[chatId].size = 'Нет';
        forwardToOperator(chatId, msg.from, 'Услуга', states[chatId].selectedService, states[chatId].hasLayout, states[chatId].layout, states[chatId].size);
    } else if (msg.text === kb.back) {
        bot.sendMessage(chatId, `Есть ли у вас макет?`, {
            reply_markup: {
                keyboard: [[kb.back]],
                resize_keyboard: true
            }
        });
        states[chatId].state = 'ask_layout';
    } else {
        bot.sendMessage(chatId, `Пожалуйста, ответьте "да" или "нет".`, {
            reply_markup: {
                keyboard: [[kb.back]],
                resize_keyboard: true
            }
        });
    }
}

// Сбор данных от пользователя
function handleCollectData(msg) {
    const chatId = helper.getChatId(msg);

    if (msg.photo) {
        // Сохраняем фото
        states[chatId].layout = msg.photo[msg.photo.length - 1].file_id;
    } else if (msg.text) {
        // Сохраняем размер
        states[chatId].size = msg.text;
    }

    if (states[chatId].nextQuestion === 'ask_size') {
        bot.sendMessage(chatId, `Знаете ли вы размер?`, {
            reply_markup: {
                keyboard: [[kb.back]],
                resize_keyboard: true
            }
        });
        states[chatId].state = 'ask_size';
    } else if (states[chatId].nextQuestion === 'forward_to_operator') {
        forwardToOperator(chatId, msg.from, 'Услуга', states[chatId].selectedService, states[chatId].hasLayout, states[chatId].layout, states[chatId].size);
    }
}

// Обработка вопроса об адресе
function handleAskAddress(msg) {
    const chatId = helper.getChatId(msg);

    if (msg.text) {
        states[chatId].address = msg.text;
        bot.sendMessage(chatId, `Есть ли у вас фото изделия?`, {
            reply_markup: {
                keyboard: [[kb.back]],
                resize_keyboard: true
            }
        });
        states[chatId].state = 'ask_photo';
    } else if (msg.text === kb.back) {
        bot.sendMessage(chatId, `Выберите услугу которая вас интересует:`, {
            reply_markup: {
                keyboard: kb_text.home[0],
                resize_keyboard: true
            }
        });
        states[chatId].state = 'start';
    } else {
        bot.sendMessage(chatId, `Пожалуйста, укажите адрес для ремонта/обслуживания.`, {
            reply_markup: {
                keyboard: [[kb.back]],
                resize_keyboard: true
            }
        });
    }
}

// Обработка вопроса о наличии фото
function handleAskPhoto(msg) {
    const chatId = helper.getChatId(msg);

    if (msg.text && (msg.text.toLowerCase() === 'да' || msg.text.toLowerCase() === 'есть')) {
        bot.sendMessage(chatId, `Пожалуйста, пришлите фото изделия.`, {
            reply_markup: {
                keyboard: [[kb.back]],
                resize_keyboard: true
            }
        });
        states[chatId].state = 'collect_photo';
    } else if (msg.text && (msg.text.toLowerCase() === 'нет' || msg.text.toLowerCase() === 'нет')) {
        forwardToOperator(chatId, msg.from, 'Ремонт/Обслуживание', null, null, null, null, states[chatId].address, null);
    } else if (msg.text === kb.back) {
        bot.sendMessage(chatId, `Пожалуйста, укажите адрес для ремонта/обслуживания.`, {
            reply_markup: {
                keyboard: [[kb.back]],
                resize_keyboard: true
            }
        });
        states[chatId].state = 'ask_address';
    } else {
        bot.sendMessage(chatId, `Пожалуйста, ответьте "да" или "нет".`, {
            reply_markup: {
                keyboard: [[kb.back]],
                resize_keyboard: true
            }
        });
    }
}

// Сбор фото от пользователя
function handleCollectPhoto(msg) {
    const chatId = helper.getChatId(msg);

    if (msg.photo) {
        states[chatId].photo = msg.photo[msg.photo.length - 1].file_id;
        forwardToOperator(chatId, msg.from, 'Ремонт/Обслуживание', null, null, states[chatId].photo, null, states[chatId].address, true);
    } else if (msg.text === kb.back) {
        bot.sendMessage(chatId, `Есть ли у вас фото изделия?`, {
            reply_markup: {
                keyboard: [[kb.back]],
                resize_keyboard: true
            }
        });
        states[chatId].state = 'ask_photo';
    } else {
        bot.sendMessage(chatId, `Пожалуйста, пришлите фото изделия.`, {
            reply_markup: {
                keyboard: [[kb.back]],
                resize_keyboard: true
            }
        });
    }
}

// Переадресация данных оператору
function forwardToOperator(chatId, user, requestType, selectedService, hasLayout, layout, size, address, photo) {
    const operatorChatId = 1460472617; // Ваш chat ID
    const operatorUsername = 'RudyMaxbar'; // Замените на username оператора

    let message = `Новая заявка: ${requestType}\n`;
    if (selectedService) {
        message += `Услуга: ${selectedService}\n`;
    }
    if (hasLayout !== undefined) {
        if(requestType !== 'Ремонт/Обслуживание')
        {
            message += `Макет: ${hasLayout ? 'Есть' : 'Нет'}\n`;
        }
        
        
    }
    if (layout) {
        bot.sendPhoto(operatorChatId, layout, {
            caption: requestType === 'Ремонт/Обслуживание' ? 'Фото изделия' : 'Макет'
        });
    }
    if (size !== undefined) {
        if(requestType !== 'Ремонт/Обслуживание')
        {
            message += `Размер: ${size}\n`;
        }
        
    }
    if (address) {
        message += `Адрес: ${address}\n`;
    }

    if (photo && requestType === 'Ремонт/Обслуживание') {
        message += `Фото изделия: Есть\n`;
    }
    if (!photo && requestType === 'Ремонт/Обслуживание') {
        message += `Фото изделия: Нет\n`;
    }
    
    

    // Добавляем ссылку на личный чат с клиентом
    if (user.username) {
        message += `Ссылка на чат с клиентом: https://t.me/${user.username}\n`;
    } else {
        message += `Клиент не имеет username. ID клиента: ${user.id}\n`;
    }

    bot.sendMessage(operatorChatId, message);

    // Формируем ссылку для клиента, чтобы он мог написать оператору
    const operatorLink = operatorUsername ? `https://t.me/${operatorUsername}` : `tg://resolve?chat_id=${operatorChatId}`;
    bot.sendMessage(chatId, `Ваш заказ передан оператору. Ожидайте связи. Вы можете написать оператору напрямую: [Написать оператору](${operatorLink})`, {
        reply_markup: {
            keyboard: [[kb.back]],
            resize_keyboard: true
        },
        parse_mode: 'Markdown'
    });

    // Очищаем состояние
    delete states[chatId];
}