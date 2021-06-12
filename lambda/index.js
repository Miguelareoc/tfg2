/*
 * Copyright 2019 Amazon.com, Inc. or its affiliates.  All Rights Reserved.
 *
 * You may not use this file except in compliance with the terms and conditions 
 * set forth in the accompanying LICENSE.TXT file.
 *
 * THESE MATERIALS ARE PROVIDED ON AN "AS IS" BASIS. AMAZON SPECIFICALLY DISCLAIMS, WITH 
 * RESPECT TO THESE MATERIALS, ALL WARRANTIES, EXPRESS, IMPLIED, OR STATUTORY, INCLUDING 
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
*/

// This skill sample demonstrates how to send directives and receive events from an Echo connected gadget.
// This skill uses the Alexa Skills Kit SDK (v2). Please visit https://alexa.design/cookbook for additional
// examples on implementing slots, dialog management, session persistence, api calls, and more.

const Alexa = require('ask-sdk-core');

const Util = require('./util');
const Common = require('./common');

const languageStrings = require('./localisation');
const persistence = require('./persistence');
const interceptors = require('./interceptors');
const logic = require('./logic');

// these are the permissions needed to get the first name
const GIVEN_NAME_PERMISSION = ['alexa::profile:given_name:read'];
// these are the permissions needed to send reminders
const REMINDERS_PERMISSION = ['alexa::alerts:reminders:skill:readwrite'];

const moment = require('moment-timezone'); // will help us do all the birthday math

// The audio tag to include background music
const BG_MUSIC = '<audio src="soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_waiting_loop_30s_01"/>';

// The namespace of the custom directive to be sent by this skill
const NAMESPACE = 'Custom.Mindstorms.Gadget';

// The name of the custom directive to be sent this skill
const NAME_CONTROL = 'control';


const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    async handle(handlerInput) {
        const {attributesManager, requestEnvelope, serviceClientFactory} = handlerInput;  //Nombre usuario
        const requestAttributes = attributesManager.getRequestAttributes();
        const sessionAttributes = attributesManager.getSessionAttributes();
        
        const request = handlerInput.requestEnvelope;
        const { apiEndpoint, apiAccessToken } = request.context.System;
        const apiResponse = await Util.getConnectedEndpoints(apiEndpoint, apiAccessToken);
        
        if ((apiResponse.endpoints || []).length === 0) {
            let speechOutput = requestAttributes.t('FAIL_CONNECTION');
            return handlerInput.responseBuilder
            //.speak(`No pude encontrar EV3 Brick conectado a este dispositivo. Por favor comprueba que EV3 Brick esta conectado y pruébalo otra vez.`)
            .speak(speechOutput)
            .getResponse();
        }
        
        if(!sessionAttributes['name']){
            // let's try to get the given name via the Customer Profile API
            // don't forget to enable this permission in your skill configuratiuon (Build tab -> Permissions)
            // or you'll get a SessionEnndedRequest with an ERROR of type INVALID_RESPONSE
            try {
                const {permissions} = requestEnvelope.context.System.user;
                if(!permissions)
                    throw { statusCode: 401, message: 'No permissions available' }; // there are zero permissions, no point in intializing the API
                const upsServiceClient = serviceClientFactory.getUpsServiceClient();   
                const profileName = await upsServiceClient.getProfileGivenName();   //recive el Nombre
                if (profileName) { // the user might not have set the name
                  //save to session and persisten attributes
                  sessionAttributes['name'] = profileName;
                }

            } catch (error) {
                console.log(JSON.stringify(error));
                if (error.statusCode === 401 || error.statusCode === 403) {
                    // the user needs to enable the permissions for given name, let's send a silent permissions card.
                  handlerInput.responseBuilder.withAskForPermissionsConsentCard(GIVEN_NAME_PERMISSION);
                }
            }
        }
        
        let name = sessionAttributes['name'] ? sessionAttributes['name'] : '';
        
        //name = "miguel";
        
        const speakOutput = requestAttributes.t('WELCOME_MSG',name) + requestAttributes.t('HELP_MSG');
        
        //--------------------------------------------------------------------------------------------------
        
        // Store the gadget endpointId to be used in this skill session
        const endpointId = apiResponse.endpoints[0].endpointId || [];
        Util.putSessionAttribute(handlerInput, 'endpointId', endpointId);

        // Set skill duration to 5 minutes (ten 30-seconds interval)
        Util.putSessionAttribute(handlerInput, 'duration', 10);

        // Set the token to track the event handler
        const token = handlerInput.requestEnvelope.request.requestId;
        Util.putSessionAttribute(handlerInput, 'token', token);

        //let speechOutput = "Bienvenido, interfaz de voz activada";
        let speechOutput = requestAttributes.t('GOOD_CONNECTION');
        

        return handlerInput.responseBuilder
//            .speak(speakOutput)
//            .reprompt(requestAttributes.t('HELP_MSG'))
//            .getResponse();
            .speak(speechOutput + BG_MUSIC)
            .addDirective(Util.buildStartEventHandler(token,60000, {}))
            .getResponse();            
            
    }
};

/*

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    async handle(handlerInput) {
        const {attributesManager, serviceClientFactory, requestEnvelope} = handlerInput;  //Nombre usuario
        const requestAttributes = attributesManager.getRequestAttributes();
        const sessionAttributes = attributesManager.getSessionAttributes();
        const {intent} = handlerInput.requestEnvelope.request;
       
        if(!sessionAttributes['name']){
            // let's try to get the given name via the Customer Profile API
            // don't forget to enable this permission in your skill configuratiuon (Build tab -> Permissions)
            // or you'll get a SessionEnndedRequest with an ERROR of type INVALID_RESPONSE
            try {
                const {permissions} = requestEnvelope.context.System.user;
                if(!permissions)
                    throw { statusCode: 401, message: 'No permissions available' }; // there are zero permissions, no point in intializing the API
                const upsServiceClient = serviceClientFactory.getUpsServiceClient();
                const profileName = await upsServiceClient.getProfileGivenName();
                if (profileName) { // the user might not have set the name
                  //save to session and persisten attributes
                  sessionAttributes['name'] = profileName;
                }

            } catch (error) {
                console.log(JSON.stringify(error));
                if (error.statusCode === 401 || error.statusCode === 403) {
                    // the user needs to enable the permissions for given name, let's send a silent permissions card.
                  handlerInput.responseBuilder.withAskForPermissionsConsentCard(GIVEN_NAME_PERMISSION);
                }
            }
        }
        
        let name = sessionAttributes['name'] ? sessionAttributes['name'] : 'no';
        
        const speakOutput = requestAttributes.t('WELCOME_MSG',name) + requestAttributes.t('HELP_MSG');
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(requestAttributes.t('HELP_MSG'))
            .getResponse();
    }
};


*/

/////////////////////////////INFO//////////////////////////////////////////////////////
const InfoIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'InfoIntent';
    },
    async handle(handlerInput) {
        const {attributesManager, serviceClientFactory, requestEnvelope} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        const {intent} = handlerInput.requestEnvelope.request;
        const requestAttributes = attributesManager.getRequestAttributes();

        const name = sessionAttributes['name'] ? sessionAttributes['name'] : '';
        
        let info = Alexa.getSlotValue(handlerInput.requestEnvelope, 'Info');
        
        let speechText;
        
        if (info==='info' || info==='información'){
            speechText = requestAttributes.t('INFO_MSG',name);
        }
        if (info==='listado'){
            speechText = requestAttributes.t('INFO_LIST_MSG',name);
        }
        if (info==='movimiento' || info==='movimientos'){
            speechText = requestAttributes.t('INFO_MOV_MSG',name);
        }
        if (info==='comando' || info==='comandos'){
            speechText = requestAttributes.t('INFO_COM_MSG',name);
        }
        if (info==='emociones' || info==='sentimientos'){
            speechText = requestAttributes.t('INFO_SENT_MSG',name);
        }
        if (info==='preguntas'){
            speechText = requestAttributes.t('INFO_PREG_MSG',name);
        }
        if (info==='mensajes'){
            speechText = requestAttributes.t('INFO_MSG_MSG',name);
        }
        
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(requestAttributes.t('HELP_MSG'))
            .getResponse();
    }
};


////////////////////////////PREGUNTAS///////////////////////////////////////
const PreguntasIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'PreguntasIntent';
    },
    async handle(handlerInput) {
        const {attributesManager, serviceClientFactory, requestEnvelope} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        const {intent} = handlerInput.requestEnvelope.request;
        const requestAttributes = attributesManager.getRequestAttributes();

        const name = sessionAttributes['name'] ? sessionAttributes['name'] : '';
        
      //  sessionAttributes['dia'] = 'activar';
        
        let Pregunta = Alexa.getSlotValue(handlerInput.requestEnvelope, 'Pregunta');

        const reminderApiClient = handlerInput.serviceClientFactory.getReminderManagementServiceClient(),
            {permissions} = handlerInput.requestEnvelope.context.System.user
                
        if (!permissions) {
            return handlerInput.responseBuilder
                .speak(requestAttributes.t('PERMISSION_MSG'))
                .withAskForPermissionsConsentCard(['alexa::alerts:reminders:skill:readwrite'])
                .getResponse();
        }   
            
        if (Pregunta==='desayuno' || Pregunta==='desayunar'){                                                 //DESAYUNO
            let message1 = requestAttributes.t('DESAYUNO_P_MSG',name);
            let message2 = requestAttributes.t('DESAYUNO_F_MSG',name);
            
            const currentDateTime1 = moment().tz('Europe/Paris'),
                reminderRequest1 = {
                  requestTime : currentDateTime1.format('YYYY-MM-DDTHH:mm:ss'),
                  trigger: {
                    type : "SCHEDULED_ABSOLUTE",
                    scheduledTime : currentDateTime1.set({hour: '11',minute: '00',second: '00'}).format('YYYY-MM-DDTHH:mm:ss'),
                    timeZoneId : "Europe/Paris",
                    recurrence : {freq: 'DAILY'}
               },
                alertInfo: {
                    spokenInfo: {
                        content: [{
                            locale: "sp-ES", 
                            text: message1,
                        }]
                    }
                },
                pushNotification : {status : 'ENABLED',}
            }
            try {
                await reminderApiClient.createReminder(reminderRequest1)
            } catch(error) {
                console.log(`~~~ Error: ${error}`)
                return handlerInput.responseBuilder
                    .speak(requestAttributes.t('ERROR_MSG'))
                    .getResponse();
            }
            const currentDateTime2 = moment().tz('Europe/Paris'),
                reminderRequest2 = {
                  requestTime : currentDateTime2.format('YYYY-MM-DDTHH:mm:ss'),
                  trigger: {
                    type : "SCHEDULED_ABSOLUTE",
                    scheduledTime : currentDateTime2.set({hour: '9',minute: '00',second: '00'}).format('YYYY-MM-DDTHH:mm:ss'),
                    timeZoneId : "Europe/Paris",
                    recurrence : {freq: 'DAILY'}
               },
                alertInfo: {
                    spokenInfo: {
                        content: [{locale: "sp-ES", text: message2,}]
                    }
                },
                pushNotification : {status : 'ENABLED',}
            }
            
            try {
                await reminderApiClient.createReminder(reminderRequest2)
            } catch(error) {
                console.log(`~~~ Error: ${error}`)
                return handlerInput.responseBuilder
                    .speak(requestAttributes.t('ERROR_MSG'))
                    .getResponse();
            }
        }
        
        if (Pregunta==='comida' || Pregunta==='comer'){                                                 //COMIDA
            let message1 = requestAttributes.t('COMIDA_P_MSG',name);
            let message2 = requestAttributes.t('COMIDA_F_MSG',name);
            
            const currentDateTime1 = moment().tz('Europe/Paris'),
                reminderRequest1 = {
                  requestTime : currentDateTime1.format('YYYY-MM-DDTHH:mm:ss'),
                  trigger: {
                    type : "SCHEDULED_ABSOLUTE",
                    scheduledTime : currentDateTime1.set({hour: '15',minute: '00',second: '00'}).format('YYYY-MM-DDTHH:mm:ss'),
                    timeZoneId : "Europe/Paris",
                    recurrence : {freq: 'DAILY'}
               },
                alertInfo: {
                    spokenInfo: {
                        content: [{
                            locale: "sp-ES", 
                            text: message1,
                        }]
                    }
                },
                pushNotification : {status : 'ENABLED',}
            }
            try {
                await reminderApiClient.createReminder(reminderRequest1)
            } catch(error) {
                console.log(`~~~ Error: ${error}`)
                return handlerInput.responseBuilder
                    .speak(requestAttributes.t('ERROR_MSG'))
                    .getResponse();
            }
            const currentDateTime2 = moment().tz('Europe/Paris'),
                reminderRequest2 = {
                  requestTime : currentDateTime2.format('YYYY-MM-DDTHH:mm:ss'),
                  trigger: {
                    type : "SCHEDULED_ABSOLUTE",
                    scheduledTime : currentDateTime2.set({hour: '13',minute: '00',second: '00'}).format('YYYY-MM-DDTHH:mm:ss'),
                    timeZoneId : "Europe/Paris",
                    recurrence : {freq: 'DAILY'}
               },
                alertInfo: {
                    spokenInfo: {
                        content: [{locale: "sp-ES", text: message2,}]
                    }
                },
                pushNotification : {status : 'ENABLED',}
            }
            
            try {
                await reminderApiClient.createReminder(reminderRequest2)
            } catch(error) {
                console.log(`~~~ Error: ${error}`)
                return handlerInput.responseBuilder
                    .speak(requestAttributes.t('ERROR_MSG'))
                    .getResponse();
            }
        }  
        
        if (Pregunta==='cena' || Pregunta==='cenar'){                                                   //CENAR
            let message1 = requestAttributes.t('CENA_P_MSG',name);
            let message2 = requestAttributes.t('CENA_F_MSG',name);
            
            const currentDateTime1 = moment().tz('Europe/Paris'),
                reminderRequest1 = {
                  requestTime : currentDateTime1.format('YYYY-MM-DDTHH:mm:ss'),
                  trigger: {
                    type : "SCHEDULED_ABSOLUTE",
                    scheduledTime : currentDateTime1.set({hour: '21',minute: '30',second: '00'}).format('YYYY-MM-DDTHH:mm:ss'),
                    timeZoneId : "Europe/Paris",
                    recurrence : {freq: 'DAILY'}
               },
                alertInfo: {
                    spokenInfo: {
                        content: [{
                            locale: "sp-ES", 
                            text: message1,
                        }]
                    }
                },
                pushNotification : {status : 'ENABLED',}
            }
            try {
                await reminderApiClient.createReminder(reminderRequest1)
            } catch(error) {
                console.log(`~~~ Error: ${error}`)
                return handlerInput.responseBuilder
                    .speak(requestAttributes.t('ERROR_MSG'))
                    .getResponse();
            }
            const currentDateTime2 = moment().tz('Europe/Paris'),
                reminderRequest2 = {
                  requestTime : currentDateTime2.format('YYYY-MM-DDTHH:mm:ss'),
                  trigger: {
                    type : "SCHEDULED_ABSOLUTE",
                    scheduledTime : currentDateTime2.set({hour: '19',minute: '30',second: '00'}).format('YYYY-MM-DDTHH:mm:ss'),
                    timeZoneId : "Europe/Paris",
                    recurrence : {freq: 'DAILY'}
               },
                alertInfo: {
                    spokenInfo: {
                        content: [{locale: "sp-ES", text: message2,}]
                    }
                },
                pushNotification : {status : 'ENABLED',}
            }
            
            try {
                await reminderApiClient.createReminder(reminderRequest2)
            } catch(error) {
                console.log(`~~~ Error: ${error}`)
                return handlerInput.responseBuilder
                    .speak(requestAttributes.t('ERROR_MSG'))
                    .getResponse();
            }
        }
        
        if (Pregunta==='algo' || Pregunta==='dato' || Pregunta==='datos' || Pregunta==='dato curioso' || Pregunta==='datos curiosos' || Pregunta==='dato interesante'){  //DATO
            let message1 = requestAttributes.t('Q_DATO_MSG',name);
            
            const currentDateTime1 = moment().tz('Europe/Paris'),
                reminderRequest1 = {
                  requestTime : currentDateTime1.format('YYYY-MM-DDTHH:mm:ss'),
                  trigger: {
                    type : "SCHEDULED_ABSOLUTE",
                    scheduledTime : currentDateTime1.set({hour: '18',minute: '30',second: '00'}).format('YYYY-MM-DDTHH:mm:ss'),
                    timeZoneId : "Europe/Paris",
                    recurrence : {freq: 'DAILY'}
               },
                alertInfo: {
                    spokenInfo: {
                        content: [{
                            locale: "sp-ES", 
                            text: message1,
                        }]
                    }
                },
                pushNotification : {status : 'ENABLED',}
            }
            try {
                await reminderApiClient.createReminder(reminderRequest1)
            } catch(error) {
                console.log(`~~~ Error: ${error}`)
                return handlerInput.responseBuilder
                    .speak(requestAttributes.t('ERROR_MSG'))
                    .getResponse();
            }
        }
        
        if (Pregunta==='historia' || Pregunta==='historias' || Pregunta==='cuento'){             //HISTORIA
            let message1 = requestAttributes.t('Q_HIST_MSG',name);
            
            const currentDateTime1 = moment().tz('Europe/Paris'),
                reminderRequest1 = {
                  requestTime : currentDateTime1.format('YYYY-MM-DDTHH:mm:ss'),
                  trigger: {
                    type : "SCHEDULED_ABSOLUTE",
                    scheduledTime : currentDateTime1.set({hour: '16',minute: '00',second: '00'}).format('YYYY-MM-DDTHH:mm:ss'),
                    timeZoneId : "Europe/Paris",
                    recurrence : {freq: 'DAILY'}
               },
                alertInfo: {
                    spokenInfo: {
                        content: [{
                            locale: "sp-ES", 
                            text: message1,
                        }]
                    }
                },
                pushNotification : {status : 'ENABLED',}
            }
            try {
                await reminderApiClient.createReminder(reminderRequest1)
            } catch(error) {
                console.log(`~~~ Error: ${error}`)
                return handlerInput.responseBuilder
                    .speak(requestAttributes.t('ERROR_MSG'))
                    .getResponse();
            }
        }
        
        if (Pregunta==='noticia' || Pregunta==='noticias' || Pregunta==='las noticias'){    //NOTICIAS
            let message1 = requestAttributes.t('Q_NOTI_MSG',name);
            
            const currentDateTime1 = moment().tz('Europe/Paris'),
                reminderRequest1 = {
                  requestTime : currentDateTime1.format('YYYY-MM-DDTHH:mm:ss'),
                  trigger: {
                    type : "SCHEDULED_ABSOLUTE",
                    scheduledTime : currentDateTime1.set({hour: '21',minute: '00',second: '00'}).format('YYYY-MM-DDTHH:mm:ss'),
                    timeZoneId : "Europe/Paris",
                    recurrence : {freq: 'DAILY'}
               },
                alertInfo: {
                    spokenInfo: {
                        content: [{
                            locale: "sp-ES", 
                            text: message1,
                        }]
                    }
                },
                pushNotification : {status : 'ENABLED',}
            }
            try {
                await reminderApiClient.createReminder(reminderRequest1)
            } catch(error) {
                console.log(`~~~ Error: ${error}`)
                return handlerInput.responseBuilder
                    .speak(requestAttributes.t('ERROR_MSG'))
                    .getResponse();
            }
            
            
        }
        
        if (Pregunta==='emociones' || Pregunta==='sentimientos'){                   //EMOCIONES
            let message1 = requestAttributes.t('Q_SENT_MSG',name);
            
            const currentDateTime1 = moment().tz('Europe/Paris'),
                reminderRequest1 = {
                  requestTime : currentDateTime1.format('YYYY-MM-DDTHH:mm:ss'),
                  trigger: {
                    type : "SCHEDULED_ABSOLUTE",
                    scheduledTime : currentDateTime1.set({hour: '10',minute: '30',second: '00'}).format('YYYY-MM-DDTHH:mm:ss'),
                    timeZoneId : "Europe/Paris",
                    recurrence : {freq: 'DAILY'}
               },
                alertInfo: {
                    spokenInfo: {
                        content: [{
                            locale: "sp-ES", 
                            text: message1,
                        }]
                    }
                },
                pushNotification : {status : 'ENABLED',}
            }
            try {
                await reminderApiClient.createReminder(reminderRequest1)
            } catch(error) {
                console.log(`~~~ Error: ${error}`)
                return handlerInput.responseBuilder
                    .speak(requestAttributes.t('ERROR_MSG'))
                    .getResponse();
            }
        }
        
        const speechText = requestAttributes.t('COMIDA_MSG');
        
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(requestAttributes.t('HELP_MSG'))
            .getResponse();
    }
};




////////////////////////////EMOCIONES//////////////////////////////////////////
const EmocionesIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'EmocionesIntent';
    },
    handle: function (handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        const requestAttributes = attributesManager.getRequestAttributes();
        let endpointId = attributesManager.getSessionAttributes().endpointId || [];
        
        let emocion = Alexa.getSlotValue(handlerInput.requestEnvelope, 'emocion');
        
        if (!emocion) {
            return handlerInput.responseBuilder
             
                .speak(requestAttributes.t('RETRY_EMOTION_MSG'))
                .withShouldEndSession(false)
                .getResponse();
        }

        // Construct the directive with the payload containing the move parameters
        let directive = Util.build(endpointId, NAMESPACE, NAME_CONTROL,
            {
                type: 'emocion',
                emocion: emocion,
            });
        
        let speechOutput = requestAttributes.t('EMOTION_MSG',emocion)
   /*   let speechOutput = `comando ${command} activado`;
        if (command === 'centinela' || command === 'guarda') {
            speechOutput = '';
        }
  */   
  return handlerInput.responseBuilder
            .speak(speechOutput + BG_MUSIC)
            .addDirective(directive)
            .getResponse();
    }
};


////////////////////////////MENSAJES////////////////////////////////////////////
const ActivarIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'ActivarIntent';
    },
    async handle(handlerInput) {
        const {attributesManager, serviceClientFactory, requestEnvelope} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        const {intent} = handlerInput.requestEnvelope.request;
        const requestAttributes = attributesManager.getRequestAttributes();

        let speechText;
        
        let activar = intent.slots.activar.value;
        sessionAttributes['activar'] = activar;
        
        if((activar==='activar')||(activar==='activa')){
            speechText = requestAttributes.t('ACTIVAR_MSG');
        }
        else {
            speechText = requestAttributes.t('DESACTIVAR_MSG');
        }
        
        
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(requestAttributes.t('HELP_MSG'))
            .getResponse();
    }
};

const AdiosIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AdiosIntent';
    },
    async handle(handlerInput) {
        const {attributesManager, serviceClientFactory, requestEnvelope} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        const {intent} = handlerInput.requestEnvelope.request;
        const requestAttributes = attributesManager.getRequestAttributes();

        const name = sessionAttributes['name'] ? sessionAttributes['name'] : '';
        const activar = sessionAttributes['activar'];
        
        let message = intent.slots.message.value;
        
        const reminderApiClient = handlerInput.serviceClientFactory.getReminderManagementServiceClient(),
            {permissions} = handlerInput.requestEnvelope.context.System.user
                
        if (!permissions) {
            return handlerInput.responseBuilder
                .speak(requestAttributes.t('PERMISSION_MSG'))
                .withAskForPermissionsConsentCard(['alexa::alerts:reminders:skill:readwrite'])
                .getResponse();
        }   
        
        if (!message || activar==='desactivar') {      // No hay mensaje
        
            message = requestAttributes.t('NO_ADIOS_MSG',name);
            
            const reminderRequest = {
                trigger: {
                    type : 'SCHEDULED_RELATIVE',
                    offsetInSeconds : '30'
                },
                alertInfo: {
                    spokenInfo: {
                        content: [{
                            locale: "sp-ES", 
                            text: message,
                        }]
                    }
                },
                pushNotification : {                            
                     status : 'ENABLED',        
                }
            }
            
            try {
                await reminderApiClient.createReminder(reminderRequest)
            } catch(error) {
                console.log(`~~~ Error: ${error}`)
                return handlerInput.responseBuilder
                    .speak(requestAttributes.t('ERROR_MSG'))
                    .getResponse();
            }
            
            
            const speechText = requestAttributes.t('DESPEDIDA_MSG');
            
            return handlerInput.responseBuilder
                .speak(speechText)
                .reprompt(requestAttributes.t('HELP_MSG'))
                .getResponse();
        }
        
        message = requestAttributes.t('ADIOS_MSG',name, message);
        
        const reminderRequest = {
            trigger: {
                type : 'SCHEDULED_RELATIVE',
                offsetInSeconds : '30'
            },
            alertInfo: {
                spokenInfo: {
                    content: [{
                        locale: "sp-ES", 
                        text: message,
                    }]
                }
            },
            pushNotification : {                            
                 status : 'ENABLED',        
            }
        }
        
        try {
            await reminderApiClient.createReminder(reminderRequest)
        } catch(error) {
            console.log(`~~~ Error: ${error}`)
            return handlerInput.responseBuilder
                .speak(requestAttributes.t('ERROR_MSG'))
                .getResponse();
        }
        
        
        const speechText = requestAttributes.t('DESPEDIDA_MSG');
        
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(requestAttributes.t('HELP_MSG'))
            .getResponse();
    }
};

const AyudaIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AyudaIntent';
    },
    async handle(handlerInput) {
        const {attributesManager, serviceClientFactory, requestEnvelope} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        const {intent} = handlerInput.requestEnvelope.request;
        const requestAttributes = attributesManager.getRequestAttributes();

        const name = sessionAttributes['name'] ? sessionAttributes['name'] : '';
        const activar = sessionAttributes['activar'];
        let message = intent.slots.message.value;

        const reminderApiClient = handlerInput.serviceClientFactory.getReminderManagementServiceClient(),
            {permissions} = handlerInput.requestEnvelope.context.System.user
                
        if (!permissions) {
            return handlerInput.responseBuilder
                .speak(requestAttributes.t('PERMISSION_MSG'))
                .withAskForPermissionsConsentCard(['alexa::alerts:reminders:skill:readwrite'])
                .getResponse();
        }   
        
        if (!message || activar==='desactivar') {     // No hay mensaje
        
            message = requestAttributes.t('NO_AYUDA_MSG',name);
            
            const reminderRequest = {
                trigger: {
                    type : 'SCHEDULED_RELATIVE',
                    offsetInSeconds : '30'
                },
                alertInfo: {
                    spokenInfo: {
                        content: [{
                            locale: "sp-ES", 
                            text: message,
                        }]
                    }
                },
                pushNotification : {                            
                     status : 'ENABLED',        
                }
            }
            
            try {
                await reminderApiClient.createReminder(reminderRequest)
            } catch(error) {
                console.log(`~~~ Error: ${error}`)
                return handlerInput.responseBuilder
                    .speak(requestAttributes.t('ERROR_MSG'))
                    .getResponse();
            }
            
            const speechText = requestAttributes.t('TRANQUIL_MSG');
            
            return handlerInput.responseBuilder
                .speak(speechText)
                .reprompt(requestAttributes.t('HELP_MSG'))
                .getResponse();
        }
        
        message = requestAttributes.t('AYUDA_MSG',name, message);
        
        const reminderRequest = {
            trigger: {
                type : 'SCHEDULED_RELATIVE',
                offsetInSeconds : '30'
            },
            alertInfo: {
                spokenInfo: {
                    content: [{
                        locale: "sp-ES", 
                        text: message,
                    }]
                }
            },
            pushNotification : {                            
                 status : 'ENABLED',        
            }
        }
        
        try {
            await reminderApiClient.createReminder(reminderRequest)
        } catch(error) {
            console.log(`~~~ Error: ${error}`)
            return handlerInput.responseBuilder
                .speak(requestAttributes.t('ERROR_MSG'))
                .getResponse();
        }
        
        const speechText = requestAttributes.t('TRANQUIL_MSG');
        
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(requestAttributes.t('HELP_MSG'))
            .getResponse();
    }
};

/////////////////////////////DINAMICO///////////////////////////////////
const CreateCosasIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'CreateCosasIntent';
    },
    handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const {intent} = handlerInput.requestEnvelope.request;
        const attributesManager = handlerInput.attributesManager;
        const requestAttributes = attributesManager.getRequestAttributes();
        
        let speakOutput = requestAttributes.t('RETRY_C_MSG');
       
        if(intent.slots.dynamicEntityCosas.confirmationStatus !== 'CONFIRMED') {
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt(speakOutput)
                .getResponse();
        }
        
        if(!sessionAttributes['entities'])
            sessionAttributes['entities'] = [];
       
        const dynamicEntityCosas = intent.slots.dynamicEntityCosas.value;
        sessionAttributes['entities'].push(dynamicEntityCosas);
        addDynamicEntities(handlerInput.responseBuilder, 'MyEntities', sessionAttributes['entities']);
       
        speakOutput = requestAttributes.t('ADDED_CL_MSG') + dynamicEntityCosas + requestAttributes.t('HELP2_MSG');
           
        Util.putSessionAttribute(handlerInput, 'Cosa', intent);

        const endpointId = attributesManager.getSessionAttributes().endpointId || [];

        let directive = Util.build(endpointId, NAMESPACE, NAME_CONTROL,
        {
            type: 'cosa',
            cosa: dynamicEntityCosas
        });
      
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(requestAttributes.t('HELP2_MSG'))
            .addDirective(directive)
            .getResponse();
    }
};

const CreateLugarIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'CreateLugarIntent';
    },
    handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const {intent} = handlerInput.requestEnvelope.request;
        const attributesManager = handlerInput.attributesManager;
        const requestAttributes = attributesManager.getRequestAttributes();
        
        let speakOutput = requestAttributes.t('RETRY_L_MSG');
        
        if(intent.slots.dynamicEntityLugar.confirmationStatus !== 'CONFIRMED') {
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt(speakOutput)
                .getResponse();
        }
        
        if(!sessionAttributes['entities'])
            sessionAttributes['entities'] = [];
        
        const dynamicEntityLugar = intent.slots.dynamicEntityLugar.value;
        sessionAttributes['entities'].push(dynamicEntityLugar);
        addDynamicEntities(handlerInput.responseBuilder, 'MyEntities', sessionAttributes['entities']);
        
        speakOutput = requestAttributes.t('ADDED_CL_MSG') + dynamicEntityLugar + requestAttributes.t('HELP2_MSG');

        const endpointId = attributesManager.getSessionAttributes().endpointId || [];

        let directive = Util.build(endpointId, NAMESPACE, NAME_CONTROL,
        {
            type: 'lugar',
            lugar: dynamicEntityLugar
        });
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(requestAttributes.t('HELP2_MSG'))
            .addDirective(directive)
            .getResponse();
    }
};

const CreateBuscarIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'CreateBuscarIntent';
    },
    handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const {intent} = handlerInput.requestEnvelope.request;
        const attributesManager = handlerInput.attributesManager;
        const requestAttributes = attributesManager.getRequestAttributes();
        
        let speakOutput = requestAttributes.t('RETRY_B_MSG');
        
        if(intent.slots.dynamicEntityBuscar.confirmationStatus !== 'CONFIRMED') {
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt(speakOutput)
                .getResponse();
        }
        
        if(!sessionAttributes['entities'])
            sessionAttributes['entities'] = [];
        
        const dynamicEntityBuscar = intent.slots.dynamicEntityBuscar.value;
        sessionAttributes['entities'].push(dynamicEntityBuscar);
        addDynamicEntities(handlerInput.responseBuilder, 'MyEntities', sessionAttributes['entities']);
        
        speakOutput = requestAttributes.t('ADDED_B_MSG') + dynamicEntityBuscar;

        const endpointId = attributesManager.getSessionAttributes().endpointId || [];

        let directive = Util.build(endpointId, NAMESPACE, NAME_CONTROL,
        {
            type: 'buscar',
            buscar: dynamicEntityBuscar
        });
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(requestAttributes.t('HELP2_MSG'))
            .addDirective(directive)
            .getResponse();
    }
};

const CreateEliminarIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'CreateEliminarIntent';
    },
    handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const {intent} = handlerInput.requestEnvelope.request;
        const attributesManager = handlerInput.attributesManager;
        const requestAttributes = attributesManager.getRequestAttributes();
        
        let speakOutput = requestAttributes.t('RETRY_E_MSG');
        
        if(intent.slots.dynamicEntityEliminar.confirmationStatus !== 'CONFIRMED') {
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt(speakOutput)
                .getResponse();
        }
        
        if(!sessionAttributes['entities'])
            sessionAttributes['entities'] = [];
        
        const dynamicEntityEliminar = intent.slots.dynamicEntityEliminar.value;
        sessionAttributes['entities'].push(dynamicEntityEliminar);
        addDynamicEntities(handlerInput.responseBuilder, 'MyEntities', sessionAttributes['entities']);
        
        speakOutput = requestAttributes.t('ADDED_E_MSG') + dynamicEntityEliminar + requestAttributes.t('HELP2_MSG');

        const endpointId = attributesManager.getSessionAttributes().endpointId || [];

        let directive = Util.build(endpointId, NAMESPACE, NAME_CONTROL,
        {
            type: 'eliminar',
            eliminar: dynamicEntityEliminar
        });
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(requestAttributes.t('HELP2_MSG'))
            .addDirective(directive)
            .getResponse();
    }
};

const CheckEntitiesIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'CheckEntitiesIntent';
    },
    handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const {intent} = handlerInput.requestEnvelope.request;
        const requestAttributes = attributesManager.getRequestAttributes();
        const attributesManager = handlerInput.attributesManager;
        
        const entity = intent.slots.entity.value;
        const slotValues = getStaticAndDynamicSlotValuesFromSlot(intent.slots.entity);
        
        let speakOutput ;
        
        if (slotValues.static.statusCode === 'ER_SUCCESS_MATCH') {
            speakOutput = entity + requestAttributes.t('IS_STATIC_MSG');
        } else
        if (slotValues.dynamic.statusCode === 'ER_SUCCESS_MATCH') {
            speakOutput = entity + requestAttributes.t('IS_DYNAMIC_MSG');
        } else {
            speakOutput = entity + requestAttributes.t('NOT_MATCHED_MSG');
        }
        
        return handlerInput.responseBuilder
            .speak(speakOutput + requestAttributes.t('HELP2_MSG'))
            .reprompt(requestAttributes.t('HELP2_MSG'))
            .getResponse();
    }
};

//////////////////////////////ROBOT///////////////////////////////////

// Add the speed value to the session attribute.
// This allows other intent handler to use the specified speed value
// without asking the user for input.
const SetSpeedIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'SetSpeedIntent';
    },
    handle: function (handlerInput) {
        const {attributesManager} = handlerInput;
        const requestAttributes = attributesManager.getRequestAttributes();
        
        // Bound speed to (1-100)
        let speed = Alexa.getSlotValue(handlerInput.requestEnvelope, 'Speed');
        speed = Math.max(1, Math.min(100, parseInt(speed)));
        Util.putSessionAttribute(handlerInput, 'speed', speed);

        let speechOutput =  requestAttributes.t('SPEED_MSG',speed);
        
        return handlerInput.responseBuilder
            .speak(speechOutput + BG_MUSIC)
            .getResponse();
    }
};

// Construct and send a custom directive to the connected gadget with
// data from the MoveIntent.
const MoveIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'MoveIntent';
    },
    handle: function (handlerInput) {
        const request = handlerInput.requestEnvelope;
        const attributesManager = handlerInput.attributesManager;
        const requestAttributes = attributesManager.getRequestAttributes();
        
        const direction = Alexa.getSlotValue(request, 'Direction');

        let duration = Alexa.getSlotValue(request, 'Duration');
        let distance = Alexa.getSlotValue(request, 'Distance');
        let angle = Alexa.getSlotValue(request, 'Angle');
        let odomX = Alexa.getSlotValue(request, 'OdomX');
        let odomY = Alexa.getSlotValue(request, 'OdomY');
        
        // Get data from session attribute
        //const attributesManager = handlerInput.attributesManager;
        const speed = attributesManager.getSessionAttributes().speed || "50";
        const endpointId = attributesManager.getSessionAttributes().endpointId || [];
        
        let mensaje;

        // Duration is optional, use default if not available
        if (duration) {
            mensaje = requestAttributes.t('DURATION_MSG', direction, duration, speed);
            distance = -1;
            angle = -1;
            odomX = -1;
            odomY = -1;
        }
        else if (distance) {
            mensaje = requestAttributes.t('DISTANCE_MSG', direction, distance, speed);
            duration = -1;
            angle = -1;
            odomX = -1;
            odomY = -1;
        }
       else if (angle) {
            mensaje = requestAttributes.t('ANGLE_MSG', direction, angle, speed);
            distance = -1;
            duration = -1;
            odomX = -1;
            odomY = -1;
        }
        else if (odomX && odomY) {
            mensaje = requestAttributes.t('ODOM_MSG', direction, odomX, odomY, speed);
            distance = -1;
            angle = -1;
            duration = -1;
        }
        else if (!duration && !distance && !angle && !odomX && !odomY) {
            mensaje = requestAttributes.t('NADA_MSG', direction,speed);
            duration = -1 ;
            distance = -1;
            angle = -1;
            odomX = -1;
            odomY = -1;
        }
        
      //  duration = Alexa.getSlotValue(request, 'Duration') || "2";

        // Construct the directive with the payload containing the move parameters
        let directive = Util.build(endpointId, NAMESPACE, NAME_CONTROL,
            {
                type: 'move',
                direction: direction,
                duration: duration,
                distance: distance,
                angle: angle,
                odomX: odomX,
                odomY: odomY,
                speed: speed
            });

/*        const speechOutput = (direction === "brake")
            ?  "Aplicando freno"
            : `${direction} ${duration} segundos a una velocidad del ${speed} porciento`;
*/
        const speechOutput = (direction === "brake")
            ?  "Aplicando freno"
            : mensaje;
            
        return handlerInput.responseBuilder
            .speak(speechOutput + BG_MUSIC)
            .addDirective(directive)
            .getResponse();
    }
};

// Construct and send a custom directive to the connected gadget with data from
// the SetCommandIntent.
const SetCommandIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'SetCommandIntent';
    },
    handle: function (handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        const requestAttributes = attributesManager.getRequestAttributes();
        let endpointId = attributesManager.getSessionAttributes().endpointId || [];
        let speed = attributesManager.getSessionAttributes().speed || "50";
        
        let command = Alexa.getSlotValue(handlerInput.requestEnvelope, 'Command');
        if (!command) {
            return handlerInput.responseBuilder
             
                .speak(requestAttributes.t('RETRY_COMMAND_MSG'))
                .withShouldEndSession(false)
                .getResponse();
        }

        // Construct the directive with the payload containing the move parameters
        let directive = Util.build(endpointId, NAMESPACE, NAME_CONTROL,
            {
                type: 'command',
                command: command,
                speed: speed
            });
        
        let speechOutput = requestAttributes.t('COMMAND_MSG')
   /*   let speechOutput = `comando ${command} activado`;
        if (command === 'centinela' || command === 'guarda') {
            speechOutput = '';
        }
  */   
  return handlerInput.responseBuilder
            .speak(speechOutput + BG_MUSIC)
            .addDirective(directive)
            .getResponse();
    }
};

const EventsReceivedRequestHandler = {
    // Checks for a valid token and endpoint.
    canHandle(handlerInput) {
        let { request } = handlerInput.requestEnvelope;
        console.log('Request type: ' + Alexa.getRequestType(handlerInput.requestEnvelope));
        if (request.type !== 'CustomInterfaceController.EventsReceived') return false;

        const attributesManager = handlerInput.attributesManager;
        const requestAttributes = attributesManager.getRequestAttributes();
        let sessionAttributes = attributesManager.getSessionAttributes();
        let customEvent = request.events[0];

        // Validate event token
        if (sessionAttributes.token !== request.token) {
            console.log("Event token doesn't match. Ignoring this event");
            return false;
        }

        // Validate endpoint
        let requestEndpoint = customEvent.endpoint.endpointId;
        if (requestEndpoint !== sessionAttributes.endpointId) {
            console.log("Event endpoint id doesn't match. Ignoring this event");
            return false;
        }
        return true;
    },
    handle(handlerInput) {

        console.log("== Received Custom Event ==");
        let customEvent = handlerInput.requestEnvelope.request.events[0];
        let payload = customEvent.payload;
        let name = customEvent.header.name;

        let speechOutput;
        if (name === 'Proximity') {
            let distance = parseInt(payload.distance);
            if (distance < 10) {
                let speechOutput = "Intruder detected! What would you like to do?";
                return handlerInput.responseBuilder
                    .speak(speechOutput, "REPLACE_ALL")
                    .withShouldEndSession(false)
                    .getResponse();
            }
        } else if (name === 'Sentry') {
            if ('fire' in payload) {
                speechOutput = "Threat eliminated";
            }

        } else if (name === 'Speech') {
            speechOutput = payload.speechOut;

        } else {
            speechOutput = "Event not recognized. Awaiting new command.";
        }
        return handlerInput.responseBuilder
            .speak(speechOutput + BG_MUSIC, "REPLACE_ALL")
            .getResponse();
    }
};
const ExpiredRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'CustomInterfaceController.Expired'
    },
    handle(handlerInput) {
        console.log("== Custom Event Expiration Input ==");

        // Set the token to track the event handler
        const token = handlerInput.requestEnvelope.request.requestId;
        Util.putSessionAttribute(handlerInput, 'token', token);

        const attributesManager = handlerInput.attributesManager;
        let duration = attributesManager.getSessionAttributes().duration || 0;
        if (duration > 0) {
            Util.putSessionAttribute(handlerInput, 'duration', --duration);

            // Extends skill session
            const speechOutput = `${duration} minutes remaining.`;
            return handlerInput.responseBuilder
                .addDirective(Util.buildStartEventHandler(token, 60000, {}))
                .speak(speechOutput + BG_MUSIC)
                .getResponse();
        }
        else {
            // End skill session
            return handlerInput.responseBuilder
                .speak("Skill duration expired. Goodbye.")
                .withShouldEndSession(true)
                .getResponse();
        }
    }
};



// Aux functions

function addDynamicEntities(responseBuilder, slotType, entities) {
    let updateEntitiesDirective = {
      type: 'Dialog.UpdateDynamicEntities',
      updateBehavior: 'REPLACE',
      types: [
        {
          name: slotType,
          values: [] // we fill this array with the entities below
        }
      ]
    };
    entities.map((entity) => updateEntitiesDirective.types[0].values.push(
        {
            id: entity.replace(/\s/gi, "_"),
            name: {
                value: entity
            }
        }
    ));
    console.log(JSON.stringify(updateEntitiesDirective));
    responseBuilder.addDirective(updateEntitiesDirective);
}

const getStaticAndDynamicSlotValues = function(slots) {
    const slotValues = {}
    for (let slot in slots) {
        slotValues[slot] = getStaticAndDynamicSlotValuesFromSlot(slots[slot]);
    }
    return slotValues;
}

const getStaticAndDynamicSlotValuesFromSlot = function(slot) {

    const result = {
        name: slot.name,
        value: slot.value
    };

    if (((slot.resolutions || {}).resolutionsPerAuthority || [])[0] || {}) {
        slot.resolutions.resolutionsPerAuthority.forEach((authority) => {
            const slotValue = {
                authority: authority.authority,
                statusCode: authority.status.code,
                synonym: slot.value || undefined,
                resolvedValues: slot.value
            };
            if (authority.values && authority.values.length > 0) {
                slotValue.resolvedValues = [];

                authority.values.forEach((value) => {
                    slotValue.resolvedValues.push(value);
                });

            }

            if (authority.authority.includes('amzn1.er-authority.echo-sdk.dynamic')) {
                result.dynamic = slotValue;
            } else {
                result.static = slotValue;
            }
        });
    }
    return result;
};




// Interceptor, intercambia la oracion para responder el en lengiaje recibido
/*
const LocalisationRequestInterceptor = {
    process(handlerInput) {
        i18n.init({
            lng: handlerInput.requestEnvelope.request.locale,   //lenguaje local (Spanish)
            fallbackLng: 'en',                                  //si no reconoce el lenguaje responde en ingles
            resources: languageStrings //acceder a las frases   
        }).then((t) => {
            requestAttributes.t = (...args) => t(...args);   //tansformacion
        });
    }
  };
*/



// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        InfoIntentHandler,
        PreguntasIntentHandler,
        LaunchRequestHandler,
        ActivarIntentHandler,
        AdiosIntentHandler,
        AyudaIntentHandler,
        CreateCosasIntentHandler,
        CreateLugarIntentHandler,
        CreateBuscarIntentHandler,
        CreateEliminarIntentHandler,
        CheckEntitiesIntentHandler,
        EmocionesIntentHandler,
        SetSpeedIntentHandler,
        SetCommandIntentHandler,
        MoveIntentHandler,
        EventsReceivedRequestHandler,
        ExpiredRequestHandler,
        Common.HelpIntentHandler,
        Common.CancelAndStopIntentHandler,
        Common.FallbackIntentHandler,
        Common.SessionEndedRequestHandler,
        Common.IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    )
    //.addRequestInterceptors(Common.RequestInterceptor, Common.LocalisationRequestInterceptor, interceptors.LoadAttributesRequestInterceptor, interceptors.LoggingRequestInterceptor)
    .addRequestInterceptors(
        Common.RequestInterceptor, 
        interceptors.LocalizationRequestInterceptor, 
        interceptors.LoadAttributesRequestInterceptor, 
        interceptors.LoggingRequestInterceptor)
    .addResponseInterceptors(
        interceptors.SaveAttributesResponseInterceptor, 
        interceptors.LoggingResponseInterceptor)
    .addErrorHandlers(Common.ErrorHandler)
    .withPersistenceAdapter(persistence.getPersistenceAdapter())
    .withCustomUserAgent('cookbook/dynamic-entities/v1')
    .withApiClient(new Alexa.DefaultApiClient())
    .lambda();