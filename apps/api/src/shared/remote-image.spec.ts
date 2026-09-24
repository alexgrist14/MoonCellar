import { isPrivateAddress } from "./remote-image";

describe("isPrivateAddress", () => {
  it("rejects loopback, private, link-local and metadata addresses", () => {
    [
      "127.0.0.1",
      "10.1.2.3",
      "172.16.0.1",
      "172.31.255.255",
      "192.168.1.10",
      "169.254.169.254",
      "100.64.0.1",
      "0.0.0.0",
      "::1",
      "fd00::1",
      "fe80::1",
      "::ffff:127.0.0.1",
    ].forEach((ip) => expect(isPrivateAddress(ip)).toBe(true));
  });

  it("accepts public addresses", () => {
    ["8.8.8.8", "172.32.0.1", "151.101.1.69", "2606:4700::1111"].forEach(
      (ip) => expect(isPrivateAddress(ip)).toBe(false)
    );
  });
});
