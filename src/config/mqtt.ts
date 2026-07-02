import mqtt from "mqtt";
import { logger } from "../shared/infrastructure/logging/logger";

// En producción usar la variable de entorno, en local usar HiveMQ
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || "mqtt://broker.hivemq.com";

const client = mqtt.connect(MQTT_BROKER_URL);

client.on("connect", () => {
  logger.info(`📡 Conectado exitosamente al Broker MQTT en: ${MQTT_BROKER_URL}`);
});

client.on("error", (err) => {
  logger.error(err, "❌ Error de conexión MQTT:");
});

// Función helper para publicar de forma segura
export const publishEvent = (topic: string, payload: any): void => {
  if (client.connected) {
    client.publish(topic, JSON.stringify(payload), { qos: 1 }, (err) => {
      if (err) {
        logger.error(err, `❌ Error al publicar en topic ${topic}:`);
      } else {
        logger.info(
          { topic, action: payload.action, id: payload.dish?.id || payload.dishId },
          `📡 Evento MQTT publicado en ${topic}: ${payload.action}`
        );
      }
    });
  } else {
    logger.warn(
      { action: payload.action },
      "⚠️ Cliente MQTT desconectado. El evento no se publicó."
    );
  }
};
