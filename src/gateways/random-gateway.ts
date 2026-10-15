import type { RandomGateway } from "./gateways";

export class MathRandomGateway implements RandomGateway {
  next(): number {
    return Math.random();
  }

  token(length: number): string {
    return Math.random()
      .toString(36)
      .slice(2, 2 + length);
  }
}
