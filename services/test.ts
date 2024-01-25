import { HelloWorld } from "../models/test";

export function getHelloWorldMessage(): HelloWorld {
    const helloWorld = {
        message: "Hello world",
        timestamp: new Date()
    }
    return helloWorld
}