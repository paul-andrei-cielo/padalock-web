import { PLATFORMS } from "@/models/Parcel";

export type ParcelInput = {
    trackingNumber: string;
    parcelName: string;
    source: (typeof PLATFORMS)[number];
    sourceOther: string;
    description: string;
    dimensions: { length: number; width: number; height: number } | null;
    image: string | null;
};

type ParseResult =
    | { data: ParcelInput; error?: undefined }
    | { data?: undefined; error: string };

export function parseParcelInput(body: any): ParseResult {
    const trackingNumber = String(body?.trackingNumber ?? "")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase()
        .slice(0, 40);

    if (!trackingNumber) {
        return { error: "Enter a tracking number." };
    }

    const source = (PLATFORMS as readonly string[]).includes(body?.source)
        ? (body.source as ParcelInput["source"])
        : "Other";

    let dimensions: ParcelInput["dimensions"] = null;
    if (body?.dimensions) {
        const nums = [
            body.dimensions.length,
            body.dimensions.width,
            body.dimensions.height
        ].map(Number);

        if (nums.some((n) => !Number.isFinite(n) || n <= 0)) {
            return { error: "Dimensions must be greater than 0." };
        }

        dimensions = { length: nums[0], width: nums[1], height: nums[2] };
    }

    const image = body?.image ?? null;
    if (image !== null) {
        if (typeof image !== "string" || !image.startsWith("data:image/")) {
            return { error: "Invalid photo." };
        }
        if (image.length > 1_000_000) {
            return { error: "Photo is too large." };
        }
    }

    return {
        data: {
            trackingNumber,
            parcelName: String(body?.parcelName ?? "").trim().slice(0, 60) || "Parcel",
            source,
            sourceOther:
                source === "Other"
                    ? String(body?.sourceOther ?? "").trim().slice(0, 40)
                    : "",
            description: String(body?.description ?? "").trim().slice(0, 200),
            dimensions,
            image
        }
    };
}