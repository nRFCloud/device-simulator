const { Iot, IotData } = require('aws-sdk');
const { writeFileSync } = require('fs');

const iot = new Iot();
const iotData = new IotData({ endpoint: 'a2n7tk1kp18wix-ats.iot.us-east-1.amazonaws.com' });

const caCert = Buffer.from('-----BEGIN CERTIFICATE-----\n' +
    'MIIDQTCCAimgAwIBAgITBmyfz5m/jAo54vB4ikPmljZbyjANBgkqhkiG9w0BAQsF\n' +
    'ADA5MQswCQYDVQQGEwJVUzEPMA0GA1UEChMGQW1hem9uMRkwFwYDVQQDExBBbWF6\n' +
    'b24gUm9vdCBDQSAxMB4XDTE1MDUyNjAwMDAwMFoXDTM4MDExNzAwMDAwMFowOTEL\n' +
    'MAkGA1UEBhMCVVMxDzANBgNVBAoTBkFtYXpvbjEZMBcGA1UEAxMQQW1hem9uIFJv\n' +
    'b3QgQ0EgMTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALJ4gHHKeNXj\n' +
    'ca9HgFB0fW7Y14h29Jlo91ghYPl0hAEvrAIthtOgQ3pOsqTQNroBvo3bSMgHFzZM\n' +
    '9O6II8c+6zf1tRn4SWiw3te5djgdYZ6k/oI2peVKVuRF4fn9tBb6dNqcmzU5L/qw\n' +
    'IFAGbHrQgLKm+a/sRxmPUDgH3KKHOVj4utWp+UhnMJbulHheb4mjUcAwhmahRWa6\n' +
    'VOujw5H5SNz/0egwLX0tdHA114gk957EWW67c4cX8jJGKLhD+rcdqsq08p8kDi1L\n' +
    '93FcXmn/6pUCyziKrlA4b9v7LWIbxcceVOF34GfID5yHI9Y/QCB/IIDEgEw+OyQm\n' +
    'jgSubJrIqg0CAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAOBgNVHQ8BAf8EBAMC\n' +
    'AYYwHQYDVR0OBBYEFIQYzIU07LwMlJQuCFmcx7IQTgoIMA0GCSqGSIb3DQEBCwUA\n' +
    'A4IBAQCY8jdaQZChGsV2USggNiMOruYou6r4lK5IpDB/G/wkjUu0yKGX9rbxenDI\n' +
    'U5PMCCjjmCXPI6T53iHTfIUJrU6adTrCC2qJeHZERxhlbI1Bjjt/msv0tadQ1wUs\n' +
    'N+gDS63pYaACbvXy8MWy7Vu33PqUXHeeE6V/Uq2V8viTO96LXFvKWlJbYK8U90vv\n' +
    'o/ufQJVtMVT8QtPHRh8jrdkPSHCa2XV4cdFyQzR1bldZwgJcJmApzyMZFo6IQ6XU\n' +
    '5MsI+yMRQ+hDKXJioaldXgjUkK642M4UwtBV8ob2xJNDd2ZhwLnoQdeXeGADbkpy\n' +
    'rqXRfboQnoZsG4q5WTP468SQvvG5\n' +
    '-----END CERTIFICATE-----\n');


(async () => {
    const stage = process.env.STAGE || 'beta';
    const stack = process.env.STACK || 'beta-v1v1v2';
    const thingName = `nrf-${stage}-simulator-${Math.random().toString(36).replace(/[^a-z]+/g, '')}`;
    await iot
        .createThing({
            thingName,
            thingTypeName: `iris-backend-${stack}-nrf91gpsflipdemo`,
            attributePayload: {
                attributes: {
                    stage
                }
            }
        })
        .promise();
    await iotData
        .updateThingShadow({
            thingName,
            payload: JSON.stringify({
                state: {
                    'desired': {
                        stage,
                        'pairing': {
                            'state': 'initiate'
                        }
                    }

                }
            })
        }).promise();
    await iot
        .addThingToThingGroup({
            thingGroupName: `iris-backend-${stack}-nrf91gpsflipdemos`,
            thingName
        })
        .promise();
    const {
        certificateArn,
        certificatePem,
        keyPair,
    } = await iot.createKeysAndCertificate({ setAsActive: true }).promise();
    if (!certificateArn || !keyPair || !certificatePem) {
        throw new Error('Failed to create certificate.');
    }
    const { PrivateKey, PublicKey } = keyPair;
    if (!PrivateKey || !PublicKey) {
        throw new Error('Failed to create key pair.');
    }
    await iot
        .attachThingPrincipal({ principal: certificateArn, thingName })
        .promise();
    writeFileSync(`${thingName}.json`, JSON.stringify({
        caCert: caCert.toString(),
        clientCert: certificatePem,
        privateKey: PrivateKey,
        publicKey: PublicKey,
        clientId: thingName,
        brokerHostname: 'a2n7tk1kp18wix-ats.iot.us-east-1.amazonaws.com',
    }, null, 2), 'utf-8')
    console.log(`${thingName}.json`);
})();
