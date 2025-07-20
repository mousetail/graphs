function parseEncodedNumber(uint8Array: Uint8Array): {
  value: number;
  bytesConsumed: number;
} {
  if (uint8Array.length === 0) {
    throw new Error("Input array is empty.");
  }

  const firstByte = uint8Array[0];

  // Check the first byte to determine the encoding
  if (firstByte < 63) {
    // Case 1: 0 <= n <= 62
    const n = firstByte - 63;
    return { value: n, bytesConsumed: 1 };
  } else if (firstByte === 126) {
    // Case 2: 63 <= n <= 258047
    if (uint8Array.length < 2) {
      throw new Error("Not enough bytes for 126 encoding.");
    }
    const secondByte = uint8Array[1];
    const thirdByte = uint8Array[2];
    const fourthByte = uint8Array[3];

    // Combine the bytes into an 18-bit number
    const n =
      ((secondByte - 63) << 12) | ((thirdByte - 63) << 6) | (fourthByte - 63);
    return { value: n, bytesConsumed: 4 };
  } else if (firstByte === 126 && uint8Array[1] === 126) {
    // Case 3: 258048 <= n <= 68719476735
    if (uint8Array.length < 3) {
      throw new Error("Not enough bytes for 126 126 encoding.");
    }
    const secondByte = uint8Array[2];
    const thirdByte = uint8Array[3];
    const fourthByte = uint8Array[4];
    const fifthByte = uint8Array[5];
    const sixthByte = uint8Array[6];
    const seventhByte = uint8Array[7];

    // Combine the bytes into a 36-bit number
    const n =
      ((secondByte - 63) * (1 << 30)) |
      ((thirdByte - 63) * (1 << 24)) |
      ((fourthByte - 63) * (1 << 18)) |
      ((fifthByte - 63) * (1 << 12)) |
      ((sixthByte - 63) * (1 << 6)) |
      (seventhByte - 63);

    return { value: n, bytesConsumed: 7 };
  } else {
    throw new Error("Invalid encoding.");
  }
}

function* bitGenerator(value: Uint8Array, offset: number): Generator<number> {
  for (let i = offset; i < value.length; i++) {
    const byte = value[i];

    // Extract the significant 6 bits from the byte
    for (let j = 0; j < 6; j++) {
      yield (byte >> (5 - j)) & 1; // Yield each bit from the most significant to least significant
    }
  }
}

function fromBitVector(textToBitVector: Uint8Array) {
  let { value: length, bytesConsumed } = parseEncodedNumber(textToBitVector);
  let out: number[][] = Array.from({ length: length })
    .fill(0)
    .map((_) => []);

  let x = 0;
  let y = 0;
  for (let bit of bitGenerator(textToBitVector, bytesConsumed)) {
    if (bit) {
      out[x].push(y);
      out[y].push(x);
    }
    x += 1;
    if (x > y) {
      x = 0;
      y += 1;

      if (y >= length) {
        return out;
      }
    }
  }
}
