import * as path from "path";
import * as fs from "fs";

export function readJsonFromFile(relativePath: string) {
  return JSON.parse(fs.readFileSync(path.resolve(relativePath), "utf8"));
}

export function abbreviateAddr(address: string): string {
  return address.slice(0, 6) + "..." + address.slice(38);
}
