// require('dotenv').config();

import * as dotenv from "dotenv";
dotenv.config();

import * as mqtt from "mqtt";
// const mqtt = require('mqtt');
const mqtt_host = process.env.MQTT_HOST;
const mqtt_user = process.env.MQTT_USER;
const mqtt_password = process.env.MQTT_PASSWORD;

const mqtt_options = {
  retain: true,
  qos: 1,
  reconnectPeriod: 1000,
  reconnectOnConnackError: true,
  username: mqtt_user,
  password: mqtt_password
};

let mmsilist = process.env.MMSI_LIST;
const mmsis = mmsilist.split(",");

const ws_reconnect_delay = process.env.WS_RECONNECT_DELAY || 1;

let client = await mqtt.connect(mqtt_host, mqtt_options);

let ships = {};

function connect() {

  // import * as WebSocket from "ws";
  // const WebSocket = require('ws');
  var socket = new WebSocket("wss://stream.aisstream.io/v0/stream");

  socket.onopen = function (_) {
    let subscriptionMessage = {
      Apikey: process.env.AISSTREAM_KEY,
      BoundingBoxes: [[[-90, -180], [90, 180]]],
      FiltersShipMMSI: mmsis, // Optional!
      FilterMessageTypes: ["PositionReport", "ShipStaticData"] // Optional!
    }
    console.log(`Subscribing: ${JSON.stringify(subscriptionMessage)}`);
    socket.send(JSON.stringify(subscriptionMessage));
  };


  socket.onmessage = async function (event) {
    // console.log(await event.data.text());
    let aisMessage = JSON.parse(await event.data.text());
    console.log(aisMessage);
    let mmsi = aisMessage.MetaData.MMSI;
    switch (aisMessage.MessageType) {
      case "PositionReport":
        break;
      case "ShipStaticData":
        ships[mmsi] = aisMessage.Message.ShipStaticData;
        return;
      default:
        console.log(`Not processing ${aisMessage.MessageType} message`);
        return;
    }
    let ship = ships[mmsi] ?? {};
    let mqtt_topic = `ship/${mmsi}`;
    let msg = {
      mmsi: mmsi,
      name: aisMessage.MetaData.ShipName.trim(),
      lat: aisMessage.Message.PositionReport.Latitude,
      lon: aisMessage.Message.PositionReport.Longitude,
      cog: aisMessage.Message.PositionReport.Cog,
      sog: aisMessage.Message.PositionReport.Sog,
      route: ship?.Destination?.trim() ?? ""
    };
    client.publish(mqtt_topic, JSON.stringify(msg), { retain: true });
  };

  socket.onclose = function (e) {
    console.log(`Websocket is closed. Reconnect will be attempted in ${ws_reconnect_delay} second(s).`, e.reason);
    setTimeout(function () {
      connect();
    }, 1000*ws_reconnect_delay);
  };

  socket.onerror = function (err) {
    console.error('Websocket encountered error: ', err.message, 'Closing socket');
    ws.close();
  };

}
connect();
