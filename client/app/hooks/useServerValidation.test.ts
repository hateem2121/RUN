import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useServerValidation } from "./useServerValidation";
import { ApiError } from "../lib/api";

describe("useServerValidation hook", () => {
    it("should set form errors when ApiError has invalid-params", () => {
        const setErrorMock = vi.fn();
        const formMock = { setError: setErrorMock } as any;

        const error = new ApiError(400, {
            type: "urn:problem:validation-error",
            status: 400,
            "invalid-params": {
                email: ["Invalid format"],
                password: ["Too short"]
            }
        });

        renderHook(() => useServerValidation({ form: formMock, error }));

        expect(setErrorMock).toHaveBeenCalledWith("email", { type: "server", message: "Invalid format" });
        expect(setErrorMock).toHaveBeenCalledWith("password", { type: "server", message: "Too short" });
    });

    it("should ignore non-ApiError errors", () => {
        const setErrorMock = vi.fn();
        const formMock = { setError: setErrorMock } as any;

        const error = new Error("Generic error");
        renderHook(() => useServerValidation({ form: formMock, error }));

        expect(setErrorMock).not.toHaveBeenCalled();
    });

    it("should ignore ApiError without invalid-params", () => {
        const setErrorMock = vi.fn();
        const formMock = { setError: setErrorMock } as any;

        const error = new ApiError(500, { status: 500, title: "Server Error" });
        renderHook(() => useServerValidation({ form: formMock, error }));

        expect(setErrorMock).not.toHaveBeenCalled();
    });

    it("should call onClientError for ApiErrors", () => {
        const setErrorMock = vi.fn();
        const onClientErrorMock = vi.fn();
        const formMock = { setError: setErrorMock } as any;

        const error = new ApiError(401, { status: 401, title: "Unauthorized" });
        renderHook(() => useServerValidation({ 
            form: formMock, 
            error, 
            onClientError: onClientErrorMock 
        }));

        expect(onClientErrorMock).toHaveBeenCalledWith(error);
    });
});
