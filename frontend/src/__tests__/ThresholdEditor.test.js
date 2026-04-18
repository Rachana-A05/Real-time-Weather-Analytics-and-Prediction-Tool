import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ThresholdEditor from "../components/alerts/ThresholdEditor";

// --- Mock react-router-dom ---
jest.mock("react-router-dom", () => ({
  Routes: () => null,
  Route: () => null,
  useLocation: () => ({ pathname: "/" }),
}));

// --- Mock axios ---
import axios from "axios";
jest.mock("axios");

// --- Mock MUI Snackbar (so we can check for snackbar existence easily) ---
jest.mock("@mui/material", () => {
  const actual = jest.requireActual("@mui/material");
  return {
    ...actual,
    Snackbar: ({ open, children }) =>
      open ? <div data-testid="snackbar">{children}</div> : null,
  };
});

describe("ThresholdEditor Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({
      data: {
        temperature: { max: 25, min: 10 },
        wind: { max: 15 },
        humidity: { max: 75, min: 25 },
        pressure: { max: 1020, min: 995 },
      },
    });
  });

  test("renders ThresholdEditor with title", async () => {
    render(<ThresholdEditor />);
    expect(
      screen.getByText("Edit Personal Alert Thresholds")
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/alerts/thresholds");
    });
  });

  test("fetches and displays thresholds on mount", async () => {
    render(<ThresholdEditor />);

    await waitFor(() => {
      // Use getAllByDisplayValue to avoid multiple match errors
      const maxValues = screen.getAllByDisplayValue("25");
      const minValues = screen.getAllByDisplayValue("10");
      expect(maxValues.length).toBeGreaterThan(0);
      expect(minValues.length).toBeGreaterThan(0);
    });
  });

  test("updates temperature threshold", async () => {
    render(<ThresholdEditor />);

    await waitFor(() => {
      expect(screen.getAllByLabelText(/Maximum Temp/i).length).toBeGreaterThan(
        0
      );
    });

    const maxTempInput = screen.getAllByLabelText(/Maximum Temp/i)[0];
    fireEvent.change(maxTempInput, { target: { value: "30" } });

    expect(maxTempInput.value).toBe("30");
  });

  test("saves thresholds successfully", async () => {
    axios.post.mockResolvedValue({ data: { success: true } });

    render(<ThresholdEditor />);

    await waitFor(() => {
      expect(screen.getByText("SAVE THRESHOLDS")).toBeInTheDocument();
    });

    const saveButton = screen.getByText("SAVE THRESHOLDS");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/alerts/thresholds",
        expect.any(Object)
      );
      expect(screen.getByTestId("snackbar")).toBeInTheDocument();
    });
  });

  test("handles save error", async () => {
    axios.post.mockRejectedValue(new Error("Save failed"));

    render(<ThresholdEditor />);

    await waitFor(() => {
      expect(screen.getByText("SAVE THRESHOLDS")).toBeInTheDocument();
    });

    const saveButton = screen.getByText("SAVE THRESHOLDS");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByTestId("snackbar")).toBeInTheDocument();
    });
  });

  test("triggers weather check manually", async () => {
    axios.post.mockResolvedValue({ data: { message: "Weather check completed" } });

    render(<ThresholdEditor />);

    await waitFor(() => {
      expect(screen.getByText("CHECK WEATHER NOW")).toBeInTheDocument();
    });

    const checkButton = screen.getByText("CHECK WEATHER NOW");
    fireEvent.click(checkButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith("/api/alerts/check-now");
    });
  });

  test("displays city selector", async () => {
    render(<ThresholdEditor />);

    await waitFor(() => {
      // MUI Select labels are tricky — use role instead
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });
  });

  test("renders all threshold sections", async () => {
    render(<ThresholdEditor />);

    await waitFor(() => {
      // Use getAllByText to handle multiple matches gracefully
      expect(screen.getAllByText(/Temperature/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Wind Speed/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Humidity/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Pressure/i).length).toBeGreaterThan(0);
    });
  });

  test("handles fetch error on mount", async () => {
    axios.get.mockRejectedValueOnce(new Error("Fetch failed"));

    render(<ThresholdEditor />);

    await waitFor(() => {
      expect(screen.getByTestId("snackbar")).toBeInTheDocument();
    });
  });

  test("displays helper text for inputs", async () => {
    render(<ThresholdEditor />);

    await waitFor(() => {
      expect(screen.getAllByText(/Alert if above/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Alert if below/i).length).toBeGreaterThan(0);
    });
  });

  test("shows info alert about monitoring", async () => {
    render(<ThresholdEditor />);

    await waitFor(() => {
      expect(
        screen.getByText(/Weather monitoring runs every 10 minutes/i)
      ).toBeInTheDocument();
    });
  });
});
