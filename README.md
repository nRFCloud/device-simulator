## nrfcloud-device-simulator

Command line utility for simulating a device connecting to and pairing with [nRFcloud.com](https://nRFCloud.com).

### Install

This utility cannot be run without installing at least the production dependencies:

    npm ci --only=prod

### Device configuration
To create a device configuration use [nrfcloud-cli](https://github.com/NordicPlayground/nrfcloud-cli).
 
Example usage for adding a device to nRF Cloud (this is not associating a device with a tenant):
    
    node dist/cli.js device-register -t nsrn:devices:types/device/nordicsemi/nRF91/PCA10074/gpsFlipDemo/0 <your device id>

### NMEA sentences

A GPS recording of NMEA sentences can be found here: https://drive.google.com/uc?export=download&id=0BxDUQnmvFeMNOXM1ZmFFNHZZU2s
         
If you have curl installed:
    
    curl -L -o /tmp/output.txt "https://drive.google.com/uc?export=download&id=0BxDUQnmvFeMNOXM1ZmFFNHZZU2s"

### Accelerometer samples

An accelerometer recording can be found here \_\_tests\_\_/sensors/accelerometer-recording.txt


### Thermometer samples

A thermometer recording can be found here \_\_tests\_\_/sensors/thermometer-recording.txt


### CLI Usage

    node dist/cli.js start <device type to simulate> -c <configuration file from nrfcloud-cli> -n <file with GPS NMEA sentences> -a <file with accelerometer recording> -t <file with thermometer recording>
    
Example:

    node dist/cli.js start nsrn:devices:types/device/nordicsemi/nRF91/PCA10074/gpsFlipDemo/0 -c /home/kere/.nrfcloud/config.json -n /tmp/nmea-recording.txt -a __tests__/sensors/accelerometer-recording.txt -t __tests__/sensors/thermometer-recording.txt
