## nrfcloud-device-simulator

Command line utility for simulating a device connecting to and pairing with [nRFcloud.com](https://nRFCloud.com).

### Install

    npm i

### Device configuration
To create a device configuration use [nrfcloud-cli](https://github.com/NordicPlayground/nrfcloud-cli).
 
Example usage for adding a device to nRF Cloud (this is not associating a device with a tenant):
    
    node dist/cli.js device-register -t nsrn:devices:types/device/nordicsemi/nRF91/PCA10074/gpsFlipDemo/0 <your device id>

### NMEA sentences

A GPS recording of NMEA sentences can be found here: https://drive.google.com/uc?export=download&id=0BxDUQnmvFeMNOXM1ZmFFNHZZU2s
         
If you have curl installed:
    
    curl -L -o /tmp/output.txt "https://drive.google.com/uc?export=download&id=0BxDUQnmvFeMNOXM1ZmFFNHZZU2s"


### CLI Usage

    node dist/cli.js start <device type to simulate> -c <configuration file from nrfcloud-cli> -n <file with GPS NMEA sentences>
    
Example:

    node dist/cli.js start nsrn:devices:types/device/nordicsemi/nRF91/PCA10074/gpsFlipDemo/0 -c /home/kere/.nrfcloud/config.json -n /tmp/nmea-recording.txt
