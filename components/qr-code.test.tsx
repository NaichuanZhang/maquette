import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QRPreview, buildQrFilename } from "./qr-code";

describe("buildQrFilename", () => {
  it("produces kebab-case filename with extension", () => {
    expect(buildQrFilename("AbC123X", "png")).toBe("maquette-qr-AbC123X.png");
    expect(buildQrFilename("AbC123X", "svg")).toBe("maquette-qr-AbC123X.svg");
  });
});

describe("<QRPreview />", () => {
  it("renders an SVG containing the value in its data attribute", () => {
    const { container } = render(
      <QRPreview value="https://example.com/r/abc1234" size={128} />,
    );
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("data-qr-value")).toBe(
      "https://example.com/r/abc1234",
    );
  });

  it("exposes a download button region", () => {
    render(<QRPreview value="https://example.com/r/abc1234" size={128} />);
    expect(
      screen.getByRole("button", { name: /download png/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /download svg/i }),
    ).toBeInTheDocument();
  });
});
