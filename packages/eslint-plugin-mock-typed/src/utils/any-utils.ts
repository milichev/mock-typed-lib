import { ArrayValues } from "type-fest";

export function isOneOf<Allowed extends readonly string[]>(
  item: string | undefined,
  allowed: Allowed
): item is ArrayValues<Allowed> {
  return !!item && allowed.includes(item);
}
