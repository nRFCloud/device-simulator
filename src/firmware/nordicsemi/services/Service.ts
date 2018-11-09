export default interface Service {
    start(): Promise<void>;
    stop(): Promise<void>;
}
