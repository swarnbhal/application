import "@testing-library/jest-dom"
import { TextDecoder, TextEncoder } from "node:util"

Object.assign(globalThis, { TextEncoder, TextDecoder })

if (typeof globalThis.crypto?.randomUUID !== "function") {
  Object.defineProperty(globalThis, "crypto", {
    value: {
      randomUUID: () =>
        "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (char) =>
          (
            Number(char) ^
            (Math.trunc(Math.random() * 16) & (15 >> (Number(char) / 4)))
          ).toString(16),
        ),
    },
  })
}

