import "dotenv/config";
import { Arcade } from "@arcadeai/arcadejs";

const arcade = new Arcade();
console.log("Auth methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(arcade.auth)));
