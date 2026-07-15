import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mocks
vi.mock("react-router", () => ({
  useNavigation: () => ({ state: "idle" }),
  useLocation: () => ({ pathname: "/" }),
  useMatches: () => [],
  useNavigate: () => vi.fn(),
  Link: (props: any) => <a {...props} />,
  NavLink: (props: any) => <a {...props} />,
  Form: (props: any) => <form {...props} />,
}));

import { Badge } from "../../../client/app/components/ui/badge.js";
import { Button } from "../../../client/app/components/ui/button.js";
import { Input } from "../../../client/app/components/ui/input.js";
import { Label } from "../../../client/app/components/ui/label.js";
import { Textarea } from "../../../client/app/components/ui/textarea.js";

describe("Client UI Auto", () => {
  it("Button renders", () => {
    const { getByText } = render(<Button>Test</Button>);
    expect(getByText("Test")).toBeInTheDocument();
  });

  it("Badge renders", () => {
    const { getByText } = render(<Badge>Test Badge</Badge>);
    expect(getByText("Test Badge")).toBeInTheDocument();
  });

  it("Input renders", () => {
    const { container } = render(<Input placeholder="test-input" />);
    expect(container.querySelector("input")).toBeInTheDocument();
  });

  it("Textarea renders", () => {
    const { container } = render(<Textarea placeholder="test-textarea" />);
    expect(container.querySelector("textarea")).toBeInTheDocument();
  });

  it("Label renders", () => {
    const { getByText } = render(<Label>Test Label</Label>);
    expect(getByText("Test Label")).toBeInTheDocument();
  });
});
