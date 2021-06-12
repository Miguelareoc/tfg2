module.exports = {
    en: {
        translation: {
            WELCOME_MSG: 'Welcome to the Dynamic Entities Demo. %s ',
            HELP_MSG: 'You can add an entity or check on an entity that you have already added. Which would you like to try? ',
            HELP2_MSG: 'Say add entity to add another one, or say, check, followed by the entity name to verify it has been registered. ',
            FALLBACK_MSG: 'That\'s not a known entity. Please try again. ',
            EXIT_MSG: 'Goodbye! ',
            REFLECT_MSG: 'You just triggered ',
            ERROR_MSG: `Sorry, there was an error. Please try again. `,
            RETRY_MSG: 'Ok. Let\'s try again. Please add another entity. ',
            ADDED_MSG: 'Done! ',
            IS_STATIC_MSG: ' is a static entity. ',
            IS_DYNAMIC_MSG: ' is a dynamic entity. ',
            NOT_MATCHED_MSG: ' is not a matched entity. '
        }
    },
    es: {
        translation: {
            // Conexion
            FAIL_CONNECTION: 'El EV3 Brick no está conectado a este dispositivo. Por favor compruebe la conexión e intentelo de nuevo.',
            GOOD_CONNECTION: 'Bienvenido, interfaz de voz activada',
            
            //Info
            INFO_MSG: '%s Te puedo dar información sobre lo que puedo hacer. Movimientos del robot o sus comandos, como utilizar el listado de objetos, el envío de mensajes, sentimientos y las preguntas. Para ello solo dí, Alexa dame informacion sobre lo que quieras',
            INFO_MOV_MSG: 'Puedes hacer que Gruby se mueva diciendole en que dirección quieres que se mueva, hacía delante, atrás, girar izquierda, derecha o que de media vuelta, movimientos por odometría o pedirle que pare con alto. Se puede mover diciendole el tiempo, distancia o ángulo que quieres que avance.',
            INFO_COM_MSG: 'Gruby tiene diversos comandos para que interactues con el. Moverse haciendo un círculo o un cuadrado, entrar en modo centinela, patrulla o automático, hacer el movimiento de arriba y abajo, subir y bajar pequeños obstáculos, que te de la patita o que te salude. Además si le pones tu canción favorita bailara al ritmo de la música. ',
            INFO_LIST_MSG: 'Puedes decirme en que lugar estas guardando un objeto para que te diga donde se encuentra cuando quieras, solo tienes que decirme que objeto es y luego donde se encuentra o al revés. Cuando quieras buscar el objeto o saber que hay en algún lugar solo tienes que decirmelo. tambén puedo eliminar un objeto o lugar de la lista.',
            INFO_MSG_MSG: 'Por tu seguridad, al salir de casa te preguntare a donde vas para poder avisar a la persona que este vinculada a la app de Alexa y que pueda saber a donde te diriges, si lo deseas puedes desactivar esta opción diciendomelo. También le avisare si me pides ayuda en una emergencia.',
            INFO_SENT_MSG: 'Dependiendo de como te sientas hoy Gruvy respondera de acorde a ello.',
            INFO_PREG_MSG: 'Si quieres puedo realizarte preguntas diarias sobre que vas a desayunar, comer o cenar y recordarte que me puedes pedir un dato curioso, que te cuenta las noticias, una historia o que te pregunte como te encuentras hoy',
             
            // Mensajes
            ACTIVAR_MSG: 'Se han activado los mensajes de localización de despedida',
            DESACTIVAR_MSG: 'Se han desactivado los mensajes de localización de despedida',
            NO_ADIOS_MSG: '%s ha salido de casa.',
            DESPEDIDA_MSG: 'Que pases un buen día. Acuerdate de coger las llaves, la cartera y el teléfono móvil',
            ADIOS_MSG: '%s ha salido %s .',
            NO_AYUDA_MSG: '%s necesita ayuda.',
            TRANQUIL_MSG: 'Se ha pedido ayuda.',
            AYUDA_MSG: '%s necesita ayuda: %s',
            
            // Preguntas
            Q_COMIDA_F_MSG: '%s, que vas a comer?',
            Q_COMIDA_P_MSG: '%s, que has comido?',
            Q_DESAYUNO_F_MSG: '%s, que vas a desayunar?',
            Q_DESAYUNO_P_MSG: '%s, que has desayunado?',
            Q_CENA_F_MSG: '%s, que vas a cenar?',
            Q_CENA_P_MSG: '%s, que has cenado?',
            Q_HIST_MSG: '%s, si quieres te puedo contar una historia, sal de la skill y pídemelo.',
            Q_DATO_MSG: '%s, te puedo dar un dato curioso, sal de la skill y pídemelo.',
            Q_SENT_MSG: '%s, como te encuentras hoy?',
            Q_NOTI_MSG: '%s, quieres saber las noticias de hoy?, sal de la skill y pídemelo.',
            
            COMIDA_MSG: 'Que aproveche!.',
            
            // Listado
            RETRY_C_MSG: 'Puedes decirme el objeto, por favor. ',
            RETRY_L_MSG: 'Puedes decirme el lugar, por favor. ',
            RETRY_B_MSG: 'Puedes decirme lo que buscas, por favor. ',
            RETRY_E_MSG: 'Puedes decirme lo que quieres eliminar, por favor. ',
            ADDED_CL_MSG: 'Listo!. Se ha añadido al listado  ',
            ADDED_B_MSG: 'Listo!. Se hará la búsqueda de   ',
            ADDED_E_MSG: 'Listo!. Se eliminará,  ',
            
            // Robot
            SPEED_MSG: 'Velocidad al %s porciento.',
            DURATION_MSG: '%s durante %s segundos, a una velocidad del %s porciento',
            DISTANCE_MSG: '%s durante %s milímetros, a una velocidad del %s porciento',
            ANGLE_MSG: '%s, %s grados, a una velocidad del %s porciento',
            ODOM_MSG: 'Desplazandose a las coordenadas X: %s e Y: %s,  a una velocidad del %s porciento',
            NADA_MSG: '%s,  a una velocidad del %s porciento',
            
            RETRY_EMOTION_MSG: 'Puedes repetirme como te sientes?',
            EMOTION_MSG: 'Así que estás %s.',
            RETRY_COMMAND_MSG: 'Puedes repetirme el comando?',
            COMMAND_MSG: 'comando %s activado', 
            
            // Ayudas
            PERMISSION_MSG: 'No tienes permiso para esta acción',
            HELP_MSG: 'Puedes decirme donde quieres guardar un objeto o preguntarme donde se encuentra o que hay en un lugar. Qué quieres hacer? ',
            HELP2_MSG: 'Dime que quieres guardar o donde. Tambien te puedo decir donde se encuentra. ',
            
            
            FALLBACK_MSG: 'Esa no es una entidad reconocida. Por favor inténtalo otra vez. ',
            NO_TIMEZONE_MSG: 'No timezone: %s',
            
            EXIT_MSG: 'Adios! ',
            ERROR_MSG: 'Perdona hubo un error. Por favor inténtalo otra vez. ',
            REFLECT_MSG: 'Acabas de activar ',
            
            WELCOME_MSG: 'Bienvenido a la Versión sin robot. %s ',
            
            IS_STATIC_MSG: ' es una entidad estática. ',
            IS_DYNAMIC_MSG: ' es una entidad dinámica. ',
            NOT_MATCHED_MSG: ' no es una entidad reconocida. '
        }
    }
}