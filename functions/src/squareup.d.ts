declare module 'squareup' {
  export class Client {
    constructor(config: any);
    paymentsApi: any;
  }
  
  export enum Environment {
    Production = 'production',
    Sandbox = 'sandbox'
  }
}

