import { Pairing, PairingStatus } from './pairing/Pairing';

export interface ShadowModelDesired {
    pairing: Pairing;
    stage?: string;
}

export interface ShadowModelReported {
    pairing?: Pairing;
    stage?: string;
    pairingStatus: PairingStatus;
}

export interface ShadowModel {
    desired: ShadowModelDesired;
    reported: ShadowModelReported;
}
