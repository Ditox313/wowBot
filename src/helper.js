module.exports = {
    logStart(){
        console.log('Бот запущен...');
    },
    getChatId(msg){
        return msg.chat.id;
    }
}