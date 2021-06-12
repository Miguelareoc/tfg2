const moment = require('moment-timezone'); // will help us do all the birthday math

module.exports = {
        createReminderData( timezone, locale, message) {
        timezone = timezone ? timezone : 'Europe/Paris'; // so it works on the simulator, replace with your timezone and remove if testing on a real device
        moment.locale(locale);
        const now = moment().tz(timezone);
        
        const scheduled = now.startOf('minute').add(30,'seconds');//.add(daysUntilBirthday, 'days');
        const extra = 
        console.log('Reminder schedule: ' + scheduled.format('YYYY-MM-DDTHH:mm:00.000'));

        return {
            requestTime: now.format('YYYY-MM-DDTHH:mm:00.000'), //ESTRUCTURA DEL FORMATO  fecha actual de cuando se ha hecho la peticion
            trigger: {  // cuando se va a enviar 
                type: 'SCHEDULED_ABSOLUTE', //fecha absoluta
                scheduledTime: scheduled.format('YYYY-MM-DDTHH:mm:00.000'), //fecha en la que lo tiene que decir
                timeZoneId: timezone,
            },
            alertInfo: {
              spokenInfo: {
                content: [{
                  locale: locale,
                  text: message,  //mensaje que se envia 
                }],
              },
            },
            pushNotification: {
              status: 'ENABLED',
            }
        }
    }
}