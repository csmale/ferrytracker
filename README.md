# ferrytracker
Track cross-channel ferries from AIS data, and forward info via MQTT

Data from aisstream.io
https://aisstream.io/

Documentation at https://aisstream.io/documentation

AIS Message descriptions:
https://www.navcen.uscg.gov/ais-class-a-reports

To run locally: set up a .env file in the application directory.

To run via docker, use:

    -v $DIR.env:/home/node/ferrytracker/.env:ro

In the .env file:

    AISSTREAM_KEY=<api key>
    MQTT_HOST=mqtt://<host>
    MQTT_USER=<user>
    MQTT_PASSWORD=<password>
    MMSI_LIST=<list of ships>

The list of ships must be a comma-separated list of MMSI identifiers for the ships required. For example:

    MMSI_LIST=227022800,228085000,228417600,235010500,235009590,235028825,209479000,209093000,209490000,210385000,210384000