// require('dotenv').config();

import * as dotenv from "dotenv";
dotenv.config();

import * as mqtt from "mqtt";
// const mqtt = require('mqtt');
const mqtt_host = process.env.MQTT_HOST;
const mqtt_options = {
    retain: true,
    qos: 1,
    reconnectPeriod: 1000
};

// import * as WebSocket from "ws";
// const WebSocket = require('ws');
const socket = new WebSocket("wss://stream.aisstream.io/v0/stream");

socket.onopen = function (_) {
    let subscriptionMessage = {
        Apikey: process.env.AISSTREAM_KEY,
        BoundingBoxes: [[[-90, -180], [90, 180]]],
        FiltersShipMMSI: ["227022800","228085000","228417600","235010500","235009590","235028825","209479000","209093000","209490000","210385000","210384000"], // Optional!
        FilterMessageTypes: ["PositionReport", "ShipStaticData"] // Optional!
    }
    socket.send(JSON.stringify(subscriptionMessage));
};

let client = await mqtt.connect(mqtt_host, mqtt_options);

let ships = {};

socket.onmessage = async function (event) {
    // console.log(await event.data.text());
    let aisMessage = JSON.parse(await event.data.text());
    console.log(aisMessage);
    let mmsi = aisMessage.MetaData.MMSI;
    switch(aisMessage.MessageType) {
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
    client.publish(mqtt_topic, JSON.stringify(msg), {retain: true});
};

